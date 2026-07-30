import { useNavigate } from 'react-router'
import { useAuth } from '../../../contexts/AuthContext'
import { useSchoolContext } from '../../../contexts/SchoolContext'
import { useSecretariaSchools } from '../hooks/useSecretarias'
import type { SecretariaPayload } from '@education-gestor/types'
import { Surface } from '../../../components/Surface'
import { Button } from '../../../components/ui/button'
import { StatusBadge } from '../../../components/StatusBadge'

export function MySchoolsPage() {
  const { payload } = useAuth()
  const { activeSchoolId, setActiveSchool } = useSchoolContext()
  const navigate = useNavigate()

  const secretariaId = (payload as SecretariaPayload).secretariaId
  const { data: schools, isLoading } = useSecretariaSchools(secretariaId)

  function handleAccess(schoolId: string, schoolName: string) {
    setActiveSchool(schoolId, schoolName)
    navigate('/')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Minhas Escolas</h1>

      {isLoading && <p className="text-muted-foreground text-sm">Carregando escolas...</p>}

      {!isLoading && schools?.length === 0 && (
        <p className="text-muted-foreground text-sm">Nenhuma escola vinculada à sua conta.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {schools?.map((school) => {
          const isActive = activeSchoolId === school.id
          return (
            <Surface key={school.id} className={'p-4 ' + (isActive ? 'border-primary' : '')}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-base font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{school.name}</h3>
                {isActive && <StatusBadge status="true" kind="active" />}
              </div>
              <p className="text-sm mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>{school.email}</p>
              <Button
                size="sm"
                variant={isActive ? 'secondary' : 'default'}
                onClick={() => handleAccess(school.id, school.name)}
              >
                {isActive ? 'Escola ativa' : 'Acessar'}
              </Button>
            </Surface>
          )
        })}
      </div>
    </div>
  )
}
