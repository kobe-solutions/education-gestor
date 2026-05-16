# Roadmap — Correção de Débitos Técnicos

> Última atualização: 2026-05-16
> Baseado na análise arquitetural do sistema.

---

## Legenda

| Símbolo | Significado |
|---------|-------------|
| 🔴 | Bloqueia evolução ou causa bug em produção |
| 🟡 | Degrada performance ou aumenta custo de manutenção |
| 🟢 | Melhoria de qualidade e segurança futura |
| ✅ | Concluído |

---

## Fase 1 — Correções Críticas
> **Meta:** Eliminar os débitos que chegam como bug de usuário antes de aparecer no monitoramento.
> **Prazo sugerido:** 2–3 semanas

---

### 1.1 🔴 Batch insert na frequência em lote

**Problema:** `registerBulkAttendanceService` executa `2 × N` roundtrips ao banco (SELECT + INSERT/UPDATE por aluno). Para 40 alunos = 80 queries por chamada.

**Arquivo:** `apps/api/src/modules/academic/academic.service.ts:73–88` e `academic.repository.ts:110–145`

**O que fazer:**
- [ ] Criar `upsertBulkAttendanceRepository(rows[])` que usa `INSERT ... ON CONFLICT DO UPDATE` em um único statement
- [ ] Substituir o `Promise.all(map(...))` no service pela nova função batch
- [ ] Atualizar o teste unitário de `academic.service`
- [ ] Validar que o comportamento de upsert (não duplicar registro do mesmo aluno na mesma data) é mantido

---

### 1.2 🔴 Transações nas operações multi-step

**Problema:** `registerPaymentService` e `registerBulkAttendanceService` têm race condition — dois requests simultâneos podem passar pela verificação de estado antes de qualquer um escrever.

**Arquivos:** `financial.service.ts:55–62`, `academic.service.ts:73–88`

**O que fazer:**
- [ ] Envolver `registerPaymentService` em `db.transaction(async (tx) => { ... })` — SELECT + UPDATE dentro da mesma transação
- [ ] Envolver `registerBulkAttendanceService` em transação para garantir rollback parcial
- [ ] Verificar se `addStudentToClassService` (check de capacidade + insert) também precisa de transação
- [ ] Adicionar testes que cobrem o caminho de rollback

---

### 1.3 🔴 Paginação nas listagens de volume

**Problema:** `findAllStudentsRepository`, `findAllTuitionsRepository` e `findAllTeachersRepository` retornam todas as linhas sem limite.

**Arquivos:** `students.repository.ts:130`, `financial.repository.ts`, `teachers.repository.ts`

**O que fazer:**
- [ ] Adicionar parâmetros `{ limit: number, offset: number }` com defaults (ex: `limit=50, offset=0`) nas três funções de repository
- [ ] Propagar os parâmetros pelos services correspondentes
- [ ] Adicionar query params `?page=` e `?limit=` nas routes
- [ ] Retornar `{ data: [], total: number }` no payload para o frontend saber o total de páginas
- [ ] Atualizar hooks do frontend (`useStudents`, `useTeachers`, `useTuitions`) para consumir o novo formato
- [ ] Atualizar testes unitários

---

### 1.4 🔴 Corrigir type coercion `number → string`

**Problema:** `value: input.value.toString()` e `amount: input.amount.toString()` criam assimetria de tipos entre service (number) e repository (string), causando bugs sutis em soma e ordenação.

**Arquivos:** `academic.service.ts:46`, `financial.service.ts:35`, `financial.service.ts:50`

**O que fazer:**
- [ ] No schema Drizzle (`academic.ts`, `financial.ts`), adicionar `.$type<number>()` nos campos `numeric` para que o ORM retorne `number` em vez de `string`
- [ ] Remover os `.toString()` nos services
- [ ] Remover os type casts de volta nos repositories
- [ ] Verificar e corrigir qualquer lugar no frontend que faça `parseFloat()` manualmente sobre esses campos
- [ ] Rodar os testes para garantir que nenhum snapshot quebrou

