import { parse as csvParse } from 'csv-parse/sync'
import * as XLSX from 'xlsx'

export type SpreadsheetRow = Record<string, string>

export type ParseResult = {
  headers: string[]
  rows: SpreadsheetRow[]
  totalRows: number
}

export function parseSpreadsheet(buffer: Buffer, fileName: string): ParseResult {
  const ext = fileName.toLowerCase().split('.').pop()

  if (ext === 'csv') {
    return parseCsv(buffer)
  }

  if (ext === 'xlsx' || ext === 'xls') {
    return parseXlsx(buffer)
  }

  throw new Error(`Formato de arquivo não suportado: .${ext}. Use CSV ou XLSX.`)
}

function parseCsv(buffer: Buffer): ParseResult {
  const content = buffer.toString('utf-8')

  const records = csvParse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relaxColumnCount: true,
    delimiter: [',', ';', '\t'],
  }) as Record<string, string>[]

  if (records.length === 0) {
    return { headers: [], rows: [], totalRows: 0 }
  }

  const headers = Object.keys(records[0])

  return {
    headers,
    rows: records.map((row) => {
      const cleaned: Record<string, string> = {}
      for (const [key, value] of Object.entries(row)) {
        cleaned[key.trim()] = value?.trim() ?? ''
      }
      return cleaned
    }),
    totalRows: records.length,
  }
}

function parseXlsx(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false })

  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return { headers: [], rows: [], totalRows: 0 }
  }

  const sheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
    defval: '',
    raw: false,
  })

  if (data.length === 0) {
    return { headers: [], rows: [], totalRows: 0 }
  }

  const headers = Object.keys(data[0])

  return {
    headers,
    rows: data.map((row) => {
      const cleaned: Record<string, string> = {}
      for (const [key, value] of Object.entries(row)) {
        cleaned[key.trim()] = String(value ?? '').trim()
      }
      return cleaned
    }),
    totalRows: data.length,
  }
}