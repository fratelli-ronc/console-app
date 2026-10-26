import { useState } from 'react'
import { History } from 'lucide-react'
import type { ChangeEntry, ChangeSet, EntityChange } from '@/client'
import {
  ENTITY_NOUNS,
  agree,
  changeKindLabel,
  entityLabel,
  fieldLabel,
  formatChangeValue,
  formatDateTime,
  formatTime,
  userLabel,
  type ChangeNames,
} from '@/lib/changeLog'

const ENTRY_OPS: Record<EntityChange['op'], string> = {
  create: 'creat',
  update: 'modificat',
  delete: 'eliminat',
}

interface ChangeSetCardProps {
  set: ChangeSet
  names: ChangeNames
  currentUsername: string | undefined
  // Show only the time, when the list already heads each day.
  timeOnly?: boolean
  // Shown under the heading.
  children?: React.ReactNode
  // Shown after an entry's label.
  entrySuffix?: (entry: ChangeEntry) => React.ReactNode
  // Entries past this many are folded behind a button, unless that would
  // hide just one.
  collapseAfter?: number
}

// One change set: what it was, who made it and when, then what it did to
// each entity, field by field for updates. Renders an <li>.
export const ChangeSetCard: React.FC<ChangeSetCardProps> = ({
  set,
  names,
  currentUsername,
  timeOnly = false,
  children,
  entrySuffix,
  collapseAfter,
}) => {
  const [expanded, setExpanded] = useState(false)
  const folded =
    !expanded &&
    collapseAfter != null &&
    set.entries.length > collapseAfter + 1
  const entries = folded ? set.entries.slice(0, collapseAfter) : set.entries
  const hidden = set.entries.length - entries.length

  return (
    <li className="rounded-lg border border-border">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
        <History size={14} className="text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">
          {changeKindLabel(set.kind)}
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          {userLabel(set.user, set.userId, currentUsername)} ·{' '}
          {timeOnly ? formatTime(set.createdAt) : formatDateTime(set.createdAt)}
        </span>
      </div>
      {children && (
        <div className="border-b border-border px-4 py-2">{children}</div>
      )}
      <ul className="divide-y divide-border/60 text-sm">
        {entries.map((entry) => (
          <li key={entry.id} className="px-4 py-2">
            <span className="text-foreground">
              {ENTITY_NOUNS[entry.entityType]} {entityLabel(entry)}
            </span>{' '}
            <span className="text-muted-foreground">
              (ID {entry.businessId}) {agree(entry, ENTRY_OPS[entry.op])}
              {entrySuffix?.(entry)}
            </span>
            {entry.op === 'update' && (
              <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                {entry.changedFields.map((field) => (
                  <li key={field} className="break-all">
                    {fieldLabel(entry.entityType, field)}:{' '}
                    {formatChangeValue(
                      entry.entityType,
                      field,
                      entry.before?.[field],
                      names,
                    )}{' '}
                    →{' '}
                    <span className="text-foreground">
                      {formatChangeValue(
                        entry.entityType,
                        field,
                        entry.after?.[field],
                        names,
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
        {folded && (
          <li className="px-4 py-2">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="cursor-pointer text-xs font-medium text-primary hover:underline"
            >
              Mostra altre {hidden} modifiche
            </button>
          </li>
        )}
      </ul>
    </li>
  )
}
