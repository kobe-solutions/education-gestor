# Education Gestor

Sistema de gestão escolar multi-tenant para colégios de pequeno e médio porte.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Node.js + TypeScript + Fastify |
| Banco | PostgreSQL + Drizzle ORM |
| Frontend | React + Vite + TanStack Query + shadcn/ui |
| Monorepo | pnpm workspaces |

---

## Pré-requisitos

- **Node.js** >= 20
- **pnpm** >= 9 — `npm install -g pnpm`
- **Docker** (para o PostgreSQL local)

---

## Executando localmente

### 1. Clonar e instalar dependências

```bash
git clone https://github.com/kobe-solutions/education-gestor.git
cd education-gestor
pnpm install
```

### 2. Subir o banco de dados

```bash
docker compose up -d
```

Isso sobe um PostgreSQL 16 na porta `5432` com:
- **usuário**: `postgres`
- **senha**: `postgres`
- **banco**: `education_gestor`

### 3. Configurar variáveis de ambiente da API

Crie o arquivo `apps/api/.env` com base no exemplo abaixo:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/education_gestor
JWT_SECRET=uma-chave-secreta-longa-de-pelo-menos-32-caracteres
PORT=3333
NODE_ENV=development
```

> `JWT_SECRET` precisa ter no mínimo 32 caracteres.

### 4. Rodar as migrations

```bash
pnpm db:migrate
```

### 5. Provisionar o primeiro admin

O primeiro usuário admin precisa ser criado via script — não há rota pública para isso.

```bash
pnpm admin:provision -- --name="Seu Nome" --email="admin@escola.com" --password="senha-segura"
```

### 6. Iniciar em modo desenvolvimento

```bash
pnpm dev
```

Isso sobe os dois serviços em paralelo:

| Serviço | Endereço |
|---|---|
| API | http://localhost:3333 |
| Web | http://localhost:5173 |

---

## Scripts disponíveis

### Raiz do monorepo

| Comando | O que faz |
|---|---|
| `pnpm dev` | Sobe API + Web em paralelo |
| `pnpm build` | Build de todos os packages |
| `pnpm db:generate` | Gera migrations a partir do schema Drizzle |
| `pnpm db:migrate` | Aplica as migrations no banco |
| `pnpm db:studio` | Abre o Drizzle Studio (GUI do banco) |
| `pnpm admin:provision` | Cria o primeiro usuário admin |

### Somente API (`apps/api`)

| Comando | O que faz |
|---|---|
| `pnpm dev` | Modo watch com `tsx` |
| `pnpm build` | Compila TypeScript para `dist/` |
| `pnpm start` | Executa o build compilado |
| `pnpm test` | Roda os testes com Vitest |
| `pnpm test:watch` | Testes em modo watch |
| `pnpm test:coverage` | Relatório de cobertura |

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

Na VPS, crie `/home/deploy/education-gestor/apps/api/.env`:

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

---

## Estrutura do projeto

```
education-gestor/
├── apps/
│   ├── api/          # Fastify + Drizzle (porta 3333)
│   └── web/          # React + Vite (porta 5173)
└── packages/
    └── types/        # DTOs e tipos compartilhados
```

### Módulos da API

| Módulo | Responsabilidade |
|---|---|
| `auth` | Login, JWT |
| `schools` | Cadastro da escola (onboarding) |
| `admins` | Usuários administradores |
| `secretarias` | Usuários secretaria |
| `teachers` | Professores |
| `students` | Alunos e responsáveis |
| `subjects` | Disciplinas |
| `classes` | Turmas |
| `academicPeriods` | Períodos letivos |
| `academic` | Notas e frequência |
| `financial` | Mensalidades e pagamentos |

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
