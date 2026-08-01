import { useRef, useState } from 'react'
import { FileText, Trash2, Upload } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { DOCUMENT_TYPE_LABELS } from '../../../../lib/labels'
import type { StudentDocument } from '@education-gestor/types'

interface DocumentsTabProps {
  documents?: StudentDocument[]
  uploading: boolean
  onUpload(file: File, type: string): void
  onDelete(id: string): void
}

export function DocumentsTab({ documents, uploading, onUpload, onDelete }: DocumentsTabProps) {
  const docInputRef = useRef<HTMLInputElement>(null)
  const [docType, setDocType] = useState('outros')

  function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onUpload(file, docType)
    e.target.value = ''
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Documentos e anexos</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={docType} onValueChange={(v) => setDocType(v ?? '')}>
              <SelectTrigger className="h-8 w-48 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => docInputRef.current?.click()} disabled={uploading}>
              <Upload className="h-3.5 w-3.5" />
              {uploading ? 'Enviando...' : 'Anexar'}
            </Button>
            <input ref={docInputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleDocUpload} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {(!documents || documents.length === 0) && (
          <p className="text-xs text-muted-foreground text-center py-8">Nenhum documento anexado</p>
        )}
        {documents?.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between border rounded-sm px-3 py-2">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm">{doc.name}</p>
                <p className="text-xs text-muted-foreground">
                  {DOCUMENT_TYPE_LABELS[doc.type]}
                  {doc.fileSize ? ` · ${(doc.fileSize / 1024).toFixed(0)} KB` : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => window.open(doc.fileUrl, '_blank')}>
                Ver
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(doc.id)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
