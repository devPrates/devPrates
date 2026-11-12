import type { ISODate } from '../_lib/types'

// Um formulário por tipo de lançamento, nada de formulário genérico.
export type NewFormType =
  | 'despesa'
  | 'receita'
  | 'compra'
  | 'transferencia'
  | 'pagar'
  | 'receber'
  | 'emprestimo'

// O que a baixa precisa saber da conta ou fatura que está sendo paga.
export type SettleTarget = {
  kind: 'pagar' | 'receber' | 'fatura'
  id: string
  description: string
  amount: number
  dueDate: ISODate
  accountId?: string
  // Só fatura: conta de crédito.
  creditAccountId?: string
}

export type FormRequest = { type: NewFormType } | { type: 'baixa'; target: SettleTarget }
