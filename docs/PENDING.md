# Pendências — O que falta para o sistema funcionar

Este documento lista o que está incompleto, ausente ou quebrado no projeto atual.  
Classificado por criticidade: **Bloqueante** (sistema não sobe), **Funcional** (feature incompleta), **Melhoria** (não bloqueia mas deve ser resolvido).

---

## Bloqueante — Infraestrutura

### 1. Arquivo `.env` não existe
O arquivo `.env` foi ignorado pelo git. Sem ele, a API não sobe.

**O que criar** (`apps/api/.env`):
```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/education_gestor
JWT_SECRET=supersecretkey_change_in_production_minimum_32_chars
PORT=3333
NODE_ENV=development
```

### 2. Banco de dados não existe
Nenhuma instância PostgreSQL está rodando. As migrations não foram aplicadas.

**Requer:**
- Docker instalado
- `docker compose up -d` para subir o PostgreSQL
- `pnpm db:migrate` para aplicar as 10 migrations pendentes (0000 a 0009)

**Obs:** não há `docker-compose.yml` no projeto. Precisa ser criado.

### 3. Usuário admin não existe
Mesmo com o banco rodando, não há nenhum usuário para fazer login. O script de provisionamento (`admin:provision`) precisa ser rodado uma vez.

---

## Bloqueante — Backend

### 4. `docker-compose.yml` não existe
Referenciado implicitamente como forma de subir o PostgreSQL, mas o arquivo não foi criado.

**O que criar** (raiz do projeto):
```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: education_gestor
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## Funcional — Features incompletas

### 5. Onboarding de escola sem interface
`POST /schools` existe na API mas não há página de cadastro de escola no frontend. Não é possível criar uma escola pela interface — apenas via chamada direta à API.

**Afeta:** todo gestor precisa de uma escola criada antes de poder logar.

### 6. Módulo de Disciplinas (subjects) sem frontend
`POST /subjects` existe na API. Não há hook, página ou componente para gerenciar disciplinas. O campo `subject` nas notas é texto livre — não há validação contra uma lista de disciplinas.

### 7. Gestão de Períodos Letivos incompleta no frontend
A API tem CRUD completo para períodos letivos (GET, POST, PUT, DELETE por id). O frontend só usa `GET /academic-periods` e `POST /academic-periods` (dentro do `ClassDialog`). Não há página dedicada para listar/editar/excluir períodos.

### 8. Secretaria não consegue ver suas escolas após login
A `SecretariasPage` usa estado local (`useState`) para listar secretarias criadas na sessão atual — não há `GET /secretarias` na API. Uma secretaria logada vê um painel vazio porque não há query que busca sua lista de escolas na tela inicial.

**Workaround atual:** a secretaria logada (com `secretariaId` no JWT) consegue acessar `GET /secretarias/:id/schools`, mas a página não faz essa query automaticamente usando o `secretariaId` do payload.

### 9. Fluxo financeiro por aluno incompleto
`useStudentTuitions` e `GET /students/:id/tuitions` existem mas não há página `StudentFinancialPage`. O link de histórico financeiro do aluno não está conectado na `StudentDetailPage`.

### 10. Boletim do aluno não está linkado
`StudentReportPage` existe mas não há botão/link na `StudentDetailPage` que leve até ela. A rota `/students/:id/report` só é acessível por URL direta.

---

## Funcional — API

### 11. `GET /school-classes/:id/grades` pode não retornar dados completos
O endpoint retorna grades pela turma, mas o repository precisa ser verificado — se filtra por `schoolId` corretamente sem expor notas de outras escolas.

### 12. Nenhum endpoint de listagem de secretarias
Não existe `GET /secretarias` na API. O admin não consegue ver as secretarias criadas após recarregar a página — o estado fica apenas em memória no frontend.

---

## Melhoria — Frontend

### 13. Sem tratamento de erros visível ao usuário
Erros de API (409 email duplicado, 404 not found, 500) são capturados pelo TanStack Query mas não exibidos ao usuário. Os formulários falham silenciosamente.

**O que falta:** toast/notification system (ex: `sonner`) e `onError` nos mutations exibindo mensagem ao usuário.

### 14. Sem loading skeleton nas tabelas
Tabelas mostram "Carregando..." em texto puro. Não há skeleton ou spinner visual.

### 15. Sem paginação
Todos os `GET /students`, `GET /teachers`, `GET /tuitions` retornam a lista completa. Sem paginação no frontend ou na API.

### 16. Sem busca/filtro nas listagens
`StudentsPage` e `TeachersPage` não têm campo de busca funcional. O plano previa "busca" mas não foi implementado.

### 17. Sidebar não tem estado ativo correto para sub-rotas
`/students/abc` não destaca "Alunos" na sidebar porque a comparação usa `location.pathname === to` — `/students` não é prefixo exato de `/students/abc` com o `startsWith` aplicado corretamente para rotas com parâmetros.

### 18. Bundle size acima de 500 kB
O build gera um único chunk de 573 kB. Vite alerta sobre isso. Falta code splitting por rota com `React.lazy`.

---

## Melhoria — API

### 19. CORS não configurado
Não há `@fastify/cors` registrado no `app.ts`. Em produção (API e frontend em domínios separados ou portas diferentes), as requisições vão falhar com erro de CORS.

### 20. Sem rate limiting
Endpoints de autenticação (`POST /sessions`) não têm rate limiting. Vulnerável a brute force.

### 21. Sem validação de sobreposição em `academic_periods`
É possível criar dois períodos letivos com datas sobrepostas. A API não valida isso.

### 22. Status `overdue` em mensalidades não é calculado automaticamente
O campo `status` em `tuitions` é armazenado como `pending` ou `paid`. Não há job/trigger que mude para `overdue` quando `dueDate` passa. O frontend exibe `overdue` se vier da API, mas nunca virá.

---

## Resumo por prioridade

| # | Item | Criticidade |
|---|------|-------------|
| 1 | Criar `.env` | Bloqueante |
| 2 | Criar `docker-compose.yml` | Bloqueante |
| 3 | Subir banco e rodar migrations | Bloqueante |
| 4 | Provisionar usuário admin | Bloqueante |
| 5 | Onboarding de escola (frontend) | Funcional |
| 6 | Listagem de secretarias na API | Funcional |
| 7 | Boletim e financeiro linkados na StudentDetailPage | Funcional |
| 8 | Toast de erros | Melhoria |
| 9 | Code splitting (lazy routes) | Melhoria |
| 10 | CORS configurado | Melhoria (crítico em produção) |
| 11 | Status `overdue` calculado automaticamente | Melhoria |
