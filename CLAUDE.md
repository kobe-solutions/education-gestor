# Education Gestor — CLAUDE.md

Gerenciador escolar completo focado em colégios de pequeno e médio porte. Multi-tenant (várias escolas na mesma instância). Sistema web com API REST + SPA.

---

## Stack

### Backend
- **Runtime**: Node.js 20+ + TypeScript (strict)
- **Framework**: Fastify v5
- **Banco de dados**: PostgreSQL 16
- **ORM**: Drizzle ORM + drizzle-kit (migrations)
- **Driver**: postgres.js
- **Validação**: Zod
- **Auth**: JWT (`@fastify/jwt` v9)
- **Storage**: S3 compatível (`@aws-sdk/client-s3`)
- **Testes**: Vitest 4

### Frontend
- **Framework**: React 19 + TypeScript
- **Bundler**: Vite 6
- **Estilização**: Tailwind CSS v4 (via `@tailwindcss/vite`) + `tw-animate-css`
- **Roteamento**: React Router v7
- **Server state**: TanStack Query v5
- **Forms**: react-hook-form + zod (`@hookform/resolvers`)
- **UI**: shadcn/ui (Radix UI primitives)
- **Ícones**: lucide-react
- **Toasts**: sonner
- **HTTP**: axios
- **JWT decode**: jwt-decode
- **Testes**: Vitest 4 + Testing Library + jsdom

### Compartilhado
- **packages/types**: tipos e DTOs compartilhados entre api e web

### Infraestrutura
- **Containerização**: Docker + Docker Compose
- **Variáveis de ambiente**: `.env` centralizado na raiz do monorepo (compartilhado entre API e Web)

---

## Estrutura do Monorepo

```
education-gestor/
├── apps/
│   ├── api/          # Fastify + Drizzle
│   └── web/          # React + Vite
├── packages/
│   └── types/        # Tipos compartilhados (DTOs, enums)
├── .env              # Variáveis de ambiente (compartilhadas)
├── Dockerfile        # Multi-stage build (targets: dev, prod)
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json      # Scripts de orquestração (concurrently)
```

### Backend — apps/api/src/

```
src/
├── db/
│   ├── schema/          # 22 tabelas definidas em TypeScript (Drizzle)
│   │   ├── schools.ts
│   │   ├── students.ts
│   │   ├── teachers.ts
│   │   └── ... (22 arquivos de schema)
│   ├── migrations/      # 23 migrations geradas pelo drizzle-kit
│   └── index.ts         # Conexão com o banco
│
├── modules/             # 22 módulos, dividido por domínio
│   └── [modulo]/
│       ├── [modulo].routes.ts      # Endpoints, validação Zod
│       ├── [modulo].service.ts     # Regras de negócio
│       ├── [modulo].repository.ts  # Queries Drizzle
│       └── [modulo].schema.ts      # Schemas Zod de input/output
│
├── middlewares/
│   ├── auth.ts          # Valida JWT, injeta user no request
│   ├── tenant.ts        # Injeta schoolId no request
│   └── authorize.ts     # Valida roles permitidas
│
├── lib/
│   ├── audit.ts         # Log de auditoria
│   ├── crypto.ts        # Hash/verificação de senha
│   ├── storage.ts       # Upload para S3/DigitalOcean Spaces
│   ├── routeHelpers.ts  # Helpers de rota (getSchoolId, etc.)
│   └── validators.ts    # Validadores de domínio
│
├── test/                # Vitest — testes unit e e2e
│   ├── unit/            # Testes do service layer
│   └── e2e/             # Testes de integração (rotas)
│
├── scripts/             # provision-admin, seed, clear
├── env.ts               # Variáveis de ambiente validadas (Zod)
├── app.ts               # Configura o Fastify (registra middlewares + rotas)
└── server.ts            # Entry point (listen)
```

### Frontend — apps/web/src/

```
src/
├── features/            # 18 features, dividido por domínio
│   └── [feature]/
│       ├── components/
│       ├── hooks/       # useFeature, useCreateFeature (TanStack Query)
│       └── pages/
│
├── pages/               # Páginas hub (Dashboard, Pessoas, Acadêmico, etc.)
├── components/          # Componentes globais reutilizáveis
│   ├── ui/              # shadcn/ui primitives (button, dialog, table, etc.)
│   └── layout/          # AppLayout, PublicLayout
├── contexts/            # AuthContext, SchoolContext, ThemeContext
├── lib/                 # api client, utils, helpers, queryClient
├── test/                # Vitest — testes unit de componentes
└── App.tsx              # Definição de rotas React Router
```

