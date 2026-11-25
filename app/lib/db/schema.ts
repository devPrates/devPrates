// Tabelas do financeiro, no schema `finance` (o `neon_auth` é do Neon Auth e
// não deve ser alterado aqui). Valores em centavos, datas YYYY-MM-DD e meses
// gravados como o dia 1º. Mudou algo? `npm run db:generate`, revise o SQL em
// drizzle/ e rode `npm run db:migrate` (vai direto para production).
//
// Parcelas e faturas não são tabelas: são calculadas a partir das compras e
// dos empréstimos. Só o pagamento da fatura é gravado.
//
// O banco não confere o tipo da conta (dinheiro × crédito) nem a natureza da
// categoria: as Server Actions precisam conferir.
import { AnyColumn, SQL, sql } from 'drizzle-orm'
import {
  check,
  date,
  index,
  integer,
  pgSchema,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const finance = pgSchema('finance')

export const accountKind = finance.enum('account_kind', [
  'corrente',
  'carteira',
  'poupanca',
  'credito',
])
export const categoryKind = finance.enum('category_kind', [
  'despesa',
  'receita',
  'neutra',
])
export const cashDirection = finance.enum('cash_direction', [
  'entrada',
  'saida',
])
export const purchaseKind = finance.enum('purchase_kind', [
  'compra',
  'pix_credito',
])

// ---------- Colunas e regras repetidas ----------

const id = () => uuid('id').primaryKey().default(sql`uuidv7()`)

const timestamps = () => ({
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

const archivedAt = () => timestamp('archived_at', { withTimezone: true })

const accountRef = (name: string) =>
  uuid(name).references(() => accounts.id, { onDelete: 'restrict' })

const categoryRef = () =>
  uuid('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'restrict' })

const positive = (column: AnyColumn): SQL => sql`${column} > 0`

const notBlank = (column: AnyColumn): SQL => sql`btrim(${column}) <> ''`

const isMonth = (column: AnyColumn): SQL =>
  sql`extract(day from ${column}) = 1`

// Baixa: data, conta e valor efetivo, os três juntos ou nenhum. O valor pode
// diferir do original (multa, juros ou desconto).
const settlement = () => ({
  settledAt: date('settled_at'),
  settledAccountId: accountRef('settled_account_id'),
  settledAmountCents: integer('settled_amount_cents'),
})

const settlementRule = (t: {
  settledAt: AnyColumn
  settledAccountId: AnyColumn
  settledAmountCents: AnyColumn
}): SQL =>
  sql`num_nonnulls(${t.settledAt}, ${t.settledAccountId}, ${t.settledAmountCents}) in (0, 3)`

// Parcelamento. `firstInstallment` é a primeira parcela registrada aqui (4 em
// uma compra que entrou no sistema na 4/10) e `firstInvoiceMonth` é o mês de
// vencimento da fatura dela. Fica gravado: mudar o fechamento do cartão não
// move o que já foi lançado.
const installmentPlan = () => ({
  installments: smallint('installments').notNull(),
  firstInstallment: smallint('first_installment').notNull().default(1),
  firstInvoiceMonth: date('first_invoice_month').notNull(),
})

const installmentRule = (t: {
  installments: AnyColumn
  firstInstallment: AnyColumn
}): SQL =>
  sql`${t.firstInstallment} >= 1 and ${t.firstInstallment} <= ${t.installments}`

// ---------- Cadastros ----------

export const accounts = finance.table(
  'accounts',
  {
    id: id(),
    name: text('name').notNull(),
    institution: text('institution').notNull().default(''),
    kind: accountKind('kind').notNull(),
    // Só contas de dinheiro; pode ser negativo (cheque especial).
    openingBalanceCents: integer('opening_balance_cents'),
    // Só contas de crédito.
    limitCents: integer('limit_cents'),
    closingDay: smallint('closing_day'),
    dueDay: smallint('due_day'),
    archivedAt: archivedAt(),
    ...timestamps(),
  },
  (t) => [
    check('accounts_name_not_blank', notBlank(t.name)),
    // Cada lado exige os seus campos e proíbe os do outro. Os `is not null`
    // são necessários: um check com resultado nulo passaria.
    check(
      'accounts_fields_by_kind',
      sql`case when ${t.kind} = 'credito'
        then ${t.openingBalanceCents} is null
          and ${t.closingDay} is not null and ${t.closingDay} between 1 and 31
          and ${t.dueDay} is not null and ${t.dueDay} between 1 and 31
          and (${t.limitCents} is null or ${t.limitCents} >= 0)
        else ${t.openingBalanceCents} is not null
          and num_nonnulls(${t.limitCents}, ${t.closingDay}, ${t.dueDay}) = 0
        end`,
    ),
  ],
)

export const categories = finance.table(
  'categories',
  {
    id: id(),
    name: text('name').notNull(),
    kind: categoryKind('kind').notNull(),
    // Classe Tailwind do marcador.
    color: text('color').notNull(),
    // Só as categorias que os cálculos usam (juros, pagamento-fatura…).
    systemKey: text('system_key').unique(),
    archivedAt: archivedAt(),
    ...timestamps(),
  },
  (t) => [
    check('categories_name_not_blank', notBlank(t.name)),
    uniqueIndex('categories_kind_name_key').on(t.kind, sql`lower(${t.name})`),
  ],
)

export const tags = finance.table(
  'tags',
  {
    id: id(),
    name: text('name').notNull(),
    color: text('color').notNull(),
    description: text('description'),
    archivedAt: archivedAt(),
    ...timestamps(),
  },
  (t) => [
    check('tags_name_not_blank', notBlank(t.name)),
    uniqueIndex('tags_name_key').on(sql`lower(${t.name})`),
  ],
)

// ---------- Lançamentos ----------

export const cashEntries = finance.table(
  'cash_entries',
  {
    id: id(),
    date: date('date').notNull(),
    description: text('description').notNull(),
    categoryId: categoryRef(),
    accountId: accountRef('account_id').notNull(),
    amountCents: integer('amount_cents').notNull(),
    direction: cashDirection('direction').notNull(),
    ...timestamps(),
  },
  (t) => [
    check('cash_entries_description_not_blank', notBlank(t.description)),
    check('cash_entries_amount_positive', positive(t.amountCents)),
    index('cash_entries_date_idx').on(t.date),
    index('cash_entries_category_idx').on(t.categoryId),
    index('cash_entries_account_idx').on(t.accountId),
  ],
)

export const transfers = finance.table(
  'transfers',
  {
    id: id(),
    date: date('date').notNull(),
    fromAccountId: accountRef('from_account_id').notNull(),
    toAccountId: accountRef('to_account_id').notNull(),
    amountCents: integer('amount_cents').notNull(),
    description: text('description'),
    ...timestamps(),
  },
  (t) => [
    check('transfers_amount_positive', positive(t.amountCents)),
    check(
      'transfers_distinct_accounts',
      sql`${t.fromAccountId} <> ${t.toAccountId}`,
    ),
    index('transfers_date_idx').on(t.date),
    index('transfers_from_account_idx').on(t.fromAccountId),
    index('transfers_to_account_idx').on(t.toAccountId),
  ],
)

export const payables = finance.table(
  'payables',
  {
    id: id(),
    description: text('description').notNull(),
    categoryId: categoryRef(),
    amountCents: integer('amount_cents').notNull(),
    dueDate: date('due_date').notNull(),
    supplier: text('supplier'),
    ...settlement(),
    ...timestamps(),
  },
  (t) => [
    check('payables_description_not_blank', notBlank(t.description)),
    check('payables_amount_positive', positive(t.amountCents)),
    check('payables_settlement_complete', settlementRule(t)),
    check('payables_settled_amount_positive', positive(t.settledAmountCents)),
    index('payables_due_date_idx').on(t.dueDate),
    index('payables_settled_at_idx').on(t.settledAt),
    index('payables_category_idx').on(t.categoryId),
    index('payables_settled_account_idx').on(t.settledAccountId),
  ],
)

export const receivables = finance.table(
  'receivables',
  {
    id: id(),
    description: text('description').notNull(),
    categoryId: categoryRef(),
    amountCents: integer('amount_cents').notNull(),
    dueDate: date('due_date').notNull(),
    customer: text('customer'),
    ...settlement(),
    ...timestamps(),
  },
  (t) => [
    check('receivables_description_not_blank', notBlank(t.description)),
    check('receivables_amount_positive', positive(t.amountCents)),
    check('receivables_settlement_complete', settlementRule(t)),
    check(
      'receivables_settled_amount_positive',
      positive(t.settledAmountCents),
    ),
    index('receivables_due_date_idx').on(t.dueDate),
    index('receivables_settled_at_idx').on(t.settledAt),
    index('receivables_category_idx').on(t.categoryId),
    index('receivables_settled_account_idx').on(t.settledAccountId),
  ],
)

// ---------- Crédito ----------

export const creditPurchases = finance.table(
  'credit_purchases',
  {
    id: id(),
    description: text('description').notNull(),
    kind: purchaseKind('kind').notNull().default('compra'),
    creditAccountId: accountRef('credit_account_id').notNull(),
    categoryId: categoryRef(),
    date: date('date').notNull(),
    totalCents: integer('total_cents').notNull(),
    ...installmentPlan(),
    ...timestamps(),
  },
  (t) => [
    check('credit_purchases_description_not_blank', notBlank(t.description)),
    check('credit_purchases_total_positive', positive(t.totalCents)),
    check('credit_purchases_installments_valid', installmentRule(t)),
    check('credit_purchases_invoice_month', isMonth(t.firstInvoiceMonth)),
    index('credit_purchases_date_idx').on(t.date),
    index('credit_purchases_category_idx').on(t.categoryId),
    index('credit_purchases_account_idx').on(t.creditAccountId),
  ],
)

export const loans = finance.table(
  'loans',
  {
    id: id(),
    description: text('description').notNull(),
    creditAccountId: accountRef('credit_account_id').notNull(),
    // Vazio em empréstimo antigo: o dinheiro já está no saldo inicial.
    depositAccountId: accountRef('deposit_account_id'),
    receivedAt: date('received_at').notNull(),
    principalCents: integer('principal_cents').notNull(),
    installmentAmountCents: integer('installment_amount_cents').notNull(),
    ...installmentPlan(),
    ...timestamps(),
  },
  (t) => [
    check('loans_description_not_blank', notBlank(t.description)),
    check('loans_principal_positive', positive(t.principalCents)),
    check(
      'loans_installment_amount_positive',
      positive(t.installmentAmountCents),
    ),
    check('loans_installments_valid', installmentRule(t)),
    check('loans_invoice_month', isMonth(t.firstInvoiceMonth)),
    index('loans_received_at_idx').on(t.receivedAt),
    index('loans_credit_account_idx').on(t.creditAccountId),
    index('loans_deposit_account_idx').on(t.depositAccountId),
  ],
)

// Uma linha = fatura paga. Sem linha, está aberta, vencida ou futura.
export const invoicePayments = finance.table(
  'invoice_payments',
  {
    id: id(),
    creditAccountId: accountRef('credit_account_id').notNull(),
    // Mês de vencimento da fatura.
    invoiceMonth: date('invoice_month').notNull(),
    paidAt: date('paid_at').notNull(),
    paidFromAccountId: accountRef('paid_from_account_id').notNull(),
    amountCents: integer('amount_cents').notNull(),
    ...timestamps(),
  },
  (t) => [
    // Sem pagamento parcial por enquanto; também barra o envio duplo.
    unique('invoice_payments_account_month_key').on(
      t.creditAccountId,
      t.invoiceMonth,
    ),
    check('invoice_payments_amount_positive', positive(t.amountCents)),
    check('invoice_payments_month', isMonth(t.invoiceMonth)),
    check(
      'invoice_payments_distinct_accounts',
      sql`${t.creditAccountId} <> ${t.paidFromAccountId}`,
    ),
    index('invoice_payments_paid_at_idx').on(t.paidAt),
    index('invoice_payments_paid_from_idx').on(t.paidFromAccountId),
  ],
)

// ---------- Tags dos lançamentos ----------

const tagRef = () =>
  uuid('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'restrict' })

export const cashEntryTags = finance.table(
  'cash_entry_tags',
  {
    cashEntryId: uuid('cash_entry_id')
      .notNull()
      .references(() => cashEntries.id, { onDelete: 'cascade' }),
    tagId: tagRef(),
  },
  (t) => [
    primaryKey({ columns: [t.cashEntryId, t.tagId] }),
    index('cash_entry_tags_tag_idx').on(t.tagId),
  ],
)

export const payableTags = finance.table(
  'payable_tags',
  {
    payableId: uuid('payable_id')
      .notNull()
      .references(() => payables.id, { onDelete: 'cascade' }),
    tagId: tagRef(),
  },
  (t) => [
    primaryKey({ columns: [t.payableId, t.tagId] }),
    index('payable_tags_tag_idx').on(t.tagId),
  ],
)

export const receivableTags = finance.table(
  'receivable_tags',
  {
    receivableId: uuid('receivable_id')
      .notNull()
      .references(() => receivables.id, { onDelete: 'cascade' }),
    tagId: tagRef(),
  },
  (t) => [
    primaryKey({ columns: [t.receivableId, t.tagId] }),
    index('receivable_tags_tag_idx').on(t.tagId),
  ],
)

export const creditPurchaseTags = finance.table(
  'credit_purchase_tags',
  {
    creditPurchaseId: uuid('credit_purchase_id')
      .notNull()
      .references(() => creditPurchases.id, { onDelete: 'cascade' }),
    tagId: tagRef(),
  },
  (t) => [
    primaryKey({ columns: [t.creditPurchaseId, t.tagId] }),
    index('credit_purchase_tags_tag_idx').on(t.tagId),
  ],
)
