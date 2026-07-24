# Tasks — Web

Cada fase do frontend só começa após a fase correspondente da API estar pronta.
As tarefas dentro de uma fase podem ser feitas em paralelo.

**Status atual:** Todas as 8 fases implementadas. Backend com 19 módulos, frontend com 16 features.

---

## Fase 1 — Setup e infraestrutura do frontend

> Sem dependência de API. Pode ser feita em paralelo com a Fase 1 da API.

- [x] Instalar e configurar shadcn/ui (`pnpm dlx shadcn@latest init`)
- [x] Adicionar componentes base: `Button`, `Input`, `Label`, `Card`, `Table`, `Dialog`, `Form`, `Badge`, `Select`
- [x] Criar layout base autenticado (`src/components/layout/AppLayout.tsx`) — sidebar + topbar
- [x] Criar layout público (`src/components/layout/PublicLayout.tsx`) — para login/onboarding
- [x] Configurar React Router com rotas públicas e privadas separadas
- [x] Criar `PrivateRoute` — redireciona para login se não autenticado
- [x] Criar contexto de autenticação `AuthContext` — armazena token e payload do JWT
- [x] Tipar o JWT payload no frontend: `AdminPayload | SecretariaPayload | TenantPayload` (espelhar `packages/types`)

---

## Fase 2 — Auth

> Depende de: API Fase 2 ✅ (endpoint `POST /sessions` implementado).

- [x] Criar página `LoginPage` — formulário de email + senha
- [x] Criar hook `useLogin` (TanStack Query mutation) — chama `POST /sessions`, salva token no `AuthContext`
- [x] Conectar `AuthContext` ao token retornado pelo login — decodificar payload e expor `role`, `schoolId`, `secretariaId`
- [x] Implementar logout — limpa token e redireciona para login
- [x] Adicionar interceptor de erro 401 no `api.ts` — redireciona para login automaticamente
- [x] Exibir sidebar diferente por role: `admin` vê secretarias; `secretaria` vê escolas vinculadas; `gestor`/`professor` vê módulos da escola

> Nota: não há `POST /auth/register` público — escolas e admins são criados pelo admin via endpoints específicos.

---

## Fase 3 — Students

> Depende de: API Fase 3 ✅, Web Fase 1 e 2.

- [x] Criar hook `useStudents` — `GET /students`
- [x] Criar hook `useStudent` — `GET /students/:id`
- [x] Criar hook `useCreateStudent` — mutation `POST /students`
- [x] Criar hook `useUpdateStudent` — mutation `PUT /students/:id`
- [x] Criar hook `useDeleteStudent` — mutation `DELETE /students/:id`
- [x] Criar hook `useStudentGuardians` — `GET /students/:id/guardians`
- [x] Criar hook `useAddGuardian` — mutation `POST /students/:id/guardians`
- [x] Criar página `StudentsPage` — tabela com listagem e busca
- [x] Criar componente `StudentForm` — formulário de cadastro/edição com validação
- [x] Criar `StudentDialog` — modal reutilizável para criar e editar
- [x] Criar página `StudentDetailPage` — dados do aluno + lista de responsáveis + aba financeira
- [x] Adicionar rota `/students` e `/students/:id` no React Router

---

## Fase 4 — Teachers

> Depende de: API Fase 4 ✅, Web Fase 1 e 2.

- [x] Criar hook `useTeachers` — `GET /teachers`
- [x] Criar hook `useTeacher` — `GET /teachers/:id`
- [x] Criar hook `useCreateTeacher` — mutation `POST /teachers`
- [x] Criar hook `useUpdateTeacher` — mutation `PUT /teachers/:id`
- [x] Criar hook `useDeleteTeacher` — mutation `DELETE /teachers/:id`
- [x] Criar página `TeachersPage` — tabela com listagem
- [x] Criar componente `TeacherForm` — formulário de cadastro/edição
- [x] Criar `TeacherDialog` — modal para criar e editar
- [x] Adicionar rota `/teachers` no React Router

---

## Fase 5 — Classes (Turmas) e Períodos Letivos

> Depende de: API Fase 5 ✅, Web Fase 3 e 4.

