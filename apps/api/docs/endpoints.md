# API Endpoints Guide

Este documento complementa o OpenAPI em `apps/api/docs/openapi.yaml` com uma visão rápida para o time.

## Base URL

- Local: `http://localhost:3333`

## JWT e Multi-tenant

- Login retorna `accessToken`.
- Payload do token:
  - `userId`
  - `schoolId`
  - `role` (`admin` | `gestor` | `professor`)
- Endpoints multi-tenant usam `schoolId` do JWT (middleware de tenant).

## Matriz de autorização (RBAC)

| Endpoint | Admin | Gestor | Professor | Auth obrigatório |
|---|---|---|---|---|
| `GET /health` | Sim | Sim | Sim | Não |
| `POST /sessions` | Sim | Sim | Sim | Não |
| `POST /schools` | Sim | Sim | Sim | Não |
| `POST /schools/users/management` | Sim | Sim | Sim | Não |
| `POST /teachers` | Sim | Sim | Não | Sim (Bearer JWT) |

Observação: `POST /teachers` aplica `authorizeRoles(['admin', 'gestor'])`.

| `POST /school-classes` | Sim | Sim | Não | Sim (Bearer JWT) |
| `POST /subjects` | Sim | Sim | Não | Sim (Bearer JWT) |

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
