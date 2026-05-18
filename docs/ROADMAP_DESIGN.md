# Roadmap — Refatoração de Design (IRIS)

> Referência: `docs/new_design_iris/` — protótipo completo com design system, tokens e UI kit.
> Objetivo: migrar o frontend atual para a identidade visual IRIS (azul institucional, Plus Jakarta Sans, componentes premium, densidade SaaS).

---

## Visão Geral

O frontend atual tem a estrutura certa (72px sidebar, header, feature folders) mas usa tokens genéricos do shadcn (azul padrão, Inter/system-ui, `--radius: 0.5rem`). A migração é incremental — cada fase entrega valor isolado sem quebrar o que já funciona.

**Critério de pronto por fase:** página/componente visualmente igual ao protótipo em `docs/new_design_iris/ui_kits/iris-educacao/`.

---

## Fase 1 — Fundação de Tokens e Tipografia ✅
**Estimativa:** 1 dia  
**Arquivos principais:** `apps/web/src/index.css`, `apps/web/tailwind.config.ts`

### Tarefas

- [x] Adicionar `@import` da fonte **Plus Jakarta Sans** (Google Fonts) e **JetBrains Mono** via `<link>` no `index.html`
- [x] Substituir todas as variáveis `:root` no `index.css` pelos tokens IRIS
- [x] Adicionar variáveis semânticas extras ao `:root` (`--iris-blue-*`, `--fg-*`, `--bg-*`, `--shadow-*`)
- [x] Atualizar `tailwind.config.ts` — `fontFamily.sans/mono`, `colors.iris.*`, `boxShadow.iris-*`, `borderRadius.xl/2xl`
- [x] Atualizar `body` no `index.css` — `font-family`, `font-size: 14px`, `antialiased`
- [x] Atualizar `apps/web/index.html` — título "IRIS Educação", Google Fonts no `<head>`

**Resultado:** toda a app herda as cores e fonte IRIS sem mudança de componentes.

---

## Fase 2 — Layout Shell (Sidebar + Header) ✅
**Estimativa:** 1 dia  
**Arquivo:** `apps/web/src/components/layout/AppLayout.tsx`

### Tarefas
- [x] Substituir logotipo "EG" pelo SVG inline do ícone IRIS (olho/livro em azuis da marca)
- [x] Nav item active: `bg-[#185FA5] text-white`
- [x] Nav item hover: `bg-[#EAF4FD] text-[#042C53]`
- [x] Header direito: nome do usuário + avatar 32px com iniciais
- [x] Avatar: `bg-[#185FA5]`, texto branco, `border-radius: 9999px`
- [x] Sidebar: `bg-white`, `border-r border-[#E5E7EB]`
- [x] "Estrutura" removida do nav principal — agora é sub-item do hub Acadêmico
- [x] `matchPaths` do Acadêmico atualizado para incluir `/estrutura`, `/education-levels`, `/series`, `/locacao`

---

## Fase 3 — Componentes Globais ✅
**Estimativa:** 2 dias  
**Diretório:** `apps/web/src/components/`

Criar ou atualizar os átomos usados em todas as páginas.

### 3.1 MetricCard (novo) ✅
- [x] `apps/web/src/components/MetricCard.tsx` criado
- Props: `icon`, `label`, `value`, `sub?`, `color`
- Tile 40×40 com ícone branco no `color`, valor em 24px/800 `-0.02em`, label muted 12px

### 3.2 PageHead (novo) ✅
- [x] `apps/web/src/components/PageHead.tsx` criado
- Props: `title`, `subtitle?`, `actions?`
- Título 20px/700 `--iris-blue-900`, subtítulo 14px `--iris-slate-500`

### 3.3 HubCard (atualizado) ✅
- [x] `apps/web/src/components/HubCard.tsx` reescrito
- Borda `1px solid #E5E7EB` → hover borda `#185FA5` + shadow-md
- Ícone em tile `rgba(24,95,165,0.10)` / ícone `#185FA5`
- Link "Acessar →" com `translate-x` no hover
- Prop `disabled?` para cards "Em breve"

### 3.4 Badge (atualizado) ✅
- [x] `apps/web/src/components/ui/badge.tsx` com variantes `danger` e `info` adicionadas
- `success` `#DCFCE7 / #15803D` · `warning` `#FEF3C7 / #B45309`
- `danger` `#FEE2E2 / #B91C1C` · `info` `#EAF4FD / #185FA5`

### 3.5 Surface (novo) ✅
- [x] `apps/web/src/components/Surface.tsx` criado
- `bg-white`, `border #E5E7EB`, `border-radius 10px`, `overflow-hidden`, `shadow-sm`

### 3.6 Estilos de tabela global ✅
- [x] Classes `.tbl` e `.iris-table` (alias) adicionadas ao `index.css`
- `th`: xs/medium/uppercase/`bg-slate-50`/`letter-spacing 0.06em`
- `td`: sm/`border-b #F1F5F9`
- `tbody tr:hover td`: `bg-slate-50`
- `tbody tr:last-child td`: sem borda inferior

---

## Fase 4 — Dashboard ✅
**Estimativa:** 1 dia  
**Arquivo:** `apps/web/src/pages/DashboardPage.tsx`  
**Referência:** `docs/new_design_iris/ui_kits/iris-educacao/features/dashboard/DashboardScreen.jsx`

### Tarefas
- [ ] Substituir o layout atual por `<PageHead>` + grid de 6 `<MetricCard>`
- [ ] Cards: Alunos, Professores, Turmas, Pendentes (R$), Pagas (R$), Atrasadas (R$)
- [ ] Tabela de mensalidades vencendo em 7 dias (com `<Surface>` + `<TuitionStatusBadge>`)
- [ ] Botão "Ver todas" → navega para `/financial`
- [ ] **Bloqueia em débito técnico:** precisa de endpoint `/dashboard/summary` (ver TECH_DEBT.md)

