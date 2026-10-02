// Reads a text/event-stream body to its end, handing every event to
// onEvent with its data parsed as JSON. Expects the framing our Go services
// write: one "event:" and one single-line "data:" per event.
export const readSSE = async (
  body: ReadableStream<Uint8Array>,
  onEvent: (name: string, data: unknown) => void,
): Promise<void> => {
  const reader = body.getReader()
  const dec = new TextDecoder()
  let buf = ''
  let eventName = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break

    buf += dec.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        onEvent(eventName, JSON.parse(line.slice(5)))
        eventName = ''
      }
    }
  }
}
