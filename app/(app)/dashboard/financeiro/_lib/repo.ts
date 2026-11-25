// Gravações do financeiro. Recebem a transação já aberta e conferem o que o
// banco não confere (tipo da conta, natureza da categoria, item arquivado,
// fatura paga). Erros que o usuário pode resolver são FinanceError.
import { and, eq, inArray, sql } from 'drizzle-orm'
import type { Tx } from '@/app/lib/db'
import * as s from '@/app/lib/db/schema'
import { createLedger, planMonths } from './finance'
import { loadFinance } from './load'
import type {
  AccountInput,
  BillInput,
  CashInput,
  CategoryInput,
  LoanInput,
  PayInvoiceInput,
  PurchaseInput,
  SettleInput,
  TagInput,
  TransferInput,
} from './schemas'

export class FinanceError extends Error {}

const NOT_FOUND = 'Este registro não existe mais. Atualize a página.'

const monthOf = (date: string) => date.slice(0, 7)

// ---------- Conferências ----------

// `current` é a conta/categoria que o registro já usava: continua valendo ao
// editar, mesmo arquivada.
async function checkAccount(tx: Tx, id: string, type: 'dinheiro' | 'credito', current?: string | null) {
  const [account] = await tx.select().from(s.accounts).where(eq(s.accounts.id, id))
  if (!account) throw new FinanceError('Conta bancária ou cartão não encontrado.')
  if ((account.kind === 'credito') !== (type === 'credito'))
    throw new FinanceError(type === 'credito' ? 'Escolha um cartão ou crédito.' : 'Escolha uma conta bancária ou carteira.')
  if (account.archivedAt && id !== current) throw new FinanceError(`${account.name} está arquivado(a).`)
}

async function checkCategory(tx: Tx, id: string, kind: 'despesa' | 'receita', current?: string) {
  const [category] = await tx.select().from(s.categories).where(eq(s.categories.id, id))
  if (!category) throw new FinanceError('Categoria não encontrada.')
  if (category.kind !== kind) throw new FinanceError(`Escolha uma categoria de ${kind}.`)
  if (category.archivedAt && id !== current) throw new FinanceError(`A categoria ${category.name} está arquivada.`)
}

// Trava compartilhada pelas gravações de crédito: impede que um pagamento de
// fatura e um item novo na mesma fatura aconteçam ao mesmo tempo.
async function lockCreditAccounts(tx: Tx, ids: string[]) {
  const unique = Array.from(new Set(ids)).sort()
  await tx.select({ id: s.accounts.id }).from(s.accounts).where(inArray(s.accounts.id, unique)).orderBy(s.accounts.id).for('update')
}

type PlanRow = { creditAccountId: string; installments: number; firstInstallment: number; firstInvoiceMonth: string }

async function hasPaidInvoice(tx: Tx, plan: PlanRow) {
  const months = planMonths({ ...plan, firstInvoiceMonth: monthOf(plan.firstInvoiceMonth) }).map((p) => `${p.month}-01`)
  const [paid] = await tx
    .select({ id: s.invoicePayments.id })
    .from(s.invoicePayments)
    .where(and(eq(s.invoicePayments.creditAccountId, plan.creditAccountId), inArray(s.invoicePayments.invoiceMonth, months)))
    .limit(1)
  return !!paid
}

async function checkOpenInvoices(tx: Tx, plan: PlanRow) {
  if (await hasPaidInvoice(tx, plan))
    throw new FinanceError('Uma das faturas dessas parcelas já está paga. Desfaça o pagamento dela antes.')
}

// ---------- Tags ----------

const TAG_TABLES = {
  cash: { table: s.cashEntryTags, owner: s.cashEntryTags.cashEntryId },
  payable: { table: s.payableTags, owner: s.payableTags.payableId },
  receivable: { table: s.receivableTags, owner: s.receivableTags.receivableId },
  purchase: { table: s.creditPurchaseTags, owner: s.creditPurchaseTags.creditPurchaseId },
} as const

async function setTags(
  tx: Tx,
  kind: keyof typeof TAG_TABLES,
  ownerId: string,
  input: { tagIds: string[]; newTags: string[] },
) {
  const ids = new Set(input.tagIds)
  for (const name of input.newTags) {
    await tx.insert(s.tags).values({ name, color: 'bg-zinc-400' }).onConflictDoNothing()
    const [tag] = await tx.select().from(s.tags).where(sql`lower(${s.tags.name}) = lower(${name})`)
    ids.add(tag.id)
    // Reusar o nome de uma tag arquivada traz ela de volta.
    if (tag.archivedAt) await tx.update(s.tags).set({ archivedAt: null }).where(eq(s.tags.id, tag.id))
  }
  const { table, owner } = TAG_TABLES[kind]
  await tx.delete(table).where(eq(owner, ownerId))
  const tagIds = Array.from(ids)
  if (!tagIds.length) return
  switch (kind) {
    case 'cash':
      return void (await tx.insert(s.cashEntryTags).values(tagIds.map((tagId) => ({ cashEntryId: ownerId, tagId }))))
    case 'payable':
      return void (await tx.insert(s.payableTags).values(tagIds.map((tagId) => ({ payableId: ownerId, tagId }))))
    case 'receivable':
      return void (await tx.insert(s.receivableTags).values(tagIds.map((tagId) => ({ receivableId: ownerId, tagId }))))
    case 'purchase':
      return void (await tx.insert(s.creditPurchaseTags).values(tagIds.map((tagId) => ({ creditPurchaseId: ownerId, tagId }))))
  }
}

