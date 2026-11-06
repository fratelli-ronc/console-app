import { useMemo } from 'react'
import { Info } from 'lucide-react'
import type { EntityChange } from '@/client'
import { StatusBadge } from '@/components'
import {
  ENTITY_NOUNS,
  agree,
  entityLabel,
  fieldLabel,
  formatChangeValue,
  type ChangeNames,
} from '@/lib/changeLog'
import { cn } from '@/lib/utils'

const OP_STYLES = {
  create: {
    badge: 'border-primary/30 text-primary bg-primary/10',
    dot: 'bg-primary',
  },
  update: {
    badge: 'border-secondary/30 text-secondary-foreground bg-secondary/10',
    dot: 'bg-secondary',
  },
  delete: {
    badge: 'border-destructive/30 text-destructive bg-destructive/10',
    dot: 'bg-destructive',
  },
}

export const Notice: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
    <Info size={16} className="mt-0.5 shrink-0" />
    <p>{children}</p>
  </div>
)

export const Loading = () => (
  <p className="py-6 text-center text-sm text-muted-foreground">Caricamento…</p>
)

export const Section: React.FC<{
  title: string
  children: React.ReactNode
}> = ({ title, children }) => (
  <section className="space-y-2">
    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {title}
    </h3>
    {children}
  </section>
)

// What the two sides of an updated field are called.
export interface DiffLabels {
  before: string
  after: string
}

interface ChangeListProps<T extends EntityChange> {
  changes: T[]
  names: ChangeNames
  labels: DiffLabels
  // Extra detail on the right of a change's header: who made it, when.
  meta?: (change: T) => string
}

// Net changes, one card per entity: the station, then its groups, then its
// variables under their group — where they are after the change, or where
// they were for the ones leaving.
export const ChangeList = <T extends EntityChange>({
  changes,
  names,
  labels,
  meta,
}: ChangeListProps<T>) => {
  const sections = useMemo(() => {
    const variablesByGroup = new Map<number | null, T[]>()
    for (const change of changes) {
      if (change.entityType !== 'variable') continue
      const groupId = change.groupIdAfter ?? change.groupIdBefore
      const list = variablesByGroup.get(groupId)
      if (list) list.push(change)
      else variablesByGroup.set(groupId, [change])
    }
    return {
      station: changes.filter((c) => c.entityType === 'station'),
      groups: changes.filter((c) => c.entityType === 'group'),
      variablesByGroup: [...variablesByGroup.entries()],
    }
  }, [changes])

  const renderChange = (change: T) => (
    <DiffCard
      key={`${change.entityType}-${change.entityId}`}
      change={change}
      names={names}
      labels={labels}
      meta={meta?.(change)}
    />
  )

  return (
    <div className="space-y-5 pb-1">
      {sections.station.length > 0 && (
        <Section title="Stazione">{sections.station.map(renderChange)}</Section>
      )}
      {sections.groups.length > 0 && (
        <Section title="Gruppi">{sections.groups.map(renderChange)}</Section>
      )}
      {sections.variablesByGroup.map(([groupId, list]) => (
        <Section
          key={`variables-${groupId}`}
          title={`Variabili — ${groupId == null ? 'nessun gruppo' : names.groupName(groupId)}`}
        >
          {list.map(renderChange)}
        </Section>
      ))}
    </div>
  )
}

// How a change reads from the station's point of view.
const describeOp = (
  change: EntityChange,
  names: ChangeNames,
): { label: string; detail?: string } => {
  switch (change.op) {
    case 'create':
      return change.stationIdBefore != null
        ? {
            label: `${agree(change, 'Spostat')} qui`,
            detail: `da ${names.stationName(change.stationIdBefore)}`,
          }
        : { label: agree(change, 'Nuov') }
    case 'delete':
      return change.stationIdAfter != null
        ? {
            label: `${agree(change, 'Spostat')} via`,
            detail: `su ${names.stationName(change.stationIdAfter)}`,
          }
        : { label: agree(change, 'Eliminat') }
    default:
      return { label: agree(change, 'Modificat') }
  }
}

interface DiffCardProps {
  change: EntityChange
  names: ChangeNames
  labels: DiffLabels
  meta: string | undefined
}

const DiffCard: React.FC<DiffCardProps> = ({ change, names, labels, meta }) => {
  const op = describeOp(change, names)

  return (
    <div className="rounded-lg border border-border">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <StatusBadge {...OP_STYLES[change.op]} label={op.label} />
        <div className="min-w-0">
          <span className="font-medium text-foreground">
            {entityLabel(change)}
          </span>
          <span className="ml-2 text-xs text-muted-foreground">
            {ENTITY_NOUNS[change.entityType]} · ID {change.businessId}
            {op.detail && ` · ${op.detail}`}
          </span>
        </div>
        {meta && (
          <span className="ml-auto text-xs text-muted-foreground">{meta}</span>
        )}
      </div>

      {change.op === 'update' ? (
        <FieldTable change={change} names={names} labels={labels} />
      ) : (
        <details className="border-t border-border px-4 py-2 text-sm">
          <summary className="cursor-pointer text-xs text-muted-foreground">
            Mostra campi
          </summary>
          <FieldTable change={change} names={names} labels={labels} bare />
        </details>
      )}
    </div>
  )
}

interface FieldTableProps {
  change: EntityChange
  names: ChangeNames
  labels: DiffLabels
  // Inside a details element: no own border, and only the side that exists.
  bare?: boolean
}

// Each changed field on both sides (or just the one side, for an entity
// that comes or goes).
const FieldTable: React.FC<FieldTableProps> = ({
  change,
  names,
  labels,
  bare,
}) => {
  const both = change.before !== null && change.after !== null
  const format = (field: string, value: unknown) =>
    formatChangeValue(change.entityType, field, value, names)

  return (
    <table
      className={cn(
        'w-full table-fixed text-sm',
        !bare && 'border-t border-border',
      )}
    >
      {both && (
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th className="w-1/4 px-4 py-2 font-medium">Campo</th>
            <th className="px-4 py-2 font-medium">{labels.before}</th>
            <th className="px-4 py-2 font-medium">{labels.after}</th>
          </tr>
        </thead>
      )}
      <tbody>
        {change.changedFields.map((field) => (
          <tr
            key={field}
            className="border-t border-border/60 first:border-t-0"
          >
            <td className="w-1/4 px-4 py-1.5 text-muted-foreground">
              {fieldLabel(change.entityType, field)}
            </td>
            {both ? (
              <>
                <td className="px-4 py-1.5 break-all text-muted-foreground line-through decoration-muted-foreground/50">
                  {format(field, change.before?.[field])}
                </td>
                <td className="px-4 py-1.5 break-all text-foreground">
                  {format(field, change.after?.[field])}
                </td>
              </>
            ) : (
              <td className="px-4 py-1.5 break-all text-foreground">
                {format(field, (change.after ?? change.before)?.[field])}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
