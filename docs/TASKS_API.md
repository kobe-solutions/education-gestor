# Tasks — API

Ordem de execução: as fases são sequenciais. Dentro de cada fase, as tarefas podem ser feitas em paralelo salvo indicação de dependência.

---

## Fase 1 — Schools (âncora do multi-tenant)

> Deve ser a primeira a existir. Toda outra entidade depende de `schoolId`.

- [x] Criar schema Drizzle `schools` (id, name, slug, createdAt, updatedAt) — _implementado com campos extras: email, passwordHash, role_
- [x] Gerar e aplicar migration
- [x] Criar `school.repository.ts` — `findById`, `findBySlug`, `create`
- [x] Criar `school.schema.ts` — schemas Zod de input/output
- [x] Criar `school.service.ts` — `createSchool`, `getSchoolBySlug`
- [x] Criar `school.routes.ts` — `POST /schools`, `GET /schools/:slug`
- [x] Registrar rotas em `app.ts`

---

## Fase 2 — Auth

> Depende de: Fase 1 (precisa de `schoolId` no JWT).

- [ ] Criar schema Drizzle `users` (id, schoolId, name, email, passwordHash, role, createdAt) — _não criado; gestores usam a tabela `schools`, admins usam a tabela `admins`_
- [x] Gerar e aplicar migration
- [ ] Criar `auth.repository.ts` — `findByEmail`, `create` — _não existe; service consulta diretamente_
- [x] Criar `auth.schema.ts` — schemas Zod para login e register
- [x] Instalar e configurar `bcrypt` para hash de senha
- [x] Criar `auth.service.ts` — `login`, geração do JWT `{ userId, schoolId, role }`
- [x] Criar `auth.routes.ts` — `POST /sessions` — _endpoint usa `/sessions`; não há rota de register_
- [x] Registrar rotas em `app.ts`
- [x] Declarar `FastifyRequest` augmentation com tipo do `user` (userId, schoolId, role)

---

## Fase 2b — Secretarias (adicionado)

> Entre admin e gestor. Uma secretaria gerencia N escolas. Sem schoolId fixo no JWT — usa secretariaId.

- [x] Criar schema Drizzle `secretarias` (id, name, email, passwordHash, role, createdAt, updatedAt)
- [x] Criar schema Drizzle `secretaria_schools` (id, secretariaId, schoolId, createdAt) — relação N:N
- [x] Gerar migration `0008_chief_greymalkin.sql`
- [ ] Aplicar migration (requer banco ativo)
- [x] Criar `secretarias.repository.ts` — `create`, `findByEmail`, `findById`, `addSchool`, `removeSchool`, `findSchools`, `findLink`
- [x] Criar `secretarias.service.ts` — `createSecretaria`, `addSchoolToSecretaria`, `removeSchoolFromSecretaria`, `listSchools`
- [x] Criar `secretarias.schema.ts` — schemas Zod de input/output
- [x] Criar `secretarias.routes.ts` — `POST /secretarias`, `GET/POST /secretarias/:id/schools`, `DELETE /secretarias/:id/schools/:schoolId`
- [x] Registrar rotas em `app.ts`
- [x] Atualizar `authorize.ts` — JWT union type: `AdminPayload | SecretariaPayload | TenantPayload`
- [x] Atualizar `tenant.ts` — tratamento por role
- [x] Criar `requireSchool.ts` — valida acesso a rotas com `:schoolId` param por role
- [x] Atualizar `auth.service.ts` — lookup em secretarias antes de schools

---

## Fase 2c — Admins (adicionado)

> Provisionamento de admins via CLI; sem endpoint público.

- [x] Criar schema Drizzle `admins` (id, name, email, passwordHash, role, createdAt, updatedAt)
- [x] Criar `admins.repository.ts`, `admins.service.ts`, `admins.schema.ts`, `admins.routes.ts`
- [x] Script `pnpm admin:provision` — cria admin via CLI sem expor endpoint

---

## Fase 2d — Subjects (adicionado)

> Disciplinas como entidade própria vinculada à escola.

- [x] Criar schema Drizzle `subjects`
- [x] Criar `subjects.repository.ts`, `subjects.service.ts`, `subjects.schema.ts`, `subjects.routes.ts`
- [x] Registrar rotas em `app.ts`

---

## Fase 3 — Students

> Depende de: Fase 1, Fase 2.

- [x] Criar schema Drizzle `students` (id, schoolId, name, email, birthDate, enrollmentCode, createdAt, updatedAt)
- [x] Criar schema Drizzle `guardians` (id, studentId, name, phone, relationship, createdAt)
- [x] Gerar migration `0009_faulty_boomerang.sql`
- [ ] Aplicar migration (requer banco ativo)
- [x] Criar `student.repository.ts` — `findAll`, `findById`, `findByEnrollmentCode`, `create`, `update`, `delete`, `createGuardian`, `findGuardians`
- [x] Criar `student.schema.ts` — schemas Zod de input/output
- [x] Criar `student.service.ts` — `listStudents`, `getStudent`, `createStudent`, `updateStudent`, `deleteStudent`, `addGuardian`, `listGuardians`
- [x] Criar `student.routes.ts` — `GET/POST /students`, `GET/PUT/DELETE /students/:id`, `GET/POST /students/:id/guardians`
- [x] Registrar rotas em `app.ts`

