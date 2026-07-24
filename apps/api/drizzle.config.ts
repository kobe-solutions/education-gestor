import { config } from 'dotenv'
import type { Config } from 'drizzle-kit'

config({ path: '../../.env' })

const url = process.env.DATABASE_URL

if (!url) {
  throw new Error('DATABASE_URL é obrigatório para migrations')
}

export default ({
  schema: './src/db/schema',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url },
}) satisfies Config
