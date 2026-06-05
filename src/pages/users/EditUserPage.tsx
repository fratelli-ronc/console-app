import { useParams } from 'react-router-dom'
import { UserFormPage } from './components/UserFormPage'
import { MOCK_USERS } from './mockUsers'

export const EditUserPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const user = MOCK_USERS.find((u) => u.id === userId)

  return <UserFormPage mode="edit" initialValues={user} />
}
