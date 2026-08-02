/**
 * Tokens semânticos de espaçamento (valores em rem).
 * Usados para padronizar espaçamento vertical/horizontal entre seções,
 * grupos e linhas — substituindo a mistura de `space-y-*`/`gap-*` ad hoc.
 *
 * Uso com Tailwind (valores arbitrários):
 *   <div className="space-y-[var(--spacing-section)]">...</div>
 *
 * Ou como constantes TS em `style={{ padding: spacing.page }}`.
 */
export const spacing = {
  /** Espaçamento entre blocos de página (equivalente a space-y-6) */
  page: '1.5rem',
  /** Espaçamento entre seções dentro de um bloco (space-y-5) */
  section: '1.25rem',
  /** Espaçamento entre grupos/cards (space-y-4) */
  group: '1rem',
  /** Espaçamento entre linhas/itens (space-y-3) */
  row: '0.75rem',
} as const

export type SpacingToken = keyof typeof spacing
