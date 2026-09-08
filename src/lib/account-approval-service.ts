import { collection, doc, getDocs, query, serverTimestamp, updateDoc, where, Timestamp } from 'firebase/firestore'
import { db as firebaseDb, isFirebaseConfigured } from './firebase'
import type { UserProfile } from '@/types/user'

function requireDb(): NonNullable<typeof firebaseDb> {
  if (!firebaseDb || !isFirebaseConfigured) throw new Error('Firebase is not configured.')
  return firebaseDb
}

function profile(id: string, data: Record<string, unknown>): UserProfile {
  const date = (value: unknown) => value instanceof Timestamp ? value.toMillis() : typeof value === 'number' ? value : Date.now()
  return { uid: id, role: data.role as UserProfile['role'], name: String(data.name ?? ''), email: String(data.email ?? ''), universityId: typeof data.universityId === 'string' ? data.universityId : undefined, accountStatus: data.accountStatus as UserProfile['accountStatus'], createdAt: date(data.createdAt), updatedAt: date(data.updatedAt) }
}

export async function getPendingUniversityAdmins(): Promise<UserProfile[]> {
  const snap = await getDocs(query(collection(requireDb(), 'users'), where('role', '==', 'university_admin'), where('accountStatus', '==', 'pending')))
  return snap.docs.map((item) => profile(item.id, item.data()))
}

export async function getPendingStudents(universityId: string): Promise<UserProfile[]> {
  const snap = await getDocs(query(collection(requireDb(), 'users'), where('role', '==', 'student'), where('universityId', '==', universityId), where('accountStatus', '==', 'pending')))
  return snap.docs.map((item) => profile(item.id, item.data()))
}

export async function setUniversityAdminStatus(uid: string, accountStatus: 'approved' | 'rejected'): Promise<void> {
  await updateDoc(doc(requireDb(), 'users', uid), { accountStatus, updatedAt: serverTimestamp() })
}

export async function setStudentStatus(uid: string, accountStatus: 'approved' | 'rejected'): Promise<void> {
  await updateDoc(doc(requireDb(), 'users', uid), { accountStatus, updatedAt: serverTimestamp() })
}
