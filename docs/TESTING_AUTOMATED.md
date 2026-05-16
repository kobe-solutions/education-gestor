# Roadmap de Testes Automatizados

Sistema: **education-gestor** — monorepo com `apps/api` (Fastify + Drizzle) e `apps/web` (React + Vite).

---

## Estado atual

### API (`apps/api`)
- **Infraestrutura**: Vitest configurado, `buildTestApp()` e helpers de token prontos
- **Testes unitários (services)**: ✅ `auth`, `students`, `teachers`, `financial`, `secretarias`, `academic`
- **Testes de integração (routes)**: ✅ `auth`, `students`, `teachers`, `classes`, `financial`, `secretarias`, `academic`
- **Módulos sem cobertura**: `schools`, `subjects`, `academicPeriods`, `dashboard`
- **Banco real**: ❌ todos os testes usam vi.mock — nenhum teste toca o PostgreSQL

### Frontend (`apps/web`)
- **Infraestrutura**: ❌ nada instalado
- **Testes unitários**: ❌
- **Testes de integração**: ❌
- **Testes E2E**: ❌

---

## Fase 1 — Completar unitários da API

**Objetivo**: cobrir os services dos módulos criados após a batch inicial.

**Ferramenta**: Vitest (já configurado) + `vi.mock` no repository.

**Arquivos a criar:**

### `src/test/unit/schools.service.test.ts`
- `createSchoolService` — cria escola e linka via `secretariaSchools`
- `createSchoolService` — lança 409 se slug ou email já existe
- `updateSchoolService` — retorna 403 (`Forbidden`) quando secretaria tenta editar escola de outra secretaria
- `updateSchoolService` — admin pode editar qualquer escola
- `deleteSchoolService` — mesma lógica de ownership

### `src/test/unit/subjects.service.test.ts`
- `createSubjectService` — cria disciplina com `schoolId`
- `createSubjectService` — lança erro se `code` duplicado na mesma escola
- `updateSubjectService` — aluno não encontrado → 404
- `deleteSubjectService` — remove corretamente

### `src/test/unit/academicPeriods.service.test.ts`
- `createAcademicPeriodService` — cria com `active: false` por padrão
- `updateAcademicPeriodService` — altera active, startDate, endDate
- `deleteAcademicPeriodService` — lança se não existe

### `src/test/unit/dashboard.service.test.ts`
(o dashboard é fortemente acoplado ao repository — cobrir as transformações de dados)
- `getSchoolMetricsRepository` retorna zeros para escola sem dados
- upcomingTuitions exclui mensalidades já pagas
- `getAdminMetricsRepository` retorna contagens corretas

**Critério de aceite**: `pnpm --filter api test:coverage` ≥ 85% nos services.

---

## Fase 2 — Completar integração de rotas da API

**Objetivo**: cobrir as rotas dos módulos sem testes, validando auth, roles e respostas HTTP.

**Padrão**: mock do service (mesmo padrão dos arquivos existentes em `e2e/`), `app.inject()`.

**Arquivos a criar:**

### `src/test/e2e/schools.test.ts`
- `POST /schools` — 401 sem token
- `POST /schools` — 403 com token de gestor (só secretaria pode criar)
- `POST /schools` — 201 com token de secretaria + payload correto
- `POST /schools` — 400 com body inválido (slug com espaços, email malformado)
- `POST /schools` — 409 se escola já existe
- `GET /schools` — secretaria recebe apenas as próprias escolas
- `GET /schools` — admin recebe todas
- `PUT /schools/:id` — 403 quando secretaria não é dona
- `PUT /schools/:id` — 200 quando dona
- `DELETE /schools/:id` — 403 quando não é dona
- `DELETE /schools/:id` — 204 quando dona

### `src/test/e2e/subjects.test.ts`
- `GET /subjects` — 401 sem token; 200 para gestor
- `POST /subjects` — 403 para professor; 201 para gestor
- `POST /subjects` — 409 se code duplicado
- `PUT /subjects/:id` — 404 se não existe
- `DELETE /subjects/:id` — 204 se existe; 404 se não

### `src/test/e2e/academicPeriods.test.ts`
- `GET /academic-periods` — 200 para gestor/professor
- `POST /academic-periods` — 403 para professor; 201 para gestor
- `PUT /academic-periods/:id` — atualiza active; 404 se não existe
- `DELETE /academic-periods/:id` — 204

### `src/test/e2e/dashboard.test.ts`
- `GET /dashboard` — 401 sem token
- `GET /dashboard` — admin → recebe `secretariasCount` e `schoolsCount`
- `GET /dashboard` — gestor com schoolId → recebe métricas da escola
- `GET /dashboard` — secretaria sem `X-School-Id` header → recebe zeros
- `GET /dashboard` — secretaria com `X-School-Id` → recebe métricas da escola

**Critério de aceite**: todos os módulos com cobertura de happy path + principais casos de erro.

---

## Fase 3 — Testes de integração com banco real

