/**
 * Browser client for the AI-only Cloudflare Worker.
 *
 * The gateway URL is public configuration, but provider credentials never enter
 * this bundle. Firebase Auth supplies an ID token for each request.
 */

import { auth } from '@/lib/firebase'
import type { ChallengeSubmission } from '@/types/ai'

const REQUEST_TIMEOUT_MS = 44_000

export type AiGatewayResult =
  | { ok: true; text: string }
  | {
      ok: false
      code: 'not_configured' | 'unauthenticated' | 'timeout' | 'request_failed'
      message: string
    }

function gatewayUrl(): string | null {
  const value = import.meta.env.VITE_AI_GATEWAY_URL?.trim()
  return value ? value.replace(/\/$/, '') : null
}

export function isAiGatewayConfigured(): boolean {
  return gatewayUrl() !== null
}

/** Sends only the challenge fields necessary for analysis, authenticated by Firebase. */
export async function requestAiAnalysis(
  submission: ChallengeSubmission,
): Promise<AiGatewayResult> {
  const url = gatewayUrl()
  if (!url) {
    return {
      ok: false,
      code: 'not_configured',
      message: 'AI analysis is not configured.',
    }
  }

  const user = auth?.currentUser
  if (!user) {
    return {
      ok: false,
      code: 'unauthenticated',
      message: 'You must be signed in to use AI analysis.',
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const idToken = await user.getIdToken()
    const response = await fetch(`${url}/v1/analyze`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: submission.title,
        description: submission.description,
        location: submission.location,
      }),
      signal: controller.signal,
    })

    const body: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      if (response.status === 401) {
        return {
          ok: false,
          code: 'unauthenticated',
          message: 'Your session could not be verified. Please sign in again.',
        }
      }
      return {
        ok: false,
        code: 'request_failed',
        message: 'AI analysis is temporarily unavailable. Please try again later.',
      }
    }

    if (
      typeof body !== 'object' ||
      body === null ||
      !('text' in body) ||
      typeof body.text !== 'string'
    ) {
      return {
        ok: false,
        code: 'request_failed',
        message: 'AI analysis returned an unexpected response.',
      }
    }
    return { ok: true, text: body.text }
  } catch {
    return {
      ok: false,
      code: controller.signal.aborted ? 'timeout' : 'request_failed',
      message:
        controller.signal.aborted
          ? 'AI analysis timed out. Please try again.'
          : 'AI analysis is temporarily unavailable. Please try again later.',
    }
  } finally {
    clearTimeout(timeoutId)
  }
}
