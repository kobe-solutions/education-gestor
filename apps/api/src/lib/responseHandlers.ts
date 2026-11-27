import type { FastifyReply } from 'fastify'
import { MissingTenantError } from './routeHelpers'

export type RouteErrorMapping = {
  message: string
  status: number
  responseMessage?: string
  includes?: boolean
}

export function successHandler<T>(
  reply: FastifyReply,
  message: string,
  status: number,
  data: T,
): FastifyReply {
  return reply.status(status).send({ message, status, data })
}

export function errorHandler(
  reply: FastifyReply,
  message: string,
  status: number,
): FastifyReply {
  return reply.status(status).send({ error: message, status })
}

export function handleRouteError(
  reply: FastifyReply,
  error: unknown,
  invalidMessage: string,
  mappings: RouteErrorMapping[] = [],
): FastifyReply {
  if (error instanceof MissingTenantError) {
    return errorHandler(
      reply,
      'Não foi possível identificar a escola ativa. Selecione uma escola e tente novamente.',
      400,
    )
  }

  if (error instanceof Error) {
    if (error.name === 'ZodError') return errorHandler(reply, invalidMessage, 400)

    const mapping = mappings.find(({ message, includes }) =>
      includes ? error.message.includes(message) : error.message === message,
    )
    if (mapping) {
      return errorHandler(reply, mapping.responseMessage ?? error.message, mapping.status)
    }
  }

  return errorHandler(reply, 'Erro interno no servidor.', 500)
}
