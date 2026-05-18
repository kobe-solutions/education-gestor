---
name: iris-educacao-design
description: Use this skill to generate well-branded interfaces and assets for IRIS Educação (Brazilian K-12 school-management SaaS — premium, institutional). Contains essential design guidelines, colors, type, fonts, logos, and a click-thru UI kit of the real product for prototyping in HTML or production React.
user-invocable: true
---

# IRIS Educação — Design Skill

Read the `README.md` file within this skill first — it contains the brand vibe, content fundamentals (PT-BR voice + casing + number formats), visual foundations (palette, type, spacing, shadows), and iconography (Lucide @ stroke 2).

Then explore:

- `colors_and_type.css` — copy this into any HTML artifact; it defines every CSS variable the kit relies on, plus shadcn-compatible HSL tokens so the existing codebase auto-brands.
- `assets/logos/` — three SVG lockups: `iris-vertical.svg` (primary), `iris-horizontal-dark.svg` (dark headers/emails), `iris-icon.svg` (favicon, small spaces).
- `ui_kits/iris-educacao/` — click-thru recreation of the Education Gestor app. `index.html` mounts the demo; `components/Atoms.jsx` and `components/Shell.jsx` are the reusable building blocks. Read its own `README.md` for the API surface.
- `preview/` — small, focused design-system cards (one concept each) you can crib styling from.

## Working modes

**If creating visual artifacts (slides, mocks, throwaway HTML prototypes):**
copy `colors_and_type.css` and the needed SVG logos into your output, link the stylesheet, and write static HTML/JSX that uses the CSS variables and classes already defined. Lean on `ui_kits/iris-educacao/styles.css` for ready-made `.btn`, `.badge`, `.card-surface`, `.metric`, `.hub-card`, `.tbl` patterns.

**If working on production code (the real Education Gestor repo, github.com/kobe-solutions/education-gestor):**
the codebase already uses shadcn/ui with HSL CSS variables under `apps/web/src/index.css`. Drop the IRIS variables from `colors_and_type.css` (`--primary`, `--secondary`, `--background`, `--foreground`, `--border`, `--radius`, etc.) into that file and the entire app inherits the brand. Don't restyle individual components.

## Defaults to use without being told

- Language is **Brazilian Portuguese**. Don't write English UI unless asked.
- Currency is **R$ 980,00** with non-breaking space and comma decimal.
- Dates are **DD/MM/AAAA**.
- Icons are **Lucide**, stroke 2, line-cap round.
- **No emoji, no purple gradients, no left-border accent cards, no Inter as body font.** (Inter only inside the logo SVGs.)
- Default font: **Plus Jakarta Sans**. Default radius: **10px**. Default base text size: **14px**.

## If invoked without specifics

If the user invokes this skill with no brief, ask:

1. What are we building? (Marketing site? Internal screen? Email? Deck?)
2. Who's the audience? (Director, secretary, teacher, parent?)
3. Any specific product page or feature to recreate / extend?
4. Any new components I'd need that aren't in the UI kit?

Then act as an expert IRIS Educação designer and output **either** static HTML artifacts (for mocks/decks/prototypes) **or** production React (for the real repo), depending on the answer to question 1.
