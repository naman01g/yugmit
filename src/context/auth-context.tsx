import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth'

import { auth as firebaseAuth, isFirebaseConfigured } from '@/lib/firebase'
import {
  loginWithEmailPassword,
  registerCitizen,
  logoutUser,
  fetchUserProfile,
  touchUserTimestamp,
} from '@/lib/auth'
import type { UserProfile } from '@/types/user'

export interface AuthState {
  firebaseUser: FirebaseUser | null
  userProfile: UserProfile | null
  isLoading: boolean
  profileError: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

/**
 * Derives the loading state from the raw auth signals.
 */
function deriveIsLoading(
  authInitialized: boolean,
  firebaseUser: FirebaseUser | null,
  userProfile: UserProfile | null,
  profileError: string | null,
): boolean {
  if (!authInitialized) return true
  if (firebaseUser && !userProfile && !profileError) return true
  return false
}

const FIREBASE_NOT_CONFIGURED_MSG =
  'Firebase is not configured. Set VITE_FIREBASE_API_KEY, ' +
  'VITE_FIREBASE_AUTH_DOMAIN, and VITE_FIREBASE_PROJECT_ID in your .env file.'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [authInitialized, setAuthInitialized] = useState(isFirebaseConfigured)
  const mountedRef = useRef(true)

  const loadProfile = useCallback(async (user: FirebaseUser) => {
    try {
      setProfileError(null)
      const profile = await fetchUserProfile(user.uid)
      if (!mountedRef.current) return
      if (profile) {
        setUserProfile(profile)
        void touchUserTimestamp(user.uid)
      } else {
        setUserProfile(null)
        setProfileError('User profile not found. Contact an administrator.')
      }
    } catch {
      if (!mountedRef.current) return
      setUserProfile(null)
      setProfileError('Failed to load user profile. Please refresh.')
    }
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseAuth) return

    mountedRef.current = true
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (!mountedRef.current) return
      setFirebaseUser(user)
      setAuthInitialized(true)
      if (user) {
        void loadProfile(user)
      } else {
        setUserProfile(null)
        setProfileError(null)
      }
    })
    return () => {
      mountedRef.current = false
      unsubscribe()
    }
  }, [loadProfile])

  const isLoading = deriveIsLoading(
    authInitialized,
    firebaseUser,
    userProfile,
    profileError,
  )

  const login = useCallback(
    async (email: string, password: string) => {
      const user = await loginWithEmailPassword(email, password)
      setFirebaseUser(user)
      await loadProfile(user)
    },
    [loadProfile],
  )

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const user = await registerCitizen(email, password, name)
      setFirebaseUser(user)
      await loadProfile(user)
    },
    [loadProfile],
  )

  const logout = useCallback(async () => {
    await logoutUser()
    setFirebaseUser(null)
    setUserProfile(null)
    setProfileError(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    const user = firebaseAuth?.currentUser
    if (user) await loadProfile(user)
  }, [loadProfile])

  const effectiveProfileError = isFirebaseConfigured
    ? profileError
    : FIREBASE_NOT_CONFIGURED_MSG

  const value: AuthState = useMemo(
    () => ({
      firebaseUser,
      userProfile,
      isLoading,
      profileError: effectiveProfileError,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [
      firebaseUser,
      userProfile,
      isLoading,
      effectiveProfileError,
      login,
      register,
      logout,
      refreshProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
