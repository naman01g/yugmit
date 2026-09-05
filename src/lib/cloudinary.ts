/**
 * Cloudinary client-side upload.
 *
 * ARCHITECTURE.md: citizen → direct Cloudinary upload → receive URL → save URL in Firestore.
 * Firebase Storage is FORBIDDEN. No Cloud Functions. No backend proxy.
 *
 * Uses unsigned upload preset. If Cloudinary is not configured,
 * all upload attempts fail gracefully with a clear error.
 */

export interface CloudinaryUploadResult {
  ok: true
  url: string
  publicId: string
}

export interface CloudinaryUploadError {
  ok: false
  code: 'not_configured' | 'upload_failed' | 'invalid_file' | 'network_error'
  message: string
}

export type CloudinaryResult = CloudinaryUploadResult | CloudinaryUploadError

function getConfigured(): { cloudName: string; uploadPreset: string } | null {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  if (!cloudName || !uploadPreset) return null
  return { cloudName, uploadPreset }
}

/**
 * Uploads an image file directly to Cloudinary from the browser.
 * Returns the secure URL on success.
 */
export async function uploadToCloudinary(file: File): Promise<CloudinaryResult> {
  const config = getConfigured()
  if (!config) {
    return {
      ok: false,
      code: 'not_configured',
      message:
        'Image upload is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env file.',
    }
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', config.uploadPreset)
  formData.append('folder', 'yugmit/challenges')

  try {
    const url = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      const msg =
        body?.error?.message ?? `Upload failed with status ${response.status}`
      return { ok: false, code: 'upload_failed', message: msg }
    }

    const data = (await response.json()) as {
      secure_url: string
      public_id: string
    }

    return {
      ok: true,
      url: data.secure_url,
      publicId: data.public_id,
    }
  } catch (error) {
    if (error instanceof TypeError) {
      return {
        ok: false,
        code: 'network_error',
        message: 'Network error during upload. Check your connection.',
      }
    }
    return {
      ok: false,
      code: 'upload_failed',
      message: 'An unexpected error occurred during upload.',
    }
  }
}

/**
 * Returns whether Cloudinary is configured and available.
 */
export function isCloudinaryConfigured(): boolean {
  return getConfigured() !== null
}
