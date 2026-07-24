# AGENTS.md

Guia para agentes de IA trabalhando neste codebase. Monorepo de gerenciamento escolar multi-tenant para colégios de pequeno/médio porte.

---

## Visão Geral do Projeto

Sistema web completo para gestão escolar com:
- **API REST** (Fastify v5 + Drizzle ORM + PostgreSQL 16)
- **SPA frontend** (React 19 + Vite 6 + shadcn/ui + Tailwind v4)
- **Multi-tenant**: várias escolas na mesma instância via `schoolId` em todas as tabelas
- **Docker**: containerização completa com docker-compose (serviços `db`, `db-test`, `api`, `web`)

---

## Stack

| Camada | Tecnologias |
|---|---|
| Runtime | Node.js 20+ + TypeScript (strict) |
| API | Fastify v5, Zod (validação), JWT (`@fastify/jwt` v9) |
| DB | PostgreSQL 16, Drizzle ORM, postgres.js |
| Frontend | React 19, Vite 6, React Router v7, TanStack Query v5 |
| UI | shadcn/ui (Radix + Tailwind v4), lucide-react, sonner (toasts) |
| Forms | react-hook-form + Zod (`@hookform/resolvers`) |
| HTTP | axios + interceptors (injeta JWT e `X-School-Id`) |
| Monorepo | pnpm workspaces |
| Docker | Docker + Docker Compose (Dockerfile multi-stage: `dev`, `prod`) |
| Deploy | PM2 + Caddy (VPS Hetzner) |
| Testes | Vitest 4 (API: 29 arquivos; Web: 1 arquivo) |

---

## Estrutura do Repositório

```
education-gestor/
├── apps/
│   ├── api/                    # Fastify backend (porta 3333)
│   │   └── src/
│   │       ├── db/
│   │       │   ├── schema/     # 22 arquivos Drizzle
│   │       │   ├── migrations/ # 23 migrations
│   │       │   └── index.ts    # Conexão DB
│   │       ├── modules/        # 22 módulos de domínio
│   │       │   └── [modulo]/
│   │       │       ├── [modulo].routes.ts
│   │       │       ├── [modulo].service.ts
│   │       │       ├── [modulo].repository.ts
│   │       │       └── [modulo].schema.ts
│   │       ├── middlewares/    # auth.ts, tenant.ts, authorize.ts
│   │       ├── lib/            # audit.ts, crypto.ts, storage.ts, routeHelpers.ts, validators.ts
│   │       ├── test/           # Vitest: unit/ e e2e/
│   │       ├── scripts/        # provision-admin.ts, seed.ts, clear.ts
│   │       ├── env.ts          # Variáveis validadas (Zod)
│   │       ├── app.ts          # Configuração do Fastify
│   │       └── server.ts       # Entry point
│   │
│   └── web/                    # React SPA (porta 5173)
│       └── src/
│           ├── features/       # 18 features (espelha módulos da API)
│           │   └── [feature]/
│           │       ├── components/
│           │       ├── hooks/  # useFeature.ts (TanStack Query)
│           │       └── pages/
│           ├── components/     # Globais: ui/ (shadcn), layout/, PrivateRoute
│           ├── contexts/       # AuthContext.tsx, SchoolContext.tsx, ThemeContext.tsx
│           ├── lib/            # api.ts, queryClient.ts, format.ts, toast.ts, useSchoolKey.ts
│           ├── pages/          # Hubs (Dashboard, People, Academic, etc.)
│           ├── test/           # Vitest unit
│           └── App.tsx         # Definição de rotas
│
├── packages/
│   └── types/                  # Tipos compartilhados (Student, Teacher, etc.)
│
├── .env                        # Variáveis de ambiente (compartilhadas)
├── Dockerfile                  # Multi-stage build (dev, prod)
├── docker-compose.yml          # 4 serviços: db, db-test, api, web
├── pnpm-workspace.yaml
└── AGENTS.md                   # Este arquivo
```

---

## Arquitetura API

**Padrão**: Layered Architecture por domínio.

```
Route → Middlewares (auth + tenant + authorize) → Service → Repository → DB
```

### Route (`*.routes.ts`)
- Registra endpoints no Fastify
- Valida input com Zod (schemas locais)
- Chama service, retorna resposta HTTP
- Usa `preHandler: [authenticate, injectTenant, authorizeRoles([...])]`

### Service (`*.service.ts`)
- Funções puras exportadas (não usa classes)
- Contém regras de negócio
- Orquestra repositories
- Lança `Error` com mensagem descritiva para erros de negócio

### Repository (`*.repository.ts`)
- Queries Drizzle
- **SEMPRE filtra por `schoolId`** (exceto operações cross-tenant)
- Retorna tipos tipados
- Soft delete via `deletedAt` (hard delete apenas para entidades child)
- Operações de upsert usam `onConflictDoUpdate` quando há unique constraint

