# Roadmap — Débitos Técnicos

> Última atualização: 2026-07-24
> Baseado em análise direta do código atual do repositório.

---

## Legenda

| Símbolo | Significado |
|---------|-------------|
| 🔴 | Bloqueia evolução ou causa bug em produção |
| 🟡 | Degrada performance ou aumenta custo de manutenção |
| 🟢 | Melhoria de qualidade e segurança futura |
| ✅ | Concluído (verificar com testes passando e código em produção) |

---

## Estado atual — débitos já resolvidos

Os itens abaixo foram concluídos em ciclos anteriores e estão refletidos no código atual. Mantidos aqui apenas como histórico — não precisam de ação.

- ✅ **1.1 Batch insert na frequência** — frequência em lote usa `db.insert(...).values(...).onConflictDoUpdate` (single statement) com chunking de 500.
- ✅ **1.2 Transações em `registerPaymentService`** — `financial.service.ts:66` envolve SELECT+UPDATE em `db.transaction(async (tx) => { ... })`.
- ✅ **1.3 Paginação nas listagens de volume** — `findAllStudentsRepository`, `findAllTeachersRepository` e `findAllTuitionsRepository` aceitam `{ limit, offset }` (defaults `50/50/100`). Frontend consome o formato `{ data, total, page, limit }` retornado pelas rotas.
- ✅ **1.4 Type coercion `number → string`** — services não usam mais `.toString()` para `value`/`amount`; o cast ocorre uma única vez no repository ao persistir. Ajustes no frontend refletem o tipo `number`.
- ✅ **2.1 Índices explícitos** — schema declara:
  - `attendances`: `att_class_date_idx (classId, date)`, `att_student_idx (studentId)`
  - `grades`: `grades_student_period_idx (studentId, academicPeriodId)`, `grades_class_idx (classId)`
  - `tuitions`: `tuitions_school_status_idx (schoolId, status)`, `tuitions_due_date_idx (dueDate)`
- ✅ **2.2 Soft delete nas entidades core** — `deletedAt` em `students`, `guardians`, `teachers`, `schools`; todas as listagens filtram com `isNull(deletedAt)` e `DELETE` vira `update({ deletedAt: new Date() })`.
- ✅ **2.3 Otimizar `upsertGradeRepository`** — usa `.onConflictDoUpdate({ target: ..., set: { value } })` em uma única operação (constraint `UNIQUE` está no schema).
- ✅ **3.2 Query unificada de perfil do aluno** — `findStudentProfileRepository` retorna aluno + responsáveis + ficha médica em um único resultado.
- ✅ **3.4 Log de auditoria** — `GET /audit-logs?entity=&page=&limit=` exposto em `modules/audit/audit.routes.ts` para roles `gestor` e `admin`.

---

## Fase 1 — Resilência e concorrência

> **Meta:** Eliminar race conditions remanescentes e adicionar garantias transacionais onde ainda faltam.
> **Prazo sugerido:** 1–2 semanas

---

### 1.1 🔴 Transação em `registerBulkAttendanceService`

**Problema:** O fluxo de frequência em lote (chamada por turma) já não faz 2N roundtrips (resolvido em 1.1 histórico), porém ainda **não está envolto em transação**. Falha parcial pode deixar notas/presenças pela metade.

**Arquivo:** `apps/api/src/modules/academic/academic.service.ts` (`registerBulkAttendanceService`)

**O que fazer:**
- [ ] Envolver o fluxo em `db.transaction(async (tx) => { ... })` para garantir atomicidade
- [ ] Tratar rollback explícito em caso de violação de unique constraint
- [ ] Adicionar teste de integração que cubra o caminho de rollback

---

### 1.2 🔴 Transação em `addStudentToClassService` (race de capacidade)

**Problema:** Check de capacidade + insert da matrícula roda em queries separadas. Dois requests simultâneos podem ambos passar pelo check antes de qualquer `INSERT`, excedendo `maxStudents` da turma.

**Arquivo:** `apps/api/src/modules/classes/schoolClasses.service.ts`

**O que fazer:**
- [ ] Mover check + insert para `db.transaction(async (tx) => { ... })`
- [ ] Considerar `SELECT ... FOR UPDATE` no `schoolClasses` para lockar a linha durante a transação
- [ ] Adicionar teste concorrente (Promise.all) que dispare o limite de capacidade

