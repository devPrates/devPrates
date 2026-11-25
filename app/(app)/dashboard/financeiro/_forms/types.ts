import type { Account, CashEntry, Category, CreditPurchase, FinanceTag, ISODate, Loan, Transfer } from '../_lib/types'

// Um formulário por tipo de lançamento, nada de formulário genérico.
export type NewFormType =
  | 'despesa'
  | 'receita'
  | 'compra'
  | 'transferencia'
  | 'pagar'
  | 'receber'
  | 'emprestimo'
  | 'conta'
  | 'categoria'
  | 'tag'

// O que a baixa precisa saber da conta ou fatura que está sendo paga.
export type SettleTarget = {
  kind: 'pagar' | 'receber' | 'fatura'
  id: string
  description: string
  amount: number
  dueDate: ISODate
  // Só fatura: conta de crédito e mês.
  creditAccountId?: string
  month?: string
}

// Conta a pagar ou a receber em edição.
export type BillInitial = {
  id: string
  description: string
  categoryId: string
  amount: number
  dueDate: ISODate
  party?: string
  tagIds: string[]
  settled: boolean
}

export type RowAction = {
  kind: 'conta' | 'categoria' | 'tag' | 'avista' | 'transferencia' | 'pagar' | 'receber' | 'compra' | 'emprestimo' | 'fatura'
  op: 'excluir' | 'arquivar' | 'reativar' | 'desfazer'
  id: string
}

export type ConfirmRequest = {
  type: 'confirmar'
  title: string
  text: string
  label: string
  danger?: boolean
  action: RowAction
}

// Com `initial`, o formulário edita o registro em vez de criar.
export type FormRequest =
  | { type: 'despesa' | 'receita'; initial?: CashEntry }
  | { type: 'compra'; initial?: CreditPurchase }
  | { type: 'transferencia'; initial?: Transfer }
  | { type: 'pagar' | 'receber'; initial?: BillInitial }
  | { type: 'emprestimo'; initial?: Loan }
  | { type: 'conta'; initial?: Account }
  | { type: 'categoria'; initial?: Category }
  | { type: 'tag'; initial?: FinanceTag }
  | { type: 'baixa'; target: SettleTarget }
  | ConfirmRequest

export type RowItem = { label: string; request: FormRequest; danger?: boolean }
