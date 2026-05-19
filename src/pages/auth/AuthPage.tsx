import { FilledButton, TextInput } from '@/components'
import { login } from '@/client/auth/requests'
import { setToken, setRefreshToken } from '@/client/tokenStore'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const randomImage = `/centrale-elettrica-${Math.ceil(Math.random() * 5)}.jpg`

export const AuthPage: React.FC = () => {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()

    setLoading(true)
    setError(null)

    try {
      const data = await login(username, password)

      console.log(data.token)

      await setToken(data.token)
      await setRefreshToken(data.refresh_token)

      navigate('/')
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 401) {
        setError('Credenziali non corrette. Riprova.')
      } else {
        setError('Errore di connessione. Controlla la rete e riprova.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="w-full max-w-4xl bg-card rounded-2xl shadow-xl overflow-hidden flex">
        {/* Left — form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-10 py-12">
          <div className="mb-8">
            <img
              src="/logo-verde-castoro-ronc.png"
              alt="Ronc"
              className="h-10 mb-8"
            />
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Accedi al tuo account
            </h1>
            <p className="text-sm text-muted-foreground">
              Inserisci le credenziali per continuare.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <TextInput
              required
              label="Username"
              value={username}
              type="username"
              placeholder="nome@esempio.com"
              onChange={setUsername}
            />

            <TextInput
              required
              label="Password"
              value={password}
              type="password"
              placeholder="••••••••"
              onChange={setPassword}
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <FilledButton
              type="submit"
              label={loading ? 'Accesso…' : 'Accedi'}
              disabled={loading}
            />
          </form>
        </div>

        {/* Right — image */}
        <div className="hidden md:block w-1/2 relative">
          <img
            src={randomImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-foreground/40" />
        </div>
      </div>
    </div>
  )
}
