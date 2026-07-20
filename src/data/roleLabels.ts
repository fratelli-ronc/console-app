import { UserAuthLevel } from '@/client'

export const ROLE_LABELS: Record<
  UserAuthLevel,
  { label: string; className: string }
> = {
  [UserAuthLevel.ReadOnly]: {
    label: 'Lettore',
    className: 'bg-muted text-muted-foreground',
  },
  [UserAuthLevel.User]: {
    label: 'Utente',
    className: 'bg-muted text-muted-foreground',
  },
  [UserAuthLevel.Work]: {
    label: 'Operatore',
    className: 'bg-secondary/20 text-amber-700',
  },
  [UserAuthLevel.WorkTec]: {
    label: 'Tecnico',
    className: 'bg-secondary/20 text-amber-700',
  },
  [UserAuthLevel.Admin]: {
    label: 'Admin',
    className: 'bg-primary/10 text-primary',
  },
  [UserAuthLevel.SuperAdmin]: {
    label: 'Super Admin',
    className: 'bg-primary/10 text-primary',
  },
}

export const ROLE_LEVELS: UserAuthLevel[] = [
  UserAuthLevel.ReadOnly,
  UserAuthLevel.User,
  UserAuthLevel.Work,
  UserAuthLevel.WorkTec,
  UserAuthLevel.Admin,
  UserAuthLevel.SuperAdmin,
]
