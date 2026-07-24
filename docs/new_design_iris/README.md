# IRIS Educação — Design System

> Sistema de design para o produto **IRIS Educação**: um SaaS de gestão escolar multi-tenant para colégios de pequeno e médio porte. Premium, institucional, brasileiro, em português.

A marca IRIS representa **visão completa da trajetória de cada aluno** — o ícone combina um olho (iris/pupila) e um livro aberto, e o azul institucional comunica confiança para diretores e secretarias escolares.

---

## Sources used

| Source | Where it informed this system |
|---|---|
| `assets/IRIS_Educacao_Identidade_Visual.pdf` (uploaded) | Color palette, logo, tagline |
| `assets/logos/iris-*.svg` (uploaded) | Logos at root in `assets/logos/` |
| User notes | Tone (`Moderna, SaaS, institucional, premium`) + exact hex palette |
| <https://github.com/kobe-solutions/education-gestor> | Product context, page anatomy, shadcn variable contract, component vocabulary, copy voice (Portuguese-BR), Lucide icon choices |

The codebase was imported under `apps/web/src/` as read-only reference and shaped both the UI kit components and the page anatomy the design tokens have to support.

---

## File index — what lives where

```
.
├── README.md                       ← this file
├── SKILL.md                        ← Claude Code-compatible skill manifest
├── colors_and_type.css             ← the single source of truth for tokens
│
├── assets/
│   ├── IRIS_Educacao_Identidade_Visual.pdf
│   └── logos/
│       ├── iris-icon.svg              (favicon, app icon, small spaces)
│       ├── iris-vertical.svg          (login, decks, hero — primary lockup)
│       └── iris-horizontal-dark.svg   (email headers, footers — dark bg built in)
│
├── preview/                        ← Cards that populate the Design System tab
│   ├── _shell.css
│   ├── colors-*.html               ( brand-blues, neutrals, semantic, surface )
│   ├── type-*.html                 ( display, body, wordmark )
│   ├── spacing-scale.html, radii.html, elevation.html
│   ├── component-*.html            ( buttons, inputs, badges, hub-card,
│   │                                  metric-card, table-row, sidebar, dialog )
│   └── brand-*.html                ( logo-vertical, logo-horizontal,
│                                      icon-only, iconography )
│
├── ui_kits/
│   └── iris-educacao/              ← Click-thru recreation of the product
│       ├── README.md
│       ├── index.html              (entry point — open in browser)
│       ├── styles.css
│       ├── Icons.jsx
│       ├── app.jsx
│       ├── components/             ( Atoms.jsx, Shell.jsx )
│       └── screens/                ( Login, Dashboard, PessoasHub,
│                                      Alunos, Mensalidades, Estrutura )
│
└── apps/web/src/                   ← Imported codebase reference (read-only).
                                    Used to source component shape, copy, and
                                    icon choices. Not part of the system itself.
```

---

## Content fundamentals — how copy is written

**Language: Brazilian Portuguese only.** The product is sold to Brazilian schools, every label and message is in PT-BR, including UI surfaces and toasts.

**Voice: institutional but warm.**
- Direct, factual, no marketing fluff. School directors want to see numbers and act.
- Slightly formal — closer to "Cadastre o aluno" than to "Vamo lá, bora cadastrar!".
- Uses *você* sparingly; mostly imperatives addressed to the user as actions.

**Casing:** Sentence case for everything except the wordmark ("IRIS" all-caps, "EDUCAÇÃO" all-caps tracked +6px) and section labels rendered with the `.eyebrow` style (uppercase, 0.12em tracking).

**Numbers and money:**
- Currency: `R$ 980,00` — comma as decimal, period as thousands, **non-breaking space** between `R$` and the digits.
- Dates: `DD/MM/AAAA` (`18/05/2026`), never US format.
- Grades: 0–10 scale, one decimal (`7,5` not `7.5`).

**Voice samples — straight from the product**

| Element | Copy |
|---|---|
| Section heading | "Hierarquia completa: Nível de Ensino → Série → Turma" |
| Hub description | "Cadastro, matrículas e dados completos. Acesse boletim e histórico individual." |
| Empty table | "Nenhuma mensalidade vencendo nos próximos 7 dias" |
| Confirmation | "Esta ação não pode ser desfeita." |
| Success toast | "Pagamento registrado" / "Aluno removido" / "Turma criada" |
| Error toast | "Email ou senha incorretos" / "Erro inesperado" |
| Form label | "Nome", "Matrícula", "Vencimento", "Valor (R$)" |

