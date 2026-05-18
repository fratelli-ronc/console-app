interface FilledButtonProps {
  type: 'submit' | 'reset' | 'button'
  label: string
  onClick?: () => void
}

export const FilledButton: React.FC<FilledButtonProps> = ({
  type,
  label,
  onClick,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className="mt-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:bg-primary/80 transition cursor-pointer"
    >
      {label}
    </button>
  )
}
