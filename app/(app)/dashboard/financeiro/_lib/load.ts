// Lê as tabelas do financeiro e converte centavos em reais (o único lugar que
// faz isso na leitura). Um usuário só e poucos milhares de linhas: carregar
// tudo mantém os cálculos num lugar só.
import { asc, desc, getTableColumns, sql } from 'drizzle-orm'
import type { Executor } from '@/app/lib/db'
import * as s from '@/app/lib/db/schema'
import type { FinanceData } from './finance'
import type { Settlement, SystemKey } from './types'

const reais = (cents: number) => cents / 100
const monthOf = (date: string) => date.slice(0, 7)
const opt = <T>(value: T | null) => value ?? undefined

function settlementOf(r: {
  settledAt: string | null
  settledAccountId: string | null
  settledAmountCents: number | null
}): Settlement | undefined {
  if (!r.settledAt || !r.settledAccountId || r.settledAmountCents === null) return undefined
  return { date: r.settledAt, accountId: r.settledAccountId, amount: reais(r.settledAmountCents) }
}

function groupTags(rows: { ownerId: string; tagId: string }[]) {
  const map = new Map<string, string[]>()
  for (const r of rows) map.set(r.ownerId, [...(map.get(r.ownerId) ?? []), r.tagId])
  return (id: string) => map.get(id) ?? []
}

// A logo não vem junto: cada uma é buscada pelo navegador, com cache.
const { logoSvg, ...accountColumns } = getTableColumns(s.accounts)

export async function loadFinance(db: Executor): Promise<FinanceData> {
  const [
    accounts, categories, tags, cash, transfers, payables, receivables, purchases, loans, payments,
    cashTags, payableTags, receivableTags, purchaseTags,
  ] = await Promise.all([
    db.select({ ...accountColumns, hasLogo: sql<boolean>`${logoSvg} is not null` }).from(s.accounts).orderBy(asc(s.accounts.id)),
    db.select().from(s.categories).orderBy(asc(s.categories.name)),
    db.select().from(s.tags).orderBy(asc(s.tags.name)),
    db.select().from(s.cashEntries).orderBy(desc(s.cashEntries.id)),
    db.select().from(s.transfers).orderBy(desc(s.transfers.id)),
    db.select().from(s.payables).orderBy(asc(s.payables.id)),
    db.select().from(s.receivables).orderBy(asc(s.receivables.id)),
    db.select().from(s.creditPurchases).orderBy(asc(s.creditPurchases.id)),
    db.select().from(s.loans).orderBy(desc(s.loans.receivedAt)),
    db.select().from(s.invoicePayments),
    db.select({ ownerId: s.cashEntryTags.cashEntryId, tagId: s.cashEntryTags.tagId }).from(s.cashEntryTags),
    db.select({ ownerId: s.payableTags.payableId, tagId: s.payableTags.tagId }).from(s.payableTags),
    db.select({ ownerId: s.receivableTags.receivableId, tagId: s.receivableTags.tagId }).from(s.receivableTags),
    db.select({ ownerId: s.creditPurchaseTags.creditPurchaseId, tagId: s.creditPurchaseTags.tagId }).from(s.creditPurchaseTags),
  ])
  const tagsOfCash = groupTags(cashTags)
  const tagsOfPayable = groupTags(payableTags)
  const tagsOfReceivable = groupTags(receivableTags)
  const tagsOfPurchase = groupTags(purchaseTags)

  return {
    accounts: accounts.map((a) => ({
      id: a.id, name: a.name, institution: a.institution, kind: a.kind,
      openingBalance: a.openingBalanceCents === null ? undefined : reais(a.openingBalanceCents),
      limit: a.limitCents === null ? undefined : reais(a.limitCents),
      closingDay: opt(a.closingDay), dueDay: opt(a.dueDay),
      logo: a.hasLogo ? `/dashboard/financeiro/logos/${a.id}?v=${a.updatedAt.getTime()}` : undefined,
      archived: !!a.archivedAt,
    })),
    categories: categories.map((c) => ({
      id: c.id, name: c.name, kind: c.kind, color: c.color,
      systemKey: opt(c.systemKey) as SystemKey | undefined, archived: !!c.archivedAt,
    })),
    tags: tags.map((t) => ({
      id: t.id, name: t.name, color: t.color, description: opt(t.description), archived: !!t.archivedAt,
    })),
    cashEntries: cash.map((c) => ({
      id: c.id, date: c.date, description: c.description, categoryId: c.categoryId, accountId: c.accountId,
      amount: reais(c.amountCents), direction: c.direction, tagIds: tagsOfCash(c.id),
    })),
    transfers: transfers.map((t) => ({
      id: t.id, date: t.date, fromAccountId: t.fromAccountId, toAccountId: t.toAccountId,
      amount: reais(t.amountCents), description: opt(t.description),
    })),
    payables: payables.map((p) => ({
      id: p.id, description: p.description, categoryId: p.categoryId, amount: reais(p.amountCents),
      dueDate: p.dueDate, supplier: opt(p.supplier), settlement: settlementOf(p), tagIds: tagsOfPayable(p.id),
    })),
    receivables: receivables.map((r) => ({
      id: r.id, description: r.description, categoryId: r.categoryId, amount: reais(r.amountCents),
      dueDate: r.dueDate, customer: opt(r.customer), settlement: settlementOf(r), tagIds: tagsOfReceivable(r.id),
    })),
    purchases: purchases.map((p) => ({
      id: p.id, description: p.description, kind: p.kind, creditAccountId: p.creditAccountId,
      categoryId: p.categoryId, date: p.date, total: reais(p.totalCents), installments: p.installments,
      firstInstallment: p.firstInstallment, firstInvoiceMonth: monthOf(p.firstInvoiceMonth),
      tagIds: tagsOfPurchase(p.id),
    })),
    loans: loans.map((l) => ({
      id: l.id, description: l.description, creditAccountId: l.creditAccountId,
      depositAccountId: opt(l.depositAccountId), receivedAt: l.receivedAt, principal: reais(l.principalCents),
      installmentAmount: reais(l.installmentAmountCents), installments: l.installments,
      firstInstallment: l.firstInstallment, firstInvoiceMonth: monthOf(l.firstInvoiceMonth),
    })),
    invoicePayments: payments.map((p) => ({
      id: p.id, creditAccountId: p.creditAccountId, month: monthOf(p.invoiceMonth), paidAt: p.paidAt,
      paidFromAccountId: p.paidFromAccountId, amount: reais(p.amountCents),
    })),
  }
}
