import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextInput, FormPage, ToggleSwitch } from '@/components'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components'
import { AuthUser, UserAuthLevel, createUser, updateUser } from '@/client'
import { ROLE_LABELS, ROLE_LEVELS } from '@/data'

interface UserFormPageProps {
  mode: 'create' | 'edit'
  initialValues?: AuthUser
}

export const UserFormPage: React.FC<UserFormPageProps> = ({
  mode,
  initialValues,
}) => {
  const navigate = useNavigate()

  const [username, setUsername] = useState(initialValues?.username ?? '')
  const [name, setName] = useState(initialValues?.name ?? '')
  const [email, setEmail] = useState(initialValues?.email ?? '')
  const [phone, setPhone] = useState(initialValues?.phone ?? '')
  const [authLevel, setAuthLevel] = useState<UserAuthLevel>(
    initialValues?.authorization ?? UserAuthLevel.ReadOnly,
  )
  const [password, setPassword] = useState('')
  const [changePassword, setChangePassword] = useState(false)
  const [enabled, setEnabled] = useState(initialValues?.enabled ?? true)
  const [loading, setLoading] = useState(false)

  const isCreate = mode === 'create'

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      username,
      name,
      email,
      phone,
      authLevel,
      ...(isCreate || changePassword ? { password } : {}),
      ...(isCreate ? {} : { enabled }),
    }

    const res = isCreate
      ? await createUser(payload)
      : await updateUser(initialValues!.id, payload)

    setLoading(false)
    if (res !== null) navigate('/users')
  }

  return (
    <FormPage
      title={isCreate ? 'Nuovo utente' : 'Modifica utente'}
      subtitle={
        isCreate
          ? 'Compila i campi per aggiungere un nuovo utente al sistema.'
          : "Modifica i dati dell'utente."
      }
      submitLabel={
        loading ? 'Salvataggio…' : isCreate ? 'Crea utente' : 'Salva modifiche'
      }
      loading={loading}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/users')}
    >
      <div className="grid grid-cols-2 gap-4">
        <TextInput
          required
          label="Nome"
          value={name}
          placeholder="Marco Rossi"
          onChange={setName}
        />
        <TextInput
          required
          label="Username"
          value={username}
          placeholder="marco.rossi"
          onChange={setUsername}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextInput
          required
          label="Email"
          value={email}
          type="email"
          placeholder="nome@fratellironc.it"
          onChange={setEmail}
        />
        <TextInput
          label="Telefono"
          value={phone}
          type="tel"
          placeholder="+393332227777"
          onChange={setPhone}
        />
      </div>

      {/* Ruolo */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Ruolo</label>
        <Select
          value={String(authLevel)}
          onValueChange={(v) => setAuthLevel(Number(v) as UserAuthLevel)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_LEVELS.map((level) => (
              <SelectItem key={level} value={String(level)}>
                {ROLE_LABELS[level].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isCreate ? (
        <TextInput
          required
          label="Password"
          value={password}
          type="password"
          placeholder="••••••••"
          onChange={setPassword}
        />
      ) : (
        <div className="flex flex-col gap-3 py-3 px-4 rounded-lg border border-border bg-muted/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                Cambia password
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Lascia disattivato per mantenere la password attuale.
              </p>
            </div>
            <ToggleSwitch
              checked={changePassword}
              onChange={setChangePassword}
            />
          </div>

          {changePassword && (
            <TextInput
              required
              label="Nuova password"
              value={password}
              type="password"
              placeholder="••••••••"
              onChange={setPassword}
            />
          )}
        </div>
      )}

      {!isCreate && (
        <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-border bg-muted/40">
          <div>
            <p className="text-sm font-medium text-foreground">
              Stato account
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {enabled
                ? "L'utente può accedere al sistema."
                : "L'utente non può accedere al sistema."}
            </p>
          </div>
          <ToggleSwitch checked={enabled} onChange={setEnabled} />
        </div>
      )}
    </FormPage>
  )
}