---

## Fase 2 — Performance e Segurança de Dados
> **Meta:** Garantir que o sistema aguenta crescimento de dados sem degradar.
> **Prazo sugerido:** 3–4 semanas após Fase 1

---

### 2.1 🟡 Índices explícitos nas tabelas de volume

**Problema:** `grades`, `attendances` e `tuitions` crescem sem limite. Queries de listagem por `classId + date`, `studentId + academicPeriodId` e `schoolId + status` não têm índices explícitos.

**Arquivo:** `apps/api/src/db/schema/academic.ts`, `financial.ts`

**O que fazer:**
- [ ] Adicionar no schema:
  ```ts
  // attendances
  index('att_class_date_idx').on(attendances.classId, attendances.date)
  index('att_student_idx').on(attendances.studentId)

  // grades
  index('grades_student_period_idx').on(grades.studentId, grades.academicPeriodId)
  index('grades_class_idx').on(grades.classId)

  // tuitions
  index('tuitions_school_status_idx').on(tuitions.schoolId, tuitions.status)
  index('tuitions_due_date_idx').on(tuitions.dueDate)
  ```
- [ ] Gerar e aplicar a migration (`pnpm db:generate && pnpm db:migrate`)
- [ ] Validar com `EXPLAIN ANALYZE` nas queries mais frequentes

---

### 2.2 🟡 Soft delete nas entidades core

**Problema:** Hard delete com cascade apaga aluno + responsáveis + ficha médica + documentos + notas + frequência sem possibilidade de recuperação.

**Tabelas:** `students`, `teachers`, `schools`

**O que fazer:**
- [ ] Adicionar coluna `deletedAt timestamp` (nullable) nas tabelas `students`, `teachers`, `schools`
- [ ] Gerar migration
- [ ] Em todos os repositories de listagem, adicionar `where(isNull(entity.deletedAt))`
- [ ] Trocar `db.delete(students)` por `db.update(students).set({ deletedAt: new Date() })`
- [ ] Garantir que `findByIdRepository` também filtra por `deletedAt IS NULL` (não retornar soft-deleted por ID)
- [ ] Criar endpoint admin `DELETE /students/:id/permanent` (hard delete real, apenas para admin)
- [ ] Atualizar testes unitários

---

### 2.3 🟡 Otimizar `upsertGradeRepository` — 3 queries → 1

**Problema:** Cada upsert de nota faz SELECT + (UPDATE ou INSERT) + SELECT com JOIN = 3 roundtrips.

**Arquivo:** `academic.repository.ts:38–90`

**O que fazer:**
- [ ] Refatorar para usar `INSERT ... ON CONFLICT (schoolId, classId, studentId, subjectId, academicPeriodId) DO UPDATE SET value = excluded.value RETURNING *`
- [ ] Fazer o JOIN na query de retorno dentro do mesmo statement usando CTE ou subquery
- [ ] Adicionar constraint `UNIQUE` no schema para o conjunto de colunas acima (necessário para o ON CONFLICT funcionar)
- [ ] Gerar migration para a unique constraint
- [ ] Atualizar testes

---

## Fase 3 — Qualidade de Manutenção
> **Meta:** Reduzir o custo de cada nova feature nos módulos core.
> **Prazo sugerido:** 4–6 semanas após Fase 2

---

### 3.1 🟡 Eliminar cross-module imports diretos no repository

**Problema:** `academic.service` importa de `students.repository` e `classes.repository`. `financial.service` importa de `students.repository`. Mudanças de assinatura em qualquer um desses repositories vai quebrar os outros módulos silenciosamente.

**Arquivos:** `academic.service.ts:9–10`, `financial.service.ts:9`

**O que fazer:**
- [ ] Substituir `findStudentByIdRepository(schoolId, id)` em `academic.service` pela chamada `getStudentService(schoolId, id)` — que já tem o erro encapsulado
- [ ] Substituir `findSchoolClassByIdRepository(schoolId, id)` em `academic.service` por `getSchoolClassService(schoolId, id)`
- [ ] Substituir `findStudentByIdRepository(schoolId, id)` em `financial.service` por `getStudentService(schoolId, id)`
- [ ] Remover os imports de repository nos modules não-donos
- [ ] Atualizar mocks nos testes unitários correspondentes

