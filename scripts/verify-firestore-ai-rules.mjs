/**
 * Engine-level verification of firestore.rules for challenge_ai_analysis.
 *
 * Compiles the REAL rules file and evaluates the required permission matrix
 * against the live Firestore Rules service (`:test` API) — no emulator, no
 * Java, no application code involved. Re-runnable: `node scripts/verify-firestore-ai-rules.mjs`.
 *
 * Uses the firebase-tools OAuth token from ~/.config/configstore/firebase-tools.json.
 */
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const RULES = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8')
const PROJECT = 'jan-setu-sih26043'

const CID = '26DcdSmGufNjOS1n4q3Y'
const CITIZEN_UID = 'gWQF0dJ6OOOO7w4pMs7HbeVsHpI2'
const OTHER_UID = 'AAAAAAAAother_citizen_uid0000'
const GOV_UID = 'BBBBBBBBgovernment_uid000000'
const UNI_UID = 'CCCCCCCCuniversity_admin_uid00'
const UNI_ID = 'ranchi-university'

const analysisDoc = {
  challengeId: CID,
  primaryDomain: 'Water Management',
  secondaryDomain: null,
  tags: ['Drinking Water', 'Water Quality', 'Water Supply'],
  urgency: 'medium',
  impactScale: 'village_ward',
  locationContext: 'Ramgarh',
  requiredExpertise: ['Water Engineer'],
  requiredFacilities: ['Water Treatment Plant'],
  problemSummary: 'Dirty drinking water in Ward 12.',
  duplicateSearchText: 'dirty drinking water ward 12',
  duplicate_candidates: [],
  confidence: 0.85,
  rawAiResponse: '{}',
  createdAt: 1725613200000,
}

const mockDoc = (fields) => ({ data: fields })
const mockGet = (path, fields) => ({
  function: 'get',
  args: [{ exactValue: path }],
  result: { value: mockDoc(fields) },
})

const p = (segments) => `/databases/(default)/documents/${segments.join('/')}`
const challengeOwner = mockGet(p(['challenges', CID]), { citizenId: CITIZEN_UID })
const challengeAssigned = mockGet(p(['challenges', CID]), { citizenId: CITIZEN_UID, assignedUniversityId: UNI_ID })
const user = (uid, role, universityId) =>
  mockGet(p(['users', uid]), { role, ...(universityId ? { universityId } : {}) })

const citizenAuth = { uid: CITIZEN_UID, token: { email: 'citizen@jan-setu.gov' } }
const otherAuth = { uid: OTHER_UID, token: { email: 'other@example.com' } }
const govAuth = { uid: GOV_UID, token: { email: 'government@jan-setu.gov' } }
const uniAuth = { uid: UNI_UID, token: { email: 'university_admin@jan-setu.gov' } }

const target = p(['challenge_ai_analysis', CID])

