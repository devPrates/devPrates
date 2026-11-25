// Modelo do financeiro, no formato dos ERPs. As tabelas estão em
// app/lib/db/schema.ts. Aqui, datas em ISO (YYYY-MM-DD), meses em YYYY-MM e
// valores em reais (number); no banco, valores ficam em centavos.
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
  // Endereço da logo, se houver.
  logo?: string
  archived: boolean
}

// Natureza da categoria:
// - despesa / receita entram no resultado (quanto ganhei e gastei);
// - fora do resultado: dinheiro que só muda de lugar ou é dívida
//   (empréstimo recebido, pagamento de fatura, transferência).
export type CategoryKind = 'despesa' | 'receita' | 'neutra'

// Categorias que os cálculos usam; não podem ser editadas.
export type SystemKey = 'juros' | 'emprestimo-recebido' | 'pagamento-fatura' | 'transferencia'

export type Category = {
  id: string
  name: string
  kind: CategoryKind
  // Cor do marcador (classe Tailwind de fundo).
  color: string
  systemKey?: SystemKey
  archived: boolean
}

// Tag: marcador livre, além da categoria. A categoria diz O QUE foi o gasto
// (Combustível); a tag diz PARA QUE ou COM QUEM (Encontros). Um lançamento
// pode ter várias tags.
export type FinanceTag = {
  id: string
  name: string
  // Cor do marcador (classe Tailwind de fundo).
  color: string
  description?: string
  archived: boolean
}

// Parcelamento. `firstInstallment` é a primeira parcela registrada aqui (4 numa
// compra que entrou no sistema na 4/10) e `firstInvoiceMonth` é o mês de
// vencimento da fatura dela.
export type InstallmentPlan = {
  installments: number
  firstInstallment: number
  firstInvoiceMonth: string
}

// Empréstimo / dinheiro extra (Mercado Pago, Shopee). O valor recebido NÃO é
// receita; as parcelas caem na fatura da conta de crédito. Juros = total das
// parcelas - valor recebido, e só os juros são despesa.
export type Loan = InstallmentPlan & {
  id: string
  description: string
  creditAccountId: string
  // Conta onde o dinheiro caiu. Vazio em empréstimo antigo (o dinheiro já está
  // no saldo inicial).
  depositAccountId?: string
  receivedAt: ISODate
  principal: number
  installmentAmount: number
}

// Compra parcelada no crédito (cartão, Shopee, pix no crédito). A compra é
// despesa na data da compra, na categoria do que foi comprado; as parcelas
// só compõem as faturas.
export type CreditPurchaseKind = 'compra' | 'pix_credito'

export type CreditPurchase = InstallmentPlan & {
  id: string
  description: string
  kind: CreditPurchaseKind
  creditAccountId: string
  categoryId: string
  date: ISODate
  total: number
  tagIds: string[]
}

// Baixa: quando, em que conta e quanto de fato foi pago (pode ter multa, juros
// ou desconto).
export type Settlement = { date: ISODate; accountId: string; amount: number }

// Conta a pagar avulsa (boleto, aluguel, conta de luz…). As faturas de
// crédito também aparecem em "Contas a pagar", mas são calculadas (Invoice).
export type Payable = {
  id: string
  description: string
  categoryId: string
  amount: number
  dueDate: ISODate
  settlement?: Settlement
  supplier?: string
  tagIds: string[]
}

export type Receivable = {
  id: string
  description: string
  categoryId: string
  amount: number
  dueDate: ISODate
  settlement?: Settlement
  customer?: string
  tagIds: string[]
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
  tagIds: string[]
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

// Pagamento de uma fatura. Sem ele, a fatura está em aberto.
export type InvoicePayment = {
  id: string
  creditAccountId: string
  month: string
  paidAt: ISODate
  paidFromAccountId: string
  amount: number
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
  // Mês de vencimento da fatura (YYYY-MM).
  month: string
  dueDate: ISODate
  items: InvoiceItem[]
  total: number
  status: InvoiceStatus
  payment?: InvoicePayment
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
  // Valor pago, quando já foi (pode diferir de amount).
  paidAmount?: number
  categoryId?: string
  origin:
    | { kind: 'avulsa'; supplier?: string }
    | { kind: 'fatura'; accountId: string; month: string; paymentId?: string }
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
  // Registro que gerou a movimentação: o que se edita, desfaz ou exclui.
  sourceId: string
  // Só transferências: a conta do outro lado.
  counterpartAccountId?: string
  tagIds?: string[]
}
