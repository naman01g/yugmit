import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/feedback/loading-state'
import { PageHeader } from '@/components/shell/page-header'

export function RegisterPage() {
  const { firebaseUser, userProfile, register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (firebaseUser && userProfile) navigate('/citizen', { replace: true })
  }, [firebaseUser, userProfile, navigate])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!name.trim()) return setError('Full name is required.')
    if (!email.trim()) return setError('Email is required.')
    if (password !== confirmPassword) return setError('Passwords do not match.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    setSubmitting(true)
    try {
      await register(email.trim(), password, name.trim())
    } catch (err) {
      setError(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Account creation failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return <div className="mx-auto w-full max-w-md py-8">
    <PageHeader title="Create account" subtitle="Create a citizen account to submit challenges." />
    <div className="rounded-lg border border-border bg-card p-6">
      <form className="space-y-4" onSubmit={submit} noValidate>
        {error && <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}
        <div className="space-y-1.5"><Label htmlFor="register-name">Full name</Label><Input id="register-name" value={name} onChange={(e) => setName(e.target.value)} disabled={submitting} required /></div>
        <div className="space-y-1.5"><Label htmlFor="register-email">Email address</Label><Input id="register-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={submitting} required /></div>
        <div className="space-y-1.5"><Label htmlFor="register-password">Password</Label><Input id="register-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={submitting} required /></div>
        <div className="space-y-1.5"><Label htmlFor="register-confirm-password">Confirm password</Label><Input id="register-confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={submitting} required /></div>
        <Button type="submit" className="w-full" disabled={submitting}>{submitting ? <span className="flex items-center gap-2"><Spinner className="size-4" />Creating account...</span> : 'Create citizen account'}</Button>
      </form>
    </div>
    <p className="mt-4 text-center text-sm text-muted-foreground">Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link></p>
  </div>
}
