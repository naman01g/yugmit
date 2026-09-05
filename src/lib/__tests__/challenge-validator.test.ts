import { describe, expect, it } from 'vitest'

import {
  validateChallengeForm,
  validateImageFile,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_EVIDENCE_FILES,
  MAX_FILE_SIZE_MB,
} from '../challenge-validator'

const VALID_FORM = {
  title: 'Broken handpump in Ward 12',
  description:
    'The handpump near the primary school has been non-functional for three weeks. Over 200 families depend on it for drinking water.',
  domain: 'Water Management',
  tags: ['Drinking Water', 'Water Supply'],
  district: 'Ranchi',
  evidence: [],
}

describe('challenge validator — valid form', () => {
  it('accepts a fully valid form', () => {
    const result = validateChallengeForm(VALID_FORM)
    expect(result.ok).toBe(true)
  })

  it('accepts a form without evidence', () => {
    const result = validateChallengeForm({ ...VALID_FORM, evidence: [] })
    expect(result.ok).toBe(true)
  })

  it('accepts a form with evidence URLs', () => {
    const result = validateChallengeForm({
      ...VALID_FORM,
      evidence: ['https://res.cloudinary.com/test/image/upload/v1/test.jpg'],
    })
    expect(result.ok).toBe(true)
  })
})

describe('challenge validator — title', () => {
  it('rejects empty title', () => {
    const result = validateChallengeForm({ ...VALID_FORM, title: '' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'title')).toBe(true)
    }
  })

  it('rejects whitespace-only title', () => {
    const result = validateChallengeForm({ ...VALID_FORM, title: '   ' })
    expect(result.ok).toBe(false)
  })

  it('rejects title exceeding max length', () => {
    const result = validateChallengeForm({
      ...VALID_FORM,
      title: 'A'.repeat(MAX_TITLE_LENGTH + 1),
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'title')).toBe(true)
    }
  })

  it('accepts title at exactly max length', () => {
    const result = validateChallengeForm({
      ...VALID_FORM,
      title: 'A'.repeat(MAX_TITLE_LENGTH),
    })
    expect(result.ok).toBe(true)
  })
})

describe('challenge validator — description', () => {
  it('rejects empty description', () => {
    const result = validateChallengeForm({ ...VALID_FORM, description: '' })
    expect(result.ok).toBe(false)
  })

  it('rejects whitespace-only description', () => {
    const result = validateChallengeForm({ ...VALID_FORM, description: '  ' })
    expect(result.ok).toBe(false)
  })

  it('rejects description exceeding max length', () => {
    const result = validateChallengeForm({
      ...VALID_FORM,
      description: 'X'.repeat(MAX_DESCRIPTION_LENGTH + 1),
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'description')).toBe(true)
    }
  })
})

describe('challenge validator — domain', () => {
  it('rejects invalid domain', () => {
    const result = validateChallengeForm({ ...VALID_FORM, domain: 'Technology' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'domain')).toBe(true)
    }
  })

  it('rejects empty domain', () => {
    const result = validateChallengeForm({ ...VALID_FORM, domain: '' })
    expect(result.ok).toBe(false)
  })

  it('accepts all 10 approved domains', () => {
    const domains = [
      'Education',
      'Agriculture',
      'Healthcare',
      'Water Management',
      'Environment',
      'Energy',
      'Urban Development',
      'Accessibility',
      'Public Administration',
      'Rural Livelihoods',
    ]
    for (const domain of domains) {
      const result = validateChallengeForm({ ...VALID_FORM, domain, tags: [] })
      // Tags will fail if empty, but domain should not
      if (!result.ok) {
        expect(
          result.errors.some((e) => e.field === 'domain'),
          `Domain "${domain}" should be valid`,
        ).toBe(false)
      }
    }
  })
})