### Schema (`*.schema.ts`)
- Zod schemas para validação de input
- Exporta tipos TypeScript derivados (`z.infer<typeof schema>`)

---

## Multi-Tenancy

**Estratégia**: Shared schema com `schoolId` em todas as tabelas de domínio.

```ts
schoolId: uuid('school_id').notNull().references(() => schools.id)
```

### JWT Payload por role:
```ts
// admin:      { userId, role: 'admin' }
// secretaria: { userId, secretariaId, role: 'secretaria' }
// gestor:     { userId, schoolId, role: 'gestor' }
// professor:  { userId, schoolId, role: 'professor' }
```

### Headers:
- `Authorization: Bearer <jwt>` — autenticação
- `X-School-Id: <uuid>` — escola ativa (usado por `secretaria` para escolher qual escola da rede acessar)

### Middlewares:
1. `authenticate` — verifica JWT
2. `injectTenant` — extrai `schoolId` do payload (gestor/professor) ou do header `X-School-Id` (secretaria)
3. `authorizeRoles(['admin', 'gestor', ...])` — controle de acesso

---

## Variáveis de Ambiente

O arquivo `.env` na raiz do monorepo é compartilhado entre API e Frontend. O Vite lê via `envDir: '../../'`.

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

# Ver logs
docker compose logs -f api
docker compose logs -f web
```

---

## Módulos do Sistema (22)

| Módulo | Entidades | Observações |
|---|---|---|
| `auth` | sessions | Login, JWT |
| `admins` | admins | Usuários da plataforma (cross-tenant) |
| `secretarias` | secretarias, secretariaSchools | Secretarias regionais + vínculo com escolas |
| `schools` | schools | Cadastro da escola (soft delete via `deletedAt`) |
| `teachers` | teachers, teacherSubjects | Professores + disciplinas (soft delete) |
| `students` | students, guardians, studentMedical, studentDocuments | Cadastro completo (soft delete) |
| `subjects` | subjects | Disciplinas |
| `classes` | schoolClasses, classRelations, classStudents | Turmas com relações professor-aluno |
| `academicYears` | academicYears | Anos letivos |
| `academicPeriods` | academicPeriods | Bimestres/trimestres/semestres |
| `academic` | grades, attendances | Notas e frequência (com índices de performance) |
| `financial` | tuitions | Mensalidades (com índices por schoolId+status e dueDate) |
| `dashboard` | — | Métricas agregadas por role |
| `educationLevels` | educationLevels | Níveis (educação infantil, fundamental, etc.) |
| `series` | series | Séries dentro dos níveis |
| `classPeriods` | classPeriods | Períodos das turmas (horários) |
| `timetable` | timetableSlots | Grade horária |
| `calendarEvents` | calendarEvents | Eventos do calendário |
| `teacherDashboard` | — | Painel e dados agregados do professor |
| `audit` | auditLogs | `GET /audit-logs` (gestor/admin) |

---

## Frontend

### Padrões

**Features**: organização por domínio, espelhando módulos da API. Atualmente 18 features (algumas agrupam mais de um módulo de domínio, ex: `academic-hub`, `teacher-dashboard`, `scheduling`).

**Hooks** (`useFeature.ts`):
```ts
// Queries
export function useStudents() {
  const { schoolKey, enabled } = useSchoolKey()
  return useQuery({
    queryKey: ['students', schoolKey],
    queryFn: async () => { ... },
    enabled,
  })
}

// Mutations
export function useCreateStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data) => { ... },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  })
}
```

**Pages**: componentes React que usam hooks e renderizam componentes.

**API Client** (`lib/api.ts`):
- Axios com baseURL `/api` (proxy do Vite em dev → `http://api:3333`)
- Interceptores: injeta token JWT e `X-School-Id` (lido de `SchoolContext`/`sessionStorage`)
- Redireciona para `/login` em 401

**Toast** (`lib/toast.ts` + `sonner`): feedback padronizado para sucesso/erro de mutations.

### Rotas principais (React Router v7)

| Rota | Roles | Descrição |
|---|---|---|
| `/login` | público | Login |
| `/` | qualquer | Dashboard |
| `/students`, `/students/:id`, `/students/:id/report` | gestor, secretaria | Alunos |
| `/teachers`, `/teachers/new`, `/teachers/:id/edit` | gestor, secretaria | Professores |
| `/classes/:id`, `/classes/:id/timetable` | gestor, professor, secretaria | Turma |
| `/financial` | gestor, secretaria | Mensalidades |
| `/subjects`, `/education-levels`, `/series` | gestor | Cadastros auxiliares |
| `/academic-years` | gestor, secretaria | Anos letivos |
| `/scheduling`, `/scheduling/students` | gestor, secretaria | Horários |
| `/structure`, `/structure/classes` | gestor | Configuração estrutural |
| `/settings` | gestor | Configurações da escola |
| `/professor`, `/professor/classes`, `/professor/performance`, `/professor/attendance` | professor | Painel do professor |
| `/admin`, `/admin/activity`, `/secretarias` | admin | Painel administrativo |
| `/schools-hub`, `/my-schools` | secretaria | Escolas vinculadas |
| `/schools` | admin, secretaria | CRUD de escolas |
| `/academic` | gestor, professor, secretaria | Hub acadêmico |