---

### 3.2 🟡 Query unificada de perfil completo do aluno

**Problema:** Dados do aluno estão em 4 tabelas (`students`, `guardians`, `studentMedical`, `studentDocuments`). Qualquer relatório ou exportação exige 4 queries separadas sem nenhum helper centralizado.

**Arquivo:** `students.repository.ts`

**O que fazer:**
- [ ] Criar `findStudentProfileRepository(schoolId, studentId)` que retorna aluno + responsáveis + ficha médica em um único resultado (via LEFT JOINs ou queries paralelas com `Promise.all`)
- [ ] Usar essa função no endpoint `GET /students/:id` (hoje ele retorna só dados básicos)
- [ ] Criar `findStudentsExportRepository(schoolId, filters)` para futura exportação CSV
- [ ] Documentar o tipo de retorno com interface TypeScript explícita

---

### 3.3 🟢 Validações de domínio nos services

**Problema:** Validações estão apenas nas routes (Zod). Se o service for chamado diretamente (testes, scripts, outros módulos), dados inválidos chegam ao banco.

**O que fazer:**
- [ ] Adicionar validação de range em `registerGradeService`: nota entre 0 e 10
- [ ] Adicionar validação em `createTuitionService`: `amount > 0`
- [ ] Adicionar validação de formato ISO em campos de data recebidos como string
- [ ] Criar helpers de validação em `src/lib/validators.ts` para reutilizar entre modules

---

### 3.4 🟢 Log de auditoria nas operações sensíveis

**Problema:** Não há registro de quem fez o quê — deletou aluno, alterou nota, marcou mensalidade como paga. Sem isso, não é possível investigar inconsistências nem atender exigências da LGPD.

**O que fazer:**
- [ ] Criar tabela `audit_logs` com colunas: `id`, `schoolId`, `userId`, `action`, `entity`, `entityId`, `payload`, `createdAt`
- [ ] Gerar migration
- [ ] Criar `src/lib/audit.ts` com função `logAudit(ctx, action, entity, entityId, payload?)`
- [ ] Instrumentar as operações sensíveis: delete de aluno, update de nota, pagamento de mensalidade, mudança de status de matrícula
- [ ] Criar endpoint `GET /audit-logs` (apenas gestor/admin) com filtro por entidade e período

---

## Backlog — Sem prazo definido

Itens identificados mas sem urgência imediata. Revisar a cada ciclo de planejamento.

- [ ] **Cache Redis no dashboard** — métricas do dashboard são computadas a cada request; com Redis, uma TTL de 60s já elimina 95% das queries redundantes
- [ ] **Importação de notas e frequência via planilha** — depende do item 1.1 (batch insert) estar resolvido antes
- [ ] **Evento de matrícula → geração automática de mensalidades** — hoje as mensalidades são criadas manualmente; quando um aluno for matriculado, gerar automaticamente os 12 registros do ano
- [ ] **Exportação de boletim em PDF** — depende do item 3.2 (query unificada de perfil) estar resolvido
- [ ] **Histórico de transferências** — tabela `student_transfers` para rastrear movimentações entre escolas sem perder o vínculo com dados anteriores

---

## Visão geral das fases

```
Fase 1 (Crítico)          Fase 2 (Performance)       Fase 3 (Manutenção)
──────────────────         ────────────────────         ───────────────────
1.1 Batch frequência  →    2.1 Índices de volume   →    3.1 Cross-module imports
1.2 Transações        →    2.2 Soft delete         →    3.2 Query perfil aluno
1.3 Paginação         →    2.3 Otimizar upsertGrade →   3.3 Validações no service
1.4 Type coercion     →                                  3.4 Log de auditoria
```

Cada fase só deve começar depois que a anterior estiver com testes passando e deploy validado em ambiente de desenvolvimento.
