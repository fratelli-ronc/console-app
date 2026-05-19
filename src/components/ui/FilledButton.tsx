interface FilledButtonProps {
  type: 'submit' | 'reset' | 'button'
  label: string
  disabled?: boolean
  onClick?: () => void
}

export const FilledButton: React.FC<FilledButtonProps> = ({
  type,
  label,
  disabled,
  onClick,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="mt-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:bg-primary/80 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {label}
    </button>
  )
}
