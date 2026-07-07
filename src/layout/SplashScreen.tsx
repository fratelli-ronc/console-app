import { Loader2 } from 'lucide-react'

export const SplashScreen: React.FC = () => {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-background">
      <img
        draggable={false}
        src="/logo-verde-castoro-ronc.png"
        alt="logo"
        className="h-12 w-12"
      />
      <Loader2 className="animate-spin text-muted-foreground" size={20} />
    </div>
  )
}
