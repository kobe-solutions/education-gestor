import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Building2, Trash2 } from 'lucide-react'
import { useCreateSecretaria, useSecretariaSchools, useLinkSchool, useUnlinkSchool } from '../hooks/useSecretarias'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import type { Secretaria } from '@education-gestor/types'

const schema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

function SecretariaCard({ secretaria }: { secretaria: Secretaria }) {
  const { data: schools } = useSecretariaSchools(secretaria.id)
  const unlinkMutation = useUnlinkSchool(secretaria.id)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          {secretaria.name}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{secretaria.email}</p>
      </CardHeader>
      <CardContent>
        <p className="text-xs font-medium text-muted-foreground mb-2">Escolas vinculadas</p>
        {schools?.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma escola vinculada</p>}
        <ul className="space-y-1">
          {schools?.map((s) => (
            <li key={s.id} className="flex items-center justify-between text-sm">
              <span>{s.name}</span>
              <Button variant="ghost" size="icon" onClick={() => unlinkMutation.mutate(s.id)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export function SecretariasPage() {
  const createMutation = useCreateSecretaria()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [secretarias, setSecretarias] = useState<Secretaria[]>([])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  function onSubmit(data: FormData) {
    createMutation.mutate(data, {
      onSuccess: (s) => {
        setSecretarias((prev) => [...prev, s])
        setDialogOpen(false)
        reset()
      },
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Secretarias</h1>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova secretaria
        </Button>
      </div>

      {secretarias.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma secretaria cadastrada.</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        {secretarias.map((s) => (
          <SecretariaCard key={s.id} secretaria={s} />
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(v) => !v && setDialogOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova secretaria</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input placeholder="Ex: Rede ABC" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Senha</Label>
              <Input type="password" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>Criar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
