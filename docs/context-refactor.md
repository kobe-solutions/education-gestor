# Context Refactor — Hierarquia Educacional Brasileira

> Documento de análise e planejamento para refatoração completa das entidades relacionadas à escola, seguindo a hierarquia real do sistema educacional brasileiro.

---

## 1. Estado Atual e Limitações

### Modelo de dados atual

```
School
  └── SchoolClass (turma)
        ├── grade: text       ← série como texto livre ("1", "2", "9º ano")
        ├── shift: text       ← turno
        ├── termTime: text    ← nome do período letivo como texto livre
        ├── classTeachers     ← N professores vinculados à turma (sem contexto de disciplina)
        └── classStudents     ← N alunos vinculados à turma

AcademicPeriod               ← período letivo (existe, mas turma só referencia pelo nome)
Subject                      ← disciplina cadastrada na escola (existe, mas sem vínculo com turma)

grades (notas)
  ├── subject: text          ← disciplina como texto livre (não FK para subjects)
  └── period: text           ← período como texto livre

attendances (frequência)
  └── date: date             ← sem vínculo com slot de horário específico
```

### Problemas identificados

| Problema | Impacto |
|---|---|
| `grade` é texto livre | Impossível filtrar por etapa/série, sem validação |
| `termTime` referencia período pelo nome | Quebra se o período for renomeado; sem FK |
| `classTeachers` vincula professor à turma sem disciplina | Não controla qual professor dá qual aula |
| `grades.subject` é texto | Sem rastreabilidade, sem vínculo com a disciplina cadastrada |
| `grades.period` é texto | Sem vínculo com período letivo real |
| Não existe entidade de nível de ensino | Impossível segmentar escola por Infantil/Fundamental/Médio |
| Não existe entidade de série estruturada | 1º ano do Fundamental ≠ 1º ano do Médio — ambíguo |
| Não existe grade de horários (timetable) | Impossível montar grade horária por turma |
| Sem controle de alocação de professor por slot | Um professor pode ser escalado em dois lugares ao mesmo tempo |

---

## 2. Hierarquia Educacional Brasileira

```
School
  └── EducationLevel (nível/etapa)
        ├── Exemplos: Educação Infantil, Ensino Fundamental 1, Ensino Fundamental 2,
        │            Ensino Médio, Ensino Técnico, Ensino Superior
        └── Serie (série/ano dentro do nível)
              ├── Exemplos: 1º ano, 2º ano, ... 9º ano (dentro do nível específico)
              └── Turma (N turmas por série)
                    ├── Alunos (N)
                    ├── AcademicPeriod (contexto de quando existe)
                    └── TimetableSlot (grade de horários)
                          ├── weekDay: segunda–sexta (ou sábado)
                          ├── startTime / endTime
                          ├── Subject (1 disciplina por slot)
                          └── Teacher (1 professor alocado naquele slot)
```

### Tipos de nível de ensino (`education_level_type`)

```
infantil_creche          → Creche (0–3 anos)
infantil_pre_escola      → Pré-escola (4–5 anos)
fundamental_1            → Ensino Fundamental 1 (1º–5º ano)
fundamental_2            → Ensino Fundamental 2 (6º–9º ano)
medio                    → Ensino Médio (1º–3º ano)
tecnico                  → Ensino Técnico
superior                 → Ensino Superior
```

### Modalidades (podem se sobrepor ao nível)

```
eja                      → Educação de Jovens e Adultos
integral                 → Ensino em tempo integral
profissionalizante       → Ensino Profissionalizante
especial                 → Educação Especial
```

> Uma escola pode oferecer múltiplos níveis e modalidades. Cada nível/modalidade tem suas próprias séries e turmas.

---

## 3. Novo Modelo de Dados (DB Schema)

### 3.1 Tabelas novas

#### `education_levels`

```ts
export const educationLevels = pgTable('education_levels', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  type: text('type').notNull(),          // enum: infantil_creche, fundamental_1, ...
  modality: text('modality'),            // enum opcional: eja, integral, especial, ...
  name: text('name').notNull(),          // nome customizado, ex: "Ensino Fundamental 1 - Integral"
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
```

#### `series`

```ts
export const series = pgTable('series', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  educationLevelId: uuid('education_level_id').notNull().references(() => educationLevels.id),
  name: text('name').notNull(),          // "1º ano", "2º ano", "3ª série"
  order: integer('order').notNull(),     // para ordenação na UI
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
```

#### `timetable_slots`

