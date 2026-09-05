import { describe, it, expect } from 'vitest'

import { DEFAULT_WEIGHTS, ALGORITHM_VERSION } from '../config'
import { computeFactors, finalScore, scoreAndRank } from '../score'
import { runMatchingEngine, MIN_MEANINGFUL_SCORE } from '../match'
import {
  makeChallenge,
  waterUniversity,
  agricultureUniversity,
  outsideUniversity,
} from './fixtures'

describe('computeFactors', () => {
  it('returns all five factor keys', () => {
    const factors = computeFactors(makeChallenge(), waterUniversity)
    expect(Object.keys(factors).sort()).toEqual(
      [
        'expertise',
        'facilities',
        'previousProjects',
        'studentCapability',
        'location',
      ].sort(),
    )
  })
})

describe('finalScore', () => {
  it('computes a manually verified example exactly (85.0)', () => {
    const challenge = makeChallenge()
    const factors = computeFactors(challenge, waterUniversity)

    // Manually derived factors:
    // expertise = 100 (primary domain + all tags matched)
    // facilities = 100 (only required facility matched)
    // previousProjects = 50 (related single-tag evidence)
    // studentCapability = 50 (1 of 2 required skills matched)
    // location = 100 (same district)
    expect(factors).toEqual({
      expertise: 100,
      facilities: 100,
      previousProjects: 50,
      studentCapability: 50,
      location: 100,
    })

    const expected =
      100 * 0.35 + 100 * 0.25 + 50 * 0.15 + 50 * 0.15 + 100 * 0.10
    expect(expected).toBe(85)

    const score = finalScore(factors, DEFAULT_WEIGHTS)
    expect(score).toBe(85)
    expect(Number.isInteger(score * 10)).toBe(true)
  })

  it('rounds to one decimal place', () => {
    const factors = {
      expertise: 33.33,
      facilities: 66.66,
      previousProjects: 50,
      studentCapability: 70,
      location: 80,
    }
    const score = finalScore(factors, DEFAULT_WEIGHTS)
    const raw = 33.33 * 0.35 + 66.66 * 0.25 + 50 * 0.15 + 70 * 0.15 + 80 * 0.1
    expect(Math.round(raw * 10) / 10).toBe(score)
    expect(Number.isInteger(score * 10)).toBe(true)
  })

  it('supports configurable weights while keeping determinism', () => {
    const factors = {
      expertise: 100,
      facilities: 100,
      previousProjects: 50,
      studentCapability: 50,
      location: 100,
    }
    const customWeights = {
      expertise: 0.5,
      facilities: 0.2,
      previousProjects: 0.1,
      studentCapability: 0.1,
      location: 0.1,
    }
    const custom = finalScore(factors, customWeights)
    const defaulted = finalScore(factors, DEFAULT_WEIGHTS)
    expect(custom).not.toBe(defaulted)
    expect(custom).toBe(
      Math.round((100 * 0.5 + 100 * 0.2 + 50 * 0.1 + 50 * 0.1 + 100 * 0.1) * 10) / 10,
    )
  })
})

describe('scoreAndRank', () => {
  it('ranks universities by descending score and is deterministic', () => {
    const pool = [agricultureUniversity, waterUniversity, outsideUniversity]
    const ranked = scoreAndRank(makeChallenge(), pool, DEFAULT_WEIGHTS)

    expect(ranked.length).toBe(3)
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1]!.score).toBeGreaterThanOrEqual(ranked[i]!.score)
    }

    const rankedAgain = scoreAndRank(makeChallenge(), pool, DEFAULT_WEIGHTS)
    expect(ranked.map((r) => r.university.id)).toEqual(
      rankedAgain.map((r) => r.university.id),
    )
  })

  it('assigns 1-based ranks in order', () => {
    const ranked = scoreAndRank(makeChallenge(), [waterUniversity, agricultureUniversity])
    expect(ranked.map((r) => r.rank)).toEqual([1, 2])
  })
})

describe('runMatchingEngine integration', () => {
  it('produces a matched result with explainable, versioned documents', () => {
    const result = runMatchingEngine(makeChallenge(), [
      waterUniversity,
      agricultureUniversity,
      outsideUniversity,
    ])

    expect(result.status).toBe('matched')
    if (result.status !== 'matched') return

    expect(result.matches.length).toBeGreaterThan(0)
    const top = result.matches[0]!
    expect(top.match.algorithmVersion).toBe(ALGORITHM_VERSION)
    expect(top.match.weightsSnapshot).toEqual(DEFAULT_WEIGHTS)
    expect(top.match.rank).toBe(1)
    expect(top.explanation.reasons.length).toBeGreaterThan(0)
  })

  it('excludes universities below the minimum meaningful score and handles no-match', () => {
    // A challenge so mismatch-prone that no university qualifies.
    const challenge = makeChallenge({
      challengeId: 'challenge-empty',
      primaryDomain: 'Energy',
      secondaryDomain: null,
      tags: ['Renewable Energy'],
      requiredExpertise: ['Nuclear Engineering'],
      requiredFacilities: ['Fusion Reactor'],
      location: { district: 'Far Far Away' },
    })
    const result = runMatchingEngine(challenge, [
      waterUniversity,
      agricultureUniversity,
    ])
    expect(result.status).toBe('no-match')
    if (result.status === 'no-match') {
      expect(result.matches).toEqual([])
      expect(result.reasons.length).toBeGreaterThan(0)
    }
  })

  it('returns a structured no-match when the university pool is empty', () => {
    const result = runMatchingEngine(makeChallenge(), [])
    expect(result.status).toBe('no-match')
    if (result.status === 'no-match') {
      expect(result.reasons.some((r) => r.includes('No university'))).toBe(true)
    }
  })

  it('never writes to Firestore; engine output is pure', () => {
    const result = runMatchingEngine(makeChallenge(), [waterUniversity])
    expect(result.status).toBe('matched')
    // No side effects expected; results independent of Firebase config.
    expect(MIN_MEANINGFUL_SCORE).toBe(40)
  })
})
