import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { PageHeader } from '@/components/shell/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { StatusIndicator } from '@/components/feedback/status-indicator'
import { Spinner } from '@/components/feedback/loading-state'
import { ALLOWED_DOMAINS, TAGS_BY_DOMAIN, type Domain } from '@/lib/taxonomy'
import { SORTED_DISTRICTS } from '@/lib/districts'
import {
  validateChallengeForm,
  validateImageFile,
} from '@/lib/challenge-validator'
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary'
import { createChallenge } from '@/lib/challenge-service'
import {
  runChallengeAiAnalysis,
  type ChallengeAiRun,
} from '@/features/ai/services/challenge-ai-integration'
import type { ChallengeSubmission } from '@/types/ai'
import type { ValidationError } from '@/lib/challenge-validator'

export function NewChallengePage() {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // The pipeline is hard-bounded internally (~AI_TOTAL_BUDGET_MS + client
  // retry). This watchdog is a pure belt-and-suspenders guarantee that the UI
  // can never stay in "AI is analyzing..." forever even if a state update is
  // dropped (e.g. the page unmounts mid-analysis).
  const AI_ANALYSIS_WATCHDOG_MS = 50_000

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [domain, setDomain] = useState<Domain | ''>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [district, setDistrict] = useState('')
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [serverError, setServerError] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)

  const [aiRun, setAiRun] = useState<{
    state: 'idle' | 'analyzing' | 'completed' | 'failed'
    result?: ChallengeAiRun
  }>({ state: 'idle' })

  const availableTags = useMemo(() => {
    if (!domain || !isDomainKey(domain)) return []
    return TAGS_BY_DOMAIN[domain] as readonly string[]
  }, [domain])

  function isDomainKey(d: string): d is Domain {
    return (ALLOWED_DOMAINS as readonly string[]).includes(d)
  }

  const fieldError = useCallback(
    (field: string) => {
      const err = errors.find((e) => e.field === field)
      return err ? err.message : null
    },
    [errors],
  )

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  function handleDomainChange(value: string) {
    if (value === '' || isDomainKey(value)) {
      setDomain(value as Domain | '')
      setSelectedTags([])
    }
  }

  useEffect(() => {
    if (aiRun.state !== 'analyzing') return
    const timer = setTimeout(() => {
      setAiRun((prev) =>
        prev.state === 'analyzing'
          ? {
              state: 'failed',
              result: {
                ok: false,
                state: 'failed',
                errorCode: 'timeout',
                message:
                  'AI analysis timed out. Your challenge remains submitted and will still be reviewed.',
              },
            }
          : prev,
      )
    }, AI_ANALYSIS_WATCHDOG_MS)
    return () => clearTimeout(timer)
  }, [aiRun.state])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newFiles = Array.from(files)
    const fileErrors: string[] = []

    for (const file of newFiles) {
      const err = validateImageFile(file)
      if (err) {
        fileErrors.push(err)
        continue
      }
      if (pendingFiles.length + evidenceUrls.length + newFiles.length > 5) {
        fileErrors.push('At most 5 evidence files are allowed.')
        break
      }
    }

    if (fileErrors.length > 0) {
      setErrors(
        fileErrors.map((message) => ({ field: 'evidence', message })),
      )
      return
    }

    setErrors([])
    setPendingFiles((prev) => [...prev, ...newFiles])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removePendingFile(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function removeUploadedUrl(index: number) {
    setEvidenceUrls((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isSubmitting) return

    setErrors([])
    setServerError(null)

    const validation = validateChallengeForm({
      title,
      description,
      domain,
      tags: selectedTags,
      district,
      evidence: evidenceUrls,
    })

    if (!validation.ok) {
      setErrors(validation.errors)
      return
    }

    if (!userProfile) {
      setServerError('You must be signed in to submit a challenge.')
      return
    }

    setIsSubmitting(true)

    try {
      let uploadedUrls = [...evidenceUrls]

      if (pendingFiles.length > 0) {
        if (!isCloudinaryConfigured()) {
          setErrors([
            {
              field: 'evidence',
              message:
                'Image upload is not configured. You can submit without photos, or configure Cloudinary in your .env file.',
            },
          ])
          setIsSubmitting(false)
          return
        }

        setIsUploading(true)
        for (const file of pendingFiles) {
          const result = await uploadToCloudinary(file)
          if (!result.ok) {
            setServerError(`Upload failed: ${result.message}`)
            setIsSubmitting(false)
            setIsUploading(false)
            return
          }
          uploadedUrls.push(result.url)
        }
        setIsUploading(false)
      }

      const challengeId = await createChallenge(userProfile.uid, {
        title,
        description,
        domain: domain as Domain,
        tags: selectedTags,
        district,
        evidence: uploadedUrls,
      })

      setSuccessId(challengeId)

      // AI analysis is decoupled from challenge creation: the challenge is
      // already submitted and analysis failure never blocks or rolls it back.
      setAiRun({ state: 'analyzing' })
      const submission: ChallengeSubmission = {
        id: challengeId,
        citizenId: userProfile.uid,
        title,
        description,
        location: { district },
      }
      void runChallengeAiAnalysis(challengeId, submission).then((result) =>
        setAiRun({
          state: result.ok ? 'completed' : 'failed',
          result,
        }),
      )
    } catch (error) {
      const msg =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'Failed to submit challenge. Please try again.'
      setServerError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (successId) {
    return (
      <div>
        <PageHeader
          title="Challenge Submitted"
          subtitle="Your challenge has been recorded and will be reviewed."
        />
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <StatusIndicator label="Submitted" tone="info" />
            <p className="text-center text-sm text-muted-foreground">
              Your challenge has been submitted successfully. The AI analysis
              and government review process will begin shortly.
            </p>

            {aiRun.state === 'analyzing' && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Spinner className="size-4" />
                <span>AI is analyzing your challenge... this usually takes a few seconds.</span>
              </div>
            )}

            {aiRun.state === 'completed' && aiRun.result?.ok && (
              <div className="flex flex-col items-center gap-2">
                <StatusIndicator
                  label={
                    aiRun.result.lowConfidence
                      ? 'AI Analysis Complete: Low Confidence'
                      : 'AI Analysis Complete'
                  }
                  tone={aiRun.result.lowConfidence ? 'warning' : 'success'}
                />
                <p className="text-center text-xs text-muted-foreground">
                  {aiRun.result.lowConfidence
                    ? 'The analysis has been flagged for reviewer attention.'
                    : 'The analysis will guide the government review of your challenge.'}
                </p>
              </div>
            )}

            {aiRun.state === 'failed' && (
              <div className="flex flex-col items-center gap-2">
                <StatusIndicator label="AI Analysis Unavailable" tone="destructive" />
                <p className="text-center text-xs text-muted-foreground">
                  {aiRun.result && !aiRun.result.ok
                    ? aiRun.result.message
                    : 'An unexpected error occurred during AI analysis.'}{' '}
                  Your challenge was submitted successfully and will still be
                  reviewed.
                </p>
              </div>
            )}

            <p className="font-mono text-xs text-muted-foreground">
              Challenge ID: {successId}
            </p>
            <div className="mt-2 flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/citizen/challenges')}
              >
                View My Challenges
              </Button>
              <Button onClick={() => navigate(`/citizen/challenges/${successId}`)}>
                View Challenge
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Submit a Challenge"
        subtitle="Report a societal challenge in your community that needs attention."
      />

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <Card>
          <CardContent className="space-y-5 pt-5">
            <p className="text-sm text-muted-foreground">
              Describe the challenge as clearly as you can. The more detail you
              provide, the better the system can classify and route it to the
              right university for a solution.
            </p>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="challenge-title">
                Challenge Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="challenge-title"
                placeholder="e.g. Broken handpump in Ward 12"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                disabled={isSubmitting}
                aria-describedby={fieldError('title') ? 'title-error' : undefined}
                aria-invalid={!!fieldError('title')}
              />
              {fieldError('title') && (
                <p id="title-error" className="text-xs text-destructive" role="alert">
                  {fieldError('title')}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="challenge-description">
                Detailed Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="challenge-description"
                placeholder="Describe the problem, when it started, how many people are affected, what you have already tried..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                maxLength={5000}
                disabled={isSubmitting}
                aria-describedby={
                  fieldError('description') ? 'description-error' : undefined
                }
                aria-invalid={!!fieldError('description')}
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/5000 characters
              </p>
              {fieldError('description') && (
                <p
                  id="description-error"
                  className="text-xs text-destructive"
                  role="alert"
                >
                  {fieldError('description')}
                </p>
              )}
            </div>

            {/* Domain */}
            <div className="space-y-2">
              <Label>
                Domain <span className="text-destructive">*</span>
              </Label>
              <Select
                value={domain}
                onValueChange={handleDomainChange}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  className="w-full"
                  aria-describedby={fieldError('domain') ? 'domain-error' : undefined}
                  aria-invalid={!!fieldError('domain')}
                >
                  <SelectValue placeholder="Select a domain" />
                </SelectTrigger>
                <SelectContent>
                  {ALLOWED_DOMAINS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldError('domain') && (
                <p id="domain-error" className="text-xs text-destructive" role="alert">
                  {fieldError('domain')}
                </p>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>
                Tags <span className="text-destructive">*</span>
              </Label>
              {!domain ? (
                <p className="text-sm text-muted-foreground">
                  Select a domain first to see available tags.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2" role="group" aria-label="Challenge tags">
                  {availableTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag)
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        disabled={isSubmitting}
                        className={
                          isSelected
                            ? ''
                            : ''
                        }
                      >
                        <Badge
                          variant={isSelected ? 'default' : 'outline'}
                          className="cursor-pointer select-none"
                          aria-pressed={isSelected}
                        >
                          {tag}
                        </Badge>
                      </button>
                    )
                  })}
                </div>
              )}
              {fieldError('tags') && (
                <p className="text-xs text-destructive" role="alert">
                  {fieldError('tags')}
                </p>
              )}
            </div>

            {/* District */}
            <div className="space-y-2">
              <Label>
                District <span className="text-destructive">*</span>
              </Label>
              <Select
                value={district}
                onValueChange={setDistrict}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  className="w-full"
                  aria-describedby={
                    fieldError('district') ? 'district-error' : undefined
                  }
                  aria-invalid={!!fieldError('district')}
                >
                  <SelectValue placeholder="Select your district" />
                </SelectTrigger>
                <SelectContent>
                  {SORTED_DISTRICTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldError('district') && (
                <p
                  id="district-error"
                  className="text-xs text-destructive"
                  role="alert"
                >
                  {fieldError('district')}
                </p>
              )}
            </div>

            {/* Evidence */}
            <div className="space-y-2">
              <Label>Evidence Photos (optional)</Label>
              <p className="text-xs text-muted-foreground">
                Upload photos showing the challenge. Maximum 5 files, 10 MB each.
                JPEG, PNG, or WebP.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                multiple
                onChange={handleFileChange}
                className="sr-only"
                id="evidence-upload"
                aria-label="Upload evidence photos"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting || isUploading}
              >
                {isUploading ? (
                  <>
                    <Spinner className="size-3.5" /> Uploading...
                  </>
                ) : (
                  'Add Photos'
                )}
              </Button>

              {pendingFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {pendingFiles.map((file, i) => (
                    <div
                      key={`pending-${i}`}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="truncate text-muted-foreground">
                        {file.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                      <button
                        type="button"
                        onClick={() => removePendingFile(i)}
                        className="text-xs text-destructive hover:underline"
                        disabled={isSubmitting}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {evidenceUrls.length > 0 && (
                <div className="mt-2 space-y-1">
                  {evidenceUrls.map((_url, i) => (
                    <div
                      key={`uploaded-${i}`}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="truncate text-muted-foreground">
                        Photo {i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeUploadedUrl(i)}
                        className="text-xs text-destructive hover:underline"
                        disabled={isSubmitting}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {fieldError('evidence') && (
                <p className="text-xs text-destructive" role="alert">
                  {fieldError('evidence')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {serverError && (
          <div
            className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            role="alert"
          >
            {serverError}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/citizen/challenges')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner className="size-3.5" />{' '}
                {isUploading ? 'Uploading...' : 'Submitting...'}
              </>
            ) : (
              'Submit Challenge'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
