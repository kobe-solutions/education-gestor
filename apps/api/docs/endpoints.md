# API Endpoints Guide

Este documento complementa o OpenAPI em `apps/api/docs/openapi.yaml` com uma visão rápida para o time.

## Base URL

- Local: `http://localhost:3333`

## JWT e Multi-tenant

- Login retorna `accessToken`.
- Payload do token (union type):
  - Admin: `{ userId, role: 'admin' }`
  - Secretaria: `{ userId, secretariaId, role: 'secretaria' }`
  - Gestor/Professor: `{ userId, schoolId, role: 'gestor' | 'professor' }`
- Endpoints multi-tenant usam `schoolId` do JWT (middleware de tenant).

## Resumo de Todos os Endpoints

| Módulo | Endpoints |
|---|---|
| Auth | `POST /sessions` |
| Schools | `POST /schools`, `GET /schools`, `GET /schools/:id`, `PUT /schools/:id`, `DELETE /schools/:id` |
| Secretarias | `POST /secretarias`, `GET /secretarias/:id/schools`, `POST /secretarias/:id/schools`, `DELETE /secretarias/:id/schools/:schoolId` |
| Teachers | `GET /teachers`, `POST /teachers`, `GET /teachers/:id`, `PUT /teachers/:id`, `DELETE /teachers/:id` |
| Students | `GET /students`, `POST /students`, `GET /students/:id`, `PUT /students/:id`, `DELETE /students/:id` |
| Guardians | `GET /students/:id/guardians`, `POST /students/:id/guardians` |
| School Classes | `GET /school-classes`, `POST /school-classes`, `GET /school-classes/:id`, `PUT /school-classes/:id`, `DELETE /school-classes/:id` |
| Class Members | `POST /school-classes/:id/students`, `DELETE /school-classes/:classId/students/:studentId`, `POST /school-classes/:id/teachers` |
| Academic Periods | `GET /academic-periods`, `POST /academic-periods`, `PUT /academic-periods/:id`, `DELETE /academic-periods/:id` |
| Academic Years | `GET /academic-years`, `POST /academic-years` |
| Subjects | `GET /subjects`, `POST /subjects`, `PUT /subjects/:id`, `DELETE /subjects/:id` |
| Education Levels | `GET /education-levels`, `POST /education-levels`, `PUT /education-levels/:id`, `DELETE /education-levels/:id` |
| Series | `GET /series`, `POST /series`, `PUT /series/:id`, `DELETE /series/:id` |
| Class Periods | `GET /class-periods`, `POST /class-periods` |
| Timetable | `GET /timetable-slots`, `POST /timetable-slots`, `PUT /timetable-slots/:id`, `DELETE /timetable-slots/:id` |
| Grades | `POST /grades`, `GET /students/:id/grades`, `GET /school-classes/:id/grades` |
| Attendances | `POST /attendances`, `POST /attendances/bulk`, `GET /students/:id/attendances`, `GET /school-classes/:id/attendances` |
| Financial | `GET /tuitions`, `POST /tuitions`, `GET /students/:id/tuitions`, `PATCH /tuitions/:id/pay` |
| Dashboard | `GET /dashboard` |
| Audit | `GET /audit-logs` |
| Health | `GET /health` |

## Matriz de autorização (RBAC)

| Endpoint | Admin | Secretaria | Gestor | Professor | Auth obrigatório |
|---|---|---|---|---|---|
| `GET /health` | Sim | Sim | Sim | Sim | Não |
| `POST /sessions` | Sim | Sim | Sim | Sim | Não |
| `POST /schools` | Sim | — | — | — | Sim |
| `POST /secretarias` | Sim | — | — | — | Sim |
| `GET/POST /teachers` | Sim | Sim | Sim | — | Sim |
| `GET/POST /students` | Sim | Sim | Sim | — | Sim |
| `GET/POST /school-classes` | Sim | Sim | Sim | — | Sim |
| `GET/POST /subjects` | Sim | — | Sim | — | Sim |
| `GET/POST /academic-periods` | Sim | Sim | Sim | — | Sim |
| `GET/POST /education-levels` | Sim | — | Sim | — | Sim |
| `GET/POST /series` | Sim | — | Sim | — | Sim |
| `POST /grades` | Sim | Sim | Sim | Sim | Sim |
| `POST /attendances` | Sim | Sim | Sim | Sim | Sim |
| `GET/POST /tuitions` | Sim | Sim | Sim | — | Sim |
| `GET /dashboard` | Sim | Sim | Sim | Sim | Sim |
| `GET /audit-logs` | Sim | — | — | — | Sim |

## Endpoints

### GET /health

Retorna status da API.

Response `200`:

```json
{
  "status": "ok"
}
```

### POST /sessions

Login único para `admin`, `gestor` e `professor`.

Request:

```json
{
  "email": "admin@education.com",
  "password": "change-me-now"
}
```

Response `200`:

```json
{
  "accessToken": "jwt-token"
}
```

Erros:
- `400` Validation error
- `401` Invalid credentials

### POST /schools

Cria usuário gestor (school).

Request:

```json
{
  "name": "School Alpha",
  "slug": "school-alpha",
  "email": "gestor@school-alpha.com",
  "password": "12345678"
}
```

Response `201`:

```json
{
  "id": "uuid",
  "name": "School Alpha",
  "slug": "school-alpha",
  "email": "gestor@school-alpha.com",
  "role": "gestor"
}
```

Erros:
- `400` Validation error
- `409` School already exists with this slug or email

### POST /schools/users/management

Alias de `POST /schools` (mesmo contrato e mesmas respostas).

### POST /teachers

Cria professor na school do token autenticado.

Headers:

```http
Authorization: Bearer <accessToken>
```

Request:

```json
{
  "name": "Teacher One",
  "email": "teacher@school-alpha.com",
  "password": "12345678"
}
```

Response `201`:

```json
{
  "id": "uuid",
  "schoolId": "uuid",
  "name": "Teacher One",
  "email": "teacher@school-alpha.com",
  "role": "professor",
  "createdAt": "2026-04-20T12:00:00.000Z"
}
```

Erros:
- `400` Validation error
- `401` Unauthorized
- `403` Forbidden
- `409` Teacher already exists with this email

## POST /school-classes

Cria uma turma na `school` do token autenticado.

Request:
```json
{
  "name": "Turma 101",
  "shift": "Matutino",
  "grade": "1º Ano",
  "termTime": "2026-1"
}
```

Response `201`:
```json
{
  "id": "uuid",
  "schoolId": "uuid",
  "name": "Turma 101",
  "grade": "1º Ano",
  "shift": "Matutino",
  "termTime": "2026-1",
  "createdAt": "2026-04-20T12:00:00.000Z"
}
```

Erros:
- `400` Validation error
- `401` Unauthorized
- `403` Forbidden

## POST /subjects

Cria uma disciplina na `school` do token autenticado.

Request:
```json
{
  "name": "Matemática",
  "code": "MAT101",
  "weeklyHours": 4
}
```

Response `201`:
```json
{
  "id": "uuid",
  "schoolId": "uuid",
  "name": "Matemática",
  "code": "MAT101",
  "weeklyHours": 4,
  "createdAt": "2026-04-20T12:00:00.000Z"
}
```

Erros:
- `400` Validation error
- `401` Unauthorized
- `403` Forbidden
- `409` Subject already exists with this name | Subject already exists with this code
