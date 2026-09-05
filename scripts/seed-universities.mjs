/**
 * Seed verified university capability profiles into Firestore.
 *
 * Usage:
 *   node scripts/seed-universities.mjs
 *
 * Requires:
 *   - /tmp/firebase-admin-key.json (service account key)
 *   - firebase-admin package installed
 *
 * This script:
 *   1. Reads the university dataset from src/data/universities.ts
 *   2. Writes each university profile to Firestore `universities` collection
 *   3. Is idempotent — safe to run multiple times (uses merge: true)
 *
 * This does NOT modify the matching algorithm.
 * This does NOT add Cloud Functions or paid infrastructure.
 *
 * DO NOT commit real credentials or service account keys.
 */

import { initializeApp, cert, applicationDefault } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Canonical dataset — the single source of truth (src/data/universities.ts).
// Node 26 strips TypeScript types natively, so the seed reads the same
// importable module the application uses instead of a drifting inline copy.
import { UNIVERSITIES } from '../src/data/universities.ts'

const SERVICE_ACCOUNT_PATH = '/tmp/firebase-admin-key.json'

function loadServiceAccount() {
  try {
    const raw = readFileSync(resolve(SERVICE_ACCOUNT_PATH), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * Seeds all university profiles into the `universities` Firestore collection.
 *
 * Each document uses the university's stable `id` as the document ID.
 * The `seededAt` field is added for traceability.
 */
async function seedUniversities(db) {
  const collection = db.collection('universities')
  let seeded = 0

  for (const uni of UNIVERSITIES) {
    const docRef = collection.doc(uni.id)
    await docRef.set(
      {
        ...uni,
        seededAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
    seeded++
    console.log(`  [seeded] ${uni.id} — ${uni.name}`)
  }

  return seeded
}

async function main() {
  const sa = loadServiceAccount()

  if (UNIVERSITIES.length === 0) {
    console.error('Fatal error: no university profiles found in the canonical dataset.')
    process.exit(1)
  }
  console.log(`Canonical dataset loaded: ${UNIVERSITIES.length} university profiles.`)

  if (sa) {
    initializeApp({ credential: cert(sa) })
    console.log('Initialized with service account key.')
  } else {
    console.log('Service account key not found. Trying application default credentials...')
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

  const db = getFirestore()
  console.log('\nSeeding university capability profiles...\n')

  const count = await seedUniversities(db)

  console.log(`\nDone. Seeded: ${count} universities`)
  console.log(`Collection: universities`)
  console.log(`Dataset version: university-dataset-v1`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
