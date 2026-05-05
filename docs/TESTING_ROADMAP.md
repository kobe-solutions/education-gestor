# Roadmap de Testes — Como rodar e testar o sistema

Siga esta ordem exatamente. Cada etapa depende da anterior.

---

## Etapa 1 — Pré-requisitos

Verifique se tem instalado:
- Node.js 20+: `node -v`
- pnpm: `pnpm -v`
- Docker: `docker -v`

Instale as dependências do monorepo se ainda não instalou:
```bash
pnpm install
```

---

## Etapa 2 — Criar o `docker-compose.yml`

Na raiz do projeto, crie o arquivo:

```yaml
# docker-compose.yml
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

Suba o banco:
```bash
docker compose up -d
```

Confirme que está rodando:
```bash
docker compose ps
# postgres deve aparecer como "running"
```

---

## Etapa 3 — Criar o arquivo `.env`

```bash
cp apps/api/.env.example apps/api/.env
```

Se não existir `.env.example`, crie `apps/api/.env` com:
```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/education_gestor
JWT_SECRET=supersecretkey_change_in_production_minimum_32_chars
PORT=3333
NODE_ENV=development
```

---

## Etapa 4 — Rodar as migrations

```bash
pnpm db:migrate
```

Esperado: 10 migrations aplicadas (0000 a 0009), sem erros.

Verifique no banco:
```bash
docker exec -it $(docker compose ps -q postgres) psql -U postgres -d education_gestor -c "\dt"
# Deve listar: admins, schools, secretarias, secretaria_schools, teachers,
#              students, guardians, school_classes, class_teachers, class_students,
#              subjects, academic_periods, grades, attendances, tuitions
```

---

## Etapa 5 — Provisionar o admin

```bash
pnpm admin:provision
```

Anote o email e senha exibidos no terminal — você vai usar para o primeiro login.

---

## Etapa 6 — Rodar os testes automatizados

Confirme que a bateria de testes continua passando (não precisa do banco rodando — os testes mockam os services):

```bash
pnpm --filter api test
# Esperado: 146 tests passed
```

---

## Etapa 7 — Subir o ambiente de desenvolvimento

Em dois terminais separados (ou use o script raiz):

```bash
# Terminal 1 — API
pnpm --filter api dev
# Esperado: Fastify rodando em http://localhost:3333

# Terminal 2 — Frontend
pnpm --filter web dev
# Esperado: Vite rodando em http://localhost:5173
```

Ou use o script raiz que roda os dois juntos:
```bash
pnpm dev
```

---

## Etapa 8 — Testar fluxo de autenticação

Abra `http://localhost:5173`.

**Deve redirecionar para `/login`.**

1. Faça login com as credenciais do admin provisionado
2. Deve redirecionar para `/` (dashboard)
3. Sidebar deve mostrar apenas "Secretarias" (role admin)
4. Clique em "Sair" — deve voltar para `/login`
5. Tente acessar `http://localhost:5173/students` sem login — deve redirecionar para `/login`

---

## Etapa 9 — Testar criação de escola via API

O frontend ainda não tem tela de onboarding. Crie uma escola diretamente:

```bash
curl -X POST http://localhost:3333/schools \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Escola Teste",
    "email": "gestor@escola.com",
    "password": "senha123!",
    "slug": "escola-teste"
  }'
```

Anote o `id` da escola e o token retornado (ou faça login com `gestor@escola.com`).

---

## Etapa 10 — Testar fluxo do Gestor

Faça login com `gestor@escola.com` em `http://localhost:5173/login`.

A sidebar deve mostrar: Alunos, Professores, Turmas, Notas, Frequência, Financeiro.

### 10.1 — Professores
1. Acesse `/teachers`
2. Clique em "Novo professor" — preencha nome, email, senha
3. Professor deve aparecer na tabela
4. Clique em editar — altere o nome — salve
5. Clique em excluir — confirme

### 10.2 — Alunos
1. Acesse `/students`
2. Clique em "Novo aluno" — preencha nome, email opcional, data de nascimento
3. Aluno deve aparecer na tabela com código de matrícula gerado
4. Clique na linha do aluno — deve abrir `StudentDetailPage`
5. Clique em "Adicionar" responsável — preencha os dados — salve
6. Responsável deve aparecer na tabela