// ---------- Contas ----------

export async function saveAccount(tx: Tx, input: AccountInput, id?: string) {
  if (!id) {
    const [row] = await tx.insert(s.accounts).values(input).returning({ id: s.accounts.id })
    return row.id
  }
  const [old] = await tx.select().from(s.accounts).where(eq(s.accounts.id, id))
  if (!old) throw new FinanceError(NOT_FOUND)
  if (old.kind !== input.kind) throw new FinanceError('O tipo não pode mudar depois de cadastrado.')
  await tx.update(s.accounts).set(input).where(eq(s.accounts.id, id))
  return id
}

export async function archiveAccount(tx: Tx, id: string, archived: boolean) {
  if (archived) {
    const ledger = createLedger(await loadFinance(tx))
    const account = ledger.accountOf(id)
    if (!account) throw new FinanceError(NOT_FOUND)
    if (account.kind === 'credito') {
      if (ledger.creditUsage(id).used > 0) throw new FinanceError('Ainda há faturas em aberto neste cartão ou crédito.')
    } else if (ledger.balanceOf(id) !== 0) {
      throw new FinanceError('Zere o saldo (com uma transferência, por exemplo) antes de arquivar.')
    }
  }
  await tx.update(s.accounts).set({ archivedAt: archived ? new Date() : null }).where(eq(s.accounts.id, id))
}

export async function deleteAccount(tx: Tx, id: string) {
  await tx.delete(s.accounts).where(eq(s.accounts.id, id))
}

// ---------- Categorias e tags ----------

async function editableCategory(tx: Tx, id: string) {
  const [old] = await tx.select().from(s.categories).where(eq(s.categories.id, id))
  if (!old) throw new FinanceError(NOT_FOUND)
  if (old.systemKey) throw new FinanceError('Esta categoria é do sistema e não pode ser alterada.')
  return old
}

export async function saveCategory(tx: Tx, input: CategoryInput, id?: string) {
  if (!id) {
    const [row] = await tx.insert(s.categories).values(input).returning({ id: s.categories.id })
    return row.id
  }
  const old = await editableCategory(tx, id)
  if (old.kind !== input.kind) throw new FinanceError('A natureza da categoria não pode mudar.')
  await tx.update(s.categories).set(input).where(eq(s.categories.id, id))
  return id
}

export async function archiveCategory(tx: Tx, id: string, archived: boolean) {
  await editableCategory(tx, id)
  await tx.update(s.categories).set({ archivedAt: archived ? new Date() : null }).where(eq(s.categories.id, id))
}

export async function deleteCategory(tx: Tx, id: string) {
  await editableCategory(tx, id)
  await tx.delete(s.categories).where(eq(s.categories.id, id))
}

export async function saveTag(tx: Tx, input: TagInput, id?: string) {
  if (!id) {
    const [row] = await tx.insert(s.tags).values(input).returning({ id: s.tags.id })
    return row.id
  }
  const rows = await tx.update(s.tags).set(input).where(eq(s.tags.id, id)).returning({ id: s.tags.id })
  if (!rows.length) throw new FinanceError(NOT_FOUND)
  return id
}

export async function archiveTag(tx: Tx, id: string, archived: boolean) {
  await tx.update(s.tags).set({ archivedAt: archived ? new Date() : null }).where(eq(s.tags.id, id))
}

export async function deleteTag(tx: Tx, id: string) {
  await tx.delete(s.tags).where(eq(s.tags.id, id))
}

// ---------- À vista e transferências ----------

export async function saveCash(tx: Tx, input: CashInput, id?: string) {
  const { amount, tagIds, newTags, ...rest } = input
  const [old] = id ? await tx.select().from(s.cashEntries).where(eq(s.cashEntries.id, id)) : []
  if (id && !old) throw new FinanceError(NOT_FOUND)
  await checkAccount(tx, rest.accountId, 'dinheiro', old?.accountId)
  await checkCategory(tx, rest.categoryId, rest.direction === 'saida' ? 'despesa' : 'receita', old?.categoryId)
  const values = { ...rest, amountCents: amount }
  let rowId = id
  if (rowId) await tx.update(s.cashEntries).set(values).where(eq(s.cashEntries.id, rowId))
  else rowId = (await tx.insert(s.cashEntries).values(values).returning({ id: s.cashEntries.id }))[0].id
  await setTags(tx, 'cash', rowId, { tagIds, newTags })
  return rowId
}

