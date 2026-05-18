import { FilledButton, TextInput } from '@/components'
import { useState } from 'react'

const randomImage = `/centrale-elettrica-${Math.ceil(Math.random() * 5)}.jpg`

export const AuthPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    // TODO: wire up auth
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
              label="Email"
              value={email}
              type="email"
              placeholder="nome@esempio.com"
              onChange={setEmail}
            />

            <TextInput
              required
              label="Password"
              value={password}
              type="password"
              placeholder="••••••••"
              onChange={setPassword}
            />

            <FilledButton type="submit" label="Accedi" />
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
