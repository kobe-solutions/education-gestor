# Importação de Alunos por Planilha

## Visão Geral

Endpoint `POST /students/import` para cadastrar alunos em lote a partir de arquivos CSV ou XLSX.

## Arquivos Criados/Modificados

### 1. `packages/shared/` — Pacote compartilhado

| Arquivo | Descrição |
|---|---|
| `package.json` | Dependências: `xlsx`, `csv-parse`, `zod` |
| `src/spreadsheet.parser.ts` | Parse de CSV (com `;`, `,` ou `\t`) e XLSX para `Record<string, string>[]` |
| `src/index.ts` | Exporta `parseSpreadsheet` e tipos |

### 2. `apps/api/src/modules/students/` — Módulo de alunos

| Arquivo | Descrição |
|---|---|
| `import-students.schema.ts` | Zod schema de validação por linha + tipos do resultado |
| `import-students.repository.ts` | Batch insert, geração de códigos de matrícula e verificação de CPFs duplicados |
| `import-students.service.ts` | Orquestra parse → validação → duplicidade → batch insert → audit |
| `students.routes.ts` | Adicionado: `POST /students/import` (multipart) |

### 3. `apps/api/package.json`

Adicionado: `"@education-gestor/shared": "workspace:*"`

---

## Funcionamento do Fluxo

1. **Upload**: O frontend envia o arquivo via `multipart/form-data` (campo `file`)
2. **Parse**: `parseSpreadsheet(buffer, filename)` detecta CSV ou XLSX e retorna `{ headers, rows, totalRows }`
3. **Validação**: Cada linha é validada contra `importStudentRowSchema`:
   - **Campos obrigatórios**: `name` (mín. 2 caracteres), `birthDate` (formato `YYYY-MM-DD`)
   - **Campos opcionais**: cpf, rg, sex, bloodType, email, phone, motherName, fatherName, motherPhone, endereço completo, comorbidities, observations, internalCode, enrollmentDate, enrollmentStatus
   - Erros de validação são coletados linha a linha (não interrompem o lote)
4. **Duplicidade**: CPFs já existentes na escola são rejeitados com mensagem específica
5. **Matrícula**: Códigos de matrícula são gerados em lote seguindo o padrão `YYYYNNNN` (ano + sequencial)
6. **Inserção**: `batchCreateStudentsRepository` insere todos os alunos válidos em uma única query
7. **Audit**: Logado com ação `CREATE`, entidade `student` e entityId `batch:N` no payload
8. **Resposta**: `{ totalRows, imported, errors, details[] }`

---

## Schema da Planilha (CSV/XLSX)

A primeira linha deve conter os cabeçalhos. Colunas reconhecidas:

| Coluna | Obrigatório | Descrição |
|---|---|---|
| `name` | Sim | Nome do aluno |
| `birthDate` | Sim | Data de nascimento (YYYY-MM-DD) |
| `cpf` | Não | CPF (validado duplicidade) |
| `rg` | Não | RG |
| `sex` | Não | M, F ou outro |
| `bloodType` | Não | A+, A-, B+, B-, AB+, AB-, O+, O- |
| `naturalidade` | Não | Cidade natal |
| `email` | Não | Email |
| `phone` | Não | Telefone |
| `motherName` | Não | Nome da mãe |
| `fatherName` | Não | Nome do pai |
| `motherPhone` | Não | Telefone da mãe |
| `addressCep` | Não | CEP |
| `addressStreet` | Não | Logradouro |
| `addressNumber` | Não | Número |
| `addressComplement` | Não | Complemento |
| `addressNeighborhood` | Não | Bairro |
| `addressCity` | Não | Cidade |
| `addressState` | Não | Estado |
| `comorbidities` | Não | Comorbidades |
| `observations` | Não | Observações |
| `internalCode` | Não | Código interno |
| `enrollmentDate` | Não | Data de matrícula (default: hoje) |
| `enrollmentStatus` | Não | active, inactive, transferred, cancelled (default: active) |

---

## Exemplo de Resposta

```json
{
  "totalRows": 150,
  "imported": 148,
  "errors": 2,
  "details": [
    { "row": 5, "status": "error", "message": "Nome deve ter no mínimo 2 caracteres" },
    { "row": 23, "status": "error", "message": "CPF 123.456.789-00 já cadastrado" },
    { "row": 0, "status": "success", "studentId": "uuid-1", "message": "Matrícula 20260001" },
    { "row": 0, "status": "success", "studentId": "uuid-2", "message": "Matrícula 20260002" }
  ]
}
```

> `row: 0` nos detalhes de sucesso indica que o aluno foi inserido (o número da linha original não é preservado após a validação).

---

## Recomendações para o Frontend

### Upload do arquivo

Enviar como `multipart/form-data` com o campo `file`:

```ts
const form = new FormData()
form.append('file', file) // File object do input[type=file]

const { data } = await api.post('/students/import', form, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
```

### Validações pré-envio

- **Tamanho**: Verificar se o arquivo tem no máximo 10MB
- **Extensão**: Aceitar apenas `.csv`, `.xlsx`, `.xls`
- **Confirmação**: Exibir contagem de linhas antes de enviar (se possível parsear headers no client)

### Feedback durante o processamento

- **Loading**: Desabilitar botão enquanto importa, mostrar spinner
- **Resultado**:
  - Exibir `totalRows`, `imported`, `errors` em cards coloridos (verde/amarelo/vermelho)
  - Exibir tabela com `details` mostrando cada erro (linha + mensagem)
  - Toasts de sucesso/erro usando `sonner`

### Hook TanStack Query

```ts
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      toast.success('Importação concluída')
    },
    onError: () => {
      toast.error('Erro ao importar arquivo')
    },
  })
}
```

### Estado da UI sugerido

```ts
type ImportResult = {
  totalRows: number
  imported: number
  errors: number
  details: Array<{
    row: number
    status: 'success' | 'error'
    message?: string
    studentId?: string
  }>
}
```

### Tratamento de erros HTTP

| Status | Significado |
|---|---|
| 400 | Arquivo não enviado, formato inválido ou muito grande |
| 401 | Token JWT ausente/inválido |
| 403 | Role não autorizada |
| 413 | Payload muito grande (Fastify limita em 10MB) |

---

## Considerações de Segurança

- O arquivo é processado em memória (buffer) e descartado após a resposta
- Limite de 10MB por arquivo (configurável no `@fastify/multipart`)
- CPFs são verificados contra a base existente da mesma escola
- Audit log registra nome do arquivo, total de linhas e quantos foram importados
- `authenticate`, `injectTenant` e `authorizeRoles` protegem o endpoint