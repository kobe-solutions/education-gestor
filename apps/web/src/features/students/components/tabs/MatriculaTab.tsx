import { useState } from 'react'
import { BookOpen, Plus, X } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { ENROLLMENT_STATUS_LABELS } from '../../../../lib/labels'
import type { Student, SchoolClass } from '@education-gestor/types'

interface MatriculaTabProps {
  isEdit: boolean
  student?: Student
  allClasses: SchoolClass[]
  studentClasses: { id: string; name: string }[]
  adding: boolean
  onAddToClass(classId: string): void
  onRemoveFromClass(classId: string): void
  onStatusChange(status: string): void
}

export function MatriculaTab({
  isEdit,
  student,
  allClasses,
  studentClasses,
  adding,
  onAddToClass,
  onRemoveFromClass,
  onStatusChange,
}: MatriculaTabProps) {
  const [classToAdd, setClassToAdd] = useState('')

  function handleAdd() {
    if (!classToAdd) return
    onAddToClass(classToAdd)
    setClassToAdd('')
  }

  if (!isEdit) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Salve os dados pessoais primeiro</p>
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Após criar o aluno, você poderá gerenciar matrícula e turmas aqui.
          </p>
        </CardContent>
      </Card>
    )
  }

  const availableClasses = allClasses.filter((c) => !studentClasses.some((sc) => sc.id === c.id))

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm">Dados de matrícula</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Número de matrícula', value: student?.enrollmentCode },
            { label: 'Código interno', value: student?.internalCode ?? '—' },
            { label: 'Data de ingresso', value: student?.enrollmentDate ?? '—' },
            { label: 'Situação', value: student?.enrollmentStatus ? ENROLLMENT_STATUS_LABELS[student.enrollmentStatus] : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="space-y-1">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-medium">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Alterar situação</CardTitle></CardHeader>
        <CardContent>
          <Select
            value={student?.enrollmentStatus ?? 'active'}
            onValueChange={(v) => { if (v !== null) onStatusChange(v) }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ENROLLMENT_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Turmas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {studentClasses.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Aluno não está matriculado em nenhuma turma
            </p>
          )}
          {studentClasses.map((sc) => (
            <div key={sc.id} className="flex items-center justify-between border rounded-sm px-3 py-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">{sc.name}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onRemoveFromClass(sc.id)}>
                <X className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}

          <div className="flex gap-2 pt-1">
            <Select value={classToAdd} onValueChange={(v) => setClassToAdd(v ?? '')}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecionar turma..." />
              </SelectTrigger>
              <SelectContent>
                {availableClasses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleAdd} disabled={!classToAdd || adding}>
              <Plus className="h-3.5 w-3.5" />
              {adding ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
