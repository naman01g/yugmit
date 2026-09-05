import { describe, it, expect } from 'vitest'

import { createMatchDocument, runMatchingEngine } from '../match'
import { computeFactors, finalScore } from '../score'
import { DEFAULT_WEIGHTS, ALGORITHM_VERSION } from '../config'
import { makeChallenge, waterUniversity } from './fixtures'

describe('match document immutability', () => {
  it('contains weightsSnapshot, algorithmVersion, factors, score and rank', () => {
    const challenge = makeChallenge({ challengeId: 'challenge-immutable' })
    const result = runMatchingEngine(challenge, [waterUniversity])

    expect(result.status).toBe('matched')
    if (result.status !== 'matched') return

    const { match } = result.matches[0]!
    expect(match.challengeId).toBe('challenge-immutable')
    expect(match.universityId).toBe(waterUniversity.id)
    expect(typeof match.score).toBe('number')
    expect(typeof match.rank).toBe('number')
    expect(typeof match.createdAt).toBe('number')
    expect(match.weightsSnapshot).toEqual(DEFAULT_WEIGHTS)
    expect(match.algorithmVersion).toBe(ALGORITHM_VERSION)
    expect(match.factors).toBeDefined()
    expect(Object.keys(match.factors).sort()).toEqual(
      [
        'expertise',
        'facilities',
        'previousProjects',
        'studentCapability',
        'location',
      ].sort(),
    )
  })

  it('generates the score and factors from the engine, not from a UI form', () => {
    const challenge = makeChallenge()
    const manuallyScored = createMatchDocument(
      challenge,
      waterUniversity,
      99.9,
      7,
      DEFAULT_WEIGHTS,
      1,
    )

    // createMatchDocument recomputes factors from the engine...
    const expectedFactors = computeFactors(challenge, waterUniversity)
    expect(manuallyScored.factors).toEqual(expectedFactors)

    // ...but the passed-in score/rank are stamped as given (document builder
    // is a leaf utility). The real engine path derives both from inputs.
    const engineResult = runMatchingEngine(challenge, [waterUniversity])
    if (engineResult.status !== 'matched') return
    const engineMatch = engineResult.matches[0]!.match
    expect(engineMatch.score).toBe(finalScore(expectedFactors, DEFAULT_WEIGHTS))
    expect(engineMatch.rank).toBe(1)
  })

  it('snapshots the weights used rather than referencing a live object', () => {
    const challenge = makeChallenge()
    const result = runMatchingEngine(challenge, [waterUniversity])
    if (result.status !== 'matched') return
    const { match } = result.matches[0]!
    // Mutating the exported default must not retroactively change the snapshot.
    const snapshot = match.weightsSnapshot
    expect(snapshot).toEqual(DEFAULT_WEIGHTS)
    expect(snapshot).not.toBe(DEFAULT_WEIGHTS)
  })
})
