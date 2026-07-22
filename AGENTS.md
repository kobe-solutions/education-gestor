# AGENTS.md

Guia para agentes de IA trabalhando neste codebase. Monorepo de gerenciamento escolar multi-tenant para colégios de pequeno/médio porte.

---

## Visão Geral do Projeto

Sistema web completo para gestão escolar com:
- **API REST** (Fastify + Drizzle + PostgreSQL)
- **SPA frontend** (React + Vite + shadcn/ui)
- **Multi-tenant**: várias escolas na mesma instância via `schoolId` em todas as tabelas
- **Docker**: containerização completa com docker-compose

---

## Stack

| Camada | Tecnologias |
|---|---|
| Runtime | Node.js + TypeScript (strict) |
| API | Fastify v5, Zod (validação), JWT (@fastify/jwt) |
| DB | PostgreSQL 16, Drizzle ORM, postgres.js |
| Frontend | React 19, Vite 6, React Router v7, TanStack Query v5 |
| UI | shadcn/ui (Radix + Tailwind), lucide-react |
| Monorepo | pnpm workspaces |
| Docker | Docker + Docker Compose |
| Deploy | PM2 + Caddy (VPS Hetzner) |

---

## Estrutura do Repositório

```
education-gestor/
├── apps/
│   ├── api/                    # Fastify backend (porta 3333)
│   │   └── src/
│   │       ├── db/
│   │       │   ├── schema/     # Drizzle tables (22 arquivos)
│   │       │   ├── migrations/
│   │       │   └── index.ts    # Conexão DB
│   │       ├── modules/        # 19 módulos de domínio
│   │       │   └── [modulo]/
│   │       │       ├── [modulo].routes.ts
│   │       │       ├── [modulo].service.ts
│   │       │       ├── [modulo].repository.ts
│   │       │       └── [modulo].schema.ts
│   │       ├── middlewares/    # auth.ts, tenant.ts, authorize.ts
│   │       ├── lib/            # audit.ts, storage.ts, routeHelpers.ts
│   │       └── scripts/        # seed.ts, clear.ts, provision-admin.ts
│   │
│   └── web/                    # React SPA (porta 5173)
│       └── src/
│           ├── features/       # 16 features (espelha módulos da API)
│           │   └── [feature]/
│           │       ├── components/
│           │       ├── hooks/  # useFeature.ts (TanStack Query)
│           │       └── pages/
│           ├── components/     # Globais (layout, ui/, PrivateRoute)
│           ├── contexts/       # AuthContext.tsx, SchoolContext.tsx
│           ├── lib/            # api.ts (axios), utils.ts
│           └── pages/          # Pages de hub e dashboard
│
├── packages/
│   └── types/                  # Tipos compartilhados (Student, Teacher, etc.)
│
├── .env                        # Variáveis de ambiente (compartilhadas)
├── Dockerfile                  # Multi-stage build
├── docker-compose.yml          # Serviços: db, db-test, api, web
└── AGENTS.md                   # Este arquivo
```

---

## Arquitetura API

**Padrão**: Layered Architecture por domínio.

```
Route → Middlewares → Service → Repository → DB
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
// admin:     { userId, role: 'admin' }
// secretaria: { userId, secretariaId, role: 'secretaria' }
// gestor:    { userId, schoolId, role: 'gestor' }
// professor: { userId, schoolId, role: 'professor' }
```

### Headers:
- `Authorization: Bearer <jwt>` — autenticação
- `X-School-Id: <uuid>` — escola ativa (usado por secretaria)

### Middlewares:
1. `authenticate` — verifica JWT
2. `injectTenant` — extrai `schoolId` do payload ou header
3. `authorizeRoles(['admin', 'gestor', ...])` — controle de acesso

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

