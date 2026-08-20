import { Plus } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle: string
  newLabel?: string
  trailing?: React.JSX.Element
  onNewClick?: () => void
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  newLabel,
  trailing,
  onNewClick,
}) => {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>

        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {trailing}

        {newLabel && (
          <button
            onClick={onNewClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:bg-primary/80 transition-colors shrink-0 cursor-pointer"
          >
            <Plus size={16} />
            {newLabel}
          </button>
        )}
      </div>
    </div>
  )
}
