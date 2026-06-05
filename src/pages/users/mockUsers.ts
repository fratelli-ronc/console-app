export type UserRole = 'Admin' | 'Operatore' | 'Lettore'

export interface User {
  id: string
  nome: string
  cognome: string
  email: string
  ruolo: UserRole
  attivo: boolean
}

export const MOCK_USERS: User[] = [
  {
    id: '1',
    nome: 'Marco',
    cognome: 'Rossi',
    email: 'marco.rossi@fratellironc.it',
    ruolo: 'Admin',
    attivo: true,
  },
  {
    id: '2',
    nome: 'Giulia',
    cognome: 'Bianchi',
    email: 'giulia.bianchi@fratellironc.it',
    ruolo: 'Operatore',
    attivo: true,
  },
  {
    id: '3',
    nome: 'Luca',
    cognome: 'Ferrari',
    email: 'luca.ferrari@fratellironc.it',
    ruolo: 'Lettore',
    attivo: false,
  },
  {
    id: '4',
    nome: 'Sara',
    cognome: 'Conti',
    email: 'sara.conti@fratellironc.it',
    ruolo: 'Operatore',
    attivo: true,
  },
  {
    id: '5',
    nome: 'Paolo',
    cognome: 'Mancini',
    email: 'paolo.mancini@fratellironc.it',
    ruolo: 'Lettore',
    attivo: false,
  },
]
