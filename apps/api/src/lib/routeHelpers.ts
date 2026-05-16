import type { TenantPayload } from '../middlewares/authorize'

export function getSchoolId(request: { user: unknown }): string {
  return (request.user as TenantPayload).schoolId
}
