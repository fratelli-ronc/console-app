import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { listGroupTags, createGroupTag } from '@/client'
import type { GroupTag } from '@/client'

interface GroupTagPickerProps {
  selectedIds: number[]
  onChange: (ids: number[]) => void
}

export const GroupTagPicker: React.FC<GroupTagPickerProps> = ({
  selectedIds,
  onChange,
}) => {
  const [tags, setTags] = useState<GroupTag[] | null>(null)
  const [newTagName, setNewTagName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    listGroupTags().then((res) => {
      if (res) setTags(res)
    })
  }, [])

  const toggle = (id: number) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((i) => i !== id)
        : [...selectedIds, id],
    )
  }

  const handleCreate = async () => {
    const name = newTagName.trim()
    if (!name) return
    setCreating(true)
    const tag = await createGroupTag(name)
    setCreating(false)
    if (tag) {
      setNewTagName('')
      setTags((prev) => [...(prev ?? []), tag])
      onChange([...selectedIds, tag.id])
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">Tag</label>

      <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-border bg-muted/40 min-h-12">
        {tags === null ? (
          <p className="text-xs text-muted-foreground">Caricamento…</p>
        ) : tags.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nessun tag disponibile. Aggiungine uno qui sotto.
          </p>
        ) : (
          tags.map((tag) => {
            const selected = selectedIds.includes(tag.id)
            return (
              <span
                key={tag.id}
                onClick={() => toggle(tag.id)}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer',
                  selected
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-background border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {tag.name}
              </span>
            )
          })
        )}
      </div>

      <div className="flex items-center gap-2 mt-1">
        <input
          type="text"
          value={newTagName}
          placeholder="Nuovo tag…"
          onChange={(e) => setNewTagName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleCreate()
            }
          }}
          className="h-8 flex-1 rounded-md border border-input bg-card px-2.5 text-xs text-foreground placeholder:text-placeholder outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
        />
        <button
          type="button"
          disabled={creating || !newTagName.trim()}
          onClick={handleCreate}
          className="h-8 px-3 inline-flex items-center gap-1 rounded-md border border-border text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={12} />
          Aggiungi
        </button>
      </div>
    </div>
  )
}
