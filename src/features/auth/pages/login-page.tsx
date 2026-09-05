import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '@/context/auth-context'
import { getRoleHomePath } from '@/lib/roles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/feedback/loading-state'
import { PageHeader } from '@/components/shell/page-header'

interface LoginPageError {
  message: string
}

export function LoginPage() {
  const { firebaseUser, userProfile, isLoading, login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<LoginPageError | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isAuthLoading = isLoading && firebaseUser === undefined

  useEffect(() => {
    if (!isAuthLoading && firebaseUser && userProfile) {
      navigate(getRoleHomePath(userProfile.role), { replace: true })
    }
  }, [isAuthLoading, firebaseUser, userProfile, navigate])

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="text-primary" />
      </div>
    )
  }

  if (firebaseUser && userProfile) {
    return null
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError({ message: 'Email is required.' })
      return
    }
    if (!password) {
      setError({ message: 'Password is required.' })
      return
    }

    setIsSubmitting(true)
    try {
      await login(email.trim(), password)
    } catch (err) {
      const authError = err as { message?: string }
      setError({ message: authError.message ?? 'Sign-in failed.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md py-8">
      <PageHeader title="Sign in" subtitle="Access the YUGMIT platform" />

      <div className="rounded-lg border border-border bg-card p-6">
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          {error ? (
            <div
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {error.message}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="login-email">Email address</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.gov"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Spinner className="size-4" />
                Signing in...
              </span>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">Need a citizen account? <Link to="/register" className="text-primary hover:underline">Create account</Link></p>
    </div>
  )
}
