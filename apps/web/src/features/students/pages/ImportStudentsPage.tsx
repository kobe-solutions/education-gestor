import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Download, ArrowLeft, FileText, Trash2, Table2 } from 'lucide-react'
import { PageHead } from '../../../components/PageHead'
import { Button } from '../../../components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Separator } from '../../../components/ui/separator'
import { ACCENT_COLOR } from '../../../lib/colors'
import { cn } from '../../../lib/utils'
import { useImportStudents } from '../hooks/useImportStudents'
import type { ImportResult } from '../hooks/useImportStudents'

const ACCEPTED_TYPES = '.csv,.xlsx,.xls'
const MAX_SIZE = 10 * 1024 * 1024
const MAX_SIZE_MB = 10

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function generateTemplateCsv() {
  const headers = [
    'name', 'birthDate', 'cpf', 'rg', 'sex', 'bloodType', 'naturalidade',
    'email', 'phone', 'motherName', 'fatherName', 'motherPhone',
    'addressCep', 'addressStreet', 'addressNumber', 'addressComplement',
    'addressNeighborhood', 'addressCity', 'addressState',
    'comorbidities', 'observations', 'internalCode',
    'enrollmentDate', 'enrollmentStatus',
  ]
  const sample = [
    'Maria Souza', '2010-03-15', '123.456.789-00', '12.345.678-9', 'F', 'A+', 'São Paulo',
    'maria@email.com', '(11) 99999-8888', 'Ana Souza', 'Carlos Souza', '(11) 98888-7777',
    '01001-000', 'Rua das Flores', '123', 'Apto 45',
    'Centro', 'São Paulo', 'SP',
    'Nenhuma', '', 'AL-2024-001',
    '2024-02-01', 'active',
  ]
  const headerLine = headers.join(',')
  const sampleLine = sample.join(',')
  const bom = '\uFEFF'
  return bom + headerLine + '\n' + sampleLine + '\n'
}

function downloadTemplate() {
  const csv = generateTemplateCsv()
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'modelo-importacao-alunos.csv'
  a.click()
  URL.revokeObjectURL(url)
}

type Step = 'upload' | 'processing' | 'result'

