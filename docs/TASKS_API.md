# Tasks — API

Ordem de execução: as fases são sequenciais. Dentro de cada fase, as tarefas podem ser feitas em paralelo salvo indicação de dependência.

---

## Fase 1 — Schools (âncora do multi-tenant)

> Deve ser a primeira a existir. Toda outra entidade depende de `schoolId`.

- [ ] Criar schema Drizzle `schools` (id, name, slug, createdAt, updatedAt)
- [ ] Gerar e aplicar migration
- [ ] Criar `school.repository.ts` — `findById`, `findBySlug`, `create`
- [ ] Criar `school.schema.ts` — schemas Zod de input/output
- [ ] Criar `school.service.ts` — `createSchool`, `getSchoolBySlug`
- [ ] Criar `school.routes.ts` — `POST /schools`, `GET /schools/:slug`
- [ ] Registrar rotas em `app.ts`

---

## Fase 2 — Auth

> Depende de: Fase 1 (precisa de `schoolId` no JWT).

- [ ] Criar schema Drizzle `users` (id, schoolId, name, email, passwordHash, role, createdAt)
- [ ] Gerar e aplicar migration
- [ ] Criar `auth.repository.ts` — `findByEmail`, `create`
- [ ] Criar `auth.schema.ts` — schemas Zod para login e register
- [ ] Instalar e configurar `bcrypt` para hash de senha
- [ ] Criar `auth.service.ts` — `register`, `login`, geração do JWT `{ userId, schoolId, role }`
- [ ] Criar `auth.routes.ts` — `POST /auth/register`, `POST /auth/login`
- [ ] Registrar rotas em `app.ts`
- [ ] Declarar `FastifyRequest` augmentation com tipo do `user` (userId, schoolId, role)

---

## Fase 3 — Students

> Depende de: Fase 1, Fase 2 (rotas protegidas por `authenticate` + `injectTenant`).

- [ ] Criar schema Drizzle `students` (id, schoolId, name, email, birthDate, enrollmentCode, createdAt, updatedAt)
- [ ] Criar schema Drizzle `guardians` (id, studentId, name, phone, relationship)
- [ ] Gerar e aplicar migration
- [ ] Criar `student.repository.ts` — `findAll`, `findById`, `create`, `update`, `delete` (todos filtrados por `schoolId`)
- [ ] Criar `student.schema.ts` — schemas Zod de input/output
- [ ] Criar `student.service.ts` — `listStudents`, `getStudent`, `createStudent`, `updateStudent`, `deleteStudent`
- [ ] Criar `student.routes.ts` — CRUD completo em `/students`
- [ ] Registrar rotas em `app.ts`

---

## Fase 4 — Teachers

> Depende de: Fase 1, Fase 2.

- [ ] Criar schema Drizzle `teachers` (id, schoolId, name, email, phone, createdAt, updatedAt)
- [ ] Gerar e aplicar migration
- [ ] Criar `teacher.repository.ts` — `findAll`, `findById`, `create`, `update`, `delete` (todos filtrados por `schoolId`)
- [ ] Criar `teacher.schema.ts` — schemas Zod de input/output
- [ ] Criar `teacher.service.ts` — `listTeachers`, `getTeacher`, `createTeacher`, `updateTeacher`, `deleteTeacher`
- [ ] Criar `teacher.routes.ts` — CRUD completo em `/teachers`
- [ ] Registrar rotas em `app.ts`

---

## Fase 5 — Classes (Turmas)

> Depende de: Fase 1, Fase 2, Fase 4.

- [ ] Criar schema Drizzle `academic_periods` (id, schoolId, name, startDate, endDate, active)
- [ ] Criar schema Drizzle `classes` (id, schoolId, academicPeriodId, name, grade, shift)
- [ ] Criar schema Drizzle `class_teachers` (classId, teacherId, subject) — relação N:N
- [ ] Criar schema Drizzle `class_students` (classId, studentId) — relação N:N
- [ ] Gerar e aplicar migration
- [ ] Criar `class.repository.ts` — CRUD + `addStudent`, `addTeacher`, `removeStudent`
- [ ] Criar `class.schema.ts` — schemas Zod de input/output
- [ ] Criar `class.service.ts` — regras: aluno não pode estar em duas turmas no mesmo período
- [ ] Criar `class.routes.ts` — CRUD em `/classes` + `POST /classes/:id/students`, `POST /classes/:id/teachers`
- [ ] Criar `academic-period.routes.ts` — CRUD em `/academic-periods`
- [ ] Registrar rotas em `app.ts`

---

## Fase 6 — Academic (Notas e Frequência)

> Depende de: Fase 3, Fase 4, Fase 5.

- [ ] Criar schema Drizzle `grades` (id, schoolId, classId, studentId, teacherId, subject, value, period, createdAt)
- [ ] Criar schema Drizzle `attendances` (id, schoolId, classId, studentId, date, present)
- [ ] Gerar e aplicar migration
- [ ] Criar `grade.repository.ts` — `upsertGrade`, `findByStudent`, `findByClass`
- [ ] Criar `attendance.repository.ts` — `upsertAttendance`, `findByStudent`, `findByClass`, `findByDate`
- [ ] Criar `grade.service.ts` — `registerGrade`, `getStudentReport` (boletim)
- [ ] Criar `attendance.service.ts` — `registerAttendance`, `getAttendanceSummary`
- [ ] Criar `grade.routes.ts` — `POST /grades`, `GET /students/:id/grades`
- [ ] Criar `attendance.routes.ts` — `POST /attendances`, `GET /students/:id/attendances`
- [ ] Registrar rotas em `app.ts`

---

## Fase 7 — Financial

> Depende de: Fase 3.

- [ ] Criar schema Drizzle `tuitions` (id, schoolId, studentId, amount, dueDate, paidAt, status, createdAt)
- [ ] Gerar e aplicar migration
- [ ] Criar `tuition.repository.ts` — `findAll`, `findByStudent`, `create`, `markAsPaid`
- [ ] Criar `tuition.schema.ts` — schemas Zod de input/output
- [ ] Criar `tuition.service.ts` — `listTuitions`, `createTuition`, `registerPayment`
- [ ] Criar `tuition.routes.ts` — `GET /tuitions`, `POST /tuitions`, `PATCH /tuitions/:id/pay`
- [ ] Registrar rotas em `app.ts`
