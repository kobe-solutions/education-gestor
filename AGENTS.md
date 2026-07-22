# AGENTS.md

Guia para agentes de IA trabalhando no Education Gestor.

---

## Visão Geral do Projeto

Sistema de gestão escolar multi-tenant para escolas brasileiras de pequeno/médio porte. Monorepo com pnpm workspaces.

**Stack**: Fastify + Drizzle ORM + PostgreSQL (backend) | React + Vite + TanStack Query + shadcn/ui (frontend)

---

## Estrutura do Repositório

```
education-gestor/
├── apps/
│   ├── api/              # Backend Fastify (porta 3333)
│   │   └── src/
│   │       ├── db/       # Schema Drizzle + migrations
│   │       ├── modules/  # Módulos de domínio (19 no total)
│   │       ├── middlewares/  # auth, tenant, authorize
│   │       ├── lib/      # storage, helpers de rota
│   │       └── scripts/  # admin:provision, seed, clear
│   │
│   └── web/              # SPA React (porta 5173)
│       └── src/
│           ├── features/ # Features de domínio (16 no total)
│           ├── components/  # UI global (shadcn + custom)
│           ├── contexts/  # AuthContext, SchoolContext
│           ├── lib/       # cliente API, utils
│           └── pages/     # Páginas hub, dashboard
│
└── packages/
    └── types/            # DTOs compartilhados, payloads JWT, enums
```

---

## Padrões de Arquitetura

### Fluxo de Requisição (Backend)
```
Rota (validação Zod) → Middleware (auth + tenant) → Service → Repository → DB
```

### Estrutura de Módulo (Backend)
Cada módulo em `apps/api/src/modules/[nome]/` segue:
- `[nome].routes.ts` — Endpoints com validação Zod, hooks preHandler
- `[nome].service.ts` — Lógica de negócio, orquestra repositories
- `[nome].repository.ts` — Queries Drizzle, **sempre filtra por schoolId**
- `[nome].schema.ts` — Schemas Zod para entrada/saída

### Estrutura de Feature (Frontend)
Cada feature em `apps/web/src/features/[nome]/` contém:
- `pages/` — Componentes de página
- `components/` — UI específica da feature
- `hooks/` — Hooks TanStack Query (useFeature, useCreateFeature)

---

## Regras Multi-Tenant

**Toda tabela de domínio deve ter:**
```typescript
schoolId: uuid('school_id').notNull().references(() => schools.id)
```

**Resolução do schoolId por role:**
- `admin` — Não requer schoolId (acesso a nível de plataforma)
- `secretaria` — schoolId do header `X-School-Id` (pode acessar múltiplas escolas)
- `gestor` / `professor` — schoolId do payload JWT (escola única)

**Padrão repository:** Todas as queries devem filtrar por schoolId. Nunca consultar sem ele.

---

## Sistema de Roles

| Role | Nível de Acesso | Origem do schoolId |
|------|----------------|-------------------|
| `admin` | Plataforma inteira, sem restrições de escola | Nenhum |
| `secretaria` | Uma ou mais escolas | Header `X-School-Id` |
| `gestor` | Escola única (gestão completa) | Payload JWT |
| `professor` | Escola única (apenas acadêmico) | Payload JWT |

**Formatos do payload JWT:**
```typescript
// admin
{ userId: string, role: 'admin' }

// secretaria
{ userId: string, secretariaId: string, role: 'secretaria' }

// gestor/professor
{ userId: string, schoolId: string, role: 'gestor' | 'professor' }
```

---

## Convenções de Código

### TypeScript
- `strict: true` em todos os projetos
- Sem `any` — usar `unknown` ou tipos adequados
- Apenas exports nomeados (evitar `export default`)

### Nomenclatura
- Arquivos: `kebab-case` (ex: `student.service.ts`)
- Funções/variáveis: `camelCase`
- Tipos/interfaces: `PascalCase`

### Validação
- Zod para toda entrada externa (rotas, variáveis de ambiente)
- Validação no nível da rota, não nos services

### Comentários
- Sem comentários óbvios
- Comentar apenas lógica não evidente

---

## Comandos Importantes

