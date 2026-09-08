import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'

import { auth as firebaseAuth, db as firebaseDb, isFirebaseConfigured } from './firebase'
import type { UserProfile } from '@/types/user'

export interface AuthError {
  code: string
  message: string
}

function mapAuthError(error: unknown): AuthError {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  ) {
    const code = (error as { code: string }).code

    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return { code, message: 'Invalid email or password.' }
      case 'auth/user-disabled':
        return { code, message: 'This account has been disabled.' }
      case 'auth/too-many-requests':
        return {
          code,
          message: 'Too many attempts. Please try again later.',
        }
      case 'auth/network-request-failed':
        return { code, message: 'Network error. Check your connection.' }
      case 'auth/email-already-in-use':
        return { code, message: 'An account already exists for this email.' }
      case 'auth/invalid-email':
        return { code, message: 'Enter a valid email address.' }
      case 'auth/weak-password':
        return { code, message: 'Password must be at least 6 characters.' }
      default:
        return { code, message: 'Sign-in failed. Please try again.' }
    }
  }

  return { code: 'unknown', message: 'An unexpected error occurred.' }
}

function requireFirebase(): { auth: NonNullable<typeof firebaseAuth>; db: NonNullable<typeof firebaseDb> } {
  if (!firebaseAuth || !firebaseDb || !isFirebaseConfigured) {
    throw {
      code: 'firebase/not-configured',
      message:
        'Firebase is not configured. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, and VITE_FIREBASE_PROJECT_ID in your .env file.',
    } satisfies AuthError
  }
  return { auth: firebaseAuth, db: firebaseDb }
}

/**
 * Signs in with email and password.
 * Returns the Firebase user on success.
 * Throws a mapped AuthError on failure.
 */
export async function loginWithEmailPassword(
  email: string,
  password: string,
): Promise<FirebaseUser> {
  const { auth: authInstance } = requireFirebase()
  try {
    const credential = await signInWithEmailAndPassword(authInstance, email, password)
    return credential.user
  } catch (error) {
    throw mapAuthError(error)
  }
}

export async function registerCitizen(email: string, password: string, name: string): Promise<FirebaseUser> {
  const { auth: authInstance, db: dbInstance } = requireFirebase()
  try {
    const credential = await createUserWithEmailAndPassword(authInstance, email, password)
    await setDoc(doc(dbInstance, 'users', credential.user.uid), {
      uid: credential.user.uid,
      role: 'citizen',
      accountStatus: 'approved',
      name: name.trim(),
      email: email.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return credential.user
  } catch (error) {
    throw mapAuthError(error)
  }
}

/** Creates a student request. The selected university is only a request until
 * that university's approved admin changes accountStatus. */
export async function registerStudent(
  email: string,
  password: string,
  name: string,
  universityId: string,
): Promise<FirebaseUser> {
  const { auth: authInstance, db: dbInstance } = requireFirebase()
  try {
    const credential = await createUserWithEmailAndPassword(authInstance, email, password)
    await setDoc(doc(dbInstance, 'users', credential.user.uid), {
      uid: credential.user.uid,
      role: 'student',
      name: name.trim(),
      email: email.trim(),
      universityId,
      accountStatus: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return credential.user
  } catch (error) {
    throw mapAuthError(error)
  }
}

/**
 * Signs out the current user.
 */
export async function logoutUser(): Promise<void> {
  const { auth: authInstance } = requireFirebase()
  await signOut(authInstance)
}

/**
 * Fetches the user's Firestore profile document.
 * Returns null if no document exists.
 */
export async function fetchUserProfile(
  uid: string,
): Promise<UserProfile | null> {
  const { db: dbInstance } = requireFirebase()
  const snapshot = await getDoc(doc(dbInstance, 'users', uid))
  return snapshot.exists() ? (snapshot.data() as UserProfile) : null
}

/**
 * Touches the user's updatedAt timestamp on login.
 * Errors are silently ignored — this is not security-critical.
 */
export async function touchUserTimestamp(uid: string): Promise<void> {
  const { db: dbInstance } = requireFirebase()
  try {
    await updateDoc(doc(dbInstance, 'users', uid), {
      updatedAt: serverTimestamp(),
    })
  } catch {
    // Non-critical: ignore timestamp update failures
  }
}