---

## Fase 5 — Hub Pessoas ✅
**Estimativa:** 2 dias  
**Arquivo novo:** `apps/web/src/pages/PessoasHubPage.tsx`  
**Referência:** `docs/new_design_iris/ui_kits/iris-educacao/features/hubs/PessoasHubScreen.jsx`

### Tarefas
- [ ] Criar rota `/pessoas` apontando para `PessoasHubPage` (atualmente vai direto para uma lista)
- [ ] Dois painéis lado a lado: Alunos e Professores
- [ ] Cada painel: ícone-tile + título + descrição + CTAs + métricas (chips) + lista de recentes
- [ ] Atalhos rápidos: Buscar aluno, Matricular em turma, Importar planilha, Relatório de alunos
- [ ] Avatar com iniciais (componente) para listas de pessoas

---

## Fase 6 — Hub Acadêmico ✅
**Estimativa:** 1 dia  
**Arquivo novo:** `apps/web/src/pages/AcademicoHubPage.tsx`  
**Referência:** `docs/new_design_iris/ui_kits/iris-educacao/features/hubs/AcademicoHubScreen.jsx`

### Tarefas
- [ ] Rota `/academico` → 6 `<HubCard>`: Estrutura Escolar, Locação de Aulas, Matrícula em Turmas, Notas & Boletim, Frequência, Disciplinas & Períodos
- [ ] Notas, Frequência e Disciplinas → marcados como `em breve` se rota não existir ainda

---

## Fase 7 — Módulo Alunos ✅
**Estimativa:** 3 dias  
**Arquivos:** `features/students/pages/`  
**Referência:** `docs/new_design_iris/ui_kits/iris-educacao/features/students/`

### 7.1 StudentsPage
- [ ] Usar `<PageHead>` com contador + botão "Novo aluno"
- [ ] Campo de busca estilo IRIS (ícone de lupa dentro do input, width 360px)
- [ ] Tabela em `<Surface>`: Nome, Matrícula (`.mono`), Turma, Responsável, Situação, Ações
- [ ] Badge de status com variante correta
- [ ] Row clickável → StudentDetailPage

### 7.2 StudentDetailPage (5 abas)
- [ ] Header do detalhe: seta voltar + nome + código de matrícula `.mono` + badge de status
- [ ] Avatar grande (60px) com upload de foto
- [ ] 5 abas: Dados pessoais, Família & responsáveis, Ficha médica, Documentos, Matrícula & turmas
- [ ] Abas 2–5 desabilitadas em modo "novo aluno"
- [ ] **Débito:** abas Família, Saúde e Documentos precisam de endpoints (ver TECH_DEBT.md)

---

## Fase 8 — Módulo Financeiro
**Estimativa:** 2 dias  
**Arquivo:** `features/financial/pages/TuitionsPage.tsx`  
**Referência:** `docs/new_design_iris/ui_kits/iris-educacao/features/financial/MensalidadesScreen.jsx`

### Tarefas
- [ ] `<PageHead>` + botão "Nova mensalidade"
- [ ] Filtros: busca por aluno + select de status (Todos / Pendente / Pago / Atrasado)
- [ ] Tabela em `<Surface>` com `<TuitionStatusBadge>`
- [ ] Dialog de confirmação para registrar pagamento
- [ ] Dialog de criação de mensalidade (aluno, valor, vencimento)

---

## Fase 9 — Módulo Acadêmico (Estrutura + Locação)
**Estimativa:** 3 dias

### 9.1 EstruturaPage
- [ ] Árvore visual: Nível de Ensino → Séries → Turmas
- [ ] Cabeçalho azul (`bg-[#EAF4FD]`) por nível, filhos indentados com border-left
- [ ] Ações inline: editar / excluir por nó

### 9.2 LocacaoPage (grade horária)
- [ ] Rail esquerdo: disciplinas colapsáveis → teacher chips (draggable)
- [ ] Grade 5 dias × N períodos; drop de professor em slot
- [ ] Slot preenchido exibe cor da disciplina + nome do professor
- [ ] **Débito:** endpoint de slots de grade horária (ver TECH_DEBT.md)

---

## Fase 10 — Login ✅
**Estimativa:** 0,5 dia  
**Arquivo:** `features/auth/pages/LoginPage.tsx`  
**Referência:** `docs/new_design_iris/ui_kits/iris-educacao/features/auth/LoginScreen.jsx`

### Tarefas
- [ ] Fundo: gradiente suave `#EAF4FD` → `#FFFFFF` (único gradiente permitido no sistema)
- [ ] Card centralizado: logo IRIS vertical (`iris-vertical.svg`), campos de email e senha, botão primário
- [ ] Remove quaisquer ilustrações ou ícones genéricos

---

## Ordem de Execução Recomendada

```
Fase 1 (tokens)
  └── Fase 2 (layout)
        └── Fase 3 (componentes globais)
              ├── Fase 4 (dashboard) ← bloqueia em TECH_DEBT #1
              ├── Fase 5 (hub pessoas)
              ├── Fase 6 (hub acadêmico)
              ├── Fase 7 (alunos) ← parcialmente bloqueia em TECH_DEBT #3,#4,#5
              ├── Fase 8 (financeiro)
              ├── Fase 9 (estrutura + locação) ← bloqueia em TECH_DEBT #7
              └── Fase 10 (login)
```

Fases 1–3 desbloqueiam todo o resto e podem ser feitas em sequência num único ciclo de trabalho.
