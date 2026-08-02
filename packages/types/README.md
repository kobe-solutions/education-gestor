# @education-gestor/types

Pacote de **tipos compartilhados** do monorepo Education Gestor. Serve como
*single source of truth* para os tipos de domínio usados tanto na **API**
(`apps/api`) quanto no **frontend** (`apps/web`).

> Regra do projeto: qualquer entidade, enum ou contrato de payload deve ser
> declarado aqui e importado pelos apps. Não duplicar tipos em `apps/*`.

---

## Estrutura

```
packages/types/
├── src/
│   └── index.ts       # Tipos e enums de domínio
├── package.json       # @education-gestor/types
└── tsconfig.json
```

O pacote exporta TypeScript **direto do fonte** (`main: ./src/index.ts`),
consumido via alias `@education-gestor/types` no pnpm workspace — não requer
build antes do uso em dev.

---

## Tipos exportados

### Autenticação / multi-tenancy

| Tipo | Descrição |
|---|---|
| `UserRole` | `'admin' \| 'gestor' \| 'professor' \| 'secretaria'` |
| `AdminPayload` | Payload JWT do admin (cross-tenant, `userId` + `role`) |
| `SecretariaPayload` | Payload JWT da secretaria (`userId`, `secretariaId`, `role`) |
| `TenantPayload` | Payload JWT de gestor/professor (`userId`, `schoolId`, `role`) |
| `JwtPayload` | União dos três payloads acima (o que `AuthContext` decodifica) |

### Domínio

| Tipo | Descrição |
|---|---|
| `School` | Escola (tenant). Campos de identidade + contato + logo |
| `Subject` | Disciplina |
| `Student` | Aluno com ficha completa (pessoal, endereço, responsáveis, matrícula) |
| `Guardian` | Responsável/autorizado do aluno |
| `StudentMedical` | Ficha médica do aluno |
| `StudentDocument` | Documento anexado do aluno |
| `Teacher` | Professor (dados pessoais, contrato, financeiro, foto) |
| `TeacherSubject` | Vínculo professor–disciplina |
| `TeacherDocument` | Documento anexado do professor |
| `SchoolClass` | Turma (série, período, professores e alunos resumidos) |
| `AcademicYear` | Ano letivo (datas de início/fim e matrícula) |
| `AcademicPeriod` | Período letivo (bimestre/trimestre/semestre) |
| `Grade` | Nota (aluno × disciplina × período) |
| `Attendance` | Registro de frequência |
| `Tuition` | Mensalidade (status, vencimento, pagamento) |
| `Secretaria` | Secretaria regional |

### Enums (unions de string)

| Enum | Valores |
|---|---|
| `EnrollmentStatus` | `active`, `inactive`, `transferred`, `cancelled` |
| `BloodType` | `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-` |
| `Sex` | `M`, `F`, `outro` |
| `DocumentType` | `historico`, `boletim`, `identidade`, `outros` |
| `TeacherDocumentType` | `diploma`, `certificado`, `registro`, `outros` |
| `ContractType` | `clt`, `temporario`, `horista` |
| `WorkShift` | `matutino`, `vespertino`, `noturno`, `integral` |
| `EmploymentStatus` | `ativo`, `inativo`, `licenca` |
| `PeriodType` | `bimestre`, `trimestre`, `semestre` |

> Os **labels** em PT-BR desses enums NÃO ficam aqui — vivem em
> `apps/web/src/lib/labels.ts` (frontend), mantendo o pacote agnóstico de UI.

---

## Como adicionar um novo tipo

1. Declare o tipo/enum em `src/index.ts` seguindo as convenções existentes.
2. Use `export interface`/`export type` (named exports, sem `default`).
3. Se é um enum de string usado em labels/UI, declare aqui e crie o label em
   `apps/web/src/lib/labels.ts`.
4. Rode `pnpm --filter @education-gestor/types build` para validar o `tsc`.

---

## Validação

```bash
pnpm --filter @education-gestor/types build
```