- [x] Criar hook `useAcademicPeriods` — `GET /academic-periods`
- [x] Criar hook `useCreateAcademicPeriod` — mutation `POST /academic-periods`
- [x] Criar hook `useClasses` — `GET /school-classes`
- [x] Criar hook `useClass` — `GET /school-classes/:id` (inclui `teachers[]` e `students[]`)
- [x] Criar hook `useCreateClass` — mutation `POST /school-classes`
- [x] Criar hook `useUpdateClass` — mutation `PUT /school-classes/:id`
- [x] Criar hook `useDeleteClass` — mutation `DELETE /school-classes/:id`
- [x] Criar hook `useAddStudentToClass` — mutation `POST /school-classes/:id/students`
- [x] Criar hook `useRemoveStudentFromClass` — mutation `DELETE /school-classes/:classId/students/:studentId`
- [x] Criar hook `useAddTeacherToClass` — mutation `POST /school-classes/:id/teachers`
- [x] Criar página `ClassesPage` — tabela de turmas filtrável por período letivo
- [x] Criar página `ClassDetailPage` — lista de alunos + professores da turma com ações de adicionar/remover
- [x] Criar componente `AddStudentToClassDialog` — busca e adiciona aluno à turma
- [x] Criar componente `AddTeacherToClassDialog` — busca e adiciona professor à turma
- [x] Criar `AcademicPeriodSelector` — seletor global de período usado em Classes e Notas
- [x] Adicionar rotas `/classes` e `/classes/:id` no React Router

---

## Fase 6 — Academic (Notas e Frequência)

> Depende de: API Fase 6 ✅, Web Fase 5.

- [x] Criar hook `useStudentGrades` — `GET /students/:id/grades`
- [x] Criar hook `useClassGrades` — `GET /school-classes/:id/grades`
- [x] Criar hook `useRegisterGrade` — mutation `POST /grades`
- [x] Criar hook `useStudentAttendances` — `GET /students/:id/attendances`
- [x] Criar hook `useClassAttendance` — `GET /school-classes/:id/attendances?date=`
- [x] Criar hook `useRegisterAttendance` — mutation `POST /attendances`
- [x] Criar hook `useRegisterBulkAttendance` — mutation `POST /attendances/bulk`
- [x] Criar página `GradesPage` — tabela de lançamento de notas por turma/disciplina; professor vê só suas turmas
- [x] Criar componente `GradeInput` — input inline editável com validação 0–10
- [x] Criar página `AttendancePage` — chamada do dia: lista de alunos com toggle presente/ausente; envia via bulk
- [x] Criar página `StudentReportPage` — boletim do aluno (notas por disciplina + percentual de frequência)
- [x] Adicionar rotas `/grades`, `/attendance`, `/students/:id/report` no React Router

---

## Fase 7 — Financial

> Depende de: API Fase 7 ✅, Web Fase 3.

- [x] Criar hook `useTuitions` — `GET /tuitions`
- [x] Criar hook `useStudentTuitions` — `GET /students/:id/tuitions`
- [x] Criar hook `useCreateTuition` — mutation `POST /tuitions`
- [x] Criar hook `useRegisterPayment` — mutation `PATCH /tuitions/:id/pay`
- [x] Criar página `TuitionsPage` — tabela com filtro por status (`pending`, `paid`, `overdue`) e por aluno
- [x] Criar componente `TuitionStatusBadge` — badge colorido: verde pago, amarelo pendente, vermelho atrasado
- [x] Criar `RegisterPaymentDialog` — modal de confirmação de pagamento
- [x] Criar página `StudentFinancialPage` — histórico financeiro de um aluno específico
- [x] Adicionar rotas `/financial` e `/students/:id/financial` no React Router

---

## Fase 8 — Secretarias (admin only)

> Depende de: API Secretarias ✅, Web Fase 1 e 2.
> Visível apenas para usuários com role `admin`.

- [x] Criar hook `useCreateSecretaria` — mutation `POST /secretarias`
- [x] Criar hook `useSecretariaSchools` — `GET /secretarias/:id/schools`
- [x] Criar hook `useLinkSchool` — mutation `POST /secretarias/:id/schools`
- [x] Criar hook `useUnlinkSchool` — mutation `DELETE /secretarias/:id/schools/:schoolId`
- [x] Criar página `SecretariasPage` — listagem de secretarias com ações de criar e gerenciar
- [x] Criar `SecretariaSchoolsDialog` — modal para vincular/desvincular escolas de uma secretaria
- [x] Adicionar rota `/secretarias` no React Router (guard: somente `admin`)