### 10.3 — Períodos Letivos e Turmas
1. Antes de criar turmas, crie um período letivo via API:
```bash
curl -X POST http://localhost:3333/academic-periods \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "2025", "startDate": "2025-02-01", "endDate": "2025-12-15"}'
```
2. Acesse `/classes`
3. Clique em "Nova turma" — selecione o período "2025", preencha nome, série, turno
4. Turma aparece na tabela
5. Clique na turma — deve abrir `ClassDetailPage`
6. Adicione um professor à turma (clique no + em Professores)
7. Adicione um aluno à turma (clique no + em Alunos)
8. Remova o aluno (ícone de lixeira na linha)

### 10.4 — Notas
1. Acesse `/grades`
2. Selecione a turma criada
3. Clique em "Lançar nota"
4. Selecione aluno, preencha disciplina, nota (0–10), período
5. Nota deve aparecer na tabela
6. Tente lançar nota com valor 11 — deve mostrar erro de validação (400)

### 10.5 — Frequência
1. Acesse `/attendance`
2. Selecione a turma e a data de hoje
3. Clique em "Carregar chamada"
4. Todos os alunos devem aparecer como "P" (presente)
5. Clique em um aluno para marcar como "F" (falta)
6. Clique em "Salvar chamada"
7. Recarregue a página, selecione a mesma turma/data — os valores devem persistir

### 10.6 — Financeiro
1. Acesse `/financial`
2. Clique em "Nova mensalidade"
3. Selecione aluno, preencha valor e data de vencimento
4. Mensalidade aparece com status "Pendente"
5. Clique em "Registrar pagamento" — confirme
6. Status deve mudar para "Pago"
7. Tente criar mensalidade com valor negativo — deve dar erro 400

---

## Etapa 11 — Testar fluxo do Professor

Crie um professor via gestor (Etapa 10.1), então faça login com o email do professor.

Sidebar deve mostrar: Turmas, Notas, Frequência (não vê Alunos, Financeiro).

1. Acesse `/classes` — deve ver as turmas
2. Acesse `/grades` — deve conseguir lançar nota
3. Tente acessar `/students` diretamente na URL — deve redirecionar (403/redirect)
4. Tente acessar `/financial` — deve redirecionar

---

## Etapa 12 — Testar fluxo de Secretaria

1. Faça login como admin
2. Acesse `/secretarias`
3. Crie uma secretaria (nome, email, senha)
4. Faça logout e login com o email da secretaria criada
5. Sidebar deve mostrar apenas "Dashboard"

> **Limitação conhecida:** a página de secretaria ainda não exibe as escolas vinculadas automaticamente ao logar. Isso está listado em `PENDING.md` como item #8.

---

## Etapa 13 — Verificar casos de erro

| Cenário | Comportamento esperado |
|---|---|
| Login com senha errada | Mensagem "Email ou senha incorretos" |
| Criar professor com email duplicado | API retorna 409 — frontend deve mostrar erro |
| Nota com valor > 10 | Formulário bloqueia (Zod) antes de enviar |
| Token expirado | API retorna 401 → frontend redireciona para `/login` |
| Acesso a rota sem permissão | `PrivateRoute` redireciona para `/` |

> **Atenção:** tratamento de erros visual (toast) ainda não está implementado — veja `PENDING.md` item #13. Os erros 409 e 500 da API não aparecerão para o usuário neste momento.

---

## Etapa 14 — Testar build de produção

```bash
# Build da API (TypeScript)
pnpm --filter api build

# Build do frontend
pnpm --filter web build
# Deve gerar dist/ com index.html + assets/

# Checar tamanho do bundle
ls -lh apps/web/dist/assets/
```

---

## Checklist rápido de smoke test

Após as etapas acima, marque o que funciona:

- [ ] Login admin funciona
- [ ] Sidebar varia por role (admin vs gestor vs professor)
- [ ] Logout funciona
- [ ] Criar/editar/excluir professor
- [ ] Criar/editar aluno + adicionar responsável
- [ ] Criar turma + adicionar aluno/professor
- [ ] Lançar nota
- [ ] Registrar chamada bulk
- [ ] Criar mensalidade + registrar pagamento
- [ ] Redirect 401 ao expirar token
- [ ] Redirect ao tentar acessar rota sem permissão
