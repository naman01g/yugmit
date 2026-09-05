/**
 * Challenge form validation.
 *
 * Validates citizen-submitted challenge data against locked taxonomy,
 * required fields, and sensible constraints. Returns ALL errors, not
 * just the first one.
 */

import { isDomain, isTagForDomain, type Domain } from './taxonomy'
import { isJharkhandDistrict } from './districts'

export interface ValidationError {
  field: string
  message: string
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: ValidationError[] }

const MAX_TITLE_LENGTH = 200
const MAX_DESCRIPTION_LENGTH = 5000
const MAX_EVIDENCE_FILES = 5
const MAX_FILE_SIZE_MB = 10
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]

/**
 * Validates a challenge form submission from a citizen.
 */
export function validateChallengeForm(data: {
  title: string
  description: string
  domain: string
  tags: string[]
  district: string
  evidence: string[]
}): ValidationResult {
  const errors: ValidationError[] = []

  // Title — required, non-empty, max length
  const title = data.title.trim()
  if (title.length === 0) {
    errors.push({ field: 'title', message: 'Challenge title is required.' })
  } else if (title.length > MAX_TITLE_LENGTH) {
    errors.push({
      field: 'title',
      message: `Title must be at most ${MAX_TITLE_LENGTH} characters. Currently ${title.length}.`,
    })
  }

  // Description — required, non-empty, max length
  const description = data.description.trim()
  if (description.length === 0) {
    errors.push({
      field: 'description',
      message: 'Challenge description is required.',
    })
  } else if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push({
      field: 'description',
      message: `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters. Currently ${description.length}.`,
    })
  }

  // Domain — must be one of the 10 approved domains
  if (!isDomain(data.domain)) {
    errors.push({
      field: 'domain',
      message: `Invalid domain: "${data.domain}". Please select a valid domain.`,
    })
  }

  // Tags — at least 1, all must belong to the selected domain
  if (!Array.isArray(data.tags) || data.tags.length === 0) {
    errors.push({
      field: 'tags',
      message: 'Select at least one tag for this challenge.',
    })
  } else if (isDomain(data.domain)) {
    const domain = data.domain as Domain
    const seen = new Set<string>()
    for (const tag of data.tags) {
      if (typeof tag !== 'string' || tag.length === 0) {
        errors.push({ field: 'tags', message: 'Each tag must be a non-empty string.' })
        continue
      }
      if (seen.has(tag)) {
        errors.push({ field: 'tags', message: `Duplicate tag: "${tag}".` })
        continue
      }
      seen.add(tag)
      if (!isTagForDomain(domain, tag)) {
        errors.push({
          field: 'tags',
          message: `Tag "${tag}" is not valid for the domain "${domain}".`,
        })
      }
    }
  }

  // District — required, must be a valid Jharkhand district
  if (!data.district || data.district.trim().length === 0) {
    errors.push({
      field: 'district',
      message: 'District is required. Please select your district.',
    })
  } else if (!isJharkhandDistrict(data.district)) {
    errors.push({
      field: 'district',
      message: `Invalid district: "${data.district}". Please select a valid Jharkhand district.`,
    })
  }

  // Evidence — optional, but if URLs provided, validate count
  if (Array.isArray(data.evidence)) {
    if (data.evidence.length > MAX_EVIDENCE_FILES) {
      errors.push({
        field: 'evidence',
        message: `At most ${MAX_EVIDENCE_FILES} evidence files are allowed. Currently ${data.evidence.length}.`,
      })
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors }
}

/**
 * Validates an image file before Cloudinary upload.
 * Returns an error message if invalid, null if valid.
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `Unsupported file type: "${file.type}". Please upload JPEG, PNG, WebP, or HEIC images.`
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `File is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`
  }
  return null
}

export { MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH, MAX_EVIDENCE_FILES, MAX_FILE_SIZE_MB }
