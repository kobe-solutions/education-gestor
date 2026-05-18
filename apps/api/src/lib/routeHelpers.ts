import type { TenantPayload } from '../middlewares/authorize'

export class MissingTenantError extends Error {
  readonly statusCode = 400
  constructor() {
    super('x-school-id header required for this operation')
  }
}

export function getSchoolId(request: { user: unknown }): string {
  const schoolId = (request.user as TenantPayload).schoolId
  if (!schoolId) throw new MissingTenantError()
  return schoolId
}
