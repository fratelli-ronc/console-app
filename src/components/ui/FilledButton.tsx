import { cn } from '@/lib/utils'

interface FilledButtonProps {
  type: 'submit' | 'reset' | 'button'
  disabled?: boolean
  className?: string
  onClick?: () => void
}

export const FilledButton: React.FC<
  React.PropsWithChildren<FilledButtonProps>
> = ({ type, disabled, className, children, onClick }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-9 px-4 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
    >
      {children}
    </button>
  )
}
