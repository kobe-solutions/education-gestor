export function validateGradeValue(value: number): void {
  if (value < 0 || value > 10) throw new Error('Grade value must be between 0 and 10')
}

export function validatePositiveAmount(amount: number): void {
  if (amount <= 0) throw new Error('Amount must be greater than zero')
}

export function validateISODate(date: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`)
}
