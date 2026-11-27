import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { MaskedInput } from '../../../components/ui/masked-input'

function TestForm({ onSubmit }: { onSubmit: (data: { cpf: string; phone: string; cep: string }) => void }) {
  const { register, handleSubmit } = useForm({
    defaultValues: { cpf: '', phone: '', cep: '' },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <MaskedInput aria-label="CPF" mask="cpf" {...register('cpf')} />
      <MaskedInput aria-label="Telefone" mask="phone" {...register('phone')} />
      <MaskedInput aria-label="CEP" mask="cep" {...register('cep')} />
      <button type="submit">Enviar</button>
    </form>
  )
}

describe('MaskedInput', () => {
  it('aplica máscara ao digitar e envia o valor mascarado pelo react-hook-form', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<TestForm onSubmit={onSubmit} />)

    const cpfInput = screen.getByLabelText('CPF')
    const phoneInput = screen.getByLabelText('Telefone')
    const cepInput = screen.getByLabelText('CEP')

    await user.type(cpfInput, '12345678901')
    await user.type(phoneInput, '11999998888')
    await user.type(cepInput, '01310100')

    expect(cpfInput).toHaveValue('123.456.789-01')
    expect(phoneInput).toHaveValue('(11) 99999-8888')
    expect(cepInput).toHaveValue('01310-100')

    await user.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(onSubmit).toHaveBeenCalledWith(
      {
        cpf: '123.456.789-01',
        phone: '(11) 99999-8888',
        cep: '01310-100',
      },
      expect.anything(),
    )
  })
})
