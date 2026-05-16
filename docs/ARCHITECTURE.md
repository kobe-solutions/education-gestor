# Arquitetura do Sistema — Education Gestor

## Visão Geral

Sistema multi-tenant de gestão escolar. Várias escolas operam na mesma instância, isoladas por `schoolId`. A entidade central é a **school** — tudo parte dela.

---

## Hierarquia de Usuários

```
Admin (plataforma)
└── Secretaria (regional / rede de escolas)
    └── Gestor (diretor da escola)
        └── Professor (docente)
```

---

## Tipos de Usuário

### Admin

- Usuário interno da plataforma (equipe Kobe).
- Acesso total ao sistema, sem restrição de escola.
- Gerencia secretarias: criar, vincular/desvincular escolas.
- **Não tem `schoolId` no JWT** — pode operar sobre qualquer escola.
- Criado diretamente no banco (sem endpoint público de cadastro).

**JWT payload:**
```ts
{ userId: string, role: 'admin' }
```

---

### Secretaria

- Representa uma regional, franquia ou rede de escolas.
- Pode gerenciar múltiplas escolas vinculadas a ela.
- Acesso às operações de professores, alunos, turmas, financeiro e acadêmico das escolas vinculadas.
- Criada apenas pelo **admin**.
- **Tem `secretariaId` no JWT**, mas não `schoolId` fixo — acessa escolas pela relação `secretaria_schools`.

**JWT payload:**
```ts
{ userId: string, secretariaId: string, role: 'secretaria' }
```

---

### Gestor

- Diretor ou coordenador de uma escola específica.
- Acesso restrito à própria escola (`schoolId` do JWT).
- Gerencia professores, alunos, turmas, disciplinas, financeiro e acadêmico.
- A entidade gestor **é a própria school** — o email/senha da escola é o login do gestor.

**JWT payload:**
```ts
{ userId: string, schoolId: string, role: 'gestor' }
```

---

### Professor

- Docente vinculado a uma escola.
- Acesso de leitura e escrita em notas e frequência das turmas que leciona.
- Acesso de leitura em alunos e turmas.
- **Não acessa** financeiro nem configurações da escola.

**JWT payload:**
```ts
{ userId: string, schoolId: string, role: 'professor' }
```

---

## Mapa de Permissões por Endpoint

| Recurso | admin | secretaria | gestor | professor |
|---|:---:|:---:|:---:|:---:|
| Secretarias (CRUD) | ✅ | — | — | — |
| Secretaria → listar/vincular escolas | ✅ | ✅ (própria) | — | — |
| Schools (criar) | ✅ | — | — | — |
| Professores (CRUD) | ✅ | ✅ | ✅ | — |
| Alunos (CRUD) | ✅ | ✅ | ✅ | — |
| Turmas (CRUD) | ✅ | ✅ | ✅ | — |
| Disciplinas (CRUD) | ✅ | — | ✅ | — |
| Períodos letivos | ✅ | ✅ | ✅ | — |
| Notas (leitura) | ✅ | ✅ | ✅ | ✅ |
| Notas (escrita) | ✅ | ✅ | ✅ | ✅ |
| Frequência (leitura) | ✅ | ✅ | ✅ | ✅ |
| Frequência (escrita) | ✅ | ✅ | ✅ | ✅ |
| Financeiro | ✅ | ✅ | ✅ | — |

---

## Multi-Tenancy

Estratégia: **shared schema com `schoolId`** em todas as tabelas de domínio.

- O `schoolId` é extraído do JWT e injetado via middleware `injectTenant` em todo request.
- O repository **sempre filtra por `schoolId`** — nunca retorna dados de outra escola.
- Admin não tem `schoolId` fixo: passa o `schoolId` via parâmetro de rota ou body quando necessário.
- Secretaria acessa escolas via tabela de relação `secretaria_schools`.

---

## Fluxo de Autenticação

```
POST /sessions
  → valida email/senha
  → busca em: admins → secretarias → schools (gestor) → teachers
  → assina JWT com payload do papel encontrado
  → retorna { accessToken }
```

O frontend salva o `accessToken` no `localStorage` e o envia em todo request via header `Authorization: Bearer <token>`.

---

## Middlewares de Acesso

Toda rota protegida passa pela cadeia:

```
authenticate → injectTenant → authorizeRoles([...])
```

| Middleware | Responsabilidade |
|---|---|
| `authenticate` | Verifica e decodifica o JWT |
| `injectTenant` | Valida que o payload tem `schoolId` ou `secretariaId` conforme o role |
| `authorizeRoles` | Rejeita com 403 se o role não está na lista permitida |

---

## Onboarding — Ordem de Criação

A criação de entidades segue uma ordem obrigatória:

1. **Admin** — criado manualmente no banco
2. **School** (gestor) — criada pelo admin ou pelo endpoint público de onboarding
3. **Secretaria** — criada pelo admin; vincula escolas após criação
4. **Teachers** — criados pelo gestor ou secretaria, sempre com `schoolId`
5. **Students** — criados pelo gestor ou secretaria
6. **SchoolClasses** — turmas criadas pelo gestor
7. **AcademicPeriods** — períodos letivos criados pelo gestor
