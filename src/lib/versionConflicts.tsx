import type { ConfirmOptions } from '@/components'
import type { SaveOutcome, VersionConflict } from '@/client'

const formatDateTime = (iso: string) => {
  const date = new Date(iso)
  const day = date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const time = date.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `il ${day} alle ${time}`
}

// "da Mario Rossi il 15/10/2026 alle 14:32" - whatever of it the change log
// knows; empty when it knows nothing.
export const describeConflictAuthor = (conflict: VersionConflict): string => {
  const who =
    conflict.changedBy?.name ||
    conflict.changedBy?.username ||
    (conflict.changedByUserId != null ? 'un altro utente' : null)
  return [
    who && `da ${who}`,
    conflict.changedAt && formatDateTime(conflict.changedAt),
  ]
    .filter(Boolean)
    .join(' ')
}

const sameValue = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b)

// The fields of `current` that differ from `baseline`.
export const changedFields = <F extends object>(
  current: F,
  baseline: F,
): Partial<F> =>
  Object.fromEntries(
    Object.entries(current).filter(
      ([key, value]) => !sameValue(value, baseline[key as keyof F]),
    ),
  ) as Partial<F>

export interface FormConflictSave<
  E extends { version: number },
  F extends object,
> {
  // The entity as the form loaded it.
  initial: E
  // The form's fields as edited.
  fields: F
  // The same fields built from an entity, as the form would have them.
  toFields: (entity: E) => F
  update: (
    payload: Partial<F> & { version: number },
  ) => Promise<SaveOutcome<E> | null>
  refetch: () => Promise<E | null>
  // Field key -> its form label, to list the fields both sides changed.
  labels: Partial<Record<keyof F, string>>
  // "La stazione è stata modificata" / "... eliminata": followed by who
  // and when.
  subject: { changed: string; deleted: string }
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

// Saves only the fields the form changed, with the version it loaded. If
// someone saved the entity since, it says who and which fields both of them
// changed, and saves again on top of their version if the user agrees -
// their changes to other fields are kept. Resolves true when the form is
// done: saved, or the entity was deleted and the user is leaving it.
export async function saveFormResolvingConflicts<
  E extends { version: number },
  F extends object,
>({
  initial,
  fields,
  toFields,
  update,
  refetch,
  labels,
  subject,
  confirm,
}: FormConflictSave<E, F>): Promise<boolean> {
  const changes = changedFields(fields, toFields(initial))
  if (Object.keys(changes).length === 0) return true

  let baseline = initial
  for (;;) {
    const res = await update({ ...changes, version: baseline.version })
    if (res === null) return false
    if (res.kind === 'saved') return true

    const conflict = res.conflicts.conflicts[0]
    const author = conflict ? describeConflictAuthor(conflict) : ''
    if (!conflict || conflict.deleted) {
      return confirm({
        title: 'Elemento eliminato',
        description: `${[subject.deleted, author].filter(Boolean).join(' ')} dopo che hai aperto il modulo: le tue modifiche non possono essere salvate.`,
        confirmLabel: "Torna all'elenco",
        cancelLabel: 'Rimani',
      })
    }

    const fresh = await refetch()
    if (fresh === null) return false

    const before = toFields(baseline)
    const after = toFields(fresh)
    const overlap = (Object.keys(changes) as (keyof F)[]).filter(
      (key) =>
        !sameValue(after[key], before[key]) &&
        !sameValue(after[key], changes[key]),
    )

    const ok = await confirm({
      title: 'Modifiche in conflitto',
      description: (
        <>
          {[subject.changed, author].filter(Boolean).join(' ')} dopo che hai
          aperto il modulo.{' '}
          {overlap.length > 0 ? (
            <>
              Avete modificato entrambi{' '}
              <span className="font-medium text-foreground">
                {overlap.map((key) => labels[key] ?? String(key)).join(', ')}
              </span>
              : salvando, i tuoi valori sostituiranno i suoi.
            </>
          ) : (
            'Le sue modifiche riguardano altri campi: salvando verranno mantenute insieme alle tue.'
          )}
        </>
      ),
      confirmLabel: 'Salva le mie modifiche',
      destructive: overlap.length > 0,
    })
    if (!ok) return false
    baseline = fresh
  }
}