# Ver logs
docker compose logs -f api
docker compose logs -f web
```

---

## Módulos do Sistema

| Módulo | Entidades | Observações |
|---|---|---|
| auth | sessions | Login, JWT |
| schools | schools | Cadastro da escola |
| secretarias | secretarias | Secretarias (cross-tenant) |
| teachers | teachers, teacherSubjects | Professores + disciplinas |
| students | students, guardians, studentMedical, studentDocuments | Cadastro completo com ficha médica e documentos |
| classes | schoolClasses, classRelations | Turmas com relações professor-aluno |
| academicYears | academicYears | Anos letivos |
| academicPeriods | academicPeriods | Bimestres/trimestres/semestres |
| academic | grades, attendances | Notas e frequência |
| financial | tuitions | Mensalidades |
| subjects | subjects | Disciplinas |
| educationLevels | educationLevels | Níveis (educação infantil, fundamental, etc.) |
| series | series | Séries dentro dos níveis |
| classPeriods | classPeriods | Períodos das turmas |
| timetable | timetableSlots | Grade horária |
| calendarEvents | calendarEvents | Eventos do calendário |
| dashboard | — | Métricas agregadas |
| audit | auditLogs | Log de auditoria |

---

## Frontend

### Padrões

**Features**: organização por domínio, espelhando módulos da API.

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
- Axios com baseURL `/api`
- Interceptores: injeta token JWT e `X-School-Id`
- Redireciona para `/login` em 401

### Rotas (React Router v7)

| Rota | Roles | Descrição |
|---|---|---|
| `/login` | público | Login |
| `/` | qualquer | Dashboard |
| `/students` | gestor, secretaria | Lista de alunos |
| `/teachers` | gestor, secretaria | Lista de professores |
| `/classes/:id` | gestor, professor, secretaria | Detalhe da turma |
| `/estrutura` | gestor | Configuração estrutural |
| `/admin` | admin | Painel administrativo |

### Contexts
- `AuthContext` — token, payload, login/logout
- `SchoolContext` — escola ativa (`activeSchoolId`)

---

## Convencões de Código

### Arquivos
- kebab-case: `students.service.ts`, `useStudents.ts`
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

---

## Comandos Úteis

```bash
# Desenvolvimento
pnpm dev                    # Executa API + Web em paralelo

# Banco de dados
pnpm db:generate            # Gera migrations a partir do schema
pnpm db:migrate             # Aplica migrations
pnpm db:studio              # Interface gráfica Drizzle Studio
pnpm db:seed                # Popular dados de teste
pnpm db:clear               # Limpar dados

# Build
pnpm build                  # Build todos os packages

# Admin
pnpm admin:provision        # Criar admin inicial

# Testes
pnpm test                   # Executa todos os testes
pnpm --filter api test      # Apenas testes da API
pnpm --filter web test      # Apenas testes do Web
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
- Mensagens em inglês para entidades (`Student not found`)
- Mensagens em português para validação de input

### Frontend
- Toast via `sonner` para feedback
- Redirect para `/login` em 401

---

## Storage (S3)

Upload de fotos e documentos usa S3 compatível:
- Fotos: `schools/{schoolId}/students/{studentId}/photo.{ext}`
- Documentos: `schools/{schoolId}/students/{studentId}/documents/{docId}.{ext}`
- Limite: 10MB por arquivo
- Tipos aceitos: JPEG, PNG, WebP (fotos); PDF, JPEG, PNG (docs)

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
O audit nunca deve interromper o fluxo principal (catch silencioso).

---

## Dicas para Agentes

1. **Sempre verificar `schoolId`**: toute query no repository deve filtrar por `schoolId`
2. **Seguir o padrão Route→Service→Repository**: não colocar lógica de negócio nas routes
3. **Usar `getSchoolId(request)`**: helper que valida e extrai o schoolId do request
4. **Invalidar queries no frontend**: toda mutation deve chamar `qc.invalidateQueries`
5. **Tipar o compartilhado**: usar `@education-gestor/types` para tipos entre API e Web
6. **Soft delete**: usar `deletedAt` em vez de DELETE para entidades principais
7. **Testes**: usar Vitest, testes em `src/test/` (API) e `src/test/` (Web)
