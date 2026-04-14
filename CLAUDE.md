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

---

## Estrutura do Monorepo

```
education-gestor/
├── apps/
│   ├── api/          # Fastify + Drizzle
│   └── web/          # React + Vite
└── packages/
    └── types/        # Tipos compartilhados (DTOs, enums)
```

### Backend — apps/api/src/

```
src/
├── db/
│   ├── schema/          # Tabelas definidas em TypeScript (Drizzle)
│   │   ├── schools.ts
│   │   ├── students.ts
│   │   ├── teachers.ts
│   │   └── ...
│   ├── migrations/      # Geradas pelo drizzle-kit
│   └── index.ts         # Conexão com o banco
│
├── modules/             # Dividido por domínio
│   └── [modulo]/
│       ├── [modulo].routes.ts      # Endpoints, validação Zod
│       ├── [modulo].service.ts     # Regras de negócio
│       ├── [modulo].repository.ts  # Queries Drizzle
│       └── [modulo].schema.ts      # Schemas Zod de input/output
│
├── middlewares/
│   ├── auth.ts          # Valida JWT, injeta user no request
│   └── tenant.ts        # Injeta schoolId no request
│
└── app.ts
```

### Frontend — apps/web/src/

```
src/
├── features/            # Dividido por domínio (espelha os módulos da api)
│   └── [feature]/
│       ├── components/
│       ├── hooks/       # useFeature, useCreateFeature (TanStack Query)
│       └── pages/
│
├── components/          # Componentes globais reutilizáveis (shadcn + customizados)
├── lib/                 # api client, utils, helpers
└── routes/              # Definição de rotas React Router
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

Considerar ativar **PostgreSQL Row Level Security (RLS)** como camada adicional de segurança.

**JWT payload:**
```ts
{ userId, schoolId, role }
```

---

## Módulos do Sistema

| Módulo | Responsabilidade |
|---|---|
| Auth | Login, JWT, perfis (admin, professor, secretaria) |
| Schools | Cadastro e configuração da escola (onboarding) |
| Students | Cadastro, matrícula, responsáveis |
| Teachers | Cadastro, disciplinas |
| Classes | Turmas, séries, períodos letivos |
| Academic | Notas, frequência, boletim |
| Financial | Mensalidades, pagamentos |

A entidade `school` deve ser criada antes de qualquer outra — é o ponto de entrada do onboarding.

---

## Paradigma de Programação

**Híbrido e pragmático** — não 100% funcional.

- Funções puras para utilitários, transformações de dados e validações
- Classes apenas onde há estado real (services, repositories)
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