---

## Fase 4 — Teachers

> Depende de: Fase 1, Fase 2.

- [x] Criar schema Drizzle `teachers` (id, schoolId, name, email, passwordHash, role, createdAt, updatedAt)
- [x] Gerar e aplicar migration
- [x] Criar `teacher.repository.ts` — CRUD completo + `findTeachersByEmail`
- [x] Criar `teacher.schema.ts` — schemas Zod de input/output
- [x] Criar `teacher.service.ts` — CRUD completo
- [x] Criar `teacher.routes.ts` — `GET/POST /teachers`, `GET/PUT/DELETE /teachers/:id`
- [x] Registrar rotas em `app.ts`

---

## Fase 5 — Classes (Turmas)

> Depende de: Fase 1, Fase 2, Fase 4.
> Nota: arquivos usam prefixo `schoolClasses`. Endpoint é `/school-classes`.

- [x] Criar schema Drizzle `academic_periods` (id, schoolId, name, startDate, endDate, active, createdAt, updatedAt)
- [x] Criar schema Drizzle `schoolClasses` (id, schoolId, name, grade, shift, termTime, createdAt, updatedAt)
- [x] Criar schema Drizzle `class_teachers` (id, classId, teacherId, createdAt) — relação N:N
- [x] Criar schema Drizzle `class_students` (id, classId, studentId, createdAt) — relação N:N
- [x] Gerar migration `0009_faulty_boomerang.sql`
- [ ] Aplicar migration (requer banco ativo)
- [x] Criar `schoolClasses.repository.ts` — CRUD + `addTeacher`, `addStudent`, `removeStudent`, `findTeachers`, `findStudents`
- [x] Criar `schoolClasses.schema.ts` — schemas Zod de input/output
- [x] Criar `schoolClasses.service.ts` — CRUD + `addTeacherToClass`, `addStudentToClass`, `removeStudentFromClass`
- [x] Criar `schoolClasses.routes.ts` — CRUD em `/school-classes` + membros
- [x] Criar `academicPeriods.repository.ts`, `academicPeriods.service.ts`, `academicPeriods.schema.ts`
- [x] Criar `academicPeriods.routes.ts` — CRUD em `/academic-periods`
- [x] Registrar rotas em `app.ts`

---

## Fase 6 — Academic (Notas e Frequência)

> Depende de: Fase 3, Fase 4, Fase 5.

- [x] Criar schema Drizzle `grades` (id, schoolId, classId, studentId, teacherId, subject, value, period, createdAt, updatedAt)
- [x] Criar schema Drizzle `attendances` (id, schoolId, classId, studentId, date, present, createdAt)
- [x] Gerar migration `0009_faulty_boomerang.sql`
- [ ] Aplicar migration (requer banco ativo)
- [x] Criar `academic.repository.ts` — `upsertGrade`, `findGradesByStudent`, `findGradesByClass`, `upsertAttendance`, `findAttendancesByStudent`, `findAttendancesByClassAndDate`
- [x] Criar `academic.service.ts` — `registerGrade`, `getStudentGrades`, `getClassGrades`, `registerAttendance`, `registerBulkAttendance`, `getStudentAttendances`, `getClassAttendanceByDate`
- [x] Criar `academic.routes.ts` — `POST /grades`, `GET /students/:id/grades`, `GET /school-classes/:id/grades`, `POST /attendances`, `POST /attendances/bulk`, `GET /students/:id/attendances`, `GET /school-classes/:id/attendances?date=`
- [x] Registrar rotas em `app.ts`

---

## Fase 7 — Financial

> Depende de: Fase 3.

- [x] Criar schema Drizzle `tuitions` (id, schoolId, studentId, amount, dueDate, paidAt, status, createdAt, updatedAt)
- [x] Gerar migration `0009_faulty_boomerang.sql`
- [ ] Aplicar migration (requer banco ativo)
- [x] Criar `financial.repository.ts` — `findAll`, `findByStudent`, `findById`, `create`, `markAsPaid`
- [x] Criar `financial.schema.ts` — schemas Zod de input/output
- [x] Criar `financial.service.ts` — `listTuitions`, `listStudentTuitions`, `createTuition`, `registerPayment`
- [x] Criar `financial.routes.ts` — `GET /tuitions`, `GET /students/:id/tuitions`, `POST /tuitions`, `PATCH /tuitions/:id/pay`
- [x] Registrar rotas em `app.ts`
