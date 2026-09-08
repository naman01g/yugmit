/**
 * Idempotently provision one pending YUGMIT demo university-admin account for
 * every canonical university. Requires YUGMIT_DEMO_PASSWORD in the process
 * environment and existing Firebase Admin credentials; no password is logged.
 */
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { readFileSync } from 'node:fs'
import { UNIVERSITIES } from '../src/data/universities.ts'

const aliases = {
  'iit-ism-dhanbad': 'iitism', 'bit-mesra': 'bitmesra', 'nit-jamshedpur': 'nitjsr',
  'cu-jharkhand': 'cuj', 'birsa-agricultural-university': 'bau', 'iiit-ranchi': 'iiitranchi',
  'ranchi-university': 'ranchiuni', 'kolhan-university': 'kolhanuni',
  'nilamber-pitamber-university': 'npu', 'bbmku-dhanbad': 'bbmku', 'jut-ranchi': 'jut',
  'bit-sindri': 'bitsindri', 'niamt-ranchi': 'niamt', 'nusrl-ranchi': 'nusrl',
  'sarla-birla-university': 'sbu',
}
const password = process.env.YUGMIT_DEMO_PASSWORD
if (!password || password.length < 6) throw new Error('Set YUGMIT_DEMO_PASSWORD to provision demo accounts.')
const raw = (() => { try { return JSON.parse(readFileSync('/tmp/firebase-admin-key.json', 'utf8')) } catch { return null } })()
initializeApp({ credential: raw ? cert(raw) : applicationDefault() })
const auth = getAuth(); const db = getFirestore()
let created = 0; let existing = 0
for (const university of UNIVERSITIES) {
  const alias = aliases[university.id]
  if (!alias) throw new Error(`Missing demo alias for ${university.id}`)
  const email = `${alias}@yugmit.com`
  let user
  try { user = await auth.getUserByEmail(email); existing++ } catch { user = await auth.createUser({ email, password, displayName: `${university.name} Demo Admin`, emailVerified: true }); created++ }
  const profileRef = db.collection('users').doc(user.uid)
  const profile = await profileRef.get()
  await profileRef.set({ uid: user.uid, name: `${university.name} Demo Admin`, email, role: 'university_admin', universityId: university.id, accountStatus: profile.exists && profile.data().accountStatus ? profile.data().accountStatus : 'pending', createdAt: profile.exists ? profile.data().createdAt ?? FieldValue.serverTimestamp() : FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true })
  console.log(`[ready] ${university.id} → ${email} (${profile.exists && profile.data().accountStatus ? profile.data().accountStatus : 'pending'})`)
}
console.log(`Provisioned ${UNIVERSITIES.length} canonical university-admin profiles; created ${created}, existing ${existing}.`)
