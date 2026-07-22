# Education Gestor — CLAUDE.md

Gerenciador escolar completo focado em colégios de pequeno e médio porte. Multi-tenant (várias escolas na mesma instância). Sistema web com API REST + SPA.

---

## Stack

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Fastify
- **Banco de dados**: PostgreSQL
- **ORM**: Drizzle ORM + drizzle-kit (migrations)
- **Driver**: postgres.js
- **Validação**: Zod
- **Auth**: JWT

### Frontend
- **Framework**: React + TypeScript
- **Bundler**: Vite
- **Roteamento**: React Router v7
- **Server state**: TanStack Query
- **UI**: shadcn/ui

### Compartilhado
- **packages/types**: tipos e DTOs compartilhados entre api e web

### Infraestrutura
- **Containerização**: Docker + Docker Compose
- **Variables de ambiente**: `.env` centralizado na raiz do monorepo

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
├── Dockerfile        # Multi-stage build
└── docker-compose.yml
```

### Backend — apps/api/src/

```
src/
├── db/
│   ├── schema/          # Tabelas definidas em TypeScript (Drizzle)
│   │   ├── schools.ts
│   │   ├── students.ts
│   │   ├── teachers.ts
│   │   └── ... (22 arquivos de schema)
│   ├── migrations/      # Geradas pelo drizzle-kit
│   └── index.ts         # Conexão com o banco
│
├── modules/             # 19 módulos, dividido por domínio
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
│   ├── storage.ts       # Upload para S3/DigitalOcean Spaces
│   ├── routeHelpers.ts  # Helpers de rota
│   └── validators.ts    # Validadores de domínio
│
├── scripts/             # admin:provision, seed, clear
├── env.ts               # Variáveis de ambiente validadas (Zod)
├── app.ts               # Configura o Fastify
└── server.ts            # Entry point
```

### Frontend — apps/web/src/

```
src/
├── features/            # 16 features, dividido por domínio
│   └── [feature]/
│       ├── components/
│       ├── hooks/       # useFeature, useCreateFeature (TanStack Query)
│       └── pages/
│
├── pages/               # Páginas hub (Dashboard, Pessoas, Acadêmico, etc.)
├── components/          # Componentes globais reutilizáveis (shadcn + customizados)
├── contexts/            # AuthContext, SchoolContext
├── lib/                 # api client, utils, helpers
└── App.tsx              # Definição de rotas React Router
```

---

## Arquitetura de Código

**Padrão**: Layered Architecture por domínio.

**Fluxo de um request:**
```
Route → Middleware (auth + tenant) → Service → Repository → DB
```

- **Route**: valida input com Zod, chama service, retorna resposta
- **Service**: contém regras de negócio, orquestra repositories
- **Repository**: queries Drizzle, **sempre filtra por `schoolId`**

Não usar Clean Architecture / Hexagonal — abstrações desnecessárias para o perfil do projeto.

---

## Multi-Tenant

Estratégia: **shared schema com `schoolId`** em todas as tabelas.

Toda tabela de domínio deve ter:
```ts
schoolId: uuid('school_id').notNull().references(() => schools.id)
```

O `schoolId` é extraído do JWT e injetado via middleware em todo request. O repository nunca deve fazer queries sem filtrar por `schoolId`.

**JWT payload por role:**
```ts
// admin
{ userId: string, role: 'admin' }

// secretaria
{ userId: string, secretariaId: string, role: 'secretaria' }

// gestor/professor
{ userId: string, schoolId: string, role: 'gestor' | 'professor' }
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

---

## Docker

### Serviços

| Serviço | Porta | Descrição |
|---|---|---|
| `db` | 5432 | PostgreSQL (produção) |
| `db-test` | 5433 | PostgreSQL (testes) |
| `api` | 3333 | Fastify backend |
| `web` | 5173 | Vite dev server |

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

## Módulos do Sistema

| Módulo | Responsabilidade |
|---|---|
| Auth | Login, JWT, perfis (admin, professor, secretaria) |
| Schools | Cadastro e configuração da escola (onboarding) |
| Students | Cadastro, matrícula, responsáveis, ficha médica, documentos |
| Teachers | Cadastro, disciplinas vinculadas |
| Classes | Turmas, séries, períodos letivos |
| Academic | Notas, frequência, boletim |
| Financial | Mensalidades, pagamentos |
| Dashboard | Métricas agregadas (alunos, professores, financeiro) |
| Education Levels | Níveis de ensino (infantil, fundamental, médio) |
| Series | Séries por nível de ensino |
| Class Periods | Períodos de aula (horários) |
| Timetable | Grade horária por turma |
| Calendar Events | Eventos do calendário escolar |
| Audit | Logs de auditoria |

A entidade `school` deve ser criada antes de qualquer outra — é o ponto de entrada do onboarding.

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
- Nomear arquivos em kebab-case: `student.service.ts`
- Nomear funções e variáveis em camelCase
- Nomear tipos e interfaces em PascalCase
- Exports nomeados — evitar `export default`
- Zod para toda validação de input externo (routes, env vars)
- Sem comentários óbvios — comentar apenas lógica não evidente

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
