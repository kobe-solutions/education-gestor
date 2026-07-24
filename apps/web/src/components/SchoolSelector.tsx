import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { useSchoolContext } from '../contexts/SchoolContext'
import { useSecretariaSchools } from '../features/secretarias/hooks/useSecretarias'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import type { SecretariaPayload } from '@education-gestor/types'

export function SchoolSelector() {
  const { payload } = useAuth()
  const { activeSchoolId, setActiveSchool } = useSchoolContext()
  const queryClient = useQueryClient()

  const secretariaId = (payload as SecretariaPayload).secretariaId
  const { data: schools } = useSecretariaSchools(secretariaId)

  function handleChange(schoolId: string) {
    const school = schools?.find((s) => s.id === schoolId)
    if (!school) return
    setActiveSchool(school.id, school.name)
    queryClient.invalidateQueries()
  }

  return (
    <Select value={activeSchoolId ?? ''} onValueChange={handleChange}>
      <SelectTrigger className="w-52 h-8 text-sm">
        <SelectValue placeholder="Selecionar escola" />
      </SelectTrigger>
      <SelectContent>
        {schools?.map((school) => (
          <SelectItem key={school.id} value={school.id}>
            {school.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
