import { PageHeader } from '@/components'
import { UpdateSection } from './components/UpdateSection'

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Impostazioni"
        subtitle="Gestisci le preferenze e gli aggiornamenti dell'applicazione."
      />

      <UpdateSection />
    </div>
  )
}
