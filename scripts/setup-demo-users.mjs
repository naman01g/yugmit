/**
 * Provision demo user accounts for SIH26043 V1.
 *
 * Usage:
 *   node scripts/setup-demo-users.mjs
 *
 * Requires:
 *   - /tmp/firebase-admin-key.json (service account key, auto-created by gcloud step)
 *   - firebase-admin package installed
 *
 * This script:
 *   1. Creates Firebase Auth users with email/password
 *   2. Creates corresponding Firestore user documents with roles
 *
 * This script is safe to run multiple times — it will skip users that already exist.
 *
 * DO NOT commit real credentials or service account keys.
 */

import { initializeApp, cert, applicationDefault } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SERVICE_ACCOUNT_PATH = '/tmp/firebase-admin-key.json'

function loadServiceAccount() {
  try {
    const raw = readFileSync(resolve(SERVICE_ACCOUNT_PATH), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const DEMO_USERS = [
  {
    email: 'citizen@jan-setu.gov',
    password: 'Demo@1234',
    name: 'Priya Kumari',
    role: 'citizen',
    universityId: null,
  },
  {
    email: 'government@jan-setu.gov',
    password: 'Demo@1234',
    name: 'Rajesh Kumar (Govt.)',
    role: 'government',
    universityId: null,
  },
  {
    email: 'university_admin@jan-setu.gov',
    password: 'Demo@1234',
    name: 'Dr. Sunita Verma',
    role: 'university_admin',
    universityId: 'bit-mesra',
  },
  {
    email: 'faculty@jan-setu.gov',
    password: 'Demo@1234',
    name: 'Prof. Amit Singh',
    role: 'faculty',
    universityId: 'bit-mesra',
  },
  {
    email: 'student@jan-setu.gov',
    password: 'Demo@1234',
    name: 'Neha Gupta',
    role: 'student',
    universityId: 'bit-mesra',
  },
]

async function main() {
  const sa = loadServiceAccount()

  if (sa) {
    initializeApp({ credential: cert(sa) })
    console.log('Initialized with service account key.')
  } else {
    console.log(
      'Service account key not found. Trying application default credentials...',
    )
    try {
      initializeApp({ credential: applicationDefault() })
      console.log('Initialized with application default credentials.')
    } catch {
      console.error(
        `Could not find service account at ${SERVICE_ACCOUNT_PATH}.\n` +
          'Run: gcloud iam service-accounts keys create /tmp/firebase-admin-key.json \\\n' +
          '  --iam-account=firebase-admin-sa@jan-setu-sih26043.iam.gserviceaccount.com',
      )
      process.exit(1)
    }
  }

  const auth = getAuth()
  const db = getFirestore()

  let created = 0
  let skipped = 0

  for (const user of DEMO_USERS) {
    let uid
    try {
      const existing = await auth.getUserByEmail(user.email)
      uid = existing.uid
      skipped++
      console.log(`  [skip] ${user.email} (uid: ${uid})`)
    } catch {
      const record = await auth.createUser({
        email: user.email,
        password: user.password,
        displayName: user.name,
        emailVerified: true,
      })
      uid = record.uid
      created++
      console.log(`  [created] ${user.email} (uid: ${uid})`)
    }

    await db.collection('users').doc(uid).set(
      {
        uid,
        name: user.name,
        email: user.email,
        role: user.role,
        universityId: user.universityId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`)
  console.log('\nDemo accounts:')
  console.log('  citizen@jan-setu.gov        / Demo@1234  (role: citizen)')
  console.log('  government@jan-setu.gov     / Demo@1234  (role: government)')
  console.log('  university_admin@jan-setu.gov / Demo@1234  (role: university_admin)')
  console.log('  faculty@jan-setu.gov        / Demo@1234  (role: faculty)')
  console.log('  student@jan-setu.gov        / Demo@1234  (role: student)')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
