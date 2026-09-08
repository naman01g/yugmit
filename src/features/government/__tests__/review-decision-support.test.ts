import { describe, expect, it } from 'vitest'
import pageSource from '../pages/challenge-detail-page.tsx?raw'
import serviceSource from '@/lib/government-review-service.ts?raw'
import rulesSource from '../../../../firestore.rules?raw'

describe('Government review decision support', () => {
  it('preserves the lifecycle decision dropdown and Submitted Start Review option', () => {
    expect(pageSource).toContain('id="government-decision"')
    expect(pageSource).toContain('<option value="">Select action...</option>')
    expect(pageSource).toContain("challenge.status === 'submitted'")
    expect(pageSource).toContain('<option value="under_review">Start Review</option>')
  })

  it('presents human decisions separately from AI review signals', () => {
    expect(pageSource).toContain('AI Review Signals')
    expect(pageSource).toContain('AI flags and explains. Government decides.')
    expect(pageSource).toContain('Government decision')
  })

  it('keeps spam as the only dropdown entry point and requires a reason', () => {
    const select = pageSource.match(/<select id="government-decision"[\s\S]*?<\/select>/)?.[0] ?? ''
    expect(select).toContain('<option value="spam">Mark as Spam</option>')
    expect(pageSource).not.toContain('>Moderation<')
    expect(pageSource).not.toContain('setSpamDialogOpen')
    expect(pageSource).toContain("actionNeedsComment && !comment.trim()")
  })

  it('does not fabricate duplicate candidates or phrase overlap', () => {
    expect(pageSource).toContain('Duplicate analysis not available.')
    expect(pageSource).toContain('Phrase-level overlap is not shown')
    expect(pageSource).toContain('duplicate_candidates')
  })

  it('exposes merge, link and keep-separate only with a real candidate', () => {
    expect(pageSource).toContain('topDuplicate &&')
    expect(pageSource).toContain('<option value="merge">Merge</option>')
    expect(pageSource).toContain('<option value="link">Link Related</option>')
    expect(pageSource).toContain('<option value="keep_separate">Keep Separate</option>')
  })

  it('keeps spam as a Government field and writes an audit event', () => {
    expect(serviceSource).toContain("spamStatus: 'none' | 'confirmed'")
    expect(serviceSource).toContain("'marked_spam'")
    expect(serviceSource).toContain("'spam_restored'")
    expect(rulesSource).toContain("request.resource.data.spamStatus in ['none', 'confirmed']")
    expect(rulesSource).toContain(".hasOnly(['spamStatus', 'updatedAt'])")
  })

  it('keeps university matching explicit', () => {
    expect(pageSource).toContain('University Matching Not Run')
    expect(pageSource).toContain('Run University Matching')
  })
})
