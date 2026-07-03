import { cn } from '@/lib/utils'

interface OutlinedButtonProps {
  type: 'submit' | 'reset' | 'button'
  disabled?: boolean
  className?: string
  onClick?: () => void
}

export const OutlinedButton: React.FC<
  React.PropsWithChildren<OutlinedButtonProps>
> = ({ type, disabled, className, children, onClick }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-9 px-4 text-sm font-medium bg-transparent text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
    >
      {children}
    </button>
  )
}
