import * as React from 'react'
import { Input } from './input'
import { applyMask, type MaskType } from '@/lib/masks'

export interface MaskedInputProps extends React.ComponentProps<typeof Input> {
  mask: MaskType
}

const DEFAULT_INPUT_MODES: Record<MaskType, React.HTMLAttributes<HTMLInputElement>['inputMode']> = {
  cpf: 'numeric',
  cnpj: 'numeric',
  cep: 'numeric',
  phone: 'tel',
  rg: 'text',
}

export function MaskedInput({ mask, onChange, inputMode, ...props }: MaskedInputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    e.target.value = applyMask(mask, e.target.value)
    onChange?.(e)
  }

  return (
    <Input
      inputMode={inputMode ?? DEFAULT_INPUT_MODES[mask]}
      onChange={handleChange}
      {...props}
    />
  )
}