---

## Módulos do Sistema

| Módulo | Responsabilidade |
|---|---|
| `auth` | Login, JWT (admin, secretaria, gestor, professor) |
| `admins` | Usuários administrativos da plataforma |
| `secretarias` | Secretarias regionais (cross-tenant) |
| `schools` | Cadastro e configuração da escola (onboarding) |
| `students` | Cadastro, matrícula, responsáveis, ficha médica, documentos |
| `teachers` | Cadastro, disciplinas vinculadas |
| `subjects` | Disciplinas |
| `classes` | Turmas (schoolClasses) com relações professor-aluno |
| `academicYears` | Anos letivos |
| `academicPeriods` | Bimestres/trimestres/semestres |
| `academic` | Notas (grades) e frequência (attendances) |
| `financial` | Mensalidades (tuitions) e pagamentos |
| `dashboard` | Métricas agregadas por role |
| `educationLevels` | Níveis de ensino (infantil, fundamental, médio) |
| `series` | Séries por nível de ensino |
| `classPeriods` | Períodos de aula (horários) |
| `timetable` | Grade horária por turma |
| `calendarEvents` | Eventos do calendário escolar |
| `teacherDashboard` | Painel e dados agregados do professor |
| `audit` | Logs de auditoria (GET /audit-logs) |

---

## Arquitetura de Código

**Padrão**: Layered Architecture por domínio.

**Fluxo de um request:**
```
Route → Middleware (auth + tenant + authorize) → Service → Repository → DB
```

- **Route** (`*.routes.ts`): valida input com Zod, registra endpoints, chama service, retorna resposta
- **Service** (`*.service.ts`): contém regras de negócio, orquestra repositories, lança `Error` com mensagem descritiva
- **Repository** (`*.repository.ts`): queries Drizzle, **sempre filtra por `schoolId`**, soft delete via `deletedAt`
- **Schema** (`*.schema.ts`): Zod schemas de input/output, exporta tipos via `z.infer<typeof schema>`

Não usar Clean Architecture / Hexagonal — abstrações desnecessárias para o perfil do projeto.

---

## Multi-Tenant

Estratégia: **shared schema com `schoolId`** em todas as tabelas de domínio.

Toda tabela de domínio tem:
```ts
schoolId: uuid('school_id').notNull().references(() => schools.id)
```

O `schoolId` é extraído do JWT (ou do header `X-School-Id` para o role `secretaria`) e injetado via middleware em todo request. O repository nunca deve fazer queries sem filtrar por `schoolId`.

**JWT payload por role:**
```ts
// admin
{ userId: string, role: 'admin' }

// secretaria
{ userId: string, secretariaId: string, role: 'secretaria' }

// gestor/professor
{ userId: string, schoolId: string, role: 'gestor' | 'professor' }
```

**Hierarquia de usuários:**
```
Admin (plataforma)
└── Secretaria (regional / rede de escolas)
    └── Gestor (diretor da escola)
        └── Professor (docente)
```

---

## Variáveis de Ambiente

O arquivo `.env` na raiz do monorepo é compartilhado entre API e Frontend.

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/education_gestor
DATABASE_URL_TEST=postgresql://postgres:postgres@localhost:5433/education_gestor_test

# Auth
JWT_SECRET=supersecretkey_change_in_production_minimum_32_chars

# Server
PORT=3333
NODE_ENV=development
```

O Frontend lê o `.env` raiz via `envDir: '../../'` no `vite.config.ts`. O proxy do dev server (`/api → http://api:3333`) está configurado para o Docker Compose.

---

## Docker

### Serviços

| Serviço | Porta | Descrição |
|---|---|---|
| `db` | 5432 | PostgreSQL 16 (produção) |
| `db-test` | 5433 | PostgreSQL 16 (testes) |
| `api` | 3333 | Fastify backend (target `dev` do Dockerfile) |
| `web` | 5173 | Vite dev server (target `dev` do Dockerfile) |

### Comandos

```bash
# Subir todos os serviços
docker compose up --build

# Subir em background
docker compose up --build -d

# Parar serviços
docker compose down

# Parar e limpar dados
docker compose down -v
```

---

## Scripts do Monorepo (raiz)

