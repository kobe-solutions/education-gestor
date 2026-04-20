# Tasks — Web

Cada fase do frontend só começa após a fase correspondente da API estar pronta.
As tarefas dentro de uma fase podem ser feitas em paralelo.

---

## Fase 1 — Setup e infraestrutura do frontend

> Sem dependência de API. Pode ser feita em paralelo com a Fase 1 da API.

- [ ] Instalar e configurar shadcn/ui (`pnpm dlx shadcn@latest init`)
- [ ] Adicionar componentes base: `Button`, `Input`, `Label`, `Card`, `Table`, `Dialog`, `Form`
- [ ] Criar layout base autenticado (`src/components/layout/AppLayout.tsx`) — sidebar + topbar
- [ ] Criar layout público (`src/components/layout/PublicLayout.tsx`) — para login/onboarding
- [ ] Configurar React Router com rotas públicas e privadas separadas
- [ ] Criar `PrivateRoute` — redireciona para login se não autenticado
- [ ] Criar contexto de autenticação `AuthContext` — armazena token e payload do JWT

---

## Fase 2 — Auth

> Depende de: API Fase 2.

- [ ] Criar página `LoginPage` — formulário de email + senha
- [ ] Criar hook `useLogin` (TanStack Query mutation) — chama `POST /auth/login`, salva token
- [ ] Criar página `RegisterPage` — formulário de cadastro inicial (onboarding da escola + admin)
- [ ] Criar hook `useRegister` — chama `POST /auth/register`
- [ ] Conectar `AuthContext` ao token retornado pelo login
- [ ] Implementar logout — limpa token e redireciona para login
- [ ] Adicionar interceptor de erro 401 no `api.ts` — redireciona para login automaticamente

---

## Fase 3 — Students

> Depende de: API Fase 3, Web Fase 1 e 2.

- [ ] Criar hook `useStudents` — `GET /students` com TanStack Query
- [ ] Criar hook `useStudent` — `GET /students/:id`
- [ ] Criar hook `useCreateStudent` — mutation `POST /students`
- [ ] Criar hook `useUpdateStudent` — mutation `PUT /students/:id`
- [ ] Criar hook `useDeleteStudent` — mutation `DELETE /students/:id`
- [ ] Criar página `StudentsPage` — tabela com listagem, busca e paginação
- [ ] Criar componente `StudentForm` — formulário de cadastro/edição com validação
- [ ] Criar `StudentDialog` — modal reutilizável para criar e editar
- [ ] Criar página `StudentDetailPage` — dados do aluno + responsáveis
- [ ] Adicionar rota `/students` e `/students/:id` no React Router

---

## Fase 4 — Teachers

> Depende de: API Fase 4, Web Fase 1 e 2.

- [ ] Criar hook `useTeachers` — `GET /teachers`
- [ ] Criar hook `useCreateTeacher` — mutation `POST /teachers`
- [ ] Criar hook `useUpdateTeacher` — mutation `PUT /teachers/:id`
- [ ] Criar hook `useDeleteTeacher` — mutation `DELETE /teachers/:id`
- [ ] Criar página `TeachersPage` — tabela com listagem
- [ ] Criar componente `TeacherForm` — formulário de cadastro/edição
- [ ] Criar `TeacherDialog` — modal para criar e editar
- [ ] Adicionar rota `/teachers` no React Router

---

## Fase 5 — Classes (Turmas)

> Depende de: API Fase 5, Web Fase 3 e 4.

- [ ] Criar hook `useAcademicPeriods` — `GET /academic-periods`
- [ ] Criar hook `useCreateAcademicPeriod` — mutation `POST /academic-periods`
- [ ] Criar hook `useClasses` — `GET /classes`
- [ ] Criar hook `useClass` — `GET /classes/:id` (com alunos e professores)
- [ ] Criar hook `useCreateClass` — mutation `POST /classes`
- [ ] Criar hook `useAddStudentToClass` — mutation `POST /classes/:id/students`
- [ ] Criar hook `useAddTeacherToClass` — mutation `POST /classes/:id/teachers`
- [ ] Criar página `ClassesPage` — tabela de turmas por período letivo
- [ ] Criar página `ClassDetailPage` — lista de alunos + professores da turma
- [ ] Criar componente `AddStudentToClassDialog` — busca e adiciona aluno
- [ ] Criar componente `AddTeacherToClassDialog` — busca e adiciona professor
- [ ] Criar `AcademicPeriodSelector` — componente global de seleção de período
- [ ] Adicionar rotas `/classes` e `/classes/:id` no React Router

---

## Fase 6 — Academic (Notas e Frequência)

> Depende de: API Fase 6, Web Fase 5.

- [ ] Criar hook `useGrades` — `GET /students/:id/grades`
- [ ] Criar hook `useRegisterGrade` — mutation `POST /grades`
- [ ] Criar hook `useAttendances` — `GET /students/:id/attendances`
- [ ] Criar hook `useRegisterAttendance` — mutation `POST /attendances`
- [ ] Criar hook `useClassAttendance` — `GET /classes/:id/attendances?date=`
- [ ] Criar página `GradesPage` — tabela de lançamento de notas por turma/disciplina
- [ ] Criar componente `GradeInput` — input inline editável para nota
- [ ] Criar página `AttendancePage` — chamada do dia: lista de alunos com checkbox presente/ausente
- [ ] Criar página `StudentReportPage` — boletim do aluno (notas + frequência)
- [ ] Adicionar rotas `/grades`, `/attendance`, `/students/:id/report` no React Router

---

## Fase 7 — Financial

> Depende de: API Fase 7, Web Fase 3.

- [ ] Criar hook `useTuitions` — `GET /tuitions` (com filtros por status e aluno)
- [ ] Criar hook `useCreateTuition` — mutation `POST /tuitions`
- [ ] Criar hook `useRegisterPayment` — mutation `PATCH /tuitions/:id/pay`
- [ ] Criar página `TuitionsPage` — tabela com status (pago, pendente, atrasado)
- [ ] Criar componente `TuitionStatusBadge` — badge colorido por status
- [ ] Criar `RegisterPaymentDialog` — confirmação de pagamento com data
- [ ] Criar página `StudentFinancialPage` — histórico financeiro de um aluno
- [ ] Adicionar rotas `/financial` e `/students/:id/financial` no React Router