**Objetivo**: garantir que as queries Drizzle funcionam corretamente — unicidade, joins, filtros por `schoolId`, transições de estado.

**Ferramenta**: Vitest + banco PostgreSQL de teste (via Docker) + `drizzle-kit migrate` no setup.

**Setup necessário:**

```yaml
# docker-compose.test.yml
services:
  postgres_test:
    image: postgres:16
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: education_gestor_test
    ports:
      - "5433:5432"
```

```ts
// src/test/integration/setup.ts
// 1. Conectar ao banco de teste
// 2. Rodar migrations (drizzle-kit migrate)
// 3. Limpar todas as tabelas antes de cada teste (TRUNCATE CASCADE)
// 4. Fechar conexão após tudo
```

**Arquivos a criar:**

### `src/test/integration/schools.integration.test.ts`
- Criar escola → confirmar que `secretaria_schools` foi populado
- `listSchoolsBySecretariaRepository` → retorna apenas as escolas da secretaria
- `isSchoolOwnedBySecretariaRepository` → retorna true/false corretamente
- Deletar escola → `secretaria_schools` é removido em cascata

### `src/test/integration/financial.integration.test.ts`
- Criar tuition → status `pending`
- `registerPaymentService` → status muda para `paid`, `paidAt` preenchido
- Tentar pagar tuition já paga → lança erro
- `updateTuitionService` → bloqueia update se status é `paid`

### `src/test/integration/students.integration.test.ts`
- `enrollmentCode` único por escola → aceita mesmo code em escolas diferentes
- `enrollmentCode` duplicado na mesma escola → constraint viola

### `src/test/integration/secretarias.integration.test.ts`
- Criar secretaria → criar escola → link via `secretariaSchools` → deletar secretaria → cascata remove o link

**Critério de aceite**: banco de teste isolado, sem interferência entre testes, migrations aplicadas automaticamente.

---

## Fase 4 — Setup de testes do frontend

**Objetivo**: infraestrutura base para todos os testes de frontend.

**Instalações necessárias:**
```bash
pnpm --filter web add -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

**Arquivos a criar:**

```ts
// apps/web/vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/features/**', 'src/pages/**', 'src/contexts/**'],
    },
  },
})
```

```ts
// apps/web/src/test/setup.ts
import '@testing-library/jest-dom'
import { vi } from 'vitest'

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return { ...actual, useNavigate: () => vi.fn(), useParams: () => ({}) }
})

