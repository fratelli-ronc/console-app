// Messages console-api sends verbatim when it refuses a revert. Anything
// unrecognised is shown as it came.
const MESSAGES: Record<string, string> = {
  'the version uses ids held elsewhere now':
    'La versione usa ID che ora appartengono ad altro.',
  'some groups of this version cannot be deployed':
    'Alcuni gruppi di questa versione non possono più essere distribuiti.',
  'config version not found': 'Versione non trovata.',
  'station not found': 'Stazione non trovata.',
  'another deploy is already running':
    "Un'altra distribuzione è già in corso. Riprova tra poco.",
  'group is not assigned to a server': 'nessun server assegnato',
  'camera group has no variable': 'telecamera senza variabile',
  'camera group has more than one variable':
    'telecamera con più di una variabile',
}

// Why a revert cannot go ahead, one reason per id held elsewhere.
const REASONS: [RegExp, (...ids: string[]) => string][] = [
  [
    /^station id (\d+) is still held by a deleted station$/,
    (id) => `L'ID stazione ${id} è ancora usato da una stazione eliminata.`,
  ],
  [
    /^station id (\d+) is now held by another station$/,
    (id) => `L'ID stazione ${id} ora appartiene a un'altra stazione.`,
  ],
  [
    /^group id (\d+) is still held by a deleted group$/,
    (id) => `L'ID gruppo ${id} è ancora usato da un gruppo eliminato.`,
  ],
  [
    /^group id (\d+) is held by a group with no station$/,
    (id) => `L'ID gruppo ${id} è usato da un gruppo senza stazione.`,
  ],
  [
    /^group id (\d+) belongs to station (\d+)$/,
    (id, station) => `Il gruppo ${id} ora appartiene alla stazione ${station}.`,
  ],
]

export const translateRevertMessage = (message: string) =>
  MESSAGES[message] ?? message

export const translateRevertReason = (reason: string) => {
  for (const [pattern, format] of REASONS) {
    const match = reason.match(pattern)
    if (match) return format(...match.slice(1))
  }
  return reason
}

// The deploy error a revert reports once the station is already written.
const REVERTED_PREFIX = 'the station was reverted, but could not be deployed: '

export const revertedDeployError = (message: string) =>
  message.startsWith(REVERTED_PREFIX)
    ? message.slice(REVERTED_PREFIX.length)
    : message
