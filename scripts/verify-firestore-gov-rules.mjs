/**
 * Engine-level verification of firestore.rules for the government review
 * workflow (challenges status transitions + challenge_reviews audit trail).
 *
 * Compiles the REAL rules file and evaluates the required permission matrix
 * against the live Firestore Rules service (`:test` API) — no emulator, no
 * Java, no application code involved. Re-runnable:
 * `node scripts/verify-firestore-gov-rules.mjs`.
 *
 * Regression focus: `submitted -> under_review` by government was denied in
 * production because fresh challenges have no `assignedUniversityId` field until
 * team_formation, and Firestore rules THROW on missing-key dereference
 * ("Property assignedUniversityId is undefined on object"), aborting the whole
 * gov update branch. ALL update cases use the real model where
 * `request.resource.data` is the MERGED document (how Firestore evaluates
 * updateDoc/PATCH), not the changed-fields-only payload.
 *
 * Uses the firebase-tools OAuth token from ~/.config/configstore/firebase-tools.json.
 */
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const RULES = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8')
const PROJECT = 'jan-setu-sih26043'

const CID = 'ch_under_review_test'
const RID = 'review_test_1'
const CITIZEN_UID = 'gWQF0dJ6OOOO7w4pMs7HbeVsHpI2'
const OTHER_UID = 'AAAAAAAAother_citizen_uid0000'
const GOV_UID = 'BBBBBBBBgovernment_uid000000'
const UNI_UID = 'CCCCCCCCuniversity_admin_uid00'
const UNI_ID = 'ranchi-university'
const T = '2026-09-06T17:00:00.000Z'

const mockDoc = (fields) => ({ data: fields })
const mockGet = (path, fields) => ({
  function: 'get',
  args: [{ exactValue: path }],
  result: { value: mockDoc(fields) },
})
const mockExists = (path, exists) => ({
  function: 'exists',
  args: [{ exactValue: path }],
  result: { value: exists },
})

const p = (segments) => `/databases/(default)/documents/${segments.join('/')}`
const user = (uid, role, universityId) =>
  mockGet(p(['users', uid]), { role, ...(universityId ? { universityId } : {}) })

const govAuth = { uid: GOV_UID, token: { email: 'government@jan-setu.gov' } }
const citizenAuth = { uid: CITIZEN_UID, token: { email: 'citizen@jan-setu.gov' } }
const uniAuth = { uid: UNI_UID, token: { email: 'university_admin@jan-setu.gov' } }
const govUserMock = user(GOV_UID, 'government')

// A freshly-submitted challenge — NO assignedUniversityId (this is the gap).
const submittedChallenge = {
  description: 'probe challenge',
  title: 'gov transition probe',
  location: { district: 'Jamtara' },
  updatedAt: '2026-09-06T16:00:00Z',
  tags: ['Irrigation'],
  status: 'submitted',
  createdAt: '2026-09-06T16:00:00Z',
  domain: 'Agriculture',
  citizenId: CITIZEN_UID,
}
const underReviewMerged = {
  ...submittedChallenge,
  status: 'under_review',
  updatedAt: T,
}
const rejectedMerged = { ...submittedChallenge, status: 'rejected', updatedAt: T }
const validatedMerged = { ...submittedChallenge, status: 'validated', updatedAt: T }

// team_formation challenge (assigned) for teamStatusToProposal path.
const assignedChallenge = {
  ...submittedChallenge,
  status: 'team_formation',
  assignedUniversityId: UNI_ID,
}
const proposalMerged = { ...assignedChallenge, status: 'proposal', updatedAt: T }

const challengeTarget = p(['challenges', CID])
const reviewTarget = p(['challenge_reviews', RID])
const matchPath = (uniId) => p(['challenge_matches', `${CID}_${uniId}`])

const reviewDoc = {
  challengeId: CID,
  action: 'under_review',
  content: 'Officer moved this to under review.',
  createdAt: T,
}

function updateCase(name, expectation, auth, existing, merged, mocks) {
  return {
    name,
    expectation,
    method: 'update',
    auth,
    existing,
    requestResource: merged,
    mocks,
  }
}

