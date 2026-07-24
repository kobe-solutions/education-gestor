# IRIS Educação — UI Kit

Click-thru recreation of the **Education Gestor** product, restyled with the IRIS Educação brand. Drop-in components for prototyping new screens at high fidelity.

## Layered structure

The kit is sliced into four layers — `lib` → `components` → `features` → `app`. Lower layers never depend on higher ones. Within `features/`, each domain owns its own screens and (when present) its constants and sub-screens.

```
ui_kits/iris-educacao/
├── index.html                    ← loads styles + scripts in dependency order
├── app.jsx                       ← root orchestrator (auth + routing + state hooks)
├── README.md
│
├── lib/                          ← cross-cutting helpers
│   ├── icons.jsx                   inline lucide SVGs (window.I)
│   ├── formatters.jsx              fmtBRL, initials, fileSizeKB
│   └── seed.jsx                    SEED + ALL_CLASSES (demo data)
│
├── components/                   ← visual primitives — no domain logic
│   ├── ui/
│   │   ├── forms.jsx               Button, Field, Input, Search, Textarea, Select, Checkbox
│   │   ├── display.jsx             Badge, Avatar, MetricCard, HubCard, TuitionStatusBadge
│   │   ├── layout.jsx              Surface, SectionCard, PageHead, Tabs
│   │   └── feedback.jsx            Dialog, Toast, EmptyState
│   └── layout/
│       ├── Sidebar.jsx             icon-rail nav
│       └── AppHeader.jsx           top strip (role · school · user)
│
├── features/                     ← one folder per domain
│   ├── auth/         LoginScreen.jsx
│   ├── dashboard/    DashboardScreen.jsx
│   ├── hubs/         PessoasHubScreen.jsx
│   ├── students/
│   │   ├── constants.jsx             shared selects + label maps
│   │   ├── AlunosScreen.jsx          list
│   │   ├── AlunoDetailScreen.jsx     detail orchestrator
│   │   └── tabs/
│   │       ├── PessoalTab.jsx          dados pessoais + foto
│   │       ├── FamiliaTab.jsx          família + endereço + responsáveis
│   │       ├── SaudeTab.jsx            ficha médica
│   │       ├── DocumentosTab.jsx       upload + listagem
│   │       └── MatriculaTab.jsx        situação + turmas
│   ├── financial/    MensalidadesScreen.jsx
│   ├── academic/     EstruturaScreen.jsx
│   └── locacao/
│       ├── tones.jsx                  shared palette helpers (LOC_tone, LOC_initials)
│       ├── LocacaoAulasScreen.jsx     drag-drop grade horária
│       └── LocacaoAlunosScreen.jsx    drag-drop matrícula em turmas
│
└── styles/                       ← split by layer, mirrors JSX layout
    ├── main.css                    @imports the rest in order
    ├── tokens.css                  inherits ../../colors_and_type.css + reset
    ├── primitives.css              .btn / .input / .badge / .tabs / .card-surface …
    ├── layout.css                  .app-shell / .sidebar / .main / utility classes
    ├── feedback.css                .dlg / .toast / .empty
    └── features/
        ├── auth.css                   .login-*
        ├── dashboard.css              (stub — uses primitives only)
        ├── students.css               .detail-head, .photo-*, .doc-row, .guardian-row, .kv-grid, .cls-row
        ├── academic.css               .tree-*
        └── locacao.css                .loc-*, .subj-*, .drag-chip, .lesson-*, .timetable*, .kanban-*
```

## Adding a new feature

1. Create `features/<name>/<Screen>.jsx`. Export to `window` at the bottom: `window.MyScreen = MyScreen`.
2. (Optional) Add `styles/features/<name>.css` and append an `@import` line to `styles/main.css`.
3. Add a `<script type="text/babel" src="features/<name>/...">` line to `index.html` **after** any primitive it depends on.
4. Add the route to `renderRoute()` in `app.jsx`.

## Conventions

- **No bundler.** Each JSX file is a `<script type="text/babel">` block — Babel compiles in the browser. Components share scope via `Object.assign(window, { … })` at the bottom of each file.
- **Order matters.** `index.html` is the dependency manifest: `lib` (icons, formatters, seed) → `components/ui` (primitives) → `components/layout` (shell) → `features` (screens, with `students/constants.jsx` and `students/tabs/*` before `AlunoDetailScreen.jsx`; `locacao/tones.jsx` before locação screens) → `app.jsx` last.
- **Naming.** PascalCase for components, camelCase for hooks (`useStudentHandlers`), kebab-case for CSS files matching the folder name.
- **Styling.** Class names follow the `.feature-piece` convention (e.g. `.tree-head .ds`, `.doc-row .ico`). All colour/spacing/radius/shadow values come from CSS variables defined in `colors_and_type.css`.

## How to use these components in production

Each component is plain React with no dependencies beyond React itself, and the styles are CSS — no Tailwind, no styled-components. To port:

1. Copy the JSX file into your `apps/web/src/components/` (or wherever).
2. Convert `Object.assign(window, …)` to ES module `export { … }`.
3. Copy the relevant `styles/*.css` file(s) and `@import` them where you import `index.css`.
4. Replace `window.I.IconName` with `import { IconName } from "lucide-react"`.

## Fidelity caveats

- Demo data lives in `lib/seed.jsx` as a single `SEED` constant — no API calls.
- Routing is a `switch` in `app.jsx`, not React Router.
- Forms accept any input — there's no Zod validation, just visual error states.
- `Professores`, `Configurações` show empty states — they exist in the real product but are stubbed here.

## Source

Original codebase: <https://github.com/kobe-solutions/education-gestor>
