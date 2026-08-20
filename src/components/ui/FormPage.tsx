import { FilledButton } from './FilledButton'

interface FormPageProps {
  title: string
  subtitle: string
  submitLabel: string
  loading?: boolean
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void
  onCancel: () => void
  children: React.ReactNode
}

export const FormPage: React.FC<FormPageProps> = ({
  title,
  subtitle,
  submitLabel,
  loading = false,
  onSubmit,
  onCancel,
  children,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}

      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      </div>

      {/* Form card */}
      <div className="bg-card border border-border rounded-xl p-6 max-w-lg">
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          {children}

          <div className="flex items-center gap-6 pt-1">
            <FilledButton type="submit" disabled={loading}>
              {submitLabel}
            </FilledButton>
            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
