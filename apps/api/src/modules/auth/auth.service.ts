import { verifyPassword } from '../../lib/crypto'
import { findAdminByEmailRepository } from '../admins/admins.repository'
import { findSecretariaByEmailRepository } from '../secretarias/secretarias.repository'
import { findSchoolByEmailRepository } from '../schools/schools.repository'
import { findTeachersByEmailRepository } from '../teachers/teachers.repository'

type AuthenticateServiceInput = {
  email: string
  password: string
}

export async function authenticateService(input: AuthenticateServiceInput) {
  const normalizedEmail = input.email.toLowerCase().trim()

  const admin = await findAdminByEmailRepository(normalizedEmail)
  if (admin && verifyPassword(input.password, admin.passwordHash)) {
    return {
      userId: admin.id,
      schoolId: admin.id,
      name: admin.name,
      role: 'admin' as const,
    }
  }

  const secretaria = await findSecretariaByEmailRepository(normalizedEmail)
  if (secretaria && verifyPassword(input.password, secretaria.passwordHash)) {
    return {
      userId: secretaria.id,
      secretariaId: secretaria.id,
      name: secretaria.name,
      role: 'secretaria' as const,
    }
  }

  const school = await findSchoolByEmailRepository(normalizedEmail)
  if (school && verifyPassword(input.password, school.passwordHash)) {
    return {
      userId: school.id,
      schoolId: school.id,
      name: school.name,
      role: 'gestor' as const,
    }
  }

  const teachers = await findTeachersByEmailRepository(normalizedEmail)
  for (const teacher of teachers) {
    if (verifyPassword(input.password, teacher.passwordHash)) {
      return {
        userId: teacher.id,
        schoolId: teacher.schoolId,
        name: teacher.name,
        role: 'professor' as const,
      }
    }
  }

  throw new Error('Invalid credentials')
}