```ts
export const timetableSlots = pgTable('timetable_slots', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  classId: uuid('class_id').notNull().references(() => schoolClasses.id, { onDelete: 'cascade' }),
  academicPeriodId: uuid('academic_period_id').notNull().references(() => academicPeriods.id),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id),
  teacherId: uuid('teacher_id').notNull().references(() => teachers.id),
  weekDay: text('week_day').notNull(),   // 'monday' | 'tuesday' | ... | 'saturday'
  startTime: text('start_time').notNull(), // "07:30"
  endTime: text('end_time').notNull(),     // "08:20"
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  // impede o mesmo professor em dois slots sobrepostos no mesmo dia/período
  uniqueTeacherSlot: uniqueIndex('timetable_teacher_unique').on(
    table.teacherId, table.weekDay, table.startTime, table.academicPeriodId
  ),
}))
```

### 3.2 Tabelas modificadas

#### `schoolClasses` — migrar `grade` e `termTime`

| Campo atual | Ação | Substituto |
|---|---|---|
| `grade: text` | Remover após migração | `serieId: uuid` → FK para `series` |
| `termTime: text` | Remover após migração | `academicPeriodId: uuid` → FK para `academic_periods` |
| `shift`, `name` | Manter | sem alteração |

Nova estrutura:

```ts
export const schoolClasses = pgTable('schoolClasses', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  serieId: uuid('serie_id').notNull().references(() => series.id),
  academicPeriodId: uuid('academic_period_id').notNull().references(() => academicPeriods.id),
  name: text('name').notNull(),     // "Turma A", "Turma B"
  shift: text('shift').notNull(),   // manhã | tarde | noite | integral
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
```

#### `grades` (notas) — vincular a entidades reais

| Campo atual | Ação | Substituto |
|---|---|---|
| `subject: text` | Remover | `subjectId: uuid` → FK para `subjects` |
| `period: text` | Remover | `academicPeriodId: uuid` → FK para `academic_periods` |
| `teacherId` | Manter | sem alteração |
| `timetableSlotId` | Adicionar (opcional) | referência ao slot que gerou a nota |

#### `classTeachers` — remover

A tabela `class_teachers` torna-se redundante: a relação professor ↔ turma ↔ disciplina já está modelada em `timetable_slots`. Remover após migração.

> **Atenção**: `classStudents` permanece — alunos ainda são vinculados à turma sem contexto de disciplina.

### 3.3 Tabelas sem alteração

- `schools`, `secretarias`, `admins` — sem mudança
- `students`, `teachers` — sem mudança estrutural
- `subjects` — sem mudança
- `academic_periods` — sem mudança
- `financial` (tuitions) — sem mudança
- `attendances` — considerar adicionar `timetableSlotId` opcional no futuro (pós-refactor)

---

## 4. Mudanças na API

### 4.1 Módulos novos

#### `education-levels` — CRUD completo

```
POST   /education-levels              → cria nível (gestor/secretaria)
GET    /education-levels              → lista níveis da escola
GET    /education-levels/:id          → detalhe
PUT    /education-levels/:id          → edita
DELETE /education-levels/:id          → remove (se não houver séries vinculadas)
```

#### `series` — CRUD completo

```
POST   /series                        → cria série (vinculada a education-level)
GET    /series?educationLevelId=:id   → lista séries de um nível
GET    /series/:id                    → detalhe
PUT    /series/:id                    → edita
DELETE /series/:id                    → remove (se não houver turmas vinculadas)
```

#### `timetable` — CRUD + validação de conflito

```
POST   /timetable-slots               → cria slot (valida conflito de professor)
GET    /timetable-slots?classId=:id   → grade horária de uma turma
PUT    /timetable-slots/:id           → edita (revalida conflito)
DELETE /timetable-slots/:id           → remove slot
```

Validação de conflito no service:
```
Dado: teacherId + weekDay + startTime + academicPeriodId
→ consultar se já existe outro slot com essa combinação
→ se existir: lançar erro 409 "Professor já alocado neste horário"
```

### 4.2 Módulos modificados

#### `classes` (schoolClasses)

- `POST /classes`: trocar `grade: string` + `termTime: string` por `serieId: uuid` + `academicPeriodId: uuid`
- `GET /classes`: retornar `serie` (com nome + nível) e `academicPeriod` (com nome) no join, não mais texto solto
- `GET /classes?serieId=:id`: filtro por série (novo)
- `GET /classes?educationLevelId=:id`: filtro por nível (novo)
- Remover lógica que referencia `classTeachers` para listagem de professores da turma (substituída por `timetableSlots`)

#### `academic` (grades e attendances)

- `POST /grades`: trocar `subject: string` + `period: string` por `subjectId: uuid` + `academicPeriodId: uuid`
- `GET /grades`: retornar disciplina e período como objetos, não strings
- Mesma mudança para `attendances` se `timetableSlotId` for adicionado