**Don't:**
- ❌ Emoji in copy (`🎉 Pagamento registrado!`).
- ❌ Exclamation marks ("Tudo certo!!").
- ❌ English words when a Portuguese term exists (`dashboard` is the only loanword we keep, because it's already vernacular).
- ❌ "Bem-vindo, [nome]! 👋" — too casual.

**Do:**
- ✅ Short status verbs: *Pendente · Pago · Atrasado · Ativo · Inativo · Transferido.*
- ✅ Helper text under inputs that says *why*: "Mínimo 8 caracteres" / "Usado para enviar relatórios mensais".
- ✅ Numbers leading sentences for KPIs: "412 alunos matriculados em 18 turmas."

---

## Visual foundations

### Colors

A single-hue brand palette: five steps of IRIS blue plus graphite ink and cool slate neutrals. **No purple, no gradient backgrounds, no AI sparkle palettes.** See `preview/colors-brand-blues.html`.

```
Blue 900  #042C53   text, deep accents, dark hero panels
Blue 700  #185FA5   primary actions, links, active nav, brand
Blue 500  #378ADD   hover, focus ring, secondary brand
Blue 300  #85B7EB   light marks on dark, dividers, illustrations
Blue 50   #EAF4FD   surface tint, hub headers, badges
Grafite   #2C2C2A   secondary text on light
```

Semantic state colors are calm and institutional — soft red/amber/green tints with mid-saturated foreground — never neon. Status maps to `pago` (success), `pendente` (warning), `atrasado` (danger), `informativo` (info = brand blue).

### Type

- **Display + body:** Plus Jakarta Sans (400/500/600/700/800).
- **Mono:** JetBrains Mono — for codes (`MAT-2026-00184`), file names, IDs.
- **Wordmark in the supplied logos was set in Inter** (per source SVG). We keep Inter inside the logo files as-is, but everywhere else in the product we use Plus Jakarta Sans because Inter is overused. **If the brand later licenses a custom display face, drop it in `fonts/` and update the `@import` in `colors_and_type.css`.**
- Scale is dense (base 14px) for SaaS table density. Display sizes start at 17px and step through 20, 24, 30, 38, 48, 64.
- Wordmark uses `letter-spacing: 3px` on "IRIS" and `letter-spacing: 6px` on "EDUCAÇÃO" — that horizontal openness is part of the institutional feel.

### Backgrounds

- **Solid surfaces only.** No mesh gradients, no abstract shapes.
- App background is cool white (`#F8FAFC`). Surfaces are pure white. Tinted panels use `#EAF4FD` (Blue 50).
- The login screen uses a single vertical wash from `#EAF4FD` → `#FFFFFF` (60% stop) — the *only* gradient in the system.
- Imagery: institutional photography of students/teachers/classrooms in **warm-natural tones, no filters**. (Not shipped with this system — see Open questions below.)

### Borders

`1px solid var(--border-1)` (`#E5E7EB`) on every container. Dashed borders for empty containers ("turmas sem série atribuída"). Inputs get a heavier `--border-2` (`#D1D5DB`) so they read as interactive.

### Shadows / elevation

Soft, blue-tinted shadows — never grey, never dramatic. The y-axis carries most of the weight; spread is tight. Five steps: `xs` (hair), `sm` (cards · default), `md` (dropdowns), `lg` (dialogs), and a dedicated 3px `focus` ring at 35% Blue 500.

### Radii

`10px` is the default (`--radius-lg`). Buttons step down to 6/8px. Pills 9999. Cards/dialogs step up to 14/20. Never above 24 — the brand is institutional, not playful.

### Layout

- Icon-rail sidebar: **fixed 72px** with stacked `icon + 10px label` per nav item. Comes from `AppLayout.tsx`.
- Header: **56px** strip with role/school/user. Sticky to top of `<main>`.
- Page padding: **24–28px** all sides.
- Grid: 14px gutter across the dashboard KPIs and hub grids.

### Hover / press states

- **Hover, primary actions:** darken by ~12% (`#185FA5` → `#134C84`).
- **Hover, outline buttons:** swap fill to `--bg-tint`, switch border to `Blue 300`, text to `Blue 700`. Light, never harsh.
- **Hover, ghost / nav items:** fill `Slate 100`, text deepens to Slate 900.
- **Hover, hub cards:** border picks up `Blue 700`, shadow steps from `sm` → `md`.
- **Press:** subtle `translateY(0.5px)` only on `.btn`. No scale, no shrink.
- **Disabled:** 50% opacity, `pointer-events: none`. Same colour, never grey-washed.

### Animation

- Easing: `cubic-bezier(0.22, 0.61, 0.36, 1)` (out-soft) for the vast majority of transitions.
- Duration: 120 / 180 / 280 ms — fast, never theatrical.
- Toasts slide up 6px + fade in 240ms. That's the most expressive animation in the system. **No bounces, no spring overshoots, no marquee.**

### Transparency and blur

- Used **only** for the dialog scrim: `rgba(4, 44, 83, 0.45)`. No backdrop-filter on it — keeps the rendering cheap and the chrome readable.
- Avatars use a flat tint, never a semi-transparent overlay.

### Imagery vibe

Institutional photography, warm-natural, no Instagram filters. Cool-blue duotones acceptable for decorative headers (not yet in this system — see Open questions).

### Card patterns

- **Default surface card:** white, `1px` border, `--radius-xl` (14px), `--shadow-sm`.
- **Metric card:** flat white card + circle icon tile + heavy figure (24/800/-0.02em). No coloured left-border accent — that pattern reads as AI slop.
- **Hub card:** click-target card with a 40×40 rounded-square icon tile (Blue 700 on 10% Blue 700), title, description, and `Acessar →` link. Hover → border becomes Blue 700.
- **Tree node:** outer container has a Blue 50 header band; inner series sit on a left-indented hairline rule.

### Anti-patterns

This system explicitly **rejects**:
- Bluish-purple gradients
- Emoji as iconography
- Cards with rounded corners + a coloured left-border accent
- Hand-drawn SVG illustrations (we use the IRIS logo and Lucide icons; everything else is photography or omitted)
- Inter as a body font (used only inside the logo SVG)
- Drop shadows tinted grey or black

---

## Iconography

**Library: [Lucide](https://lucide.dev/)**, used in the source codebase as `lucide-react`. Outline style, **stroke 2, line-cap and line-join `round`**, no fills. Default size 18–22px; colour inherits from `currentColor`.

**Why Lucide:** the source product already uses `lucide-react@1.11`. We re-create those icons as inline SVGs in `ui_kits/iris-educacao/Icons.jsx` so the kit has no JS dependencies.

For new work in production, import Lucide directly. For HTML mockups, copy the SVG paths from `Icons.jsx`.

**Specific glyphs in active use (sidebar + dashboard):**

| Concept | Lucide name |
|---|---|
| Dashboard | `layout-dashboard` |
| Pessoas / Alunos | `users` |
| Professores | `graduation-cap` |
| Acadêmico / Turmas | `book-open` |
| Financeiro / Mensalidades | `dollar-sign` |
| Calendário, Período letivo | `calendar` |
| Estrutura | `network` |
| Estrutura — nível | `layers` |
| Mensalidade pendente | `clock` |
| Mensalidade paga | `check-circle` |
| Mensalidade atrasada | `alert-circle` |
| Escolas | `school` |
| Administração | `building-2` |
| Buscar / Editar / Excluir | `search` / `pencil` / `trash-2` |
| Adicionar | `plus` |
| Sair | `log-out` |

**Substitution flag:** the source uses `lucide-react@1.11`. We've inlined a representative subset of glyphs in `Icons.jsx` so the kit works offline. **If you need an icon not in `Icons.jsx`, the canonical thing to do is import it from `lucide-react` (production) or copy the SVG body from <https://lucide.dev/icons/> (mockups).**

**No emoji.** No Unicode glyphs as icons (no ★, no 📚). The only place an emoji is acceptable is in user-generated content (a student's name with an accent character isn't an emoji — that's the language).

**Icon backgrounds:** when an icon needs a tile (hub card, metric card), it sits on a flat fill — usually `rgba(24,95,165,.10)` (Blue 700 at 10%), with the icon itself in Blue 700. For dashboard KPI tiles the fill is a solid status colour (Blue 700, Blue 500, Blue 900, Amber 700, Green 700, Red 700) with a white icon.

---

## Substitutions flagged for the user

1. **Display font.** No licensed brand display font was provided. We're using **Plus Jakarta Sans** (Google Fonts) — modern, geometric, premium, not overused. The logo SVGs themselves are set in Inter (per source). **Please send the brand's licensed font(s) if there are any**, and I'll swap the `@import` and add the files to `fonts/`.

2. **Photography.** No brand photography was supplied. The system specifies the *vibe* (institutional, warm-natural, no filters) but ships no hero or full-bleed images. **Send 2–3 representative photos** and I'll add a `brand-imagery` card and an example hero pattern.

3. **Icons.** The system uses Lucide as a CDN-free inlined set in `Icons.jsx`. **If you want a custom icon family**, send SVG sources and I'll integrate them.

4. **PDF brand guide.** `IRIS_Educacao_Identidade_Visual.pdf` is shipped under `assets/` but its text content didn't parse cleanly (it appears to be an image-only PDF). **If there are typography or layout rules in there**, paste them as text and I'll fold them in.

---

## Quick start — using this in a new design

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <link rel="stylesheet" href="colors_and_type.css">
  <style>
    body { font-family: var(--font-body); background: var(--bg-app); }
  </style>
</head>
<body>
  <h1>Boletim do Aluno</h1>
  <p class="muted">9º ano A · 2º bimestre</p>
  …
</body>
</html>
```

For React mockups, copy `ui_kits/iris-educacao/components/` into your project — every atom is plain JSX with no dependencies beyond React.
