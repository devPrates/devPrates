// Itens do menu "…" de cada tipo de registro. Montados no servidor e entregues
// prontos ao RowMenu.
import type { ConfirmRequest, RowAction, RowItem } from '../_forms/types'
import type { Ledger } from './finance'
import type { Account, Category, FinanceTag, Movement, Payable, Receivable } from './types'

const ask = (
  kind: RowAction['kind'],
  op: RowAction['op'],
  id: string,
  title: string,
  text: string,
  label: string,
  danger = false,
): ConfirmRequest => ({ type: 'confirmar', title, text, label, danger, action: { kind, op, id } })

const remove = (kind: RowAction['kind'], id: string, name: string, text = 'Não dá para desfazer.'): RowItem => ({
  label: 'Excluir',
  danger: true,
  request: ask(kind, 'excluir', id, `Excluir "${name}"?`, text, 'Excluir', true),
})

const archive = (kind: RowAction['kind'], id: string, name: string, archived: boolean): RowItem =>
  archived
    ? { label: 'Reativar', request: ask(kind, 'reativar', id, `Reativar "${name}"?`, 'Volta a aparecer nos formulários.', 'Reativar') }
    : { label: 'Arquivar', request: ask(kind, 'arquivar', id, `Arquivar "${name}"?`, 'Some dos formulários, mas o histórico continua.', 'Arquivar') }

const IN_USE = 'Só é possível excluir o que nunca foi usado.'

export const accountItems = (a: Account): RowItem[] => [
  { label: 'Editar', request: { type: 'conta', initial: a } },
  archive('conta', a.id, a.name, a.archived),
  remove('conta', a.id, a.name, IN_USE),
]

// As do sistema são usadas pelos cálculos e não mudam.
export const categoryItems = (c: Category): RowItem[] =>
  c.systemKey
    ? []
    : [
        { label: 'Editar', request: { type: 'categoria', initial: c } },
        archive('categoria', c.id, c.name, c.archived),
        remove('categoria', c.id, c.name, IN_USE),
      ]

export const tagItems = (t: FinanceTag): RowItem[] => [
  { label: 'Editar', request: { type: 'tag', initial: t } },
  archive('tag', t.id, t.name, t.archived),
  remove('tag', t.id, t.name, IN_USE),
]

function billItems(kind: 'pagar' | 'receber', bill: Payable | Receivable): RowItem[] {
  const party = 'supplier' in bill ? bill.supplier : 'customer' in bill ? bill.customer : undefined
  const { id, description, categoryId, amount, dueDate, tagIds, settlement } = bill
  const edit: RowItem = {
    label: 'Editar',
    request: { type: kind, initial: { id, description, categoryId, amount, dueDate, party, tagIds, settled: !!settlement } },
  }
  if (!settlement) return [edit, remove(kind, id, description)]
  return [
    edit,
    {
      label: 'Desfazer baixa',
      request: ask(kind, 'desfazer', id, `Desfazer a baixa de "${description}"?`, 'A movimentação some, o saldo volta e o lançamento fica em aberto.', 'Desfazer baixa'),
    },
  ]
}

export const payableItems = (ledger: Ledger, id: string): RowItem[] => {
  const bill = ledger.data.payables.find((p) => p.id === id)
  return bill ? billItems('pagar', bill) : []
}

export const receivableItems = (ledger: Ledger, id: string): RowItem[] => {
  const bill = ledger.data.receivables.find((r) => r.id === id)
  return bill ? billItems('receber', bill) : []
}

export const invoiceItems = (paymentId?: string): RowItem[] =>
  paymentId
    ? [
        {
          label: 'Desfazer pagamento',
          request: ask('fatura', 'desfazer', paymentId, 'Desfazer o pagamento da fatura?', 'A movimentação some, o saldo volta e a fatura fica em aberto.', 'Desfazer pagamento'),
        },
      ]
    : []

export function purchaseItems(ledger: Ledger, id: string): RowItem[] {
  const purchase = ledger.data.purchases.find((p) => p.id === id)
  if (!purchase) return []
  return [
    { label: 'Editar compra', request: { type: 'compra', initial: purchase } },
    remove('compra', id, purchase.description, 'Exclui a compra e todas as parcelas. Não dá para desfazer.'),
  ]
}

export function loanItems(ledger: Ledger, id: string): RowItem[] {
  const loan = ledger.data.loans.find((l) => l.id === id)
  if (!loan) return []
  return [
    { label: 'Editar empréstimo', request: { type: 'emprestimo', initial: loan } },
    remove('emprestimo', id, loan.description, 'Exclui o empréstimo, a entrada e todas as parcelas. Não dá para desfazer.'),
  ]
}

// Na movimentação, o menu age no registro que a gerou.
export function movementItems(ledger: Ledger, mv: Movement): RowItem[] {
  switch (mv.source) {
    case 'a_vista': {
      const entry = ledger.data.cashEntries.find((c) => c.id === mv.sourceId)
      if (!entry) return []
      return [
        { label: 'Editar', request: { type: entry.direction === 'saida' ? 'despesa' : 'receita', initial: entry } },
        remove('avista', entry.id, entry.description),
      ]
    }
    case 'transferencia': {
      const transfer = ledger.data.transfers.find((t) => t.id === mv.sourceId)
      if (!transfer) return []
      return [
        { label: 'Editar', request: { type: 'transferencia', initial: transfer } },
        remove('transferencia', transfer.id, mv.description, 'Exclui a saída e a entrada juntas. Não dá para desfazer.'),
      ]
    }
    case 'baixa_pagar':
      return payableItems(ledger, mv.sourceId)
    case 'baixa_receber':
      return receivableItems(ledger, mv.sourceId)
    case 'emprestimo':
      return loanItems(ledger, mv.sourceId)
    case 'fatura':
      return invoiceItems(mv.sourceId)
  }
}
