import { config } from 'dotenv'
import { z } from 'zod'

config({ path: '../../.env' })

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(3333),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DO_SPACES_ENDPOINT: z.string().optional(),
  DO_SPACES_BUCKET: z.string().optional(),
  DO_SPACES_REGION: z.string().default('nyc3'),
  DO_SPACES_KEY: z.string().optional(),
  DO_SPACES_SECRET: z.string().optional(),
  DO_SPACES_CDN_URL: z.string().optional(),
  MINIO_ENDPOINT: z.string().optional(),
  MINIO_BUCKET: z.string().optional(),
  MINIO_REGION: z.string().default('us-east-1'),
  MINIO_KEY: z.string().optional(),
  MINIO_SECRET: z.string().optional(),
  MINIO_PUBLIC_URL: z.string().optional(),
})

export const env = envSchema.parse(process.env)
