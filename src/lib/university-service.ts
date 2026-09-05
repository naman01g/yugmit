/**
 * University Firestore service — Module 07
 *
 * Provides read operations for university-related data.
 * Used by team formation to get students and university info.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore'

import { db as firebaseDb, isFirebaseConfigured } from './firebase'
import type { UserProfile } from '@/types/user'

export interface UniversityServiceError {
  code: string
  message: string
}

function requireDb(): NonNullable<typeof firebaseDb> {
  if (!firebaseDb || !isFirebaseConfigured) {
    throw {
      code: 'firebase/not-configured',
      message: 'Firebase is not configured.',
    } satisfies UniversityServiceError
  }
  return firebaseDb
}

/**
 * Gets all students for a university.
 * Returns student user profiles.
 */
export async function getUniversityStudents(universityId: string): Promise<UserProfile[]> {
  const db = requireDb()
  const q = query(
    collection(db, 'users'),
    where('universityId', '==', universityId),
    where('role', '==', 'student'),
    orderBy('name', 'asc'),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => {
    const data = d.data()
    return {
      uid: d.id,
      role: data.role,
      name: data.name,
      email: data.email,
      phone: data.phone as string | undefined,
      universityId: data.universityId as string | undefined,
      createdAt: data.createdAt instanceof Timestamp
        ? data.createdAt.toMillis()
        : typeof data.createdAt === 'number'
          ? data.createdAt
          : Date.now(),
      updatedAt: data.updatedAt instanceof Timestamp
        ? data.updatedAt.toMillis()
        : typeof data.updatedAt === 'number'
          ? data.updatedAt
          : Date.now(),
    }
  })
}

/**
 * Gets all faculty for a university.
 */
export async function getUniversityFaculty(universityId: string): Promise<UserProfile[]> {
  const db = requireDb()
  const q = query(
    collection(db, 'users'),
    where('universityId', '==', universityId),
    where('role', '==', 'faculty'),
    orderBy('name', 'asc'),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => {
    const data = d.data()
    return {
      uid: d.id,
      role: data.role,
      name: data.name,
      email: data.email,
      phone: data.phone as string | undefined,
      universityId: data.universityId as string | undefined,
      createdAt: data.createdAt instanceof Timestamp
        ? data.createdAt.toMillis()
        : typeof data.createdAt === 'number'
          ? data.createdAt
          : Date.now(),
      updatedAt: data.updatedAt instanceof Timestamp
        ? data.updatedAt.toMillis()
        : typeof data.updatedAt === 'number'
          ? data.updatedAt
          : Date.now(),
    }
  })
}

/**
 * Gets a university by ID.
 */
export async function getUniversity(universityId: string): Promise<Record<string, unknown> | null> {
  const db = requireDb()
  const snapshot = await getDoc(doc(db, 'universities', universityId))
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() }
}

/**
 * Gets a university's display name, or falls back to its id.
 */
export async function getUniversityName(universityId: string): Promise<string> {
  const db = requireDb()
  const snapshot = await getDoc(doc(db, 'universities', universityId))
  if (!snapshot.exists()) return universityId
  const data = snapshot.data()
  const name = data.name
  return typeof name === 'string' && name.trim().length > 0 ? name : universityId
}

/**
 * Gets all universities.
 */
export async function getAllUniversities(): Promise<Record<string, unknown>[]> {
  const db = requireDb()
  const snapshot = await getDocs(collection(db, 'universities'))
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}