---

### 1.3 🟡 Validação de overlap de datas em `POST /academic-periods`

**Problema:** Não há checagem de sobreposição entre períodos letivos do mesmo ano (`1º bimestre 01/02–30/04` e `2º bimestre 15/04–30/06` passam). Gera dados incoerentes.

**Arquivo:** `apps/api/src/modules/academicPeriods/academicPeriods.service.ts`

**O que fazer:**
- [ ] Adicionar validação de overlap no service (não apenas no schema Zod) usando helpers de intervalo
- [ ] Reutilizar helper em `src/lib/validators.ts`
- [ ] Adicionar teste unitário cobrindo todos os tipos de overlap (fronteira, parcial, total)

---

## Fase 2 — Segurança e operação

> **Meta:** Endurecer autenticação, observabilidade e ciclo de vida de mensalidades.
> **Prazo sugerido:** 2–3 semanas após Fase 1

---

### 2.1 🔴 Rate-limit em `POST /sessions`

**Problema:** Login não tem rate-limit. Brute-force trivial.

**Arquivo:** `apps/api/src/modules/auth/auth.routes.ts`, `apps/api/src/app.ts`

**O que fazer:**
- [ ] Adicionar `@fastify/rate-limit` ao projeto (dependência ainda não instalada)
- [ ] Configurar limite em `POST /sessions` (ex: 10 req/min por IP)
- [ ] Adicionar teste e2e que valide o retorno 429 após o limite
- [ ] Documentar em `apps/api/docs/openapi.yaml` o header `Retry-After`

---

### 2.2 🟡 Job de `overdue` para mensalidades

**Problema:** `tuitions.status` depende de job externo. Sem ele, mensalidades vencidas ficam com `status='pending'` para sempre.

**Arquivo:** `apps/api/src/modules/financial/financial.repository.ts` e novo `financial.jobs.ts`

**O que fazer:**
- [ ] Criar `markOverdueTuitionsJob()` que executa `UPDATE tuitions SET status='overdue' WHERE status='pending' AND dueDate < NOW()`
- [ ] Registrar scheduler no boot (`app.ts` ou script standalone `src/scripts/overdue.ts`)
- [ ] Configurar frequência (diária, próximo do início do dia)
- [ ] Adicionar teste que valide a transição de status

---

### 2.3 🟡 Hard delete real para admin (LGPD)

**Problema:** Soft delete cobre o fluxo operacional, mas admin não tem como remover um registro permanentemente — necessário para conformidade com LGPD.

**Arquivo:** `apps/api/src/modules/students/students.routes.ts` (e equivalente para `teachers`, `schools`)

**O que fazer:**
- [ ] Criar endpoint admin `DELETE /students/:id/permanent` (e `/teachers/:id/permanent`, `/schools/:id/permanent`)
- [ ] Garantir `authorizeRoles(['admin'])` apenas
- [ ] Cascade explícito das dependências (responsáveis, ficha médica, documentos, notas, mensalidades)
- [ ] Adicionar log de auditoria com flag `permanent: true` para diferenciar de soft delete
- [ ] Testes e2e cobrindo 403 (não-admin) e sucesso (admin)

---

## Fase 3 — Qualidade de manutenção e DX

> **Meta:** Reduzir custo de cada nova feature nos módulos core.
> **Prazo sugerido:** 3–4 semanas após Fase 2

---

### 3.1 🟡 Eliminar cross-module imports diretos no repository

**Problema:** Services ainda podem importar `repository` de outros módulos em alguns pontos (ex: `academic.service` ↔ `students.repository`). Mudança de assinatura em um repository quebra silenciosamente o módulo vizinho.

**Arquivos:** `apps/api/src/modules/academic/academic.service.ts`, `apps/api/src/modules/financial/financial.service.ts`

**O que fazer:**
- [ ] Auditar imports cruzados (grep `from .*\.repository` em services de outros módulos)
- [ ] Substituir por chamadas ao service correspondente (`getStudentService(schoolId, id)` em vez de `findStudentByIdRepository(schoolId, id)`)
- [ ] Atualizar mocks nos testes unitários

---

### 3.2 🟡 Validações de domínio no service layer

