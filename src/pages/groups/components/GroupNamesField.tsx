import { Group } from '@/client'
import { TextInput } from '@/components'

interface GroupNamesFieldProps {
  groups: Group[]
  // New name per group id; a group missing from the map keeps its name.
  names: Record<number, string>
  disabled?: boolean
  onChange: (names: Record<number, string>) => void
}

// Lets a clone or transfer rename the groups it touches: a single name field
// for one group, one row per group otherwise. The caller prefills names.
export const GroupNamesField: React.FC<GroupNamesFieldProps> = ({
  groups,
  names,
  disabled = false,
  onChange,
}) =>
  groups.length === 1 ? (
    <TextInput
      label="Nome"
      value={names[groups[0].id] ?? ''}
      placeholder={groups[0].name || 'Nome del gruppo'}
      disabled={disabled}
      onChange={(value) => onChange({ ...names, [groups[0].id]: value })}
    />
  ) : (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">Nomi</span>
      <div className="max-h-64 overflow-y-auto rounded-lg border border-border divide-y divide-border">
        {groups.map((group) => (
          <div key={group.id} className="flex items-center gap-3 px-3 py-2">
            <span className="w-16 shrink-0 text-xs text-muted-foreground">
              ID {group.groupId}
            </span>
            <input
              type="text"
              value={names[group.id] ?? ''}
              placeholder={group.name || 'Nome del gruppo'}
              disabled={disabled}
              onChange={(e) =>
                onChange({ ...names, [group.id]: e.target.value })
              }
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className="h-9 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-placeholder outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        ))}
      </div>
    </div>
  )

// The names that differ from the groups' current ones; blank entries keep
// the current name.
export const changedGroupNames = (
  groups: Group[],
  names: Record<number, string>,
): Record<number, string> =>
  Object.fromEntries(
    groups.flatMap((group) => {
      const name = (names[group.id] ?? '').trim()
      return name !== '' && name !== (group.name ?? '')
        ? [[group.id, name]]
        : []
    }),
  )
