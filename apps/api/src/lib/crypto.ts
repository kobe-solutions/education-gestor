import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, originalHash] = storedHash.split(':')
  if (!salt || !originalHash) return false
  const hashBuffer = scryptSync(password, salt, 64)
  const originalHashBuffer = Buffer.from(originalHash, 'hex')
  if (hashBuffer.length !== originalHashBuffer.length) return false
  return timingSafeEqual(hashBuffer, originalHashBuffer)
}
