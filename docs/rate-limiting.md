# Rate Limiting

Proteção contra abuso de API via limitação de taxa de requisições por IP.

## Plugin

[@fastify/rate-limit](https://github.com/fastify/fastify-rate-limit) v10+ (compatível com Fastify 5).

## Configuração

| Escopo | Limite | Janela | Aplicação |
|--------|--------|--------|-----------|
| **Global** | 100 req | 1 min | Todos os endpoints |
| **Login** (`POST /sessions`) | 10 req | 1 min | Proteção contra brute-force |

## Variáveis de Ambiente

| Variável | Default | Descrição |
|----------|---------|-----------|
| `RATE_LIMIT_GLOBAL_MAX` | `100` | Máximo de requisições globais por IP |
| `RATE_LIMIT_LOGIN_MAX` | `10` | Máximo de tentativas de login por IP |
| `RATE_LIMIT_TIME_WINDOW` | `60000` | Janela de tempo em milissegundos (1 min) |

## Headers de Resposta

### Quando o limite NÃO foi atingido:

```
x-ratelimit-limit: 100
x-ratelimit-remaining: 99
x-ratelimit-reset: 1725000060
```

### Quando o limite FOI atingido (429):

```
x-ratelimit-limit: 100
x-ratelimit-remaining: 0
x-ratelimit-reset: 1725000060
retry-after: 45
```

## Response Body (429 Too Many Requests)

```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 45 seconds.",
  "retryAfter": 45
}
```

Para login:

```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Too many login attempts. Try again in 45 seconds.",
  "retryAfter": 45
}
```

## Arquivos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `apps/api/src/middlewares/rateLimit.ts` | Configurações de rate limit |
| `apps/api/src/app.ts` | Registro do plugin global |
| `apps/api/src/modules/auth/auth.routes.ts` | Rate limit específico no login |
| `apps/api/src/env.ts` | Validação das variáveis de ambiente |

## Comportamento

- **Por IP**: O rate limit é aplicado por endereço IP do cliente
- **In-memory store**: Utiliza LRU cache interno (padrão)
- **Headers**: Sempre retorna headers de rate limit para transparência
- **Mensagens**: Resposta em inglês para entidades, contexto em português quando aplicável

## Produção

Para ambientes com múltiplas instâncias, considere configurar Redis como store:

```ts
import Redis from 'ioredis'

export const globalRateLimitConfig = {
  redis: new Redis(process.env.REDIS_URL),
  // ...outras opções
}
```

## Referências

- [Fastify Rate Limit - GitHub](https://github.com/fastify/fastify-rate-limit)
- [Fastify Rate Limit - npm](https://www.npmjs.com/package/@fastify/rate-limit)
