import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '../env'

const isConfigured = !!(env.DO_SPACES_KEY && env.DO_SPACES_SECRET && env.DO_SPACES_ENDPOINT)

const s3 = isConfigured
  ? new S3Client({
      endpoint: env.DO_SPACES_ENDPOINT,
      region: env.DO_SPACES_REGION,
      credentials: {
        accessKeyId: env.DO_SPACES_KEY!,
        secretAccessKey: env.DO_SPACES_SECRET!,
      },
    })
  : null

export async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  if (!s3 || !env.DO_SPACES_BUCKET) {
    throw new Error('Storage not configured. Set DO_SPACES_* env vars.')
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: env.DO_SPACES_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: 'public-read',
    }),
  )

  const baseUrl = env.DO_SPACES_CDN_URL ?? `${env.DO_SPACES_ENDPOINT}/${env.DO_SPACES_BUCKET}`
  return `${baseUrl}/${key}`
}

export async function deleteFile(key: string): Promise<void> {
  if (!s3 || !env.DO_SPACES_BUCKET) return

  await s3.send(
    new DeleteObjectCommand({
      Bucket: env.DO_SPACES_BUCKET,
      Key: key,
    }),
  )
}

export function extractKeyFromUrl(url: string): string {
  const baseUrl = env.DO_SPACES_CDN_URL ?? `${env.DO_SPACES_ENDPOINT}/${env.DO_SPACES_BUCKET}`
  return url.replace(`${baseUrl}/`, '')
}
