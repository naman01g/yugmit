import { describe, expect, it } from 'vitest'

import { parseGeminiResponse } from '../ai-parser'

describe('parseGeminiResponse', () => {
  const validJson = `{
    "primaryDomain": "Agriculture",
    "secondaryDomain": null,
    "tags": ["Crop Management", "Irrigation"],
    "urgency": "medium",
    "impactScale": "village_ward",
    "requiredExpertise": ["Agronomist"],
    "requiredFacilities": ["Irrigation Infrastructure"],
    "problemSummary": "Irrigation shortage.",
    "duplicateSearchText": "irrigation shortage agriculture",
    "confidence": 0.85
  }`

  it('parses a plain JSON response', () => {
    const result = parseGeminiResponse(validJson)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.primaryDomain).toBe('Agriculture')
      expect(result.data.urgency).toBe('medium')
      expect(result.data.confidence).toBe(0.85)
    }
  })

  it('parses JSON wrapped in markdown code fences', () => {
    const fenced = '```json\n' + validJson + '\n```'
    const result = parseGeminiResponse(fenced)
    expect(result.ok).toBe(true)
  })

  it('parses JSON with trailing commas', () => {
    const withTrailing = validJson.replace('"confidence": 0.85', '"confidence": 0.85,')
    const result = parseGeminiResponse(withTrailing)
    expect(result.ok).toBe(true)
  })

  it('returns invalid_json for non-JSON text', () => {
    const result = parseGeminiResponse('this is not JSON at all')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('invalid_json')
    }
  })

  it('returns invalid_json for a JSON array', () => {
    const result = parseGeminiResponse('[1, 2, 3]')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('invalid_json')
    }
  })

  it('returns invalid_json for a JSON primitive', () => {
    const result = parseGeminiResponse('"hello"')
    expect(result.ok).toBe(false)
  })

  it('returns missing_fields when required keys are absent', () => {
    const partial = JSON.stringify({ primaryDomain: 'Agriculture' })
    const result = parseGeminiResponse(partial)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('missing_fields')
    }
  })
})
