import { isAxiosError } from 'axios'
import toast from 'react-hot-toast'

// Exported for the rare call that renders its own failure instead of
// letting withErrorHandling toast it (see deployStations).
export function extractErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (!error.response) return 'Errore di connessione. Controlla la rete.'
    // Both console-api and goauth-gate reply with { "error": "..." }, not
    // { "message": "..." } — this is the key every handler actually sets.
    const msg = error.response.data?.error
    if (typeof msg === 'string' && msg.length > 0) return msg
    return `Errore del server (${error.response.status}).`
  }
  if (error instanceof Error && error.message.length > 0) return error.message
  return 'Si è verificato un errore imprevisto.'
}

export async function withErrorHandling<T>(
  fn: () => Promise<T>,
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    // 401s are already handled by the auth interceptor — skip them here
    if (isAxiosError(error) && error.response?.status === 401) return null
    toast.error(extractErrorMessage(error))
    return null
  }
}
