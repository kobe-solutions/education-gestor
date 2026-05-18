# Débitos Técnicos — Rotas de API Pendentes

> Contexto: o protótipo IRIS (`docs/new_design_iris/`) prevê interações que **não têm endpoint correspondente** na API atual. Este documento lista cada débito, a tela que o consome e o contrato mínimo esperado.

---

## #1 — Dashboard: endpoint de métricas agregadas

**Tela:** `DashboardPage`  
**Bloqueia:** Fase 4 do roadmap de design

### Problema
Atualmente não existe nenhum endpoint que retorne os KPIs da tela inicial. O frontend precisaria fazer 6+ chamadas separadas para montar o dashboard.

### Contrato esperado
```
GET /dashboard/summary
Authorization: Bearer <token>

Response 200:
{
  "studentsCount": 412,
  "teachersCount": 28,
  "classesCount": 18,
  "tuitions": {
    "pending":  { "count": 34, "total": 33320.00 },
    "paid":     { "count": 198, "total": 194040.00 },
    "overdue":  { "count": 12, "total": 11760.00 }
  },
  "upcomingTuitions": [          // vencendo em 7 dias
    {
      "id": "uuid",
      "studentName": "...",
      "className": "...",
      "dueDate": "2026-05-20",
      "amount": 980.00,
      "status": "pending"
    }
  ]
}
```

### Onde implementar
`apps/api/src/modules/dashboard/` — novo módulo, query aggregada usando `COUNT` e `SUM` filtrados por `schoolId`.

---

## #2 — Header: dados do usuário autenticado ✅

**Tela:** `AppLayout` (header)  
**Bloqueia:** Fase 2

### Solução implementada
Campo `name` adicionado ao payload do JWT para todos os tipos de usuário (`admin`, `secretaria`, `gestor`, `professor`). Queries de auth atualizadas nos respectivos repositories. Tipo `JwtPayload` em `packages/types` atualizado.

---

## #3 — Alunos: responsáveis / família

**Tela:** `StudentDetailPage` → aba "Família & responsáveis"  
**Bloqueia:** Fase 7.2

### Problema
Não existe tabela de responsáveis/guardiões vinculados a alunos. A aba de família não pode ser construída.

### Contrato esperado
```
GET    /students/:id/guardians
POST   /students/:id/guardians      body: { name, cpf, phone, email, relationship, isResponsible }
DELETE /students/:id/guardians/:gid
```

### Schema de banco necessário
Nova tabela `student_guardians`:
```sql
id          uuid PK
student_id  uuid FK → students.id
school_id   uuid FK → schools.id
name        text NOT NULL
cpf         varchar(14)
phone       varchar(20)
email       varchar(255)
relationship text
is_responsible boolean DEFAULT false
created_at  timestamptz
```

---

## #4 — Alunos: ficha médica

**Tela:** `StudentDetailPage` → aba "Ficha médica"  
**Bloqueia:** Fase 7.2

### Contrato esperado
```
GET  /students/:id/medical
PUT  /students/:id/medical
body: {
  allergies: string,
  medications: string,
  foodRestrictions: string,
  diseases: string,
  bloodType: string,
  medicalContact: string
}
```

### Schema de banco necessário
Nova tabela `student_medical` (1:1 com students):
```sql
id               uuid PK
student_id       uuid FK UNIQUE → students.id
school_id        uuid FK → schools.id
allergies        text
medications      text
food_restrictions text
diseases         text
blood_type       varchar(5)
medical_contact  text
updated_at       timestamptz
```

---

## #5 — Alunos: documentos

**Tela:** `StudentDetailPage` → aba "Documentos"  
**Bloqueia:** Fase 7.2

### Contrato esperado
```
GET    /students/:id/documents
POST   /students/:id/documents     multipart: file + { label, type }
DELETE /students/:id/documents/:did
```

### Observação
Exige estratégia de armazenamento de arquivos (S3, MinIO, ou disco local com Caddy serving). Débito maior — discutir antes de implementar.

---

## #6 — Mensalidades: ações de gestão

**Tela:** `TuitionsPage`  
**Bloqueia:** Fase 8

### Problema
O endpoint `POST /tuitions` pode não existir ou não ter os campos corretos. Também falta `PATCH /tuitions/:id/pay` para registrar pagamento.

### Contrato esperado
```
POST /tuitions
body: { studentId, amount, dueDate, description? }

PATCH /tuitions/:id/pay
body: { paidAt?: string }   // default: now()
Response: atualiza status → "paid"
```

---

## #7 — Grade Horária: locação de aulas

**Tela:** `LocacaoPage` (drag-drop timetable)  
**Bloqueia:** Fase 9.2

### Problema
O módulo `timetable` existe na API, mas precisa de endpoints para:
- Listar slots disponíveis por turma
- Alocar professor + disciplina em um slot
- Remover alocação

### Contrato esperado
```
GET  /timetable/classes/:classId/slots
Response: {
  slots: [
    { day: "mon", period: "p1", startTime: "07:30", endTime: "08:20",
      allocation: { teacherId, teacherName, subjectId, subjectName } | null }
  ]
}

POST /timetable/classes/:classId/slots/:slotId/allocate
body: { teacherId, subjectId }

DELETE /timetable/classes/:classId/slots/:slotId/allocate
```

---

## #8 — Notas & Boletim

**Tela:** Hub Acadêmico → "Notas & Boletim"  
**Bloqueia:** Fase 6 (card desabilitado) e futura implementação

### Contrato esperado (esboço)
```
GET  /grades?classId=&bimestre=
POST /grades       body: { studentId, subjectId, bimestre, value }
GET  /grades/report/:studentId   // boletim completo do aluno
```

---

## #9 — Frequência

**Tela:** Hub Acadêmico → "Frequência"  
**Bloqueia:** Fase 6 (card desabilitado)

### Contrato esperado (esboço)
```
GET  /attendance?classId=&date=
POST /attendance/batch
body: { classId, date, records: [{ studentId, present: boolean }] }
```

---

## #10 — Professores: disciplinas vinculadas ✅

**Tela:** PessoasHub → painel Professores  
**Bloqueia:** Fase 5

### Solução implementada
Nova tabela `teacher_subjects` (migration `0021_teacher_subjects.sql`). `GET /teachers` e `GET /teachers/:id` agora retornam `subjects: [{ id, name, code }]`. Novas rotas:
- `POST /teachers/:id/subjects` — body `{ subjectId }`
- `DELETE /teachers/:id/subjects/:subjectId`

---

## Prioridade de implementação

| # | Débito | Esforço | Impacto visual |
|---|--------|---------|----------------|
| 2 | Nome do usuário no JWT | Baixo | Alto (header em toda a app) |
| 1 | Dashboard summary | Médio | Alto (primeira tela) |
| 6 | Mensalidades ações | Baixo | Médio |
| 3 | Responsáveis do aluno | Médio | Médio |
| 7 | Grade horária | Alto | Médio |
| 4 | Ficha médica | Baixo | Baixo |
| 5 | Documentos do aluno | Alto* | Baixo |
| 10 | Teachers com subjects | Baixo | Baixo |
| 8 | Notas & Boletim | Alto | Baixo (por ora) |
| 9 | Frequência | Alto | Baixo (por ora) |

*\#5 é alto por exigir decisão de infraestrutura de storage.*
