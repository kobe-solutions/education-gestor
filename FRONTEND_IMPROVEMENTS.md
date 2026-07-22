# Frontend Improvements — Education Gestor

> Documento vivo de melhorias, refactors, fixes, features e ajustes visuais
> identificados no frontend do monorepo (`apps/web`). Cada item está classificado
> por **prioridade** (`P0` crítico → `P3` nice-to-have) e por **categoria**.

---

## Sumário

1. [Visão geral do estado atual](#1-visão-geral-do-estado-atual)
2. [Arquitetura, organização e refactor](#2-arquitetura-organização-e-refactor)
3. [Layout, UX e problemas visuais](#3-layout-ux-e-problemas-visuais)
4. [Acessibilidade e performance](#4-acessibilidade-e-performance)
5. [Features faltantes e melhorias funcionais](#5-features-faltantes-e-melhorias-funcionais)
6. [Consistência entre páginas e bugs pontuais](#6-consistência-entre-páginas-e-bugs-pontuais)
7. [Testes](#7-testes)
8. [Sugestões de design system e padrões](#8-sugestões-de-design-system-e-padrões)

---

## 1. Visão geral do estado atual

### Pontos fortes
- **Design system IRIS coerente**: tokens HSL/hex centralizados em `index.css`; paleta e tipografia consistentes em todas as páginas.
- **Stack moderno**: React + Vite + React Router v7 + TanStack Query + Zod + RHF + Radix UI (via shadcn-like components).
- **Multi-tenant bem modelado no front**: `AuthContext` + `SchoolContext` + `useSchoolKey` abstraem injeção de `schoolId` em query keys.
- **Componentes reutilizáveis**: `HubCard`, `MetricCard`, `PageHead`, `Surface` cortam duplicação em várias páginas.
- **Features complexas funcionais**: drag-and-drop para matrícula de alunos (`LocacaoAlunosPage`) e alocação de professores (`LocacaoPage`) com HTML5 DnD nativo.
- **Testes configurados**: Vitest + Testing Library + `renderWithProviders` + mocks de `api` e `react-router`.

### Pontos fracos (a corrigir)
- **Inconsistência de padrões de tabela**: o projeto usa **dois componentes de tabela diferentes** — `Surface + .tbl` (estilo IRIS) e `Card + Table/TableHeader/...` (shadcn). A mesma feature escolhe um em cada página.
- **Estilos `inline` generalizados** com `onMouseEnter`/`onMouseLeave` trocando cor manualmente, em vez de variantes de `Button`/`ghost` ou classes `hover:` do Tailwind. Ex.: `TeachersPage`, `AcademicYearsPage`, `EstruturaPage`, `LocacaoAlunosPage`.
- **Hard-coded English** em comentários, IDs e chaves de i18n (não há i18n real, mas os comentários ficam misturados em PT-BR/EN).
- **Falta de feedback de erro/sucesso** em alguns fluxos (ex.: drag-and-drop de aluno/professor chama `api` direto sem captura de erro se a escola mudar entre render e drop).
- **Sem dark mode**, sem `prefers-reduced-motion` realmente respeitado (há o media query mas o resto do app usa `transition-colors` em 100+ lugares).
- **Validação de formulário duplicada**: `StudentFormPage`, `TeacherFormPage`, `SchoolsPage` etc. definem schemas Zod e defaults de formulário manualmente.
- **TanStack Query sem defaults globais** (`staleTime`, `refetchOnWindowFocus`, `retry`) — `main.tsx` cria `new QueryClient()` cru.
- **Cobertura de testes muito baixa** (1 arquivo `.test.tsx` em todo o `src/`).
- **Logout "full reload"**: `api.ts` faz `window.location.href = '/login'` em 401, descartando o estado de TanStack Query e quebrando back/forward do browser.
- **Sem `Suspense`/`ErrorBoundary`** em rotas: erros de fetch derrubam a página inteira.

---

## 2. Arquitetura, organização e refactor

### 2.1 [P0] Padronizar um único componente de tabela

**Problema**: o projeto alterna entre duas implementações:
- **IRIS** (`Surface` + `<table class="tbl">`): usado em `StudentsPage`, `TeachersPage`, `TuitionsPage`, `SubjectsPage`, `SchoolsPage`, `EstruturaTurmasPage`.
- **shadcn** (`Card` + `Table/TableHeader/...`): usado em `ClassesPage`, `EducationLevelsPage`, `SeriesPage`, `SecretariasPage`, `AcademicPeriodsPage`.

**Refactor sugerido**:
- Decidir **um** caminho e migrar o outro lado. Recomendação: usar o **shadcn `Table`** (mais flexível, mais semântico, com `forwardRef`).
- Expor `<DataTable>` com props `columns`, `data`, `onRowClick`, `emptyMessage`, `loading`, `rowKey`, `actions` — substituir ~12 duplicações de "header + linha + célula vazia + skeleton" espalhadas pelas páginas.
- Manter a estética IRIS via tokens do `badge.tsx`, `button.tsx`, `card.tsx` (já estão coerentes).

**Impacto**: -300 linhas duplicadas; ganha-se tema dark, acessibilidade e variantes de coluna de graça.

### 2.2 [P0] Criar `QueryClient` com defaults globais

**Arquivo**: `apps/web/src/main.tsx`

```ts
// Atual
const queryClient = new QueryClient()

// Sugerido
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
})
```

**Benefícios**: menos refetches em navegação rápida entre páginas hub, melhor UX em rede ruim, evita refetch após login (queries da tela anterior).

### 2.3 [P0] Centralizar tratamento de erro HTTP no `api.ts`

**Arquivo**: `apps/web/src/lib/api.ts`

**Problemas**:
1. O 401 faz `window.location.href = '/login'` (full reload, perde cache do React Query, sem tratamento de race condition).
2. Toast de erro fica a cargo de **cada `mutate({ onError: ... })`** — código repetido ~25 vezes.
3. Não há interceptor para mapear 403 (sem permissão) nem 5xx.

**Sugestão**:
- Substituir `window.location.href` por uma `queryClient.clear()` + `<Navigate to="/login" />` via context.
- Criar `lib/api.ts` que injeta o `queryClient` no `onResponseError` e dispara `toast.error(message)` automaticamente para mutações; deixa 4xx/5xx de query cair no `error` do `useQuery`.
- Mapear `err.response?.data?.message ?? 'Erro inesperado'` num helper `extractErrorMessage(err)`.

### 2.4 [P1] Mover `ApiError`/`extractErrorMessage` para `lib/`

Criar `apps/web/src/lib/errors.ts`:
```ts
import type { AxiosError } from 'axios'
export function extractErrorMessage(err: unknown, fallback = 'Erro inesperado') {
  return (err as AxiosError<{ message: string }>)?.response?.data?.message ?? fallback
}
```

Substituir `(err as AxiosError<{ message: string }>)?.response?.data?.message ?? 'Erro inesperado'` (~30 ocorrências).

### 2.5 [P1] Unificar `StudentDialog` (em `students/components/`) — atualmente é componente morto

**Arquivo**: `apps/web/src/features/students/components/StudentDialog.tsx`

Foi criado, mas a página `StudentsPage` não o usa (vai direto para `/students/new` → `StudentFormPage`). Ou se remove (morto), ou se reativa como quick-create pela lista.

### 2.6 [P1] Mover `AcademicPeriodsPage` para `features/classes/`

Já está em `features/classes/pages/`, mas o seu link no `App.tsx` aponta para `/academic-periods` com `role: ['gestor']` enquanto a gestão principal (anos + períodos) está em `AcademicYearsPage` (`gestor` + `secretaria`). Decidir se mantém os dois ou funde.

### 2.7 [P2] Unificar `MetricChip` (em `HubPessoasPage`) num componente global

A função `MetricChip` + `TONE_STYLES` é definida inline em `HubPessoasPage.tsx` mas poderia servir `DashboardPage` e `HubPessoasPage` (ambos têm KPIs). Promover para `components/MetricChip.tsx`.

### 2.8 [P2] Extrair `PersonRow` + `Avatar` para `components/`

Mesma situação: definidos em `HubPessoasPage.tsx` mas o padrão avatar circular com iniciais aparece também em:
- `AppLayout.tsx` (header avatar)
- `EstruturaTurmasPage.tsx` (lazy student list)
- `LocacaoAlunosPage.tsx` (sidebar de alunos)
- `LocacaoPage.tsx` (sidebar de professores)

Criar `<Avatar name={...} size={...} color={...} />` em `components/Avatar.tsx`.

### 2.9 [P2] Padronizar headers de página

Atualmente, cada página implementa o bloco "botão voltar + título + meta + actions" do zero (12+ vezes). Extrair `<PageHeader title subtitle back actions />` com base no atual `PageHead` e adicionar o botão de voltar opcional.

Substituir:
- `StudentDetailPage`, `StudentFormPage`, `ClassDetailPage`, `TimetablePage`, `SeriesPage`, `StudentReportPage`, etc.

### 2.10 [P3] Mover labels e enums para `packages/types` (single source of truth)

Hoje temos:
- `EDUCATION_LEVEL_TYPE_LABELS` em `features/educationLevels/hooks/useEducationLevels.ts`
- `STATUS_LABEL` (aluno) duplicado em `StudentsPage`, `StudentFormPage`, `StudentDetailPage`
- `EMPLOYMENT_STATUS_LABELS` (professor) em `TeachersPage`, `TeacherFormPage`
- `SHIFT_LABELS` (turno) em `LocacaoAlunosPage` e `LocacaoPage`
- `WEEK_DAY_LABELS` em `timetable/hooks/useTimetable.ts`

Centralizar em `packages/types/src/labels.ts` (ou gerar de um único `Zod` enum).

### 2.11 [P3] Dividir `StudentFormPage.tsx` (761 linhas)

`StudentFormPage` mistura:
- lógica de foto (upload, dialog)
- 5 abas de formulário (pessoal, família, médico, responsáveis, documentos, matrícula)
- 9 hooks do TanStack Query
- 7 formulários `useForm`
- handlers de upload + delete

**Sugestão**:
- `features/students/components/tabs/PessoalTab.tsx`
- `features/students/components/tabs/FamiliaTab.tsx`
- `features/students/components/tabs/MedicalTab.tsx`
- `features/students/components/tabs/GuardiansTab.tsx`
- `features/students/components/tabs/DocumentsTab.tsx`
- `features/students/components/tabs/MatriculaTab.tsx`

Cada tab recebe `studentId` e os hooks necessários. Página vira ~80 linhas.

### 2.12 [P3] Dividir `AcademicYearsPage.tsx` (599 linhas) similar ao item 2.11

Mover `YearDialog` e `PeriodDialog` para `features/classes/components/`.

### 2.13 [P3] Dividir `TuitionsPage.tsx` (261 linhas)

Mover `TuitionCreateDialog` para `features/financial/components/`.

### 2.14 [P2] Adicionar `ErrorBoundary` por rota

```tsx
<Route errorElement={<RouteError />}>
  <Route path="/students" element={<StudentsPage />} />
  ...
</Route>
```

Hoje qualquer 500 do backend derruba o app inteiro.

---

## 3. Layout, UX e problemas visuais

### 3.1 [P0] Eliminar `onMouseEnter`/`onMouseLeave` que mudam `style` inline

**Arquivos afetados (amostra)**:
- `AppLayout.tsx` (linhas 184-189, 203-205, 232-238, 301-305)
- `TeachersPage.tsx` (linhas 121-138)
- `StudentsPage.tsx` (linhas 143-160)
- `SchoolsPage.tsx` (linhas 219-237)
- `SubjectsPage.tsx` (linhas 196-214)
- `AcademicYearsPage.tsx` (linhas 502-559)
- `EstruturaPage.tsx` (linhas 51-82, 113-121, 130-153, 197-217)
- `EstruturaTurmasPage.tsx` (vários pontos com `ChevronRight` rotate manual)
- `SeriesPage.tsx`
- `ClassDetailPage.tsx` (28-50)
- `StudentFormPage.tsx` (276-284)
- `StudentDetailPage.tsx` (93-99, 204-210)
- `StudentReportPage.tsx` (29-37)

**Refactor**:
- Para hover de botão/ícone: usar `<Button variant="ghost" size="icon">` com `hover:bg-accent` (já tem no shadcn).
- Para hover de card: usar `.hover:shadow-md .hover:border-primary` no Tailwind.
- Para hover de pill/borda: classes `hover:bg-[var(--iris-blue-50)]` no `className`.

Elimina ~80+ blocos `onMouseEnter`/`onMouseLeave` e melhora acessibilidade (estado de focus).

### 3.2 [P0] Substituir estilos hardcoded em `AppLayout.tsx`

`AppLayout.tsx` tem **três** cópias quase idênticas do estilo de link da sidebar (desktop, mobile, drawer). Extrair `<NavLink>` interno:

```tsx
function SidebarLink({ to, icon: Icon, label, active }) {
  return (
    <Link to={to} className={cn('flex items-center gap-3 w-full rounded-lg px-3 py-2.5 transition-colors',
      active ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground hover:bg-accent')}>
      <Icon className="h-5 w-5" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )
}
```

Reduz 100+ linhas.

### 3.3 [P1] Sidebar colapsável (recolhida → só ícones)

A constante `SIDEBAR_W = 220` está fixa, mas o `index.css` já define:
```css
--sidebar-w: 72px;
--sidebar-expanded-w: 220px;
```

Nunca chega a ser usada essa versão colapsada. Implementar toggle com persistência em `localStorage` (já há padrão via `SchoolContext`/`AuthContext`).

**Benefício**: telas largas ganham mais área para o conteúdo; telas pequenas continuam OK com o drawer.

### 3.4 [P1] Cabeçalho do mobile: alinhar logo + selector

`AppLayout.tsx` header mobile só mostra o botão hamburger + role + (secretaria) `SchoolSelector` + nome/avatar. Falta:
- Logo IRIS visível (aparece só no drawer e no desktop)
- Botão de notificações (próximo item)
- Título da página atual (breadcrumbs) — ver 3.5

### 3.5 [P1] Adicionar breadcrumbs

Páginas como `StudentDetailPage`, `ClassDetailPage`, `TimetablePage` têm "voltar" cego. Adicionar trilha:
```
Pessoas › Alunos › Maria Silva › Boletim
```

Implementar `<Breadcrumbs items={[...]} />` que lê do React Router e/ou aceita prop explícita.

### 3.6 [P1] Skeleton padronizado

Há **três** padrões diferentes de loading:
- `SkeletonCards` em `DashboardPage.tsx`
- `Skeleton` + `space-y-2` em `StudentsPage`, `TeachersPage`, `ClassesPage`
- `<Skeleton className="h-16 w-full rounded-xl" />` em `AcademicYearsPage`
- Tabela vazia com `<p>Carregando...</p>` em `SecretariasPage` (UX ruim)

Padronizar:
- `<TableSkeleton columns rows />` para tabelas
- `<MetricSkeleton />` para cards
- `<PageSkeleton />` opcional

### 3.7 [P1] Empty states visuais

Quase todas as listas têm um "Nenhum X cadastrado" em texto cinza simples. Criar `<EmptyState icon title description action />`:

```tsx
<EmptyState
  icon={<GraduationCap className="h-12 w-12" />}
  title="Nenhuma turma cadastrada"
  description="Comece criando a primeira turma desta escola"
  action={<Button onClick={...}><Plus /> Nova turma</Button>}
/>
```

Aplicar em todas as listas vazias: students, teachers, classes, schools, secretarias, education levels, series, subjects, tuitions, etc.

### 3.8 [P1] Acessibilidade — focus ring e keyboard nav

- Botões "ícone" (`<button className="... w-8 h-8">` em `TeachersPage`, `StudentsPage`, `SchoolsPage`, etc.) **não têm `aria-label`** e nem `focus-visible:ring`.
- Inputs custom de busca (que não usam o `<Input>` shadcn) também não têm focus ring.
- `Tabs` com scroll horizontal não tem `aria-orientation`.

Aplicar `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring` globalmente aos botões de ação por linha.

### 3.9 [P2] Adicionar dark mode

Tokens HSL já estão prontos em `:root`. Falta:
- Variante `.dark` em `index.css`
- Toggle no `AppLayout` (header)
- Persistência em `localStorage`
- Respeitar `prefers-color-scheme` no primeiro load

### 3.10 [P2] `Sidebar` mobile: fechar ao clicar fora via `useEffect` (atualmente fecha só em `onClick` do overlay)

Pequeno fix de UX: se o usuário pressionar `Esc`, a sidebar deve fechar. Usar `onEscapeKeyDown` no Drawer.

### 3.11 [P2] Avatar de usuário no header clicável (dropdown)

Hoje o avatar leva ao clique → nada (`<div>` no `AppLayout.tsx`). Criar menu:
- Meu perfil (placeholder)
- Trocar escola (só `secretaria`)
- Tema (claro/escuro/sistema)
- Sair

### 3.12 [P2] `Logout` limpa `sessionStorage` da escola

`api.ts` remove só `localStorage.token` no 401. O `SchoolContext` mantém `sessionStorage` de uma escola que pode não existir mais. Limpar tudo no `logout()`.

### 3.13 [P2] `LocacaoAlunosPage` e `LocacaoPage` usam `h-[calc(100vh-5rem)]` hardcoded

Altura é calculada assumindo header 80px. Usar `h-[calc(100vh-var(--header-h)-2rem)]` como em `LocacaoPage` e centralizar no token.

### 3.14 [P3] Animação de "slot" ao adicionar aluno/professor

Os cards em `LocacaoAlunosPage`/`LocacaoPage` poderiam ter `animate-in fade-in-50` ao cair no `EnrolledPill`, reforçando o feedback visual.

### 3.15 [P3] Cursor "grabbing" mais visível

`cursor-grab active:cursor-grabbing` está OK, mas os cards no hover poderiam ter leve `scale-[1.01]` ou sombra mais visível para indicar arrastável.

### 3.16 [P3] `Sidebar` sem suporte a "fixar" itens (pin/unpin)

UX opcional, mas gestores/professores têm "Painel" como destino fixo — fixar os primeiros 2-3 itens no topo é comum em ERPs.

### 3.17 [P3] Tooltip "?" nos ícones da sidebar no estado colapsado

Quando a sidebar for colapsável, mostrar `Tooltip` com o nome do item no hover.

### 3.18 [P3] `LoginPage` — campo de senha sem "olhinho"

UX padrão moderno é ter `<Eye />`/`<EyeOff />` para alternar visibilidade.

### 3.19 [P3] `LoginPage` — lembrar-me

Checkbox "lembrar-me" + persistir `email` (não senha) em `localStorage`.

### 3.20 [P3] `LoginPage` — Esqueci minha senha

Link para `/forgot-password` (precisa de endpoint no backend).

### 3.21 [P2] `PageHead` aceita `breadcrumb` e `tabs`

A `Tabs` em `StudentFormPage` e `TeacherFormPage` está fora do `PageHead`. Unificar com slot `tabs` para padronizar.

### 3.22 [P2] `PublicLayout` com branding (logo grande + ilustração)

Hoje é só um gradient. Adicionar ilustração do lado esquerdo (split layout), frase de impacto, e depoimentos em um carrossel (ou mock).

### 3.23 [P2] Responsividade do `DashboardPage` em telas muito pequenas (320px)

`grid-cols-2 ... xl:grid-cols-6` está OK, mas as labels "Pagas / Pendentes / Atrasadas" ficam truncadas em `width: 360px`. Adicionar `truncate` ou empilhar.

### 3.24 [P3] `Table` shadcn: header com ordenação

Adicionar `<DataTableColumn>` com `sortable`, `align`, `width`, `render` (cell custom). Hoje não há ordenação em nenhuma tabela.

### 3.25 [P3] `Table` shadcn: paginação

Nenhuma página tem paginação. Para listas grandes (alunos, mensalidades), a UI fica lenta. Integrar com o backend se ele retornar `total` (já retorna para `/students` e `/teachers`).

### 3.26 [P3] `Table` shadcn: filtro por coluna

Filtro genérico no header (ex: "Situação" em alunos). Hoje o filtro é só global (`StudentsPage`, `TuitionsPage`).

### 3.27 [P3] Indicador de "salvando" inline (em vez de desabilitar botão)

Botão "Salvar" desabilitado vira "Salvando..." com spinner. Adicionar `<Spinner />` visual.

### 3.28 [P3] Confirmar navegação quando há mudanças não salvas

`StudentFormPage`, `TeacherFormPage` não avisam ao fechar aba com form sujo. Hook `usePrompt` do React Router v7 ou um `beforeunload`.

---

## 4. Acessibilidade e performance

### 4.1 [P1] Acessibilidade — labels ausentes

Vários `<Input>` em `SubjectsPage`, `TuitionsPage`, `SeriesPage` etc. não estão usando o `Label` shadcn (estão como `<Input placeholder="..." />` solto). Ex.:

```tsx
// Sujeito
<Input placeholder="Ex: Matemática" value={form.name} onChange={...} />
<Input type="number" min={1} placeholder="Ex: 4" ... />

// Sugerido
<div className="space-y-1">
  <Label htmlFor="name">Nome *</Label>
  <Input id="name" placeholder="Ex: Matemática" ... />
</div>
```

### 4.2 [P1] `Dialog` com foco preso e `aria-describedby`

O `Dialog` do Radix já faz focus trap. Mas os conteúdos (`TuitionsPage`, `SchoolsPage`, etc.) às vezes renderizam parágrafo de aviso sem associar via `aria-describedby`.

### 4.3 [P1] `Tabela` (`.tbl`) sem `<caption>`

A `.tbl` em `index.css` é `<table>` crua, sem `<caption>` ou `aria-label`. Adicionar em `Surface` ou nas páginas.

### 4.4 [P2] `react-hook-form` sem `mode: 'onBlur'`

Schema Zod é rodado apenas no `onSubmit`. Adicionar `mode: 'onBlur'` para feedback mais rápido.

### 4.5 [P2] `Bundle` — code splitting por rota

Hoje `App.tsx` importa todas as páginas sincronamente. Usar `React.lazy`:

```tsx
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
```

Especialmente útil para `StudentFormPage` (761 linhas), `LocacaoAlunosPage` (453 linhas), `LocacaoPage` (598 linhas).

### 4.6 [P2] Imagens sem `loading="lazy"`

`StudentFormPage` (`<img src={student.photoUrl}>`) e boletins não usam `loading="lazy"` nem `decoding="async"`.

### 4.7 [P2] TanStack Query — revalidação de queries após mutação

Vários `useMutation` invalidam só `['students']` mas o detalhe `['students', id]` é separado. Esquecer de invalidar o detalhe gera UI desatualizada. Ex.: `useCreateStudent` em `useStudents.ts:43`.

### 4.8 [P3] `prefers-reduced-motion`

Há um media query no `index.css` que zera a transição do drawer, mas todas as outras (`hover:scale`, `transition-colors`, `animate-in`) continuam ativas. Aplicar regra global em `tailwind.config` ou CSS:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 4.9 [P3] `Vite` — `build.rollupOptions.output.manualChunks`

Separar `react`, `react-dom`, `react-router`, `@tanstack/react-query`, `lucide-react`, `axios` em chunks próprios.

### 4.10 [P3] `Vite` — `@tanstack/react-query-persist-client`

Para queries que não mudam muito (lista de séries, disciplinas, turnos), usar `persistQueryClient` com `localStorage` (TTL de 1h).

### 4.11 [P3] Imagens responsivas com `<picture>` ou `srcSet`

Para foto de aluno, gerar múltiplos tamanhos no backend e usar `srcSet`.

### 4.12 [P3] Service Worker / PWA

`vite-plugin-pwa` daria offline-first para mobile, crítico para uso em sala de aula.

---

## 5. Features faltantes e melhorias funcionais

### 5.1 [P0] Boletim do aluno incompleto

**Arquivo**: `apps/web/src/features/academic/pages/StudentReportPage.tsx`

Hoje: notas por disciplina × período + % de frequência. Falta:
- Média por disciplina
- Média geral
- Situação final (aprovado/reprovado) por disciplina e geral
- Imprimir/PDF do boletim
- Compartilhar com responsável (link assinado, e-mail)
- Falta por disciplina (continuar com `AttendancePage` que está desabilitado)

### 5.2 [P0] `AttendancePage` (rotas `disabled` em `AcademicoHubPage`)

Lá está `disabled: true`. **Ativar** — está nos hooks (`useClassAttendance`, `useRegisterBulkAttendance`) mas sem UI. Implementar:
- Lista de alunos da turma
- Checkboxes para presença
- Data picker
- Botão "Salvar todos"
- Histórico por aluno

### 5.3 [P0] `GradesPage` (idem, `disabled`)

Idem acima. **Ativar** — hooks prontos (`useClassGrades`, `useRegisterGrade`).
- Tabela aluno × disciplina
- Input de nota por célula
- Validação (0–10)
- Cálculo de média automático

### 5.4 [P1] Recuperação de senha

Fluxo `/forgot-password` + `/reset-password?token=...` com envio de e-mail.

### 5.5 [P1] "Esqueci a senha" do professor

A rota existe no backend (`PUT /teachers/:id/password`) mas não tem UI de "esqueci a senha" para o próprio professor.

### 5.6 [P1] Notificações no header

Bell icon + popover com:
- Cobranças vencendo em 3 dias
- Aniversariantes do dia
- Alunos com frequência crítica
- Avisos da secretaria

### 5.7 [P1] Calendário de eventos

`Calendar Events` está no CLAUDE.md como módulo mas não tem página. Criar `features/calendar/`:
- Visualização mês/semana
- Eventos da escola (provas, reuniões, feriados)
- Cores por tipo

### 5.8 [P1] Importação de alunos via planilha

`HubPessoasPage` tem atalho "Importar planilha" (linha 319) que aponta para `/students` (não faz nada). Implementar:
- Upload de `.xlsx`/`.csv`
- Preview
- Validação linha a linha
- Confirmação

### 5.9 [P1] Exportação de relatórios (alunos, mensalidades, etc.)

Botão "Exportar relatório" em `DashboardPage` (linha 93) não tem handler. Implementar:
- CSV / PDF
- Filtros aplicados
- Salvar localmente

### 5.10 [P1] Geração de boleto / Pix para mensalidade

`TuitionsPage` permite registrar pagamento manual, mas falta o ciclo completo: gerar código de barras / Pix copia-e-cola + link público para responsável pagar.

### 5.11 [P1] Foto do professor

Hook `photoUrl` no tipo `Teacher` mas **nenhuma rota** faz upload. Adicionar `PUT /teachers/:id/photo` no backend (se já não existir) e UI em `TeacherFormPage` (igual à aba de foto do aluno).

### 5.12 [P2] Filtros avançados em `StudentsPage`

Hoje: só busca textual. Adicionar:
- Por status
- Por turma
- Por data de matrícula (range)
- Por sexo, faixa etária

### 5.13 [P2] Filtros em `TuitionsPage` por data

Só filtra por status e nome. Adicionar range de vencimento.

### 5.14 [P2] Detalhe expandido do aluno (aba "Histórico")

Mostrar timeline de mudanças de status, transferências, ocorrências, observações.

### 5.15 [P2] Auditoria visual

Hook de auditoria existe no backend (`audit.ts`). Criar página `/audit-log` (admin/gestor) com timeline de ações por usuário.

### 5.16 [P2] Grade horária em visualização semanal (calendário)

`TimetablePage` lista slots por dia em cards. Criar visualização `<WeekGrid />` com colunas = dias, linhas = horários, células = cards com disciplina + professor + turma (cores por turma). Drag-and-drop entre slots.

### 5.17 [P2] Conflito de horário na locação

Ao alocar professor, detectar:
- Mesmo professor em duas turmas no mesmo horário
- Sala sobreposta (se houver entidade `Room`)

### 5.18 [P2] Comunicados (mural)

Sistema de avisos para responsáveis: comunicado geral ou por turma, com confirmação de leitura.

### 5.19 [P2] Portal do responsável

Visão read-only para responsáveis verem:
- Boletim do filho
- Frequência
- Mensalidades
- Comunicados

### 5.20 [P3] Tema personalizável por escola (cor primária)

Secretaria escolhe a cor de marca da escola e o tema IRIS vira dinâmico via `style={{ '--primary': school.brandColor }}`.

### 5.21 [P3] Internacionalização (i18n PT/EN)

Usar `react-i18next` ou `lingui`. Hoje tem tudo hardcoded em PT-BR.

### 5.22 [P3] Atalhos de teclado (`?` mostra cheat sheet)

Padrão para ERPs: `g` + `p` vai para "Pessoas", `c` cria item, `/` foca na busca, etc.

### 5.23 [P3] Tour guiado para novos usuários

`react-joyride` apontando os elementos da sidebar e do dashboard.

### 5.24 [P3] Webhooks / integrações

`/settings/integrations` para plugar Google Classroom, Notion, Slack, etc.

### 5.25 [P3] Multi-idioma do aluno (Língua materna)

A escola é brasileira, mas é comum ter aluno estrangeiro. Campo `preferredLanguage` em `Student`.

### 5.26 [P3] Geração de contrato de matrícula em PDF

Quando o aluno é criado, gerar PDF com dados e contrato pronto para assinatura.

### 5.27 [P3] Backup / exportação completa

`/settings/backup` para admin baixar dump JSON de toda a escola (LGPD-friendly).

---

## 6. Consistência entre páginas e bugs pontuais

### 6.1 [P0] `AcademicPeriodsPage` não está linkado em `AcademicoHubPage`

`HubConfiguracoesPage` (linha 21) aponta para `/academic-periods` mas a gestão real é em `AcademicYearsPage` (`/academic-years`). Decidir: ou `AcademicPeriodsPage` vira legado, ou consolidar.

### 6.2 [P0] `LoginPage` — texto "Email ou senha incorretos" é fixo

```tsx
{error && (
  <p className="text-xs text-center" style={{ color: 'var(--iris-danger-600)' }}>
    Email ou senha incorretos
  </p>
)}
```

O `useLogin` retorna o `error` do Axios, mas a UI ignora e mostra sempre a mesma string. Usar `extractErrorMessage(error)`.

### 6.3 [P0] `LoginPage` — `useEffect` redireciona mesmo com erro

```ts
useEffect(() => {
  if (token && payload) navigate('/', { replace: true })
}, [token, payload, navigate])
```

Se houver `token` antigo (storage) e o user entrar de novo, navega antes da hora. Limpar storage no mount.

### 6.4 [P1] `StudentFormPage` — aba "Matrícula" só acessível após salvar

A aba é `disabled={!isEdit}`, mas a UX fica estranha porque o usuário tem que salvar dados pessoais antes de poder adicionar turma. Considerar permitir turmas já no cadastro (pelo menos criar `student` mínimo: `name`).

### 6.5 [P1] `StudentFormPage` — `onSaveFamilia` envia só campos de família, mas também campos pessoais

O `updateStudent.mutateAsync(data)` envia `data: FamiliaForm`, mas o `useUpdateStudent` aceita `Partial<CreateStudentInput>`. Não há validação no backend de quais campos aceitar. Verificar consistência.

### 6.6 [P1] `SchoolContext` — `clearActiveSchool` nunca é chamado

Hook exposto mas não usado. Usar em:
- Logout (juntamente com o `localStorage.removeItem('token')`)
- Quando a secretaria é desativada

### 6.7 [P1] `PrivateRoute` — `requireSchool` é declarado mas nunca passado

Linha 8-9: `requireSchool?: boolean`. Todas as chamadas omitem. Decidir o comportamento por role em vez de checar manualmente.

### 6.8 [P1] `EstruturaPage` — link da série aponta para `/classes` (linha 116)

A navegação `<span ... onClick={() => navigate('/classes')}>` leva à lista geral. Provavelmente devia abrir detalhes (`/series/:id`) ou `/classes?serieId=...`. Quebrar cabeçalho de URL não é descobrível.

### 6.9 [P1] `EstruturaTurmasPage` filtra por aluno mas o `defaultOpen` quebra

```tsx
{seriesWithClasses
  .sort(...)
  .map(({ serie, classes }, idx) => (
    <SerieGroup ... defaultOpen={idx === 0} />
  ))}
```

Só a primeira série do primeiro nível abre. Se o usuário filtrar por aluno, a primeira série pode estar vazia. Usar `defaultOpen` apenas quando há matches.

### 6.10 [P1] `MySchoolsPage` — não tem `requireSchool` flag (não precisa), mas o layout mistura botões

`Card` do shadcn sem consistência com o resto do app (que usa `Surface` IRIS). Padronizar com `Surface`.

### 6.11 [P1] `SchoolsPage` — `EditDialog` reaparece após fechar quando reabre Create

```tsx
<Dialog open={createOpen} ...>
<Dialog open={!!editing} ...>
```

Os dois `Dialog` montam simultaneamente quando `createOpen === true` e `editing` é definido. Botão "Cancelar" do Create não limpa `editing`. Limpar tudo.

### 6.12 [P1] `LocacaoPage` — `useDeleteTimetableSlot('')` (linha 299)

Hook chamado com string vazia só para satisfazer TS. `useDeleteTimetableSlot` aceita `classId` no escopo errado — refatorar para não exigir.

### 6.13 [P1] `LocacaoAlunosPage` — `useClass` chamado para cada coluna

Para N turmas, faz N requests independentes. `useClasses` já traz `students: []` (vazio por padrão). Criar um endpoint `/school-classes?with=students` ou usar `useQueries` com batch.

### 6.14 [P1] `TimetablePage` — slots só aparecem por dia se houver, mas a query inicial é `?classId=...` × 1

A página `LocacaoPage` faz `useAllTimetableSlots` e filtra no client. `TimetablePage` faz `useTimetableSlots(classId)`. Padronizar.

### 6.15 [P2] `StudentFormPage` — textarea de `observations`/`comorbidities` é `<textarea>` cru

Não usa componente `<Textarea>` shadcn (não criado). Criar `components/ui/textarea.tsx` e usar.

### 6.16 [P2] `TeacherFormPage` — `senhaForm` está dentro de "Financeiro"

Aba "Dados Financeiros" tem dois forms: dados bancários + alterar senha. Renomear a aba ou separar.

### 6.17 [P2] `HubAdminPage` tem só 2 cards, `HubPessoasPage` é mais rico

Considerar mover atalhos rápidos para um único componente ou criar um sistema de "quick actions" configurável por role.

### 6.18 [P2] `SchoolsPage` — `Edit` aparece inline como input HTML

Não tem `<Select>` para o tipo de escola (se houver), slug não tem auto-gerador a partir do nome.

### 6.19 [P2] `SchoolsPage` — botão "Nova escola" só aparece para `secretaria`

Verificar com backend: `admin` também deveria poder criar? Hoje nem admin vê.

### 6.20 [P2] `SchoolsPage` — coluna "Diretor" e "Coordenador" sem formatação

Mostra string crua, sem avatar/iniciais, sem link para o detalhe do funcionário.

### 6.21 [P2] `SecretariasPage` — `Ativo`/`Inativo` é um `<Button>` que alterna boolean (linha 324-331)

```tsx
<Button
  type="button"
  variant={activeValue ? 'default' : 'outline'}
  size="sm"
  onClick={() => setEditValue('active', !activeValue)}
>
  {activeValue ? 'Ativo' : 'Inativo'}
</Button>
```

UX confusa. Usar `<Switch />` ou `<Checkbox />`.

### 6.22 [P2] `SecretariasPage` — `setCreateOpen(false)` não chama `resetCreate()`

```tsx
onOpenChange={(v) => { if (!v) { setCreateOpen(false); resetCreate() } }}
```

Mas o botão "Cancelar" do form tem o mesmo padrão — OK. O detalhe é o `useEffect` para popular `editForm` quando `editTarget` muda. Não há `useEffect`, então se o user trocar de secretaria sem fechar, pode ver dados antigos. Adicionar.

### 6.23 [P2] `AcademicYearsPage` — botão "Encerrar" some quando status é `closed`

```tsx
{year.status !== 'closed' && (
  <button ... title={year.status === 'planning' ? 'Ativar' : 'Encerrar'}>
```

OK, mas a mensagem de "Encerrar" → status `closed` esconde a ação. Adicionar tooltip "Reabrir" para admin.

### 6.24 [P2] `SeriesPage` — `Tooltip` é importado mas usado com `<TooltipProvider>` inline (linha 221)

```tsx
<TooltipProvider>
  <Tooltip content="...">
```

O `TooltipProvider` deveria estar no root do app (`main.tsx` ou `AppLayout`), senão o delay de 200ms reseta a cada página. Movê-lo.

### 6.25 [P2] `TimetablePage` — `setValue` em `academicPeriodId` quando a turma já tem `academicPeriodId`

```tsx
defaultValues: {
  academicPeriodId: schoolClass?.academicPeriodId ?? '',
  ...
}
```

Mas `useForm` só usa `defaultValues` no mount. Se o user muda de turma, o `defaultValues` não é reaplicado. Usar `values` (RHF 7+).

### 6.26 [P2] `EstruturaTurmasPage` — `studentCount` vem de `useClasses()` ou `useClass(id)`?

Há um `studentCount` em `SchoolClass` retornado pela API, mas `EstruturaTurmasPage` usa `useClasses()` (sem `with=students`). O `studentCount` deve ser populado pelo backend.

### 6.27 [P3] `DashboardPage` — `fmtBRL` duplicado em 3+ arquivos

Mover para `lib/format.ts`:

```ts
export const fmtBRL = (v: string | number) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
```

### 6.28 [P3] `DashboardPage` — `new Date(t.dueDate + 'T12:00:00')` é repetido

`T12:00:00` é hack para evitar timezone. Criar `lib/date.ts`:

```ts
export const parseLocalDate = (d: string) => new Date(d + 'T12:00:00')
export const fmtDate = (d: string) => parseLocalDate(d).toLocaleDateString('pt-BR')
```

Aplicar em `DashboardPage`, `StudentDetailPage`, `TuitionsPage`, `AcademicYearsPage`, `PeriodsSection`.

### 6.29 [P3] `Avatar` (AppLayout) com `payload.name` pode ser `undefined`

```tsx
{userName ? getInitials(userName) : role?.[0]?.toUpperCase() ?? 'U'}
```

O fallback é OK, mas `role?.[0]` em roles compostos ('gestor', 'secretaria') retorna só 'g'/'s'. Mostrar nome completo como tooltip.

### 6.30 [P3] `PrivateRoute` — `SECRETARIA_PUBLIC_PATHS` é hardcoded

Adicionar à `JwtPayload` um `permissions: { publicRoutes: string[] }` ou centralizar via config.

### 6.31 [P3] `AppLayout` — `useEffect` no `mobileDrawerOpen` reseta `body.style.overflow`

Funciona, mas se houver 2 `AppLayout` montados (StrictMode), sobrescreve. Usar `useLayoutEffect` ou mover para hook custom.

### 6.32 [P3] `SchoolsPage` — `EditDialog` mistura `useForm` global

```tsx
const editForm = useForm<EditForm>({ resolver: zodResolver(editSchema) })
```

A mesma instância é usada em todo re-render. Se a usuária cancelar a edição da escola A e abrir a escola B, o `editForm` ainda tem `id` A. Limpar no `useEffect`.

### 6.33 [P3] `SubjectsPage` — `useEffect` ausente para popular `form` em edição

`handleEdit` faz `setForm({...})` direto. OK. Mas se a mutação falhar e o user tentar de novo, o `form` ainda tem o valor antigo. Recarregar.

### 6.34 [P3] `LocacaoAlunosPage` — `useQueryClient` usado para invalidar `['classes', classId]`, mas o dado veio de `useClasses()`

```tsx
queryClient.invalidateQueries({ queryKey: ['classes', classId] })
```

Não invalida `['classes']` que é a lista. Fazer `['classes']` (com o schoolKey) também.

### 6.35 [P3] `index.css` tem `--sidebar-w: 72px` e `--sidebar-expanded-w: 220px` mas só `220px` é usado

Aplicar quando implementar sidebar colapsável (item 3.3).

### 6.36 [P3] `TuitionsPage` — campo `amount` sem máscara de moeda

`<Input type="number" step="0.01" ... />` permite digitar `,` em vez de `.`. Aplicar máscara BRL.

### 6.37 [P3] `SchoolsPage` — `slug` não tem auto-gerador

Ao digitar "Escola Modelo", o slug deveria sugerir "escola-modelo". Auto-gerar no `onChange` de `name`.

### 6.38 [P3] `ClassDetailPage` — `useClass` traz `students: []` pequeno. Para turmas grandes, paginar.

Para 50+ alunos, a página fica lenta. Paginar ou virtualizar (`@tanstack/react-virtual`).

---

## 7. Testes

### 7.1 [P0] Adicionar testes para hooks críticos

Hooks sem teste (alto risco):
- `useStudents` / `useCreateStudent` / `useUpdateStudent`
- `useTuitions` / `useRegisterPayment`
- `useDashboard`
- `useSchoolKey`

Cobrir:
- Query é habilitada/desabilitada por role
- Mutation invalida queries corretas

### 7.2 [P0] Adicionar testes de componentes

Pelos menos um teste por feature:
- `StudentsPage` renderiza skeleton, lista, empty state
- `TuitionsPage` filtra por status
- `StudentFormPage` mostra erros de validação
- `DashboardPage` separa admin vs school dashboard

### 7.3 [P1] Adicionar testes E2E (Playwright)

Cobrir fluxos:
1. Login → Dashboard
2. Secretaria → criar escola → selecionar → ver alunos
3. Gestor → criar aluno → ver boletim
4. Drag-and-drop de aluno em turma
5. Drag-and-drop de professor em grade

### 7.4 [P1] Adicionar `a11y` tests (axe)

`vitest-axe` ou `jest-axe` para garantir contraste e estrutura semântica.

### 7.5 [P2] Visual regression tests (Chromatic/Percy)

Para o design system IRIS, garantir que mudanças CSS não quebrem screenshots.

### 7.6 [P2] `renderWithProviders` aceita `mockApi` e `mockAuth`

Facilitar mock de múltiplos endpoints numa só helper.

### 7.7 [P3] Storybook para componentes

`components/ui/`, `HubCard`, `MetricCard`, `PageHead` merecem stories.

### 7.8 [P3] `setup.ts` — mockar `matchMedia` e `IntersectionObserver`

Já há mock do `react-router`, mas não de APIs do browser que algumas libs usam.

---

## 8. Sugestões de design system e padrões

### 8.1 [P1] Criar arquivo `apps/web/src/lib/colors.ts`

Expor os tokens IRIS como constantes TypeScript:

```ts
export const iris = {
  blue: { 50: '#EAF4FD', 300: '#85B7EB', 500: '#378ADD', 700: '#185FA5', 900: '#042C53' },
  slate: { 50: '#F8FAFC', 100: '#F1F5F9', 200: '#E5E7EB', 300: '#D1D5DB', 500: '#6B7280', 700: '#374151', 900: '#1F2A37' },
  success: { 50: '#DCFCE7', 600: '#15803D' },
  warning: { 50: '#FEF3C7', 600: '#B45309' },
  danger:  { 50: '#FEE2E2', 600: '#B91C1C' },
  info:    { 50: '#EAF4FD', 600: '#185FA5' },
}
```

Permite usar tanto em `style={{}}` quanto em classes Tailwind arbitrárias.

### 8.2 [P1] Componente `<StatusBadge status={...} kind="student" />`

Mapear todos os badges espalhados (EnrollmentStatus, EmploymentStatus, TuitionStatus, PeriodType) num único componente. Cada label é um mapa em `lib/labels.ts`.

### 8.3 [P1] Componente `<SearchInput value onChange placeholder />`

Hoje o input de busca é duplicado em **7** lugares com pequenas variações (`StudentsPage`, `TeachersPage`, `SubjectsPage`, `SchoolsPage`, `TuitionsPage`, `LocacaoAlunosPage`, `LocacaoPage`). Centralizar.

### 8.4 [P1] Componente `<ConfirmDialog open onConfirm onCancel title description />`

Reduzir as **15+** cópias de `<AlertDialog>...<AlertDialogAction>...</AlertDialogAction></AlertDialog>` espalhadas pelas páginas.

### 8.5 [P1] Hook `useApiMutation` com toast automático

```ts
const deleteMutation = useApiMutation({
  mutationFn: ...,
  successMessage: 'Aluno removido',
  errorMessage: 'Erro ao remover aluno',
  invalidate: [['students']],
})
```

### 8.6 [P2] ESLint custom rule para proibir `onMouseEnter`/`onMouseLeave` que muda `style`

Forçar uso de classes Tailwind ou variantes do `Button`.

### 8.7 [P2] ESLint custom rule para `style={{ color: '...' }}` com hex hardcoded

Forçar uso de tokens via CSS variables.

### 8.8 [P2] Documentar `packages/types` no Storybook ou docz

`EducationLevel`, `Student`, `Teacher`, `Tuition` etc. são o coração do domínio. Storybook/docs evitam inconsistências de UI.

### 8.9 [P3] Theme variants

Hoje `Button` tem 6 variants e `Badge` tem 7. Criar `tone` (informational, success, warning, danger, neutral) e aplicar consistentemente.

### 8.10 [P3] Padronizar espaçamentos

Mistura de `space-y-4`, `space-y-5`, `space-y-6`, `gap-3`, `gap-4`, `gap-5`, `p-4`, `p-5`, `p-6`, `p-8`. Criar tokens semânticos:

```ts
export const spacing = {
  page: '1.5rem',    // space-y-6
  section: '1.25rem', // space-y-5
  group: '1rem',     // space-y-4
  row: '0.75rem',    // space-y-3
}
```

### 8.11 [P3] Tipografia: definir `textDisplay`, `textTitle`, `textBody`, `textCaption` no CSS

Em vez de `fontSize: 20, letterSpacing: '-0.01em'` ad-hoc em `PageHead`/`StudentDetailPage`, criar classes utilitárias reutilizáveis.

---

## Apêndice A — Hierarquia de prioridade

| Pri | Significado |
| --- | --- |
| **P0** | Quebra feature, bug visível, inconsistência grave. Fazer esta sprint. |
| **P1** | Melhoria substancial de UX/acessibilidade, refactor que desbloqueia outros. Próximas 2 sprints. |
| **P2** | Polish, otimização, refactor secundário. Próximo quarter. |
| **P3** | Nice-to-have, ideias para roadmap futuro. |

## Apêndice B — Métricas sugeridas

Antes e depois de cada ciclo, medir:
- **Lighthouse score** (Performance, Accessibility, Best Practices, SEO)
- **Bundle size** por rota
- **Cobertura de testes** (meta: 70% em 2 sprints)
- **Tempo médio para encontrar uma feature** (UX research)
- **Nº de `onMouseEnter`/`onMouseLeave` no código** (meta: 0)
- **Nº de strings hardcoded em PT-BR fora de `lib/labels.ts`** (meta: 0)

## Apêndice C — Componentes UI shadcn faltando

A maioria do design system está montada, mas valeria a pena adicionar:
- `<Avatar />` (Radix)
- `<Checkbox />`
- `<Switch />`
- `<RadioGroup />`
- `<Combobox />` / `<Command />` (busca com autocomplete para selects grandes)
- `<DataTable />` (com ordenação, paginação, filtros)
- `<EmptyState />`
- `<Spinner />` / `<LoadingDots />`
- `<Toast />` (Sonner já está, mas um wrapper `<ToastProvider>`)
- `<Textarea />`
- `<Calendar />` (date range picker)
- `<Form />` wrapper (já há `useForm` mas sem o `<FormField>` do shadcn para integrar com `Label`/`Input` sem repetição)
- `<Sheet />` (drawer lateral, melhor que o atual mobile)
- `<Popover />` (para filtros avançados)
- `<Breadcrumb />`
- `<Pagination />`
- `<Progress />` (para uploads)
- `<Skeleton />` (já tem, mas com mais variantes)

---

**Última atualização**: 2026-07-22
**Status**: rascunho inicial — itens ainda precisam ser priorizados com o time.