### Contexts
- `AuthContext` — token, payload (decoded JWT), login/logout
- `SchoolContext` — escola ativa (`activeSchoolId`) para role `secretaria`
- `ThemeContext` — dark mode / light mode

---

## Convenções de Código

### Arquivos
- kebab-case: `students.service.ts`, `use-students.ts`
- Exports nomeados (evitar `export default`)

### Nomes
- Variáveis/funções: camelCase
- Tipos/interfaces: PascalCase
- Enums/constantes: UPPER_SNAKE_CASE

### TypeScript
- `strict: true` em todos os projetos
- Sem `any` — usar `unknown` quando necessário
- Zod para toda validação de input externo

### Estilo
- Sem comentários óbvios
- Funções puras para utils, transformações e validações
- Imutabilidade como hábito
- Tratamento de erros com `Error` messages descritivas
- Mensagens em inglês para entidades (`Student not found`)
- Mensagens em português para validação de input (campos de formulário)

---

## Comandos Úteis

```bash
# Desenvolvimento
pnpm dev                    # Executa API + Web em paralelo (concurrently)

# Banco de dados
pnpm db:generate            # Gera migrations a partir do schema
pnpm db:migrate             # Aplica migrations
pnpm db:studio              # Interface gráfica Drizzle Studio
pnpm db:seed                # Popular dados de teste (idempotente)
pnpm db:clear               # Limpar dados (pede confirmação)

# Build
pnpm build                  # Build todos os packages

# Admin
pnpm admin:provision        # Criar admin inicial (sem endpoint público)

# Testes
pnpm test                   # Executa todos os testes (raiz)
pnpm --filter api test      # Apenas testes da API
pnpm --filter web test      # Apenas testes do Web
pnpm test:coverage          # Relatório de cobertura (api e web)
```

---

## Padrões de Erro

### API
- **400**: Validação Zod ou `MissingTenantError`
- **401**: JWT inválido ou ausente
- **403**: Role não autorizada
- **404**: Entidade não encontrada
- **409**: Conflito (ex: enrollment code duplicado)

### Service Layer
- Erros de negócio são `throw new Error('mensagem')`
- Mensagens em inglês para entidades
- Mensagens em português para validação de input

### Frontend
- Toast via `sonner` para feedback
- Redirect para `/login` em 401

---

## Storage (S3)

Upload de fotos e documentos usa S3 compatível (`@aws-sdk/client-s3`):
- Fotos: `schools/{schoolId}/students/{studentId}/photo.{ext}`
- Documentos: `schools/{schoolId}/students/{studentId}/documents/{docId}.{ext}`
- Limite: 10MB por arquivo
- Tipos aceitos: JPEG, PNG, WebP (fotos); PDF, JPEG, PNG (docs)
- Configuração via `lib/storage.ts`

---

## Audit Log

Todas as operações de CREATE, UPDATE, DELETE, PAY são logadas:
```ts
await logAudit(
  { userId, userRole, schoolId },
  'DELETE',
  'student',
  studentId
)
```
- Endpoint de leitura: `GET /audit-logs?entity=&page=&limit=` (gestor/admin)
- O audit nunca deve interromper o fluxo principal (catch silencioso)
- Schema: `db/schema/auditLog.ts`

---

## Dicas para Agentes

1. **Sempre verificar `schoolId`**: toda query no repository deve filtrar por `schoolId`
2. **Seguir o padrão Route→Service→Repository**: não colocar lógica de negócio nas routes
3. **Usar `getSchoolId(request)`**: helper que valida e extrai o schoolId do request
4. **Invalidar queries no frontend**: toda mutation deve chamar `qc.invalidateQueries`
5. **Tipar o compartilhado**: usar `@education-gestor/types` para tipos entre API e Web
6. **Soft delete**: usar `deletedAt` em vez de DELETE para entidades principais (students, teachers, schools, guardians)
7. **Testes**: usar Vitest, testes em `apps/api/src/test/{unit,e2e}/` e `apps/web/src/test/`
8. **Não usar `any`**: preferir `unknown` e narrowing quando o tipo for incerto
9. **Props de UI**: usar componentes do `components/ui/` (shadcn) em vez de elementos HTML nativos estilizados
10. **Não criar `export default`**: preferir named exports
11. **Índices de performance**: tabelas de volume (`grades`, `attendances`, `tuitions`) já têm índices declarados no schema; não duplicar
12. **Tailwind v4**: tokens via CSS variables em `src/index.css`; evitar criar `tailwind.config.js` (v4 usa `@theme` no CSS)
