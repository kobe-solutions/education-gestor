import { useNavigate } from 'react-router'
import { useAuth } from '../../../contexts/AuthContext'
import { useSchoolContext } from '../../../contexts/SchoolContext'
import { useSecretariaSchools } from '../hooks/useSecretarias'
import type { SecretariaPayload } from '@education-gestor/types'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'

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
            <Card key={school.id} className={isActive ? 'border-primary' : undefined}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{school.name}</CardTitle>
                  {isActive && <Badge variant="default">Ativa</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{school.email}</p>
                <Button
                  size="sm"
                  variant={isActive ? 'secondary' : 'default'}
                  onClick={() => handleAccess(school.id, school.name)}
                >
                  {isActive ? 'Escola ativa' : 'Acessar'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
