import type { FastifyRateLimitOptions } from '@fastify/rate-limit'
import type { FastifyRequest } from 'fastify'
import { env } from '../env'

export const globalRateLimitConfig: FastifyRateLimitOptions = {
  max: env.RATE_LIMIT_GLOBAL_MAX,
  timeWindow: env.RATE_LIMIT_TIME_WINDOW,
  keyGenerator: (request: FastifyRequest) => {
    return request.ip || request.socket.remoteAddress || 'unknown'
  },
  addHeadersOnExceeding: {
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true,
  },
  addHeaders: {
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true,
    'retry-after': true,
  },
  errorResponseBuilder: (_request: FastifyRequest, context: { ttl: number }) => {
    return {
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
      retryAfter: Math.ceil(context.ttl / 1000),
    }
  },
}

export const loginRateLimitConfig: FastifyRateLimitOptions = {
  max: env.RATE_LIMIT_LOGIN_MAX,
  timeWindow: env.RATE_LIMIT_TIME_WINDOW,
  keyGenerator: (request: FastifyRequest) => {
    return request.ip || request.socket.remoteAddress || 'unknown'
  },
  addHeadersOnExceeding: {
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true,
  },
  addHeaders: {
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true,
    'retry-after': true,
  },
  errorResponseBuilder: (_request: FastifyRequest, context: { ttl: number }) => {
    return {
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Too many login attempts. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
      retryAfter: Math.ceil(context.ttl / 1000),
    }
  },
}
