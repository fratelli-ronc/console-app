import { isAxiosError } from 'axios'
import toast from 'react-hot-toast'

function extractMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (!error.response) return 'Errore di connessione. Controlla la rete.'
    const msg = error.response.data?.message
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
    toast.error(extractMessage(error))
    return null
  }
}