export async function deleteCash(tx: Tx, id: string) {
  await tx.delete(s.cashEntries).where(eq(s.cashEntries.id, id))
}

export async function saveTransfer(tx: Tx, input: TransferInput, id?: string) {
  const { amount, ...rest } = input
  const [old] = id ? await tx.select().from(s.transfers).where(eq(s.transfers.id, id)) : []
  if (id && !old) throw new FinanceError(NOT_FOUND)
  await checkAccount(tx, rest.fromAccountId, 'dinheiro', old?.fromAccountId)
  await checkAccount(tx, rest.toAccountId, 'dinheiro', old?.toAccountId)
  const values = { ...rest, amountCents: amount }
  if (id) {
    await tx.update(s.transfers).set(values).where(eq(s.transfers.id, id))
    return id
  }
  return (await tx.insert(s.transfers).values(values).returning({ id: s.transfers.id }))[0].id
}

export async function deleteTransfer(tx: Tx, id: string) {
  await tx.delete(s.transfers).where(eq(s.transfers.id, id))
}

// ---------- Contas a pagar e a receber ----------

export type BillKind = 'pagar' | 'receber'

const UNDO_FIRST = 'Esta conta já foi baixada. Desfaça a baixa antes.'

// FOR UPDATE: duas baixas ao mesmo tempo não podem passar as duas.
async function findBill(tx: Tx, kind: BillKind, id: string) {
  const [row] =
    kind === 'pagar'
      ? await tx.select().from(s.payables).where(eq(s.payables.id, id)).for('update')
      : await tx.select().from(s.receivables).where(eq(s.receivables.id, id)).for('update')
  if (!row) throw new FinanceError(NOT_FOUND)
  return row
}

export async function saveBill(tx: Tx, kind: BillKind, input: BillInput, id?: string) {
  const { amount, party, tagIds, newTags, ...rest } = input
  const old = id ? await findBill(tx, kind, id) : undefined
  if (old?.settledAt && old.amountCents !== amount)
    throw new FinanceError('O valor não pode mudar depois da baixa. Desfaça a baixa antes.')
  await checkCategory(tx, rest.categoryId, kind === 'pagar' ? 'despesa' : 'receita', old?.categoryId)
  const values = { ...rest, amountCents: amount }
  let rowId = id
  if (kind === 'pagar') {
    const row = { ...values, supplier: party }
    if (rowId) await tx.update(s.payables).set(row).where(eq(s.payables.id, rowId))
    else rowId = (await tx.insert(s.payables).values(row).returning({ id: s.payables.id }))[0].id
    await setTags(tx, 'payable', rowId, { tagIds, newTags })
  } else {
    const row = { ...values, customer: party }
    if (rowId) await tx.update(s.receivables).set(row).where(eq(s.receivables.id, rowId))
    else rowId = (await tx.insert(s.receivables).values(row).returning({ id: s.receivables.id }))[0].id
    await setTags(tx, 'receivable', rowId, { tagIds, newTags })
  }
  return rowId
}

export async function deleteBill(tx: Tx, kind: BillKind, id: string) {
  const old = await findBill(tx, kind, id)
  if (old.settledAt) throw new FinanceError(UNDO_FIRST)
  if (kind === 'pagar') await tx.delete(s.payables).where(eq(s.payables.id, id))
  else await tx.delete(s.receivables).where(eq(s.receivables.id, id))
}

export async function settleBill(tx: Tx, kind: BillKind, id: string, input: SettleInput) {
  const old = await findBill(tx, kind, id)
  if (old.settledAt) throw new FinanceError('Esta conta já foi baixada.')
  await checkAccount(tx, input.accountId, 'dinheiro')
  const values = {
    settledAt: input.date,
    settledAccountId: input.accountId,
    // Em contas a receber, o valor é sempre o combinado.
    settledAmountCents: kind === 'pagar' ? input.amount : old.amountCents,
  }
  if (kind === 'pagar') await tx.update(s.payables).set(values).where(eq(s.payables.id, id))
  else await tx.update(s.receivables).set(values).where(eq(s.receivables.id, id))
}

export async function undoSettle(tx: Tx, kind: BillKind, id: string) {
  await findBill(tx, kind, id)
  const values = { settledAt: null, settledAccountId: null, settledAmountCents: null }
  if (kind === 'pagar') await tx.update(s.payables).set(values).where(eq(s.payables.id, id))
  else await tx.update(s.receivables).set(values).where(eq(s.receivables.id, id))
}

