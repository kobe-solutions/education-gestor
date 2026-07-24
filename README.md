# Education Gestor

Sistema de gestão escolar multi-tenant para colégios de pequeno e médio porte. Suporta múltiplas escolas na mesma instância, com isolamento por `schoolId`.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Node.js 20 + TypeScript + Fastify v5 |
| Banco | PostgreSQL 16 + Drizzle ORM + postgres.js |
| Validação | Zod |
| Auth | JWT (`@fastify/jwt`) |
| Frontend | React 19 + Vite 6 + TanStack Query v5 + shadcn/ui + Tailwind v4 |
| Forms | react-hook-form + Zod |
| Monorepo | pnpm workspaces |
| Containerização | Docker + Docker Compose (multi-stage) |
| Testes | Vitest 4 |

---

## Pré-requisitos

- **Node.js** >= 20
- **pnpm** >= 9 — `npm install -g pnpm`
- **Docker + Docker Compose**

---

## Executando localmente

### 1. Clonar e instalar dependências

```bash
git clone https://github.com/kobe-solutions/education-gestor.git
cd education-gestor
pnpm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

> O `.env` fica na **raiz do monorepo** e é compartilhado entre API e Frontend (o Vite lê via `envDir: '../../'`).

### 3. Subir o banco de dados

```bash
docker compose up -d
```

Sobe:
- **PostgreSQL 16** na porta `5432` (produção) — `db`
- **PostgreSQL 16** na porta `5433` (testes) — `db-test`

### 4. Rodar as migrations

```bash
pnpm db:migrate
```

> Se alterar o schema Drizzle, regenere antes: `pnpm db:generate`.

### 5. (Opcional) Popular dados de teste

```bash
pnpm db:seed
```

Cria: 1 admin, 2 secretarias, 3 escolas, 12 turmas/escola, 30-35 alunos/turma, professores, disciplinas, notas, frequência e mensalidades. Senha padrão: `senha123`. Detalhes em `LOGINS.md`.

### 6. Provisionar o primeiro admin (alternativa ao seed)

O primeiro admin pode ser criado via script — não há endpoint público para isso.

```bash
pnpm admin:provision -- --name="Seu Nome" --email="admin@escola.com" --password="senha-segura"
```

### 7. Iniciar em modo desenvolvimento

```bash
pnpm dev
```

| Serviço | Endereço |
|---|---|
| API | http://localhost:3333 |
| Web | http://localhost:5173 |
| Health check | http://localhost:3333/health |

### Alternativa: Usar Docker para tudo

```bash
docker compose up --build
```

Sobe API + Web + Banco em containers.

---

## Scripts disponíveis

### Raiz do monorepo

| Comando | O que faz |
|---|---|
| `pnpm dev` | Sobe API + Web em paralelo (concurrently) |
| `pnpm build` | Build de todos os packages |
| `pnpm db:generate` | Gera migrations a partir do schema Drizzle |
| `pnpm db:migrate` | Aplica as migrations no banco |
| `pnpm db:studio` | Abre o Drizzle Studio (GUI do banco) |
| `pnpm db:seed` | Popula dados de teste (idempotente) |
| `pnpm db:clear` | Limpa dados (pede confirmação) |
| `pnpm admin:provision` | Cria o primeiro usuário admin |

### Somente API (`apps/api`)

| Comando | O que faz |
|---|---|
| `pnpm dev` | Modo watch com `tsx` |
| `pnpm build` | Compila TypeScript para `dist/` |
| `pnpm start` | Executa o build compilado |
| `pnpm test` | Roda os testes com Vitest (unit + e2e) |
| `pnpm test:watch` | Testes em modo watch |
| `pnpm test:coverage` | Relatório de cobertura |

### Somente Web (`apps/web`)

| Comando | O que faz |
|---|---|
| `pnpm dev` | Vite dev server (porta 5173) |
| `pnpm build` | tsc + vite build |
| `pnpm preview` | Vite preview |
| `pnpm test` | Vitest run |
| `pnpm test:coverage` | Relatório de cobertura |

---

## Docker

### Serviços

| Serviço | Porta | Descrição |
|---|---|---|
| `db` | 5432 | PostgreSQL 16 (produção) |
| `db-test` | 5433 | PostgreSQL 16 (testes) |
| `api` | 3333 | Fastify backend (target `dev` do Dockerfile) |
| `web` | 5173 | Vite dev server (target `dev` do Dockerfile) |

O `Dockerfile` é multi-stage com targets `dev` e `prod`. O `docker-compose.yml` usa o target `dev` para permitir hot-reload via volumes.

### Comandos Docker

```bash
# Subir todos os serviços
docker compose up --build