### 4.3 Módulos sem alteração significativa

- `auth`, `schools`, `secretarias`, `admins` — sem mudança
- `students`, `teachers` — sem mudança
- `subjects`, `academic-periods` — sem mudança
- `financial` — sem mudança
- `dashboard` — adicionar métricas de níveis/séries/turmas no futuro (pós-refactor)

---

## 5. Mudanças no Frontend

### 5.1 Páginas novas

#### `EducationLevelsPage` (`/education-levels`)

- Tabela: Tipo, Modalidade, Nome, Nº de Séries, Ativo
- Ações: criar, editar, excluir (com confirmação)
- Dialog de criação: `type` (select com enum), `modality` (select opcional), `name` (text)

#### `SeriesPage` (`/education-levels/:id/series` ou `/series`)

- Tabela: Nome, Nível, Ordem, Nº de Turmas
- Filtro por nível de ensino
- Dialog: `name`, `order`, `educationLevelId`

#### `TimetablePage` (`/classes/:id/timetable`)

- Visualização em grade semanal (segunda–sexta, opcionalmente sábado)
- Cada célula: disciplina + professor alocado
- Ações: adicionar slot, editar, remover
- Feedback visual de conflito de professor (highlight ou badge "conflito")

### 5.2 Páginas modificadas

#### `ClassesPage` + `ClassDialog`

- Campo `grade` (texto livre) → `serieId` (select populado pela query `GET /series`)
- Campo `termTime` (select por nome) → `academicPeriodId` (select populado por `GET /academic-periods`)
- Tabela: exibir nome da série e nome do período (join) em vez dos campos de texto
- Adicionar botão "Ver grade horária" → navega para `TimetablePage`

#### `GradesPage` + formulário de lançamento

- Campo `subject` (texto) → `subjectId` (select das disciplinas da escola)
- Campo `period` (texto) → `academicPeriodId` (select dos períodos)

#### `ClassDetailPage`

- Seção "Professores" atualmente lista `classTeachers` → substituir por professores extraídos dos `timetableSlots` (agrupados por disciplina)
- Adicionar link/aba "Grade horária"

#### `AppLayout` / Sidebar

- Adicionar item "Níveis de Ensino" (abaixo de "Disciplinas" ou em seção "Estrutura Escolar")
- Adicionar item "Séries" vinculado ao nível selecionado
- Rota `/classes/:id/timetable` acessível pelo detalhe da turma

### 5.3 Hooks novos

```
useEducationLevels()          GET /education-levels
useCreateEducationLevel()     POST /education-levels
useUpdateEducationLevel()     PUT /education-levels/:id
useDeleteEducationLevel()     DELETE /education-levels/:id

useSeries(educationLevelId?)  GET /series?educationLevelId=:id
useCreateSerie()              POST /series
useUpdateSerie()              PUT /series/:id
useDeleteSerie()              DELETE /series/:id

useTimetableSlots(classId)    GET /timetable-slots?classId=:id
useCreateTimetableSlot()      POST /timetable-slots
useUpdateTimetableSlot()      PUT /timetable-slots/:id
useDeleteTimetableSlot()      DELETE /timetable-slots/:id
```

### 5.4 Hooks modificados

```
useClasses()      → passar serieId e academicPeriodId nos dados retornados (não grade/termTime)
useCreateClass()  → input: serieId + academicPeriodId (não grade + termTime)
useUpdateClass()  → mesma mudança
```

---

## 6. Código a Remover Após o Refactor

| Artefato | Motivo da remoção |
|---|---|
| `schoolClasses.grade: text` | Substituído por `serieId` (FK) |
| `schoolClasses.termTime: text` | Substituído por `academicPeriodId` (FK) |
| `grades.subject: text` | Substituído por `subjectId` (FK) |
| `grades.period: text` | Substituído por `academicPeriodId` (FK) |
| `db/schema/classRelations.ts` → `classTeachers` | Substituído por `timetable_slots` |
| `modules/classes/schoolClasses.repository.ts` → queries que usam `termTime`/`grade` como string | Reescrever para joins |
| `modules/academic/academic.repository.ts` → queries que usam `subject`/`period` como string | Reescrever |
| `ClassDialog` → campos `grade` (input texto) e `termTime` (select por nome) | Substituir por selects de série e período |
| `GradesPage` → campos `subject` e `period` como texto | Substituir por selects |
| `ClassDetailPage` → seção que lista `classTeachers` | Substituir por view dos timetable slots |

---

## 7. Estratégia de Testes

> Os testes guiam o refactor: escrever o teste do novo comportamento antes de alterar o código.