vi.mock('../lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}))
```

```ts
// apps/web/src/test/render.tsx
// wrapper com QueryClientProvider + AuthProvider + MemoryRouter
export function renderWithProviders(ui, { route = '/', user = null } = {})
```

**Critério de aceite**: `pnpm --filter web test` executa e passa nos testes dummy de smoke.

---

## Fase 5 — Testes unitários do frontend

**Objetivo**: testar unidades isoladas — componentes puros, schemas Zod, hooks.

### Componentes (`src/test/unit/components/`)

**`TuitionStatusBadge.test.tsx`**
- Renderiza "Pendente" com classe warning para `pending`
- Renderiza "Pago" com classe success para `paid`
- Renderiza "Atrasado" com classe destructive para `overdue`

**`MetricCard.test.tsx`** (Dashboard)
- Renderiza label e value
- Renderiza sub quando fornecido
- Não renderiza sub quando ausente

### Schemas Zod (`src/test/unit/schemas/`)

**`guardianSchema.test.ts`** (StudentDetailPage)
- Aceita email vazio string como opcional
- Rejeita email malformado quando preenchido
- Rejeita name com menos de 2 caracteres

**`tuitionSchema.test.ts`** (TuitionsPage)
- Aceita data no formato `YYYY-MM-DD`
- Rejeita amount negativo
- Rejeita studentId vazio

**`createSchoolSchema.test.ts`**
- Rejeita slug com espaços ou maiúsculas
- Aceita slug com hífens
- Rejeita senha com menos de 8 chars

### Hooks (`src/test/unit/hooks/`)

**`useStudents.test.ts`**
- `useStudents` chama `GET /students` e retorna dados
- `useCreateStudent` chama `POST /students` e invalida `['students']`
- `useDeleteStudent` chama `DELETE /students/:id`

**`useDashboard.test.ts`**
- `isAdminDashboard` retorna `true` quando payload tem `secretariasCount`
- `isAdminDashboard` retorna `false` para payload de escola

**Critério de aceite**: todos os componentes e helpers críticos com pelo menos um teste de comportamento.

---

## Fase 6 — Testes de integração do frontend (MSW)

**Objetivo**: testar as pages completas — render, interação do usuário, chamadas HTTP mockadas, toasts, dialogs.

**Instalações necessárias:**
```bash
pnpm --filter web add -D msw
```

**Setup:**
```ts
// apps/web/src/test/msw/handlers.ts
// handlers para GET /students, POST /students, DELETE /students/:id, etc.
// apps/web/src/test/msw/server.ts
// setupServer(...handlers) — reset antes de cada teste
```

**Arquivos a criar:**

### `src/test/integration/StudentsPage.test.tsx`
- Renderiza lista de alunos retornada pela API
- Filtra por nome ao digitar no campo de busca
- Filtra por código de matrícula
- Abre dialog ao clicar "Novo aluno"
- Submit com campos válidos → chama `POST /students` → aluno aparece na lista
- Submit com nome vazio → exibe erro de validação (não faz request)
- Clica em excluir → abre AlertDialog → confirma → chama `DELETE /students/:id`
- Cancela exclusão → não chama DELETE

### `src/test/integration/LoginPage.test.tsx`
- Renderiza campos email e senha
- Submit válido → chama `POST /sessions` → salva token no localStorage → redireciona
- Credenciais inválidas (mock 401) → exibe mensagem de erro
- Submit com email inválido → erro de validação sem request

### `src/test/integration/TuitionsPage.test.tsx`
- Lista mensalidades com nome do aluno como link
- Filtro por status (pending/paid/overdue)
- Busca por nome do aluno
- "Registrar pagamento" → abre dialog de confirmação → confirma → status muda para "Pago"
- "Nova mensalidade" → preenche → salva → aparece na lista

### `src/test/integration/DashboardPage.test.tsx`
- Exibe cards de métricas com valores corretos (gestor)
- Exibe cards de secretarias/escolas (admin)
- Exibe mensagem de seleção de escola quando secretaria sem `activeSchoolId`
- Renderiza tabela de mensalidades próximas a vencer
- Exibe mensagem "nenhuma" quando lista vazia

### `src/test/integration/PrivateRoute.test.tsx`
- Redireciona para `/login` quando não autenticado
- Redireciona para `/` quando role não tem permissão para a rota
- Renderiza o componente quando role tem permissão

**Critério de aceite**: fluxos principais das 5 pages mais críticas cobertos.

---

## Fase 7 — Testes E2E (Playwright)

**Objetivo**: testar fluxos completos de ponta a ponta em um browser real — garantia de que frontend e backend integram corretamente.

**Instalações necessárias:**
```bash
pnpm add -D -w playwright @playwright/test
npx playwright install chromium
```

**Setup:**
```ts
// playwright.config.ts (raiz do monorepo)
// baseURL: http://localhost:5173
// Roda API em background no beforeAll global
// Reseta banco de teste antes de cada spec (via API interna ou query direta)
```

### Spec: `auth.spec.ts`
- Login com credenciais válidas → redireciona ao dashboard → sidebar exibe itens do role
- Login com senha errada → permanece na tela de login com erro visível
- Logout → redireciona para `/login`
- Acesso direto a `/students` sem login → redireciona para `/login`
- Token expirado → nova requisição retorna 401 → redireciona para `/login`

### Spec: `students.spec.ts`
- Login como gestor → criar aluno → aparece na listagem
- Buscar aluno pelo nome → resultado filtrado
- Acessar detalhe do aluno → ver aba responsáveis → adicionar responsável → aparece na tabela
- Link "Ver boletim" → navega para `/students/:id/report`

### Spec: `financial.spec.ts`
- Criar mensalidade para aluno existente → aparece com status "Pendente"
- Registrar pagamento → status muda para "Pago" → botão "Registrar pagamento" some
- Dashboard reflete as contagens corretas após as operações

### Spec: `secretaria.spec.ts`
- Login como secretaria sem escola selecionada → dashboard mostra estado vazio
- Ir para "Minhas Escolas" → selecionar escola → voltar ao dashboard → métricas aparecem
- SchoolSelector no header → trocar de escola → dados recarregam

### Spec: `classes.spec.ts`
- Criar turma → adicionar professor → adicionar aluno → ver na listagem da turma
- Remover aluno da turma → aluno some da listagem

**Critério de aceite**: CI roda os E2E contra o ambiente de staging/test. Cada spec deve passar em < 30s.

---

## Ordem de execução recomendada

| Fase | Dependências | Esforço estimado |
|------|-------------|-----------------|
| Fase 1 — Unitários API (gaps) | Vitest já configurado | Baixo |
| Fase 2 — Integração rotas API (gaps) | Padrão já estabelecido | Baixo |
| Fase 3 — Integração com banco real | Docker + setup de transações | Médio |
| Fase 4 — Setup frontend | Instalar libs, criar wrappers | Baixo |
| Fase 5 — Unitários frontend | Setup da Fase 4 | Médio |
| Fase 6 — Integração frontend (MSW) | Setup da Fase 4 + MSW | Alto |
| Fase 7 — E2E Playwright | API + banco + frontend rodando | Alto |

## Comandos após setup completo

```bash
# API — todos os testes
pnpm --filter api test

# API — cobertura
pnpm --filter api test:coverage

# API — integração com banco real (requer docker-compose.test.yml up)
pnpm --filter api test:integration

# Frontend — todos os testes
pnpm --filter web test

# Frontend — cobertura
pnpm --filter web test:coverage

# E2E (requer servidor rodando)
pnpm test:e2e
```