# Subir em background
docker compose up --build -d

# Parar serviços
docker compose down

# Parar e limpar dados
docker compose down -v

# Ver logs
docker compose logs -f api
docker compose logs -f web
```

---

## Estrutura do projeto

```
education-gestor/
├── apps/
│   ├── api/          # Fastify + Drizzle (porta 3333) — 22 módulos
│   └── web/          # React + Vite (porta 5173) — 18 features
├── packages/
│   └── types/        # DTOs e tipos compartilhados
├── .env              # Variáveis de ambiente (compartilhadas)
├── Dockerfile        # Multi-stage build (dev, prod)
├── docker-compose.yml
├── pnpm-workspace.yaml
├── AGENTS.md         # Documentação para agentes de IA
├── CLAUDE.md         # Guia para o projeto (stack, arquitetura, padrões)
├── ROADMAP.md        # Débitos técnicos priorizados
└── LOGINS.md         # Credenciais geradas pelo seed
```

### Módulos da API (22)

| Módulo | Responsabilidade |
|---|---|
| `auth` | Login, JWT (admin, secretaria, gestor, professor) |
| `admins` | Usuários administrativos da plataforma |
| `secretarias` | Secretarias regionais (cross-tenant) |
| `schools` | Cadastro da escola (onboarding, soft delete) |
| `students` | Alunos, responsáveis, ficha médica, documentos |
| `teachers` | Professores + disciplinas vinculadas |
| `subjects` | Disciplinas |
| `classes` | Turmas + relações professor-aluno |
| `academicYears` | Anos letivos |
| `academicPeriods` | Bimestres/trimestres/semestres |
| `academic` | Notas e frequência |
| `financial` | Mensalidades e pagamentos |
| `dashboard` | Métricas agregadas por role |
| `educationLevels` | Níveis de ensino |
| `series` | Séries por nível |
| `classPeriods` | Períodos de aula (horários) |
| `timetable` | Grade horária |
| `calendarEvents` | Eventos do calendário |
| `teacherDashboard` | Painel e dados agregados do professor |
| `audit` | Logs de auditoria (GET /audit-logs) |

Especificação completa em `apps/api/docs/openapi.yaml` (fonte de verdade) e guia rápido em `apps/api/docs/endpoints.md`.

### Roles e multi-tenant

```
Admin (plataforma, cross-tenant)
└── Secretaria (regional / rede de escolas — via X-School-Id)
    └── Gestor (diretor da escola — JWT com schoolId)
        └── Professor (docente da escola — JWT com schoolId)
