# Roadmap — Education Gestor

Atualizado em maio/2026. Separado por fase e por camada (API / Frontend).

---

## Estado atual — resumo

| Módulo | API | Frontend |
|---|---|---|
| Auth | ✅ | ✅ |
| Secretarias | ✅ CRUD completo | ✅ tabela + filtro + edição (visão admin) |
| Painel da Secretaria | ✅ X-School-Id + roles | ✅ SchoolContext + SchoolSelector + MySchoolsPage |
| Schools | ✅ CRUD completo + ownership secretaria | ✅ tabela + filtro + criação (secretaria) + edição + exclusão |
| Students | ✅ CRUD + guardians | ✅ |
| Teachers | ✅ CRUD | ✅ |
| Classes | ✅ CRUD + relações | ✅ |
| Subjects | ✅ CRUD completo | ✅ tabela + filtro + criação + edição + exclusão |
| Academic Periods | ✅ CRUD | ✅ tabela + badge ativo + criação + edição + exclusão |
| Grades | ✅ | ✅ |
| Attendance | ✅ | ✅ |
| Financial | ✅ | ✅ filtro por status + busca por aluno |
| Dashboard | ✅ métricas por role | ✅ cards + tabela de vencimentos |
| Testes API | ✅ 247 testes (unit + integração) | ✅ setup + 3 testes smoke |

---

## Fase 1 — Fechar gaps de API ✅

- [x] `GET /subjects`, `GET /subjects/:id`, `PUT /subjects/:id`, `DELETE /subjects/:id`
- [x] `GET /schools`, `GET /schools/:id`, `PUT /schools/:id`, `DELETE /schools/:id`
- [x] `PATCH /tuitions/:id` — atualizar valor e vencimento
- [x] `PUT /schools/:id/password`, `PUT /teachers/:id/password`, `PUT /secretarias/:id/password`

---

## Fase 2 — Gestão de Escolas e Disciplinas (Frontend) ✅

- [x] `SubjectsPage` — CRUD completo com filtro
- [x] `SchoolsPage` — CRUD completo com filtro (criação exclusiva da secretaria)
- [x] `AcademicPeriodsPage` — CRUD completo com badge ativo/inativo
- [x] Hooks correspondentes para todos os módulos acima
- [x] Rotas e itens de sidebar adicionados

---

## Fase 3 — Painel da Secretaria ✅

- [x] `injectTenant` lê `X-School-Id` e injeta `schoolId` para role `secretaria`
- [x] `SchoolContext` + `sessionStorage` + `setActiveSchool` / `clearActiveSchool`
- [x] Interceptor axios injeta `X-School-Id` automaticamente
- [x] `SchoolSelector` na topbar — troca escola e invalida queries
- [x] `MySchoolsPage` — escolas vinculadas com botão "Acessar"
- [x] Todas as rotas de gestão abertas para secretaria

---

## Fase 4 — UX e Integridade do Fluxo ✅

- [x] `useCreateSchool` + dialog de criação de escola (secretaria) com campos: Nome, Slug, Email, Senha, Diretor, Coordenador, Telefone, Endereço
- [x] Escola vinculada à secretaria via `secretariaSchools` automaticamente na criação
- [x] Toasts (`sonner`) em todos os mutations de criação, edição e exclusão
- [x] `AlertDialog` de confirmação em todas as exclusões
- [x] Busca por nome/matrícula em `StudentsPage`; busca por nome em `TeachersPage`
- [x] Filtro por status + busca por aluno em `TuitionsPage`
- [x] Link "Ver boletim" e seção de mensalidades em `StudentDetailPage`
- [x] Nome do aluno em `TuitionsPage` com link para `StudentDetailPage`
- [x] Skeletons de loading em todas as tabelas
- [x] Sidebar com destaque ativo via `startsWith` e itens condicionais por role

---

## Fase 5 — Dashboard ✅

- [x] `GET /dashboard` — métricas por role: admin (secretarias + escolas), gestor/secretaria (alunos, professores, turmas, mensalidades por status, próximos vencimentos em 7 dias)
- [x] `DashboardPage` — 6 cards de métricas com ícone e valor total; estado vazio para secretaria sem escola selecionada
- [x] Tabela "Vencendo nos próximos 7 dias" com link para perfil do aluno e badge de status

---

## Fase 6 — Testes ✅ (parcial)

- [x] Vitest configurado na API com `buildTestApp()`, helpers de token e setup
- [x] Testes unitários (service layer): `auth`, `students`, `teachers`, `financial`, `secretarias`, `academic`, `schools`, `subjects`, `academicPeriods`
- [x] Testes de integração (route layer): `auth`, `students`, `teachers`, `classes`, `financial`, `secretarias`, `academic`, `schools`, `subjects`, `academicPeriods`, `dashboard`
- [x] **247 testes passando**
- [x] Setup do frontend: Vitest + Testing Library + jsdom + `renderWithProviders` + mocks globais
- [ ] Testes unitários do frontend — componentes, schemas Zod, hooks
- [ ] Testes de integração do frontend — pages completas com MSW
- [ ] Testes E2E — Playwright (fluxos críticos: login, aluno, mensalidade, secretaria)

---

## Fase 7 — Produção e Qualidade

> Requisitos para o sistema ser utilizável em produção.

### API
- [ ] `@fastify/rate-limit` em `POST /sessions` — limitar tentativas de login (ex: 10 req/min por IP)
- [ ] Job de `overdue`: `UPDATE tuitions SET status = 'overdue' WHERE status = 'pending' AND due_date < NOW()` — cron no processo Node ou `pg_cron`
- [ ] Paginação em `GET /students`, `GET /teachers`, `GET /tuitions` — query params `page` + `limit`, resposta `{ data, total, page, limit }`
- [ ] Validação de sobreposição de datas em `POST /academic-periods`

### Frontend
- [ ] Code splitting por rota com `React.lazy` + `Suspense`
- [ ] Paginação nas tabelas de Students, Teachers e Tuitions (integrada com a API)
- [ ] Página 404 dedicada (atualmente redireciona silenciosamente para `/`)
- [ ] Verificação de expiração do JWT (`exp`) no `AuthContext` — logout automático sem depender do interceptor 401

### Infra / CI
- [ ] GitHub Actions — workflow de typecheck + build em todo PR
- [ ] `.env.example` da API com todas as variáveis documentadas
- [ ] Configurar Caddy — build estático do frontend + proxy reverso para API
- [ ] Script de deploy via SSH (ou `appleboy/ssh-action`)

---

## Resumo de prioridades

| Fase | Status | Impacto |
|---|---|---|
| Fase 1 — Gaps de API | ✅ Concluída | — |
| Fase 2 — Schools + Subjects + Periods | ✅ Concluída | — |
| Fase 3 — Painel da Secretaria | ✅ Concluída | — |
| Fase 4 — UX | ✅ Concluída | — |
| Fase 5 — Dashboard | ✅ Concluída | — |
| Fase 6 — Testes | 🔄 Em andamento | Médio — confiança em deploy |
| Fase 7 — Produção | ⏳ Pendente | Alto em prod |
