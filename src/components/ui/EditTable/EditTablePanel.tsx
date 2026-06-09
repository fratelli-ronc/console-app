import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { FilledButton } from '../FilledButton'
import { TextButton } from '../TextButton'
import { EditTable, type EditTableColumn, type EditTableHandle } from './EditTable'
import type { FetchParams, FetchResult } from './useEditTable'

export type { EditTableColumn, FetchParams, FetchResult }

interface EditTablePanelProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  columns: EditTableColumn[]
  fetchFn: (params: FetchParams) => Promise<FetchResult<T>>
  onSave?: (data: T[]) => void | Promise<void>
  pageSize?: number
  className?: string
  filters?: React.ReactNode
}

export function EditTablePanel<
  T extends Record<string, unknown> = Record<string, unknown>,
>({
  columns,
  fetchFn,
  onSave,
  pageSize,
  className,
  filters,
}: EditTablePanelProps<T>) {
  const tableRef = useRef<EditTableHandle>(null)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        tableRef.current?.save()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className={cn('h-full flex flex-col gap-6', className)}>
      <div className="flex items-center gap-3">
        {filters}

        <TextButton
          type="button"
          disabled={!isDirty}
          onClick={() => tableRef.current?.discard()}
          className="ml-auto"
        >
          Annulla
        </TextButton>

        <FilledButton
          type="button"
          disabled={!isDirty}
          onClick={() => tableRef.current?.save()}
        >
          Salva
        </FilledButton>
      </div>

      <EditTable
        ref={tableRef}
        className="flex-1 min-h-0"
        columns={columns}
        fetchFn={fetchFn}
        onSave={onSave}
        onDirtyChange={setIsDirty}
        pageSize={pageSize}
      />
    </div>
  )
}