export function ImportStudentsPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [errorTab, setErrorTab] = useState<'all' | 'success' | 'error'>('all')

  const importMutation = useImportStudents()

  const validateFile = useCallback((f: File): string | null => {
    const ext = f.name.toLowerCase().split('.').pop()
    if (!ext || !['csv', 'xlsx', 'xls'].includes(ext)) {
      return 'Formato inválido. Use arquivos CSV ou XLSX.'
    }
    if (f.size > MAX_SIZE) {
      return `Arquivo muito grande (${formatFileSize(f.size)}). Máximo permitido: ${MAX_SIZE_MB}MB.`
    }
    return null
  }, [])

  const handleFileSelect = useCallback((f: File) => {
    const error = validateFile(f)
    if (error) {
      toast.error(error)
      return
    }
    setFile(f)
  }, [validateFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFileSelect(f)
  }, [handleFileSelect])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFileSelect(f)
  }, [handleFileSelect])

  const handleImport = useCallback(async () => {
    if (!file) return
    setStep('processing')
    try {
      const data = await importMutation.mutateAsync(file)
      setResult(data)
      setStep('result')
    } catch {
      setStep('upload')
    }
  }, [file, importMutation])

  const handleReset = useCallback(() => {
    setFile(null)
    setResult(null)
    setStep('upload')
    setErrorTab('all')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const filteredDetails = result?.details.filter((d) => {
    if (errorTab === 'success') return d.status === 'success'
    if (errorTab === 'error') return d.status === 'error'
    return true
  }) ?? []

  const successCount = result?.details.filter((d) => d.status === 'success').length ?? 0

  return (
    <div className="space-y-6">
      <PageHead
        title="Importar Alunos"
        subtitle="Cadastre alunos em lote a partir de uma planilha"
        backTo="/students"
      />

      {step === 'upload' && (
        <>
          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-0">
            {['upload', 'processing', 'result'].map((s, i) => {
              const isActive = s === 'upload'
              const isDone = false
              const labels = ['Upload', 'Processamento', 'Resultado']
              return (
                <div key={s} className="flex items-center">
                  <div className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors',
                    isActive && 'text-white',
                    !isActive && 'text-muted-foreground',
                  )}
                  style={isActive ? { background: ACCENT_COLOR } : undefined}
                  >
                    {isDone ? <CheckCircle2 size={16} /> : <span className="flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold border" style={isActive ? { borderColor: 'transparent' } : { borderColor: 'hsl(var(--border))' }}>{i + 1}</span>}
                    <span className="hidden sm:inline">{labels[i]}</span>
                  </div>
                  {i < 2 && (
                    <div className="w-8 h-px mx-1" style={{ background: 'hsl(var(--border))' }} />
                  )}
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload area */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Selecionar Arquivo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all duration-200 cursor-pointer group',
                      dragOver && 'scale-[1.01]',
                    )}
                    style={{
                      borderColor: dragOver ? ACCENT_COLOR : file ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                      background: dragOver ? `${ACCENT_COLOR}08` : file ? 'hsl(var(--primary)) / 0.03' : undefined,
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_TYPES}
                      className="hidden"
                      onChange={handleInputChange}
                    />

                    {!file ? (
                      <>
                        <div
                          className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4 transition-transform group-hover:scale-110"
                          style={{ background: `${ACCENT_COLOR}12` }}
                        >
                          <Upload size={24} style={{ color: ACCENT_COLOR }} />
                        </div>
                        <p className="text-base font-semibold">Arraste o arquivo aqui ou clique para selecionar</p>
                        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          Formatos aceitos: CSV, XLSX ou XLS (máx. {MAX_SIZE_MB}MB)
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center gap-4 w-full max-w-md">
                        <div
                          className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
                          style={{ background: `${ACCENT_COLOR}12` }}
                        >
                          <FileSpreadsheet size={22} style={{ color: ACCENT_COLOR }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{file.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleImport}
                      disabled={!file || importMutation.isPending}
                      className="gap-2"
                    >
                      {importMutation.isPending ? (
                        <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                      ) : (
                        <Upload size={16} />
                      )}
                      {importMutation.isPending ? 'Importando...' : 'Importar Alunos'}
                    </Button>
                    <Button variant="outline" onClick={downloadTemplate} className="gap-2">
                      <Download size={16} />
                      Baixar Modelo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Info sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle size={16} style={{ color: '#F59E0B' }} />
                    Instruções
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <p>Baixe o modelo de planilha para garantir o formato correto dos dados.</p>
                  <Separator />
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Campos obrigatórios:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li><code className="text-xs px-1 py-0.5 rounded" style={{ background: 'hsl(var(--muted))' }}>name</code> — Nome completo</li>
                      <li><code className="text-xs px-1 py-0.5 rounded" style={{ background: 'hsl(var(--muted))' }}>birthDate</code> — Data (AAAA-MM-DD)</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Regras:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>CPFs duplicados são rejeitados</li>
                      <li>Código de matrícula é gerado automaticamente</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Table2 size={16} style={{ color: ACCENT_COLOR }} />
                    Colunas Disponíveis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {['name', 'birthDate', 'cpf', 'rg', 'sex', 'bloodType', 'email', 'phone', 'motherName', 'fatherName', 'motherPhone', 'addressCep', 'addressStreet', 'addressNumber', 'addressCity', 'addressState', 'comorbidities', 'enrollmentStatus'].map((col) => (
                      <span
                        key={col}
                        className="text-xs px-2 py-1 rounded-md font-mono"
                        style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {step === 'processing' && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div
              className="flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{ background: `${ACCENT_COLOR}12` }}
            >
              <span className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: ACCENT_COLOR, borderTopColor: 'transparent' }} />
            </div>
            <p className="text-lg font-semibold">Processando arquivo...</p>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Validando dados e realizando importação
            </p>
          </CardContent>
        </Card>
      )}

      {step === 'result' && result && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl" style={{ background: 'rgba(129, 140, 248, 0.12)' }}>
                  <FileText size={22} style={{ color: ACCENT_COLOR }} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{result.totalRows}</p>
                  <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Total de Linhas</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl" style={{ background: 'rgba(34, 197, 94, 0.12)' }}>
                  <CheckCircle2 size={22} className="text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-500">{result.imported}</p>
                  <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Importados</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.12)' }}>
                  <XCircle size={22} className="text-red-500" />
                </div>
                <div>
                  <p className={cn('text-2xl font-bold', result.errors > 0 ? 'text-red-500' : 'text-green-500')}>{result.errors}</p>
                  <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Erros</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details table */}
          {result.details.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Detalhes da Importação</CardTitle>
                <div className="flex items-center gap-1">
                  {(['all', 'success', 'error'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setErrorTab(tab)}
                      className={cn(
                        'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                        errorTab === tab
                          ? 'text-white'
                          : 'hover:bg-muted',
                      )}
                      style={errorTab === tab ? { background: ACCENT_COLOR } : { color: 'hsl(var(--muted-foreground))' }}
                    >
                      {tab === 'all' && `Todos (${result.details.length})`}
                      {tab === 'success' && `Sucesso (${successCount})`}
                      {tab === 'error' && `Erro (${result.errors})`}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                        <th className="text-left font-medium px-4 py-3" style={{ color: 'hsl(var(--muted-foreground))' }}>Linha</th>
                        <th className="text-left font-medium px-4 py-3" style={{ color: 'hsl(var(--muted-foreground))' }}>Status</th>
                        <th className="text-left font-medium px-4 py-3" style={{ color: 'hsl(var(--muted-foreground))' }}>Mensagem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDetails.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            Nenhum resultado encontrado
                          </td>
                        </tr>
                      ) : (
                        filteredDetails.map((d, i) => (
                          <tr
                            key={i}
                            className="transition-colors hover:bg-muted/50"
                            style={{ borderBottom: '1px solid hsl(var(--border))' }}
                          >
                            <td className="px-4 py-3 font-mono text-xs">
                              {d.row > 0 ? d.row : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={d.status === 'success' ? 'success' : 'danger'}>
                                {d.status === 'success' ? 'Importado' : 'Erro'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3" style={{ color: 'hsl(var(--foreground))' }}>
                              {d.message || (d.studentId ? 'Aluno cadastrado' : '')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button onClick={handleReset} className="gap-2">
              <Upload size={16} />
              Nova Importação
            </Button>
            <Button variant="outline" onClick={() => navigate('/students')} className="gap-2">
              <ArrowLeft size={16} />
              Ver Alunos
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
