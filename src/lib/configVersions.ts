// Messages console-api sends verbatim when it refuses a revert or a
// discard. Anything unrecognised is shown as it came.
const MESSAGES: Record<string, string> = {
  'the pending changes cannot be discarded':
    'Le modifiche in sospeso non si possono scartare.',
  'the station has not been deployed since the change log was introduced':
    "La stazione non è stata distribuita da quando è attivo il registro delle modifiche: non si sa com'era all'ultima distribuzione.",
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

const ENTITY_LABELS: Record<string, string> = {
  group: 'Il gruppo',
  variable: 'La variabile',
  station: 'La stazione',
}

// Why a revert or a discard cannot go ahead.
const REASONS: [RegExp, (...ids: string[]) => string][] = [
  [
    /^(group|variable|station) (\d+) was moved to station (\d+)$/,
    (entity, id, station) =>
      `${ENTITY_LABELS[entity]} ${id} è stat${entity === 'group' ? 'o' : 'a'} spostat${entity === 'group' ? 'o' : 'a'} nella stazione ${station}.`,
  ],
  [
    /^(group|variable|station) (\d+) was moved here from station (\d+)$/,
    (entity, id, station) =>
      `${ENTITY_LABELS[entity]} ${id} è stat${entity === 'group' ? 'o' : 'a'} spostat${entity === 'group' ? 'o' : 'a'} qui dalla stazione ${station}.`,
  ],
  [
    /^group id (\d+) is now held by another group$/,
    (id) => `L'ID gruppo ${id} ora appartiene a un altro gruppo.`,
  ],
  [
    /^the deployed photo is no longer stored$/,
    () => 'La foto distribuita non è più disponibile.',
  ],
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
