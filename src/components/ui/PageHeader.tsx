import { Plus } from 'lucide-react'
import { FilledButton } from './FilledButton'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './HoverCard'

interface PageHeaderProps {
  title: string
  subtitle: string
  newLabel?: string
  trailing?: React.JSX.Element
  onNewClick?: () => void
  newDisabled?: boolean
  // When the new button is disabled, hovering it reveals this text in a
  // popover explaining why.
  newDisabledReason?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  newLabel,
  trailing,
  onNewClick,
  newDisabled = false,
  newDisabledReason,
}) => {
  const newButton = newLabel ? (
    <FilledButton
      type="button"
      disabled={newDisabled}
      onClick={onNewClick}
      className="inline-flex items-center gap-2"
    >
      <Plus size={16} />
      {newLabel}
    </FilledButton>
  ) : null

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>

        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {trailing}

        {newButton &&
          (newDisabled && newDisabledReason ? (
            <HoverCard openDelay={100}>
              <HoverCardTrigger asChild>
                <span className="inline-flex cursor-not-allowed">
                  {newButton}
                </span>
              </HoverCardTrigger>
              <HoverCardContent className="w-auto max-w-xs p-3">
                <p className="text-xs text-muted-foreground">
                  {newDisabledReason}
                </p>
              </HoverCardContent>
            </HoverCard>
          ) : (
            newButton
          ))}
      </div>
    </div>
  )
}
