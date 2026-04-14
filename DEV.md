# Guia de Desenvolvimento

## Pré-requisitos

- [Node.js 20+](https://nodejs.org/)
- [pnpm 9+](https://pnpm.io/installation)
- [Docker + Docker Compose](https://www.docker.com/)

---

## Setup inicial

### 1. Instale as dependências

```bash
pnpm install
```

### 2. Configure as variáveis de ambiente da API

```bash
cp apps/api/.env.example apps/api/.env
```

Edite `apps/api/.env` se necessário. Os valores padrão já funcionam com o Docker local.

### 3. Suba o banco de dados

```bash
docker compose up -d
```

Isso inicia o PostgreSQL na porta `5432`.

### 4. Gere e rode as migrations

```bash
# Gerar arquivos de migration a partir do schema
pnpm db:generate

# Aplicar as migrations no banco
pnpm db:migrate
```

### 5. Suba os servidores de desenvolvimento

```bash
pnpm dev
```

| Serviço | URL |
|---|---|
| API (Fastify) | http://localhost:3333 |
| Web (Vite) | http://localhost:5173 |
| Health check | http://localhost:3333/health |

---

## Comandos úteis

```bash
# Rodar apenas a API
pnpm --filter api dev

# Rodar apenas o frontend
pnpm --filter web dev

# Abrir o Drizzle Studio (visualizador do banco)
pnpm db:studio

# Gerar nova migration após alterar o schema
pnpm db:generate

# Aplicar migrations pendentes
pnpm db:migrate
```

---

## Estrutura do projeto

```
education-gestor/
├── apps/
│   ├── api/                     # Fastify + Drizzle
│   │   ├── src/
│   │   │   ├── db/
│   │   │   │   ├── schema/      # Tabelas Drizzle (adicione aqui)
│   │   │   │   └── migrations/  # Gerado automaticamente
│   │   │   ├── modules/         # Adicione um por domínio
│   │   │   ├── middlewares/
│   │   │   │   ├── auth.ts      # Valida JWT
│   │   │   │   └── tenant.ts    # Injeta schoolId
│   │   │   ├── env.ts           # Variáveis de ambiente validadas (Zod)
│   │   │   ├── app.ts           # Configura o Fastify
│   │   │   └── server.ts        # Entry point
│   │   ├── drizzle.config.ts
│   │   └── .env                 # Não commitado
│   │
│   └── web/                     # React + Vite
│       └── src/
│           ├── features/        # Adicione uma por domínio
│           ├── components/      # Componentes globais
│           ├── lib/
│           │   └── api.ts       # Cliente axios com JWT
│           └── App.tsx
│
└── packages/
    └── types/                   # DTOs e tipos compartilhados
        └── src/index.ts
```

---

## Adicionando um novo módulo

### Backend (`apps/api/src/modules/[modulo]/`)

```
[modulo].routes.ts      # Endpoints, validação Zod
[modulo].service.ts     # Regras de negócio
[modulo].repository.ts  # Queries Drizzle (sempre filtrar por schoolId)
[modulo].schema.ts      # Schemas Zod de input/output
```

Registre as rotas em `src/app.ts`:
```ts
app.register(import('./modules/[modulo]/[modulo].routes'))
```

### Frontend (`apps/web/src/features/[feature]/`)

```
components/
hooks/        # useFeature, useCreateFeature (TanStack Query)
pages/
```

---

## Multi-tenant

Todo request autenticado carrega `schoolId` no JWT:

```ts
{ userId, schoolId, role }
```

O middleware `tenant.ts` injeta o `schoolId` no contexto do request. Os repositories **sempre** devem filtrar por `schoolId` — nunca fazer queries sem esse filtro.

---

## Parar o banco

```bash
docker compose down
```

Para remover os dados também:

```bash
docker compose down -v
```