describe('challenge validator — tags', () => {
  it('rejects empty tags', () => {
    const result = validateChallengeForm({ ...VALID_FORM, tags: [] })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'tags')).toBe(true)
    }
  })

  it('rejects tag not belonging to the selected domain', () => {
    const result = validateChallengeForm({
      ...VALID_FORM,
      domain: 'Agriculture',
      tags: ['Roads'], // Urban Development tag
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'tags' && e.message.includes('Roads'))).toBe(true)
    }
  })

  it('accepts tag belonging to the selected domain', () => {
    const result = validateChallengeForm({
      ...VALID_FORM,
      domain: 'Agriculture',
      tags: ['Crop Management', 'Irrigation'],
    })
    expect(result.ok).toBe(true)
  })

  it('rejects duplicate tags', () => {
    const result = validateChallengeForm({
      ...VALID_FORM,
      tags: ['Drinking Water', 'Drinking Water'],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'tags' && e.message.includes('Duplicate'))).toBe(true)
    }
  })

  it('allows a single tag', () => {
    const result = validateChallengeForm({
      ...VALID_FORM,
      tags: ['Drinking Water'],
    })
    expect(result.ok).toBe(true)
  })
})

describe('challenge validator — district', () => {
  it('rejects empty district', () => {
    const result = validateChallengeForm({ ...VALID_FORM, district: '' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'district')).toBe(true)
    }
  })

  it('rejects invalid district', () => {
    const result = validateChallengeForm({
      ...VALID_FORM,
      district: 'Mumbai',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'district')).toBe(true)
    }
  })

  it('accepts valid Jharkhand districts', () => {
    const districts = ['Ranchi', 'Dhanbad', 'Hazaribagh', 'Gumla', 'Pakur']
    for (const district of districts) {
      const result = validateChallengeForm({ ...VALID_FORM, district })
      expect(result.ok).toBe(true)
    }
  })
})

describe('challenge validator — evidence', () => {
  it('rejects more than MAX_EVIDENCE_FILES', () => {
    const urls = Array.from(
      { length: MAX_EVIDENCE_FILES + 1 },
      (_, i) => `https://cloudinary.com/image${i}.jpg`,
    )
    const result = validateChallengeForm({ ...VALID_FORM, evidence: urls })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'evidence')).toBe(true)
    }
  })

  it('accepts exactly MAX_EVIDENCE_FILES', () => {
    const urls = Array.from(
      { length: MAX_EVIDENCE_FILES },
      (_, i) => `https://cloudinary.com/image${i}.jpg`,
    )
    const result = validateChallengeForm({ ...VALID_FORM, evidence: urls })
    expect(result.ok).toBe(true)
  })
})

describe('challenge validator — initial status', () => {
  it('validates that challenge creation form does not expose status', () => {
    // The form type ChallengeFormData does not include 'status'.
    // The service layer sets status to 'submitted'.
    // This test documents the intent.
    const formData = { ...VALID_FORM }
    expect('status' in formData).toBe(false)
  })
})

describe('challenge validator — multiple errors', () => {
  it('returns all errors, not just the first one', () => {
    const result = validateChallengeForm({
      title: '',
      description: '',
      domain: 'Invalid',
      tags: [],
      district: '',
      evidence: [],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThanOrEqual(4)
    }
  })
})

describe('image file validation', () => {
  function makeFile(name: string, type: string, sizeBytes: number): File {
    const buffer = new ArrayBuffer(sizeBytes)
    return new File([buffer], name, { type })
  }

  it('rejects non-image file types', () => {
    const file = makeFile('doc.pdf', 'application/pdf', 1000)
    const result = validateImageFile(file)
    expect(result).not.toBeNull()
    expect(result).toContain('Unsupported file type')
  })

  it('rejects oversized files', () => {
    const file = makeFile(
      'large.jpg',
      'image/jpeg',
      (MAX_FILE_SIZE_MB + 1) * 1024 * 1024,
    )
    const result = validateImageFile(file)
    expect(result).not.toBeNull()
    expect(result).toContain('too large')
  })

  it('accepts valid JPEG under size limit', () => {
    const file = makeFile('photo.jpg', 'image/jpeg', 1000)
    const result = validateImageFile(file)
    expect(result).toBeNull()
  })

  it('accepts valid PNG', () => {
    const file = makeFile('photo.png', 'image/png', 1000)
    const result = validateImageFile(file)
    expect(result).toBeNull()
  })

  it('accepts valid WebP', () => {
    const file = makeFile('photo.webp', 'image/webp', 1000)
    const result = validateImageFile(file)
    expect(result).toBeNull()
  })
})