const cases = [
  // — The regression: gov submitted -> under_review on an UNASSIGNED challenge —
  updateCase(
    'REQ gov transition submitted->under_review (assignedUniversityId ABSENT)',
    'ALLOW', govAuth, submittedChallenge, underReviewMerged, [govUserMock],
  ),
  updateCase(
    'gov transition under_review->rejected',
    'ALLOW', govAuth, { ...submittedChallenge, status: 'under_review' }, rejectedMerged, [govUserMock],
  ),
  updateCase(
    'gov cannot make matching a lifecycle status',
    'DENY', govAuth,
    { ...submittedChallenge, status: 'validated' },
    { ...submittedChallenge, status: 'university_matching', updatedAt: T },
    [govUserMock],
  ),
  updateCase(
    'gov records matching completion without lifecycle transition',
    'ALLOW', govAuth,
    { ...submittedChallenge, status: 'validated' },
    { ...submittedChallenge, status: 'validated', matchingStatus: 'completed', updatedAt: T },
    [govUserMock],
  ),
  // — Illegal edges / tamper must stay DENIED —
  updateCase(
    'gov illegal edge submitted->validated -> DENY',
    'DENY', govAuth, submittedChallenge, validatedMerged, [govUserMock],
  ),
  updateCase(
    'gov cannot ADD assignedUniversityId on an unassigned challenge -> DENY',
    'DENY', govAuth, submittedChallenge,
    { ...underReviewMerged, assignedUniversityId: UNI_ID }, [govUserMock],
  ),
  updateCase(
    'gov cannot change citizenId -> DENY',
    'DENY', govAuth, submittedChallenge,
    { ...underReviewMerged, citizenId: OTHER_UID }, [govUserMock],
  ),
  updateCase(
    'gov cannot edit title (field tamper) on unassigned challenge -> clean DENY (no runtime error at legacy call site)',
    'DENY', govAuth, submittedChallenge,
    { ...submittedChallenge, title: 'hijacked' }, [govUserMock],
  ),
  updateCase(
    'citizen submitted->under_review -> DENY',
    'DENY', citizenAuth, submittedChallenge, underReviewMerged,
    [user(CITIZEN_UID, 'citizen')],
  ),
  updateCase(
    'university_admin submitted->under_review -> DENY',
    'DENY', uniAuth, submittedChallenge, underReviewMerged,
    [user(UNI_UID, 'university_admin', UNI_ID)],
  ),
  {
    name: 'unauthenticated update -> DENY',
    expectation: 'DENY',
    method: 'update',
    auth: undefined,
    existing: submittedChallenge,
    requestResource: underReviewMerged,
    mocks: [],
  },
  // — teamStatusToProposal branch still works (assigned challenge) —
  updateCase(
    'active team faculty team_formation->proposal -> ALLOW',
    'ALLOW', { uid: UNI_UID, token: { email: 'faculty@jan-setu.gov' } },
    assignedChallenge, proposalMerged,
    [
      user(UNI_UID, 'faculty', UNI_ID),
      mockGet(p(['proposals', `${CID}_${UNI_ID}`]), { status: 'submitted' }),
      mockGet(p(['teams', `${CID}_${UNI_ID}`]), { status: 'active', facultyLeadId: UNI_UID, memberIds: [] }),
    ],
  ),
  updateCase(
    'student team member team_formation->proposal -> ALLOW',
    'ALLOW', { uid: UNI_UID, token: { email: 'student@jan-setu.gov' } },
    assignedChallenge, proposalMerged,
    [
      user(UNI_UID, 'student', UNI_ID),
      mockGet(p(['proposals', `${CID}_${UNI_ID}`]), { status: 'submitted' }),
      mockGet(p(['teams', `${CID}_${UNI_ID}`]), { status: 'active', facultyLeadId: 'ZZZ', memberIds: [UNI_UID] }),
    ],
  ),
  // — University read model (same missing-key class, made defined-safe) —
  {
    name: 'university_admin read UNASSIGNED challenge -> DENY',
    expectation: 'DENY', method: 'get', auth: uniAuth, existing: submittedChallenge,
    mocks: [user(UNI_UID, 'university_admin', UNI_ID), mockExists(matchPath(UNI_ID), false)],
  },
  {
    name: 'university_admin read ASSIGNED challenge -> ALLOW',
    expectation: 'ALLOW', method: 'get', auth: uniAuth, existing: assignedChallenge,
    mocks: [user(UNI_UID, 'university_admin', UNI_ID)],
  },
  {
    name: 'university_admin read MATCHED-BUT-UNASSIGNED challenge -> ALLOW (exists branch now reachable)',
    expectation: 'ALLOW', method: 'get', auth: uniAuth, existing: submittedChallenge,
    mocks: [user(UNI_UID, 'university_admin', UNI_ID), mockExists(matchPath(UNI_ID), true)],
  },
  // — challenge_reviews audit trail —
  {
    name: 'gov CREATE challenge_reviews -> ALLOW',
    expectation: 'ALLOW', method: 'create', auth: govAuth, requestResource: reviewDoc,
    target: reviewTarget, mocks: [govUserMock],
  },
  {
    name: 'tamper gov review with non-string content -> DENY',
    expectation: 'DENY', method: 'create', auth: govAuth,
    requestResource: { ...reviewDoc, content: 5 }, target: reviewTarget, mocks: [govUserMock],
  },
  {
    name: 'citizen CREATE challenge_reviews -> DENY',
    expectation: 'DENY', method: 'create', auth: citizenAuth,
    requestResource: reviewDoc, target: reviewTarget, mocks: [user(CITIZEN_UID, 'citizen')],
  },
  {
    name: 'university_admin CREATE challenge_reviews -> DENY',
    expectation: 'DENY', method: 'create', auth: uniAuth,
    requestResource: reviewDoc, target: reviewTarget, mocks: [user(UNI_UID, 'university_admin', UNI_ID)],
  },
  {
    name: 'gov READ review history -> ALLOW',
    expectation: 'ALLOW', method: 'get', auth: govAuth, existing: reviewDoc,
    target: reviewTarget, mocks: [govUserMock],
  },
  {
    name: 'gov UPDATE review -> DENY (immutable audit trail)',
    expectation: 'DENY', method: 'update', auth: govAuth,
    existing: reviewDoc, requestResource: { ...reviewDoc, content: 'edited' },
    target: reviewTarget, mocks: [govUserMock],
  },
  {
    name: 'gov DELETE review -> DENY (immutable audit trail)',
    expectation: 'DENY', method: 'delete', auth: govAuth, existing: reviewDoc,
    target: reviewTarget, mocks: [govUserMock],
  },
]

