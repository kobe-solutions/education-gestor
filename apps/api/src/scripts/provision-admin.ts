import 'dotenv/config'
import { z } from 'zod'
import { createAdminService } from '../modules/admins/admins.service'

const provisionAdminInputSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

function parseCliArgs() {
  const args = process.argv.slice(2)
  const argsMap = new Map<string, string>()

  for (const arg of args) {
    if (!arg.startsWith('--')) {
      continue
    }

    const [key, ...valueParts] = arg.slice(2).split('=')
    if (!key || valueParts.length === 0) {
      continue
    }

    argsMap.set(key, valueParts.join('='))
  }

  return argsMap
}

async function main() {
  const argsMap = parseCliArgs()

  const parsedInput = provisionAdminInputSchema.safeParse({
    name: argsMap.get('name') ?? process.env.ADMIN_NAME,
    email: argsMap.get('email') ?? process.env.ADMIN_EMAIL,
    password: argsMap.get('password') ?? process.env.ADMIN_PASSWORD,
  })

  if (!parsedInput.success) {
    console.error('Invalid input to provision admin. Use --name, --email, --password or ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD env vars.')
    console.error(parsedInput.error.flatten().fieldErrors)
    process.exit(1)
  }

  try {
    const admin = await createAdminService(parsedInput.data)
    console.log(`Admin provisioned successfully: ${admin.email}`)
    process.exit(0)
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin already exists with this email') {
      console.error(error.message)
      process.exit(1)
    }

    throw error
  }
}

main().catch((error) => {
  console.error('Failed to provision admin:', error)
  process.exit(1)
})