```bash
pnpm dev              # Sobe API + Web em paralelo (concurrently)
pnpm build            # Build de todos os packages
pnpm db:generate      # Gera migrations a partir do schema Drizzle
pnpm db:migrate       # Aplica as migrations no banco
pnpm db:studio        # Abre o Drizzle Studio
pnpm db:seed          # Popula dados de teste (admin + 2 secretarias + 3 escolas + ...)
pnpm db:clear         # Limpa dados (após confirmar)
pnpm admin:provision  # Cria o primeiro admin (sem endpoint público)
```

### API (`apps/api`)

```bash
pnpm dev              # Modo watch com tsx
pnpm build            # Compila TypeScript
pnpm start            # Executa dist/server.js
pnpm test             # Vitest run (unit + e2e)
pnpm test:watch       # Vitest em modo watch
pnpm test:coverage    # Relatório de cobertura
```

### Web (`apps/web`)

```bash
pnpm dev              # Vite dev server (porta 5173)
pnpm build            # tsc + vite build
pnpm preview          # Vite preview
pnpm test             # Vitest run
pnpm test:watch       # Vitest em modo watch
pnpm test:coverage    # Relatório de cobertura
```

---

## Paradigma de Programação

**Híbrido e pragmático** — não 100% funcional.

- Funções puras para utilitários, transformações de dados e validações
- Exports nomeados em vez de classes — funções exportadas direto do módulo
- Imutabilidade como hábito, sem forçar abstrações de FP (pipes, monads, functors)

---

## Padrões de Escrita

- TypeScript estrito em todo o projeto (`strict: true`)
- Sem `any` — tipar corretamente ou usar `unknown`
- Nomear arquivos em kebab-case: `student.service.ts`, `use-students.ts`
- Nomear funções e variáveis em camelCase
- Nomear tipos e interfaces em PascalCase
- Enums e constantes em UPPER_SNAKE_CASE
- Exports nomeados — evitar `export default`
- Zod para toda validação de input externo (routes, env vars)
- Sem comentários óbvios — comentar apenas lógica não evidente
- Mensagens em inglês para entidades (`Student not found`)
- Mensagens em português para validação de input (campos de formulário)

---

## Onboarding — Ordem de Criação

A ordem de criação importa pelo modelo multi-tenant:

```
1. School       → cria a escola (schoolId base de tudo)
2. Admin        → pnpm admin:provision (vinculado à escola)
3. Teachers     → via painel admin
4. Subjects     → via painel admin
5. Classes      → via painel admin (turmas com professor + disciplina)
6. Students     → via painel admin ou secretaria
```

Para popular dados de teste completos, use `pnpm db:seed` — gera 2 secretarias, 3 escolas, 12 turmas/escola, 30-35 alunos/turma, professores, disciplinas, notas, frequência e mensalidades.

---

## Documentação Auxiliar

| Arquivo | Conteúdo |
|---|---|
| `README.md` | Setup local, scripts, fluxo de produção |
| `AGENTS.md` | Guia rápido para agentes de IA (stack, módulos, padrões) |
| `ROADMAP.md` | Débitos técnicos (Fase 1, 2 e 3) |
| `LOGINS.md` | Credenciais geradas pelo seed |
| `docs/ARCHITECTURE.md` | Hierarquia de usuários, mapa RBAC, multi-tenancy |
| `docs/ROADMAP.md` | Roadmap de produto (Fases 1–7) |
| `docs/DEV.md` | Guia de desenvolvimento detalhado |
| `docs/TASKS_API.md` / `docs/TASKS_WEB.md` | Tasks por camada |
| `docs/TECH_DEBT_API.md` | Débitos técnicos priorizados |
| `docs/TESTING_AUTOMATED.md` / `docs/TESTING_ROADMAP.md` | Estratégia de testes |
| `apps/api/docs/openapi.yaml` | Especificação OpenAPI (fonte de verdade) |
| `apps/api/docs/endpoints.md` | Guia rápido de endpoints |

---

## Deploy (Produção)

- **Infraestrutura**: VPS Hetzner CX22 (~€4/mês)
- **Reverse proxy + HTTPS**: Caddy (HTTPS automático)
- **Processo Node**: PM2 (restart automático)
- **Banco**: PostgreSQL instalado na própria VPS
- **Frontend**: build estático servido pelo Caddy
- **CI/CD**: GitHub Actions com deploy via SSH

```
VPS
├── Caddy (porta 80/443)
│   ├── → api (Fastify, porta interna)
│   └── → web (arquivos estáticos)
├── API (PM2)
└── PostgreSQL (local)
```

Detalhes completos em `README.md` (seção "Subindo para produção").