function buildRequest(c) {
  const req = { auth: c.auth ?? undefined, method: c.method, path: c.target ?? challengeTarget, time: T }
  if (c.requestResource) req.resource = { data: c.requestResource }
  return req
}

const testSuite = {
  testCases: cases.map((c) => ({
    expectation: c.expectation,
    request: buildRequest(c),
    resource: c.existing ? { data: c.existing, time: '2026-09-06T16:59:00.000Z' } : undefined,
    pathEncoding: 'URL_ENCODED',
    expressionReportLevel: 'NONE',
    functionMocks: c.mocks,
  })),
}

const cfg = JSON.parse(
  readFileSync(join(homedir(), '.config/configstore/firebase-tools.json'), 'utf8'),
)
const token = cfg.tokens?.access_token
if (!token) throw new Error('No firebase-tools token found in configstore.')

const res = await fetch(
  `https://firebaserules.googleapis.com/v1/projects/${PROJECT}:test`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ source: { files: [{ name: 'firestore.rules', content: RULES }] }, testSuite }),
  },
)
const text = await res.text()
if (res.status !== 200) {
  console.error('TEST API ERROR', res.status)
  console.error(text.slice(0, 6000))
  process.exit(2)
}
const data = JSON.parse(text)
let failures = 0
for (const issue of data.issues ?? []) {
  if (issue.severity === 'ERROR') {
    console.error('SOURCE ERROR:', issue.description ?? JSON.stringify(issue))
    failures += 1
  } else {
    console.log(`warn: ${issue.description ?? JSON.stringify(issue)}`)
  }
}

data.testResults.forEach((tr, i) => {
  const c = cases[i]
  const matched = tr.state === 'SUCCESS'
  const verdict = matched ? c.expectation : c.expectation === 'ALLOW' ? 'DENY' : 'ALLOW'
  const tag = matched ? 'PASS' : 'FAIL'
  if (!matched) failures += 1
  console.log(`${tag}  [${verdict}] ${c.name} (expected ${c.expectation})`)
  for (const m of tr.debugMessages ?? []) console.log(`      debug: ${m}`)
})

console.log(failures === 0 ? '\nALL GOVERNMENT RULES CASES PASS' : `\n${failures} FAILURES`)
process.exit(failures === 0 ? 0 : 1)