```

- `schoolId` é extraído do JWT (gestor/professor) ou do header `X-School-Id` (secretaria) e injetado via middleware.
- Repositories **sempre** filtram por `schoolId` — dados de outras escolas são inacessíveis.

---

## Fluxo de onboarding

A ordem de criação importa pelo modelo multi-tenant:

```
1. School       → cria a escola (schoolId base de tudo)
2. Admin        → pnpm admin:provision (vinculado à escola)
3. Teachers     → via painel admin
4. Subjects     → via painel admin
5. Classes      → via painel admin (turmas com professor + disciplina)
6. Students     → via painel admin ou secretaria
```

Para popular dados completos de teste, use `pnpm db:seed` (idempotente — pula o que já existe).

---

## Documentação auxiliar

- **`AGENTS.md`** — guia para agentes de IA (stack, módulos, padrões, dicas)
- **`CLAUDE.md`** — guia canônico do projeto (stack, arquitetura, multi-tenant, padrões)
- **`ROADMAP.md`** — débitos técnicos priorizados (Fases 1–3)
- **`LOGINS.md`** — credenciais geradas pelo seed
- **`docs/ARCHITECTURE.md`** — hierarquia de usuários, mapa RBAC, multi-tenancy
- **`docs/ROADMAP.md`** — roadmap de produto (Fases 1–7)
- **`docs/DEV.md`** — guia de desenvolvimento detalhado
- **`docs/TASKS_API.md`** / **`docs/TASKS_WEB.md`** — tasks por camada
- **`docs/TECH_DEBT_API.md`** — débitos técnicos priorizados
- **`docs/TESTING_AUTOMATED.md`** / **`docs/TESTING_ROADMAP.md`** — estratégia de testes

---

## Subindo para produção

A infraestrutura de produção roda em uma VPS Hetzner CX22 com:
- **Caddy** como reverse proxy + HTTPS automático
- **PM2** para gerenciar o processo Node
- **PostgreSQL** instalado localmente na VPS
- **GitHub Actions** para deploy via SSH

### Visão geral

```
VPS
├── Caddy (80/443)  →  api (porta 3333)
│                  →  web (arquivos estáticos)
├── API (PM2)
└── PostgreSQL (local)
```

### 1. Preparar a VPS (primeira vez)

```bash
# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar pnpm
npm install -g pnpm

# Instalar PM2
npm install -g pm2

# Instalar Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib
```

### 2. Configurar o banco em produção

```bash
sudo -u postgres psql

CREATE USER education_user WITH PASSWORD 'senha-forte-aqui';
CREATE DATABASE education_gestor OWNER education_user;
\q
```

### 3. Variáveis de ambiente em produção

Na VPS, crie `/home/deploy/education-gestor/.env`:

```env
DATABASE_URL=postgresql://education_user:senha-forte-aqui@localhost:5432/education_gestor
JWT_SECRET=chave-secreta-de-producao-com-pelo-menos-32-caracteres
PORT=3333
NODE_ENV=production
```

> Nunca commite o `.env` de produção. Use secrets do GitHub Actions para injetar via SSH.

### 4. Configurar o Caddy

Edite `/etc/caddy/Caddyfile`:

```
api.suaescola.com {
    reverse_proxy localhost:3333
}

app.suaescola.com {
    root * /var/www/education-gestor
    file_server
    try_files {path} /index.html
}
```

```bash
sudo systemctl reload caddy
```

### 5. Build e deploy manual (primeira vez)

```bash
git clone https://github.com/kobe-solutions/education-gestor.git
cd education-gestor
pnpm install
pnpm build

# Rodar migrations
pnpm db:migrate

# Iniciar com PM2
pm2 start apps/api/dist/server.js --name education-api
pm2 save
pm2 startup  # gera comando para rodar PM2 no boot

# Copiar build do frontend
sudo mkdir -p /var/www/education-gestor
sudo cp -r apps/web/dist/* /var/www/education-gestor/
```

### 6. Deploy via GitHub Actions (CI/CD)

O workflow em `.github/workflows/deploy.yml` faz deploy automático em push para `main`.

**Secrets necessários no repositório** (`Settings > Secrets`):

| Secret | Descrição |
|---|---|
| `SSH_HOST` | IP ou domínio da VPS |
| `SSH_USER` | Usuário SSH (ex: `deploy`) |
| `SSH_PRIVATE_KEY` | Chave privada SSH |
| `API_ENV` | Conteúdo completo do `.env` da API |

O workflow executa via SSH:
1. `git pull` na VPS
2. `pnpm install`
3. `pnpm build`
4. `pnpm db:migrate`
5. `pm2 restart education-api`
6. Copia `apps/web/dist/` para `/var/www/education-gestor`

### 7. Provisionar o admin em produção

```bash
ssh deploy@suavps.com "cd education-gestor && pnpm admin:provision -- --name='Admin' --email='admin@escola.com' --password='senha-segura'"
```