// ---------- Compras no crédito e empréstimos ----------

// Só o que muda as faturas: descrição, categoria e tags são livres.
const samePlan = (a: PlanRow, b: PlanRow) =>
  a.creditAccountId === b.creditAccountId &&
  a.installments === b.installments &&
  a.firstInstallment === b.firstInstallment &&
  monthOf(a.firstInvoiceMonth) === monthOf(b.firstInvoiceMonth)

export async function savePurchase(tx: Tx, input: PurchaseInput, id?: string) {
  const { total, tagIds, newTags, ...rest } = input
  const [old] = id ? await tx.select().from(s.creditPurchases).where(eq(s.creditPurchases.id, id)).for('update') : []
  if (id && !old) throw new FinanceError(NOT_FOUND)
  await checkAccount(tx, rest.creditAccountId, 'credito', old?.creditAccountId)
  await checkCategory(tx, rest.categoryId, 'despesa', old?.categoryId)
  if (!old || !samePlan(old, rest) || old.totalCents !== total) {
    await lockCreditAccounts(tx, [rest.creditAccountId, ...(old ? [old.creditAccountId] : [])])
    if (old) await checkOpenInvoices(tx, old)
    await checkOpenInvoices(tx, rest)
  }
  const values = { ...rest, totalCents: total }
  let rowId = id
  if (rowId) await tx.update(s.creditPurchases).set(values).where(eq(s.creditPurchases.id, rowId))
  else rowId = (await tx.insert(s.creditPurchases).values(values).returning({ id: s.creditPurchases.id }))[0].id
  await setTags(tx, 'purchase', rowId, { tagIds, newTags })
  return rowId
}

export async function deletePurchase(tx: Tx, id: string) {
  const [old] = await tx.select().from(s.creditPurchases).where(eq(s.creditPurchases.id, id)).for('update')
  if (!old) throw new FinanceError(NOT_FOUND)
  await lockCreditAccounts(tx, [old.creditAccountId])
  await checkOpenInvoices(tx, old)
  await tx.delete(s.creditPurchases).where(eq(s.creditPurchases.id, id))
}

export async function saveLoan(tx: Tx, input: LoanInput, id?: string) {
  const { principal, installmentAmount, ...rest } = input
  const [old] = id ? await tx.select().from(s.loans).where(eq(s.loans.id, id)).for('update') : []
  if (id && !old) throw new FinanceError(NOT_FOUND)
  await checkAccount(tx, rest.creditAccountId, 'credito', old?.creditAccountId)
  if (rest.depositAccountId) await checkAccount(tx, rest.depositAccountId, 'dinheiro', old?.depositAccountId)
  if (!old || !samePlan(old, rest) || old.installmentAmountCents !== installmentAmount) {
    await lockCreditAccounts(tx, [rest.creditAccountId, ...(old ? [old.creditAccountId] : [])])
    if (old) await checkOpenInvoices(tx, old)
    await checkOpenInvoices(tx, rest)
  }
  const values = { ...rest, principalCents: principal, installmentAmountCents: installmentAmount }
  if (id) {
    await tx.update(s.loans).set(values).where(eq(s.loans.id, id))
    return id
  }
  return (await tx.insert(s.loans).values(values).returning({ id: s.loans.id }))[0].id
}

export async function deleteLoan(tx: Tx, id: string) {
  const [old] = await tx.select().from(s.loans).where(eq(s.loans.id, id)).for('update')
  if (!old) throw new FinanceError(NOT_FOUND)
  await lockCreditAccounts(tx, [old.creditAccountId])
  await checkOpenInvoices(tx, old)
  await tx.delete(s.loans).where(eq(s.loans.id, id))
}

// ---------- Faturas ----------

// O total vem dos itens no banco, não do navegador.
export async function payInvoice(tx: Tx, input: PayInvoiceInput) {
  await lockCreditAccounts(tx, [input.creditAccountId])
  await checkAccount(tx, input.accountId, 'dinheiro')
  const ledger = createLedger(await loadFinance(tx))
  const invoice = ledger.invoiceOf(input.creditAccountId, monthOf(input.month))
  if (!invoice) throw new FinanceError('Não há fatura nesse mês.')
  if (invoice.payment) throw new FinanceError('Esta fatura já está paga.')
  const [row] = await tx
    .insert(s.invoicePayments)
    .values({
      creditAccountId: input.creditAccountId,
      invoiceMonth: input.month,
      paidAt: input.date,
      paidFromAccountId: input.accountId,
      amountCents: Math.round(invoice.total * 100),
    })
    .returning({ id: s.invoicePayments.id })
  return row.id
}

export async function undoInvoicePayment(tx: Tx, id: string) {
  await tx.delete(s.invoicePayments).where(eq(s.invoicePayments.id, id))
}