### 7.1 Para cada entidade nova (EducationLevel, Serie, TimetableSlot)

**Testes unitários (service layer):**
- `createEducationLevelService`: valida tipo, unicidade por escola
- `createSerieService`: valida vínculo com education level
- `createTimetableSlotService`: valida conflito de professor (o mais crítico)
- `createTimetableSlotService`: permite mesmo professor em dias/horários diferentes
- `createTimetableSlotService`: permite dois professores diferentes no mesmo slot de turmas diferentes

**Testes de integração (route layer):**
- `POST /education-levels` → 201 com dados corretos
- `POST /series` → 201, retorna vínculo com nível
- `POST /timetable-slots` → 201 sem conflito
- `POST /timetable-slots` → 409 quando professor já alocado no mesmo horário/dia/período
- `GET /timetable-slots?classId=:id` → retorna slots com disciplina e professor expandidos

### 7.2 Para entidades modificadas (SchoolClasses, Grades)

**Antes de alterar:** garantir que os testes atuais de `classes` e `academic` cobrem o comportamento existente.

**Depois de alterar:** atualizar os testes para:
- `POST /classes` → aceitar `serieId` + `academicPeriodId` (não `grade` + `termTime`)
- `POST /classes` → rejeitar se `serieId` não existe ou não pertence à escola
- `POST /grades` → aceitar `subjectId` + `academicPeriodId`
- `GET /classes` → retornar `serie.name` e `academicPeriod.name` no objeto

### 7.3 Testes de regressão após remoção de código

- Após remover `classTeachers`: verificar que nenhum endpoint ainda retorna dados baseados nessa tabela
- Após remover campos de texto: verificar que seeds/factories não usam mais os campos removidos
- Após migração: rodar suite completa (`vitest run`) e confirmar 0 regressões

---

## 8. Plano de Migração

### Fase A — Estrutura nova, código antigo ainda funciona

1. Criar tabelas `education_levels`, `series`, `timetable_slots` (migration)
2. Adicionar colunas `serieId` e `academicPeriodId` em `schoolClasses` como **nullable** inicialmente
3. Adicionar colunas `subjectId` e `academicPeriodId` em `grades` como **nullable** inicialmente
4. Implementar módulos `education-levels`, `series`, `timetable` (API + Frontend) — novos endpoints, sem alterar os existentes
5. Testes dos novos módulos: devem passar antes de continuar

### Fase B — Migração dos dados existentes

6. Para ambiente de dev/staging: limpar dados de `schoolClasses` e `grades` (sistema ainda não tem dados reais de produção)
7. Para produção futura: script de migração que:
   - Cria levels/series padrão por escola
   - Vincula cada turma à série correta
   - Atualiza `schoolClasses.serieId` e `academicPeriodId`
   - Atualiza `grades.subjectId` e `academicPeriodId`

### Fase C — Tornar os campos novos obrigatórios

8. Migration: adicionar `NOT NULL` nas colunas `serieId`, `academicPeriodId` (após dados migrados)
9. Atualizar schemas Zod e validações da API
10. Atualizar formulários do frontend

### Fase D — Remoção do código legado

11. Migration: remover colunas `schoolClasses.grade`, `schoolClasses.termTime`, `grades.subject`, `grades.period`
12. Remover tabela `class_teachers`
13. Remover código morto identificado na Seção 6
14. Rodar suite de testes completa — deve passar integralmente

---

## 9. Ordem de Implementação Recomendada

```
1. education_levels   → API (CRUD) → Frontend (EducationLevelsPage)
2. series             → API (CRUD, filtro por level) → Frontend (SeriesPage)
3. schoolClasses      → migrar grade→serieId e termTime→academicPeriodId (Fase A→C)
4. timetable_slots    → API (CRUD + validação conflito) → Frontend (TimetablePage)
5. grades             → migrar subject→subjectId e period→academicPeriodId
6. classTeachers      → remover tabela e código após timetable_slots funcionar
7. código legado      → limpar campos e código morto (Fase D)
```

Cada item deve ter seus testes escritos e passando antes de avançar para o próximo.

---

## 10. Resumo de Impacto

| Camada | Impacto |
|---|---|
| DB (migrations) | 3 tabelas novas, 2 tabelas alteradas, 1 tabela removida, 4 colunas removidas |
| API (módulos) | 3 módulos novos, 2 módulos com breaking changes, restante intocado |
| Frontend (pages) | 3 páginas novas, 3 páginas com mudanças significativas, sidebar atualizada |
| Testes | ~25 novos testes unitários + integração para os módulos novos |
| Código removido | `classTeachers`, 4 colunas de texto livre, lógica de texto em queries |
