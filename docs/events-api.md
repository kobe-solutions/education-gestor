# Entidade `events` — API de Eventos Escolares

## Visão Geral

Nova entidade `events` para o calendário de eventos da escola. Cada evento pertence **diretamente a uma escola** (`schoolId`), e o escopo multi-tenant é aplicado **no servidor**: nenhuma query retorna eventos de outra escola, inclusive quando a requisição é feita por uma secretaria vinculada a múltiplas escolas.

Sem alterações de frontend nesta entrega.

## Arquivos Criados

| Arquivo | Descrição |
|---|---|
| `apps/api/src/db/schema/events.ts` | Tabela `events` (drizzle) com FK para `schools` e índice `(school_id, date)` |
| `apps/api/src/db/migrations/0027_bouncy_vermin.sql` | Migration gerada pelo drizzle-kit |
| `apps/api/src/modules/events/events.schema.ts` | Schemas Zod de validação |
| `apps/api/src/modules/events/events.repository.ts` | Queries Drizzle — **todas** filtram por `schoolId` |
| `apps/api/src/modules/events/events.service.ts` | Regras de negócio |
| `apps/api/src/modules/events/events.routes.ts` | Endpoints HTTP + audit log |
| `apps/api/src/test/unit/events.service.test.ts` | Testes unitários (9) |
| `apps/api/src/test/e2e/events.test.ts` | Testes de integração/roteamento (17) |

## Estrutura da Tabela

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | uuid | PK, `gen_random_uuid()` |
| `schoolId` | uuid | **FK `schools.id`** — escopo multi-tenant |
| `title` | text | obrigatório (mín. 2 caracteres) |
| `category` | text | obrigatório (ex.: `festividade`, `feriado`, `reuniao`, ...) |
| `date` | date | obrigatório, formato `YYYY-MM-DD` |
| `startTime` | text | opcional, formato `HH:MM` |
| `endTime` | text | opcional, formato `HH:MM` |
| `allDay` | boolean | default `false` |
| `location` | text | opcional |
| `description` | text | opcional |
| `createdAt` / `updatedAt` | timestamp | automáticos |

## Rotas

### Autenticação e Tenant

Todas as rotas exigem `Authorization: Bearer <jwt>`.

| Role | Como o `schoolId` é resolvido |
|---|---|
| `gestor` / `professor` | direto do JWT (`payload.schoolId`) |
| `secretaria` | header `X-School-Id: <uuid>` (escolha a escola ativa) |
| `admin` | sem `schoolId` — não acessa estas rotas |

- **Leitura** (`GET`): `authenticate` + `injectTenant` (gestor, professor, secretaria)
- **Escrita** (`POST/PUT/DELETE`): `authenticate` + `injectTenant` + `authorizeRoles(['admin', 'secretaria', 'gestor'])`

> **Importante para o frontend:** quando a role for `secretaria`, o interceptor de axios já injeta o `X-School-Id` do `SchoolContext`/`sessionStorage`. Sem esse header, a API retorna **400** com `x-school-id header required for this operation`.

### `GET /events`

Lista os eventos da escola (somente da escola ativa). Aceita filtros por query string:

| Query | Tipo | Exemplo | Descrição |
|---|---|---|---|
| `from` | date | `?from=2025-07-01` | eventos a partir desta data (inclusive) |
| `to` | date | `?to=2025-07-31` | eventos até esta data (inclusive) |
| `category` | text | `?category=feriado` | filtra por categoria |

Respostas:
- `200` — array de eventos ordenado por `date`
- `400` — data em formato inválido na query

### `GET /events/:id`

Retorna um evento **somente se pertencer à escola ativa**.

- `200` — evento
- `404` — evento não existe **ou pertence a outra escola** (nunca vaza dados)

### `POST /events`

Body (Zod):

```json
{
  "title": "Festival de Inverno",
  "category": "festividade",
  "date": "2025-07-15",
  "startTime": "09:00",
  "endTime": "17:00",
  "allDay": false,
  "location": "Quadra",
  "description": "Evento anual da escola"
}
```

- `startTime`/`endTime`/`location`/`description` são opcionais (`null` ou ausentes)
- `allDay` opcional (default `false`)
- Respostas: `201` (evento criado), `400` (validação: título/`date`/formato `HH:MM`)

### `PUT /events/:id`

Atualização parcial. Qualquer campo do body é opcional; para limpar um campo opcional, envie `null`.

- `200` — evento atualizado
- `404` — não existe na escola ativa
- `400` — validação

### `DELETE /events/:id`

- `204` — removido (hard delete)
- `404` — não existe na escola ativa

## Escopo Multi-Tenant (regra de negócio)

- Toda query em `events.repository.ts` filtra por `schoolId` (`eq(events.schoolId, schoolId)`).
- Uma secretaria vinculada a várias escolas **nunca** recebe eventos de todas: o header `X-School-Id` define a escola ativa e somente os eventos dela são retornados.
- `GET /events/:id` e operações de escrita retornam `404` para ids de outras escolas (não há como deduzir que o evento existe).

## Testes

```bash
pnpm --filter api test
```

- Unit: `apps/api/src/test/unit/events.service.test.ts` (9 testes)
- E2E: `apps/api/src/test/e2e/events.test.ts` (17 testes) — inclui cenário de secretaria multi-escola via `X-School-Id` e 400 sem o header.

## Migration

Aplicar a migration no banco:

```bash
pnpm db:migrate
```
