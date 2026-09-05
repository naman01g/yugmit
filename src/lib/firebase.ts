import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

interface FirebaseServices {
  app: FirebaseApp
  auth: Auth
  db: Firestore
}

function initFirebase(): FirebaseServices | null {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID

  if (!apiKey || !authDomain || !projectId) {
    console.warn(
      '[YUGMIT] Firebase not configured. Set VITE_FIREBASE_API_KEY, ' +
        'VITE_FIREBASE_AUTH_DOMAIN, and VITE_FIREBASE_PROJECT_ID in your .env file.',
    )
    return null
  }

  const app =
    getApps().length === 0
      ? initializeApp({ apiKey, authDomain, projectId, ...extraConfig() })
      : getApps()[0]!

  return { app, auth: getAuth(app), db: getFirestore(app) }
}

function extraConfig(): Record<string, string> {
  const cfg: Record<string, string> = {}
  if (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) {
    cfg['storageBucket'] = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
  }
  if (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) {
    cfg['messagingSenderId'] = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
  }
  if (import.meta.env.VITE_FIREBASE_APP_ID) {
    cfg['appId'] = import.meta.env.VITE_FIREBASE_APP_ID
  }
  return cfg
}

const services = initFirebase()

/**
 * Firebase app instance. Null when Firebase is not configured.
 */
export const firebaseApp = services?.app ?? null

/**
 * Firebase Auth instance. Null when Firebase is not configured.
 * Auth-dependent code must check for null before use.
 */
export const auth: Auth | null = services?.auth ?? null

/**
 * Firestore instance. Null when Firebase is not configured.
 * Firestore-dependent code must check for null before use.
 */
export const db: Firestore | null = services?.db ?? null

/**
 * Whether Firebase is configured and available.
 */
export const isFirebaseConfigured = services !== null