const cases = [
  // — Run-through of the previously-failing production write —
  { name: 'citizen CREATE analysis for own challenge', expectation: 'ALLOW', method: 'create', auth: citizenAuth, requestResource: analysisDoc, mocks: [challengeOwner, user(CITIZEN_UID, 'citizen')] },
  // — The 6 required regression cases —
  { name: 'REQ own-citizen read of analysis', expectation: 'ALLOW', method: 'get', auth: citizenAuth, existing: analysisDoc, mocks: [challengeOwner, user(CITIZEN_UID, 'citizen')] },
  { name: 'REQ other-citizen read -> DENY (private)', expectation: 'DENY', method: 'get', auth: otherAuth, existing: analysisDoc, mocks: [mockGet(p(['users', OTHER_UID]), { role: 'citizen' }), mockGet(p(['challenges', CID]), { citizenId: CITIZEN_UID })] },
  { name: 'REQ government read authorized analysis', expectation: 'ALLOW', method: 'get', auth: govAuth, existing: analysisDoc, mocks: [challengeOwner, user(GOV_UID, 'government')] },
  { name: 'REQ unauthenticated read -> DENY', expectation: 'DENY', method: 'get', auth: undefined, existing: analysisDoc, mocks: [] },
  { name: 'REQ citizen modify/update analysis -> DENY (immutable)', expectation: 'DENY', method: 'update', auth: citizenAuth, requestResource: { ...analysisDoc, confidence: 0.99 }, existing: analysisDoc, mocks: [challengeOwner, user(CITIZEN_UID, 'citizen')] },
  { name: 'REQ citizen delete analysis -> DENY (immutable)', expectation: 'DENY', method: 'delete', auth: citizenAuth, existing: analysisDoc, mocks: [challengeOwner, user(CITIZEN_UID, 'citizen')] },
  // — Tamper / fabrication guards —
  { name: 'tamper: unapproved tag -> DENY', expectation: 'DENY', method: 'create', auth: citizenAuth, requestResource: { ...analysisDoc, tags: ['Not A Tag', 'Water Quality'] }, mocks: [challengeOwner, user(CITIZEN_UID, 'citizen')] },
  { name: 'tamper: duplicate tags -> DENY', expectation: 'DENY', method: 'create', auth: citizenAuth, requestResource: { ...analysisDoc, tags: ['Water Quality', 'Water Quality'] }, mocks: [challengeOwner, user(CITIZEN_UID, 'citizen')] },
  { name: 'tamper: non-approved secondaryDomain -> DENY', expectation: 'DENY', method: 'create', auth: citizenAuth, requestResource: { ...analysisDoc, secondaryDomain: 'Fake Domain' }, mocks: [challengeOwner, user(CITIZEN_UID, 'citizen')] },
  { name: 'other-citizen fabricated create -> DENY', expectation: 'DENY', method: 'create', auth: otherAuth, requestResource: analysisDoc, mocks: [mockGet(p(['users', OTHER_UID]), { role: 'citizen' }), mockGet(p(['challenges', CID]), { citizenId: CITIZEN_UID })] },
  { name: 'government create analysis -> ALLOW', expectation: 'ALLOW', method: 'create', auth: govAuth, requestResource: analysisDoc, mocks: [challengeOwner, user(GOV_UID, 'government')] },
  // — University routing model —
  { name: 'university_admin read for assigned challenge -> ALLOW', expectation: 'ALLOW', method: 'get', auth: uniAuth, existing: analysisDoc, mocks: [challengeAssigned, user(UNI_UID, 'university_admin', UNI_ID), mockGet(p(['challenge_matches', `${CID}_${UNI_ID}`]), { challengeId: CID })] },
  { name: 'university_admin read for unassigned challenge -> DENY', expectation: 'DENY', method: 'get', auth: uniAuth, existing: analysisDoc, mocks: [mockGet(p(['challenges', CID]), { citizenId: CITIZEN_UID }), user(UNI_UID, 'university_admin', UNI_ID)] },
]

function buildRequest(c) {
  const req = { auth: c.auth ?? undefined, method: c.method, path: target, time: '2026-09-06T15:00:05.000Z' }
  if (c.requestResource) req.resource = { data: c.requestResource }
  return req
}

const testSuite = {
  testCases: cases.map((c) => ({
    expectation: c.expectation,
    request: buildRequest(c),
    resource: c.existing ? { data: c.existing, time: '2026-09-06T15:00:00.000Z' } : undefined,
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
  // state SUCCESS == the test's expectation was matched (ALLOW or DENY).
  const matched = tr.state === 'SUCCESS'
  const verdict = matched ? c.expectation : c.expectation === 'ALLOW' ? 'DENY' : 'ALLOW'
  const tag = matched ? 'PASS' : 'FAIL'
  if (!matched) failures += 1
  console.log(
    `${tag}  [${verdict}] ${c.name} (expected ${c.expectation})`,
  )
  for (const m of tr.debugMessages ?? []) console.log(`      debug: ${m}`)
})

console.log(failures === 0 ? '\nALL RULES CASES PASS' : `\n${failures} FAILURES`)
process.exit(failures === 0 ? 0 : 1)