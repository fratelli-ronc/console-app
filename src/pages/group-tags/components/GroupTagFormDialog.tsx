import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  FilledButton,
  TextButton,
  TextInput,
} from '@/components'
import { createGroupTag, updateGroupTag } from '@/client'
import type { GroupTag } from '@/client'

interface GroupTagFormDialogProps {
  open: boolean
  tag: GroupTag | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export const GroupTagFormDialog: React.FC<GroupTagFormDialogProps> = ({
  open,
  tag,
  onOpenChange,
  onSaved,
}) => {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setName(tag?.name ?? '')
  }, [open, tag])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    setSaving(true)
    const res = tag
      ? await updateGroupTag(tag.id, trimmed)
      : await createGroupTag(trimmed)
    setSaving(false)

    if (res) {
      onOpenChange(false)
      onSaved()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{tag ? 'Rinomina tag' : 'Nuovo tag'}</DialogTitle>
            <DialogDescription>
              {tag
                ? 'Modifica il nome del tag.'
                : 'Crea un nuovo tag da assegnare ai gruppi.'}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <TextInput
              label="Nome"
              value={name}
              onChange={setName}
              required
              disabled={saving}
              placeholder="Es. Autostrada"
            />
          </div>

          <DialogFooter className="mt-6">
            <TextButton
              type="button"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Annulla
            </TextButton>
            <FilledButton type="submit" disabled={saving || !name.trim()}>
              {saving ? 'Salvataggio…' : 'Salva'}
            </FilledButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
