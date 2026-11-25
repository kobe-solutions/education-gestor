import type { FastifyReply } from 'fastify'

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
