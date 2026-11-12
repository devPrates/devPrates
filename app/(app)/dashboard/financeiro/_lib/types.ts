// Modelo do financeiro, no formato dos ERPs. Cada tipo aqui vira uma tabela
// no Postgres quando o backend existir. Datas em ISO (YYYY-MM-DD) e valores
// em reais (number); no banco, valores vão em centavos (integer).
//
// Regra de ouro: todo gasto entra em UM lugar só.
// - Tem vencimento? Conta a pagar (avulsa) ou parcela numa fatura de crédito.
// - Foi pago na hora? Despesa à vista (uma movimentação de saída).
// Pagar uma conta a pagar é só a "baixa": gera a movimentação, não outra despesa.

export type ISODate = string

// Contas onde o dinheiro está (corrente, carteira) ou de onde vem o crédito
// (cartão, Mercado Pago, Shopee). Conta de crédito tem fatura mensal.
export type AccountKind = 'corrente' | 'carteira' | 'poupanca' | 'credito'

export type Account = {
  id: string
  name: string
  institution: string
  kind: AccountKind
  // Só contas de dinheiro: saldo antes da primeira movimentação registrada.
  openingBalance?: number
  // Só contas de crédito.
  limit?: number
  closingDay?: number
  dueDay?: number
}

// Natureza da categoria:
// - despesa / receita entram no resultado (quanto ganhei e gastei);
// - fora do resultado: dinheiro que só muda de lugar ou é dívida
//   (empréstimo recebido, pagamento de fatura, transferência).
export type CategoryKind = 'despesa' | 'receita' | 'neutra'

export type Category = {
  id: string
  name: string
  kind: CategoryKind
  // Cor do marcador (classe Tailwind de fundo).
  color: string
}

// Tag: marcador livre, além da categoria. A categoria diz O QUE foi o gasto
// (Combustível); a tag diz PARA QUE ou COM QUEM (Encontros). Um lançamento
// pode ter várias tags; no banco vira uma tabela de ligação (lançamento × tag).
export type FinanceTag = {
  id: string
  name: string
  // Cor do marcador (classe Tailwind de fundo).
  color: string
  description?: string
}

// Empréstimo / dinheiro extra (Mercado Pago, Shopee). O valor recebido NÃO é
// receita; as parcelas caem na fatura da conta de crédito. Juros = total das
// parcelas - valor recebido, e só os juros são despesa.
export type Loan = {
  id: string
  description: string
  creditAccountId: string
  // Conta onde o dinheiro caiu.
  depositAccountId: string
  receivedAt: ISODate
  principal: number
  installments: number
  installmentAmount: number
}

// Compra parcelada no crédito (cartão, Shopee, pix no crédito). A compra é
// despesa na data da compra, na categoria do que foi comprado; as parcelas
// só compõem as faturas.
export type CreditPurchaseKind = 'compra' | 'pix_credito'

export type CreditPurchase = {
  id: string
  description: string
  kind: CreditPurchaseKind
  creditAccountId: string
  categoryId: string
  date: ISODate
  total: number
  installments: number
  // Marcadores livres para filtrar depois (ex.: Encontros, Trabalho).
  tagIds?: string[]
}

// Conta a pagar avulsa (boleto, aluguel, conta de luz…). As faturas de
// crédito também aparecem em "Contas a pagar", mas são calculadas (Invoice).
export type Payable = {
  id: string
  description: string
  categoryId: string
  amount: number
  dueDate: ISODate
  paidAt?: ISODate
  // Conta usada para pagar (na baixa).
  accountId?: string
  supplier?: string
  // Marcadores livres para filtrar depois (ex.: Encontros, Trabalho).
  tagIds?: string[]
}

export type Receivable = {
  id: string
  description: string
  categoryId: string
  amount: number
  dueDate: ISODate
  receivedAt?: ISODate
  accountId?: string
  customer?: string
  // Marcadores livres para filtrar depois (ex.: Encontros, Trabalho).
  tagIds?: string[]
}

// Despesa ou receita resolvida na hora, sem vencimento (pix, débito,
// dinheiro). Vira direto uma movimentação.
export type CashEntry = {
  id: string
  date: ISODate
  description: string
  categoryId: string
  accountId: string
  amount: number
  direction: 'entrada' | 'saida'
  // Marcadores livres para filtrar depois (ex.: Encontros, Trabalho).
  tagIds?: string[]
}

// Transferência entre contas de dinheiro (saque, depósito, pix entre contas
// próprias). NÃO é receita nem despesa: o dinheiro só muda de lugar. Um
// cadastro só, que gera duas movimentações ligadas (saída na origem, entrada
// no destino); editar ou excluir a transferência mexe nas duas juntas.
// Tarifa (TED, saque) é lançada à parte, como despesa em "Juros e tarifas".
export type Transfer = {
  id: string
  date: ISODate
  fromAccountId: string
  toAccountId: string
  amount: number
  description?: string
}

// ---------- Calculados (não são tabelas) ----------

export type InstallmentOrigin =
  | { kind: 'emprestimo'; loanId: string }
  | { kind: 'compra' | 'pix_credito'; purchaseId: string }

export type InvoiceItem = {
  id: string
  description: string
  origin: InstallmentOrigin
  number: number
  of: number
  amount: number
  categoryId?: string
}

export type InvoiceStatus = 'paga' | 'aberta' | 'vencida' | 'futura'

export type Invoice = {
  id: string
  accountId: string
  // Mês de referência da fatura (YYYY-MM).
  month: string
  dueDate: ISODate
  items: InvoiceItem[]
  total: number
  status: InvoiceStatus
  paidAt?: ISODate
}

export type BillStatus = 'paga' | 'aberta' | 'vencida'

// Linha da tela "Contas a pagar": avulsa ou fatura.
export type PayableRow = {
  id: string
  description: string
  dueDate: ISODate
  amount: number
  status: BillStatus
  paidAt?: ISODate
  categoryId?: string
  origin: { kind: 'avulsa'; supplier?: string } | { kind: 'fatura'; accountId: string; month: string }
}

export type MovementSource =
  | 'a_vista'
  | 'baixa_pagar'
  | 'baixa_receber'
  | 'emprestimo'
  | 'fatura'
  | 'transferencia'

// Movimentação = o que de fato entrou ou saiu de uma conta de dinheiro.
export type Movement = {
  id: string
  date: ISODate
  description: string
  accountId: string
  categoryId: string
  amount: number
  direction: 'entrada' | 'saida'
  source: MovementSource
  // Só transferências: a transferência de origem e a conta do outro lado.
  transferId?: string
  counterpartAccountId?: string
  tagIds?: string[]
}
