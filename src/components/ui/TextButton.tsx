import { cn } from '@/lib/utils'

interface TextButtonProps {
  type: 'submit' | 'reset' | 'button'
  disabled?: boolean
  className?: string
  onClick?: () => void
}

export const TextButton: React.FC<React.PropsWithChildren<TextButtonProps>> = ({
  type,
  disabled,
  className,
  children,
  onClick,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-9 px-3 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
    >
      {children}
    </button>
  )
}