```bash
# Desenvolvimento
pnpm dev                    # Executa API + Web em paralelo

# Banco de dados
pnpm db:generate            # Gera migrations a partir do schema
pnpm db:migrate             # Aplica migrations
pnpm db:studio              # Interface gráfica Drizzle Studio
pnpm admin:provision        # Cria primeiro usuário admin

# Testes
pnpm test                   # Executa todos os testes
pnpm --filter api test      # Apenas testes da API
pnpm --filter web test      # Apenas testes do Web
```

---

## Variáveis de Ambiente

```env
# Obrigatórias
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/education_gestor
JWT_SECRET=min-32-caracteres-no-secret

# Opcionais
PORT=3333
NODE_ENV=development

# DigitalOcean Spaces (para armazenamento de arquivos)
DO_SPACES_ENDPOINT=
DO_SPACES_BUCKET=
DO_SPACES_REGION=nyc3
DO_SPACES_KEY=
DO_SPACES_SECRET=
DO_SPACES_CDN_URL=
```

---

## Padrões do Frontend

### Rotas (React Router v7)
- Rotas públicas: `/login`
- Rotas protegidas por role via `<PrivateRoute allowedRoles={[...]} />`
- Páginas hub para navegação: `/pessoas`, `/academico`, `/estrutura`, `/configuracoes`

### Gerenciamento de Estado
- Estado do servidor: TanStack Query
- Estado de auth: AuthContext (JWT no localStorage)
- Seleção de escola: SchoolContext + sessionStorage (`activeSchoolId`)

### Cliente API
- Axios com baseURL `/api`
- Interceptores: adiciona Bearer token + header X-School-Id
- Resposta 401 → redireciona para `/login`

---

## Padrões Comuns

### Criar um Novo Módulo

**Backend:**
1. Criar schema em `apps/api/src/db/schema/[nome].ts`
2. Criar módulo em `apps/api/src/modules/[nome]/`:
   - `[nome].schema.ts` — Schemas Zod de entrada/saída
   - `[nome].repository.ts` — Queries Drizzle (sempre filtra schoolId)
   - `[nome].service.ts` — Lógica de negócio
   - `[nome].routes.ts` — Rotas Fastify com validação
3. Registrar rotas em `apps/api/src/app.ts`

**Frontend:**
1. Criar feature em `apps/web/src/features/[nome]/`
2. Adicionar hooks para chamadas API (TanStack Query)
3. Adicionar páginas e componentes
4. Registrar rotas em `apps/web/src/App.tsx`

### Padrão Soft Delete
```typescript
// Schema
deletedAt: timestamp('deleted_at')

// Repository - filtra deletados
.where(and(eq(table.schoolId, schoolId), isNull(table.deletedAt)))

// Delete - define timestamp
await db.update(table).set({ deletedAt: new Date() }).where(...)
```

### Padrão de Paginação
```typescript
// Repository
async function findAllRepository(
  schoolId: string,
  { limit = 50, offset = 0 }: { limit?: number; offset?: number } = {},
) {
  const [data, [countResult]] = await Promise.all([
    db.select(...).where(...).limit(limit).offset(offset),
    db.select({ total: count() }).from(table).where(...),
  ])
  return { data, total: countResult.total }
}
```

---

## Testes

- Framework: Vitest
- Testes da API: `apps/api/src/test/`
- Testes do Web: `apps/web/src/test/`
- Executar: `pnpm test` ou `pnpm test:watch`

---

## Deploy

- **Infraestrutura**: VPS Hetzner CX22
- **Proxy reverso**: Caddy (HTTPS automático)
- **Processo**: PM2
- **Banco de dados**: PostgreSQL na VPS
- **CI/CD**: GitHub Actions → deploy via SSH ao push no `main`

---

## Dívida Técnica

Consulte `ROADMAP.md` para dívida técnica priorizada:
- **Fase 1 (Crítica)**: Inserções em lote, transações, paginação, coerção de tipos
- **Fase 2 (Performance)**: Índices, soft delete, otimização de queries
- **Fase 3 (Manutenção)**: Imports entre módulos, queries unificadas, validações, auditoria
