import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '../env'

const endpoint = env.DO_SPACES_ENDPOINT || env.MINIO_ENDPOINT
const bucket = env.DO_SPACES_BUCKET || env.MINIO_BUCKET
const region = env.DO_SPACES_REGION || env.MINIO_REGION
const accessKeyId = env.DO_SPACES_KEY || env.MINIO_KEY
const secretAccessKey = env.DO_SPACES_SECRET || env.MINIO_SECRET

const isConfigured = !!(accessKeyId && secretAccessKey && endpoint)

const s3 = isConfigured
  ? new S3Client({
      endpoint,
      region,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    })
  : null

export async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  if (!s3 || !bucket) {
    throw new Error('Storage not configured. Set DO_SPACES_* or MINIO_* env vars.')
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )

  const baseUrl = env.DO_SPACES_CDN_URL ?? env.MINIO_PUBLIC_URL ?? `${endpoint}/${bucket}`
  return `${baseUrl}/${key}`
}

export async function deleteFile(key: string): Promise<void> {
  if (!s3 || !bucket) return

  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  )
}

export function extractKeyFromUrl(url: string): string {
  const baseUrl = env.DO_SPACES_CDN_URL ?? env.MINIO_PUBLIC_URL ?? `${endpoint}/${bucket}`
  return url.replace(`${baseUrl}/`, '')
}
