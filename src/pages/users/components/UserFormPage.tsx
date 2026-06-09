import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { TextInput } from '@/components'
import { FilledButton } from '@/components'
import { cn } from '@/lib/utils'
import { User, UserRole } from '../mockUsers'

interface UserFormPageProps {
  mode: 'create' | 'edit'
  initialValues?: Partial<User>
}

const ROLES: UserRole[] = ['Admin', 'Operatore', 'Lettore']

export const UserFormPage: React.FC<UserFormPageProps> = ({
  mode,
  initialValues,
}) => {
  const navigate = useNavigate()

  const [nome, setNome] = useState(initialValues?.nome ?? '')
  const [cognome, setCognome] = useState(initialValues?.cognome ?? '')
  const [email, setEmail] = useState(initialValues?.email ?? '')
  const [ruolo, setRuolo] = useState<UserRole>(
    initialValues?.ruolo ?? 'Lettore',
  )
  const [password, setPassword] = useState('')
  const [attivo, setAttivo] = useState(initialValues?.attivo ?? true)
  const [loading, setLoading] = useState(false)

  const isCreate = mode === 'create'
  const title = isCreate ? 'Nuovo utente' : 'Modifica utente'
  const subtitle = isCreate
    ? 'Compila i campi per aggiungere un nuovo utente al sistema.'
    : "Modifica i dati dell'utente."

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    navigate('/users')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate(-1)}
          className="mt-0.5 h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
        >
          <ChevronLeft size={16} />
        </button>

        <div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-card border border-border rounded-xl p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <TextInput
              required
              label="Nome"
              value={nome}
              placeholder="Marco"
              onChange={setNome}
            />
            <TextInput
              required
              label="Cognome"
              value={cognome}
              placeholder="Rossi"
              onChange={setCognome}
            />
          </div>

          <TextInput
            required
            label="Email"
            value={email}
            type="email"
            placeholder="nome@fratellironc.it"
            onChange={setEmail}
          />

          {/* Ruolo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Ruolo</label>
            <select
              value={ruolo}
              onChange={(e) => setRuolo(e.target.value as UserRole)}
              className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {isCreate && (
            <TextInput
              required
              label="Password"
              value={password}
              type="password"
              placeholder="••••••••"
              onChange={setPassword}
            />
          )}

          {!isCreate && (
            <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-border bg-muted/40">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Stato account
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {attivo
                    ? "L'utente può accedere al sistema."
                    : "L'utente non può accedere al sistema."}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={attivo}
                onClick={() => setAttivo((v) => !v)}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                  attivo ? 'bg-primary' : 'bg-input',
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200',
                    attivo ? 'translate-x-5' : 'translate-x-0',
                  )}
                />
              </button>
            </div>
          )}

          <div className="flex items-center gap-6 pt-1">
            <FilledButton type="submit" disabled={loading}>
              {loading
                ? 'Salvataggio…'
                : isCreate
                  ? 'Crea utente'
                  : 'Salva modifiche'}
            </FilledButton>
            <button
              type="button"
              onClick={() => navigate('/users')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