**Problema:** Validações estão concentradas nas routes (Zod). Se o service for chamado diretamente (testes, scripts, jobs), dados inválidos chegam ao banco.

**O que fazer:**
- [ ] Adicionar validação de range em `registerGradeService`: `0 <= value <= 10`
- [ ] Adicionar validação em `createTuitionService`: `amount > 0`
- [ ] Adicionar validação de formato ISO em campos de data recebidos como string
- [ ] Mover/criar helpers de validação em `src/lib/validators.ts` para reutilizar entre modules
- [ ] Cobrir com testes unitários

---

### 3.3 🟢 Endpoint de exportação CSV de alunos

**Problema:** Operadores escolares pedem planilha de alunos para conferência manual. Hoje é necessário abrir o Drizzle Studio.

**Arquivo:** `apps/api/src/modules/students/students.repository.ts`, `students.routes.ts`

**O que fazer:**
- [ ] Criar `findStudentsExportRepository(schoolId, filters)` retornando colunas planas
- [ ] Adicionar rota `GET /students/export.csv` (gestor, secretaria) com `Content-Type: text/csv`
- [ ] Gerar CSV em streaming para não carregar tudo em memória
- [ ] Documentar o tipo de retorno com interface TypeScript explícita

---

### 3.4 🟢 CI — typecheck + build em todo PR

**Problema:** Não há workflow de GitHub Actions executando `pnpm typecheck` e `pnpm build` em PRs. Builds quebrados só são descobertos no deploy.

**O que fazer:**
- [ ] Criar `.github/workflows/ci.yml` rodando em `pull_request` e `push` na `main`
- [ ] Steps: `pnpm install`, `pnpm --filter api build`, `pnpm --filter web build`, `pnpm test`
- [ ] Cache de `~/.local/share/pnpm/store` para acelerar
- [ ] Bloquear merge se a pipeline falhar (branch protection rule)

---

## Backlog — Sem prazo definido

Itens identificados mas sem urgência imediata. Revisar a cada ciclo de planejamento.

- [ ] **Cache Redis no dashboard** — métricas do dashboard são computadas a cada request; com Redis, uma TTL de 60s já elimina 95% das queries redundantes
- [ ] **Importação de notas e frequência via planilha** — depende de UI dedicada de upload + parser CSV
- [ ] **Evento de matrícula → geração automática de mensalidades** — hoje as mensalidades são criadas manualmente; quando um aluno for matriculado, gerar automaticamente os 12 registros do ano
- [ ] **Exportação de boletim em PDF** — depende da query unificada de perfil (3.2 histórico, já concluído)
- [ ] **Histórico de transferências** — tabela `student_transfers` para rastrear movimentações entre escolas sem perder o vínculo com dados anteriores
- [ ] **Frontend — code splitting por rota** — usar `React.lazy` + `Suspense` para reduzir o bundle inicial
- [ ] **Frontend — verificação de expiração do JWT (`exp`)** — logout automático no `AuthContext` sem depender apenas do interceptor 401
- [ ] **Frontend — testes unit de componentes e hooks** — atualmente há 1 arquivo de teste; expandir para schemas Zod, hooks e pages principais
- [ ] **Frontend — testes E2E com Playwright** — fluxos críticos: login, matrícula, lançamento de nota, pagamento

---

## Visão geral das fases

```
Débitos já resolvidos (histórico)        Em aberto
─────────────────────────────             ───────────────────────────
1.1 Batch frequência  ✅                 1.1 Transação em bulk attendance
1.2 Paginação         ✅                 1.2 Transação em addStudentToClass
1.3 Transação pagamento ✅               1.3 Overlap de academic periods
1.4 Type coercion     ✅
2.1 Índices           ✅                 2.1 Rate-limit em /sessions
2.2 Soft delete       ✅                 2.2 Job de overdue
2.3 Upsert grade      ✅                 2.3 Hard delete admin (LGPD)
3.2 Perfil aluno      ✅
3.4 Audit log         ✅                 3.1 Cross-module imports
                                          3.2 Validações no service
                                          3.3 Exportação CSV
                                          3.4 CI — typecheck + build
```

Cada fase só deve começar depois que a anterior estiver com testes passando e deploy validado em ambiente de desenvolvimento.
