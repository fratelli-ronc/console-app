import { cn } from '@/lib/utils'

export interface FilterPillOption<T> {
  label: string
  value: T
}

interface FilterPillsProps<T> {
  options: FilterPillOption<T>[]
  value: T
  onChange: (value: T) => void
}

export function FilterPills<T>({
  options,
  value,
  onChange,
}: FilterPillsProps<T>) {
  return (
    <div className="flex items-center gap-1.5 bg-muted rounded-lg p-1.5">
      {options.map((option) => (
        <button
          key={String(option.value)}
          onClick={() => onChange(option.value)}
          className={cn(
            'px-3 py-[6.5px] rounded-md text-xs font-medium transition-colors cursor-pointer',
            value === option.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
