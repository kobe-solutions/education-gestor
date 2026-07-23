import { useState } from 'react'
import { useClasses } from '../../classes/hooks/useClasses'
import { useClassAttendance, useRegisterBulkAttendance } from '../hooks/useAcademic'
import { useStudents } from '../../students/hooks/useStudents'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'

export function AttendancePage() {
  const today = new Date().toISOString().split('T')[0]
  const [selectedClassId, setSelectedClassId] = useState('')
  const [date, setDate] = useState(today)
  const [attendance, setAttendance] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState(false)

  const { data: classes } = useClasses()
  const { data: existingAttendances } = useClassAttendance(selectedClassId, date)
  const { data: studentsData } = useStudents()
  const allStudents = studentsData?.data
  const bulkMutation = useRegisterBulkAttendance()

  const selectedClass = classes?.find((c) => c.id === selectedClassId)
  const classStudents = selectedClass?.students ?? []
  const studentIds = classStudents.map((s: any) => s.studentId)
  const enrolledStudents = allStudents?.filter((s) => studentIds.includes(s.id)) ?? []

  function toggle(studentId: string) {
    setAttendance((prev) => ({ ...prev, [studentId]: !prev[studentId] }))
    setSaved(false)
  }

  function handleSave() {
    const attendances = enrolledStudents.map((s) => ({
      studentId: s.id,
      present: attendance[s.id] ?? true,
    }))
    bulkMutation.mutate(
      { classId: selectedClassId, date, attendances },
      { onSuccess: () => setSaved(true) },
    )
  }

  function initAttendance() {
    if (existingAttendances && existingAttendances.length > 0) {
      const map: Record<string, boolean> = {}
      existingAttendances.forEach((a) => { map[a.studentId] = a.present })
      setAttendance(map)
    } else {
      const map: Record<string, boolean> = {}
      enrolledStudents.forEach((s) => { map[s.id] = true })
      setAttendance(map)
    }
  }

  const isReady = selectedClassId && date && enrolledStudents.length > 0

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Frequência</h1>

      <div className="flex gap-4 items-end">
        <div className="w-64 space-y-1">
          <Label>Turma</Label>
          <Select value={selectedClassId} onValueChange={(v) => { setSelectedClassId(v); setAttendance({}); setSaved(false) }}>
            <SelectTrigger><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
            <SelectContent>
              {classes?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name} — {c.serie?.name ?? c.shift}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Data</Label>
          <Input type="date" value={date} onChange={(e) => { setDate(e.target.value); setAttendance({}); setSaved(false) }} />
        </div>
        {isReady && Object.keys(attendance).length === 0 && (
          <Button variant="outline" onClick={initAttendance}>Carregar chamada</Button>
        )}
      </div>

      {isReady && Object.keys(attendance).length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Chamada — {date}</CardTitle>
              <div className="flex items-center gap-2">
                {saved && <span className="text-xs text-green-600">Salvo!</span>}
                <Button size="sm" onClick={handleSave} disabled={bulkMutation.isPending}>
                  {bulkMutation.isPending ? 'Salvando...' : 'Salvar chamada'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead className="w-32 text-center">Presente</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrolledStudents.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell className="text-center">
                      <button
                        type="button"
                        onClick={() => toggle(s.id)}
                        className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                          attendance[s.id]
                            ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                            : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        }`}
                      >
                        {attendance[s.id] ? 'P' : 'F'}
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
