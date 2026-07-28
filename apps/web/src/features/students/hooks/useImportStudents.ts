import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { toast } from 'sonner'

export type ImportResultRow = {
  row: number
  status: 'success' | 'error'
  message?: string
  studentId?: string
}

export type ImportResult = {
  totalRows: number
  imported: number
  errors: number
  details: ImportResultRow[]
}

export function useImportStudents() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post<ImportResult>('/students/import', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['students'] })
      if (data.imported > 0) {
        toast.success(`${data.imported} aluno(s) importado(s) com sucesso`)
      }
      if (data.errors > 0) {
        toast.error(`${data.errors} erro(s) encontrados na planilha`)
      }
    },
    onError: () => {
      toast.error('Erro ao importar arquivo')
    },
  })
}
