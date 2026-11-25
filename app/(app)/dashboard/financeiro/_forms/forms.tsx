'use client'

// Formulários de lançamento, baixa e cadastro. Cada tipo tem o seu, só com os
// campos que ele precisa; o que dá para deduzir vem preenchido. Com `initial`,
// o mesmo formulário edita o registro.
import { ArrowLeftRight } from 'lucide-react'
import { type FormEvent, type ReactNode, useId, useState, useTransition } from 'react'
import * as actions from '../_actions'
import type { ActionResult } from '../_actions'
import type { FormOptions } from '../_lib/finance'
import { addMonths, dayOfMonth, firstInvoiceMonth, monthOf, round2, split, todayISO } from '../_lib/dates'
import { fullDate, money, monthLabel, shortMonthLabel } from '../_lib/format'
import type {
  Account,
  AccountKind,
  CashEntry,
  Category,
  CategoryKind,
  CreditPurchase,
  FinanceTag,
  Loan,
  Transfer,
} from '../_lib/types'
import {
  AccountPicker,
  CategoryPicker,
  Checkbox,
  ChoicePicker,
  ColorPicker,
  DatePicker,
  dateText,
  Done,
  FormBody,
  FormFooter,
  FormHeader,
  Hint,
  InstallmentsPicker,
  isPositive,
  type LogoChange,
  logoError,
  LogoField,
  MoneyField,
  MoneyInput,
  moneyText,
  MonthSelect,
  newTagName,
  NumberField,
  parseMoney,
  Preview,
  type PreviewLine,
  Row,
  splitTags,
  TagPicker,
  TextInput,
} from './fields'
import type { BillInitial, ConfirmRequest, FormRequest, NewFormType, SettleTarget } from './types'

const DOC = '/dashboard/financeiro/tutorial'

type FormProps = {
  options: FormOptions
  onClose: () => void
  onSwitch: (type: NewFormType) => void
  onAgain: () => void
}

// ---------- Utilidades ----------

// Arquivados só aparecem quando o registro em edição já os usava.
const usable = <T extends { id: string; archived: boolean }>(list: T[], keep: (string | undefined)[]) =>
  list.filter((item) => !item.archived || keep.includes(item.id))

function useAccounts(options: FormOptions, ...keep: (string | undefined)[]) {
  const list = usable(options.accounts, keep)
  const money = list.filter((a) => a.kind !== 'credito')
  const credit = list.filter((a) => a.kind === 'credito')
  const byId = (id?: string): Account | undefined => options.accounts.find((a) => a.id === id)
  return { money, credit, byId, defaultMoney: money[0]?.id ?? '' }
}

const categoriesOf = (options: FormOptions, kind: CategoryKind, keep?: string) =>
  usable(options.categories, [keep]).filter((c) => c.kind === kind)

const catName = (options: FormOptions, id: string) => options.categories.find((c) => c.id === id)?.name

const tagNames = (options: FormOptions, ids: string[]) =>
  ids.map((id) => newTagName(id) ?? options.tags.find((t) => t.id === id)?.name)

const missingText = (items: [boolean, string][]) =>
  items
    .filter(([ok]) => !ok)
    .map(([, name]) => name)
    .join(', ')

// Valor para mostrar na prévia antes de digitar.
const show = (n: number) => (isPositive(n) ? money(n) : 'R$ —')

function SwitchLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="font-medium text-sky-200 underline underline-offset-2 hover:text-white">
      {children}
    </button>
  )
}

// Casca comum: cabeçalho, corpo, rodapé, envio e a tela de concluído. Edições
// e baixas (sem doneTitle) só fecham.
function Shell({
  title,
  description,
  doc,
  onClose,
  onAgain,
  valid,
  missing,
  submitLabel,
  preview = [],
  save,
  doneTitle,
  danger,
  children,
}: {
  title: string
  description: string
  doc?: string
  onClose: () => void
  onAgain?: () => void
  valid: boolean
  missing?: string
  submitLabel: string
  preview?: PreviewLine[]
  save: () => Promise<ActionResult>
  doneTitle?: string
  danger?: boolean
  children?: ReactNode
}) {
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [pending, start] = useTransition()
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid || pending) return
    setError('')
    start(async () => {
      try {
        const result = await save()
        if (!result.ok) setError(result.error)
        else if (doneTitle) setDone(true)
        else onClose()
      } catch {
        setError('Sem resposta do servidor. Confira se salvou antes de tentar de novo.')
      }
    })
  }
  if (done && doneTitle) {
    return (
      <>
        <FormHeader title={title} description={description} onClose={onClose} />
        <Done title={doneTitle} lines={preview} onAgain={onAgain} onClose={onClose} />
      </>
    )
  }
  return (
    <form onSubmit={submit}>
      <FormHeader title={title} description={description} docHref={doc ? `${DOC}/${doc}` : undefined} onClose={onClose} />
      <FormBody>
        {children}
        <Preview lines={preview} />
        {error && (
          <p role="alert" className="rounded-md border border-red-900/70 bg-red-950/40 px-3 py-2 text-[13px] text-red-200">
            {error}
          </p>
        )}
      </FormBody>
      <FormFooter
        onCancel={onClose}
        submitLabel={pending ? 'Salvando…' : submitLabel}
        disabled={!valid || pending}
        missing={pending ? undefined : missing}
        danger={danger}
      />
    </form>
  )
}

// ---------- Despesa e receita à vista ----------

function CashForm({ direction, initial, options, onClose, onSwitch, onAgain }: FormProps & { direction: 'saida' | 'entrada'; initial?: CashEntry }) {
  const out = direction === 'saida'
  const acc = useAccounts(options, initial?.accountId)
  const [amount, setAmount] = useState(moneyText(initial?.amount))
  const [description, setDescription] = useState(initial?.description ?? '')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '')
  const [accountId, setAccountId] = useState(initial?.accountId ?? acc.defaultMoney)
  const [date, setDate] = useState(initial?.date ?? todayISO())
  const [tagIds, setTagIds] = useState<string[]>(initial?.tagIds ?? [])
  const n = parseMoney(amount)

  const preview: PreviewLine[] = [
    { tone: out ? 'out' : 'in', text: <>{out ? 'Sai' : 'Entra'} <b>{show(n)}</b> {out ? 'de' : 'em'} {acc.byId(accountId)?.name}, {dateText(date)}.</> },
    {
      tone: 'neutral',
      text: categoryId ? (
        <>Conta como {out ? 'despesa' : 'receita'} em <b>{catName(options, categoryId)}</b> no resultado de {monthLabel(monthOf(date))}.</>
      ) : (
        <>Escolha a categoria para saber onde ela conta no resultado.</>
      ),
    },
    ...(tagIds.length ? [{ tone: 'neutral' as const, text: <>Aparece nas tags: {tagNames(options, tagIds).join(', ')}.</> }] : []),
  ]

  return (
    <Shell
      title={out ? 'Despesa à vista' : 'Receita à vista'}
      description={out ? 'Gasto pago na hora: pix, débito ou dinheiro.' : 'Dinheiro que entrou na hora.'}
      doc={out ? 'despesa-a-vista' : 'receita-a-vista'}
      onClose={onClose}
      onAgain={onAgain}
      valid={isPositive(n) && !!description.trim() && !!categoryId && !!accountId}
      missing={missingText([[isPositive(n), 'valor'], [!!description.trim(), 'descrição'], [!!categoryId, 'categoria']])}
      submitLabel={initial ? 'Salvar' : out ? 'Lançar despesa' : 'Lançar receita'}
      doneTitle={initial ? undefined : out ? 'Despesa lançada' : 'Receita lançada'}
      preview={preview}
      save={() => actions.saveCash({ date, description, amount: n, accountId, categoryId, direction, ...splitTags(tagIds) }, initial?.id)}
    >
      <MoneyInput value={amount} onChange={setAmount} />
      <Row label="Descrição">
        <TextInput value={description} onChange={setDescription} placeholder={out ? 'Ex.: Gasolina para sair' : 'Ex.: Venda de monitor usado'} />
      </Row>
      <Row label="Categoria">
        <CategoryPicker categories={categoriesOf(options, out ? 'despesa' : 'receita', initial?.categoryId)} value={categoryId} onChange={setCategoryId} />
      </Row>
      <Row label={out ? 'Saiu de' : 'Caiu em'}>
        <AccountPicker accounts={acc.money} value={accountId} onChange={setAccountId} />
      </Row>
      <Row label="Data">
        <DatePicker value={date} onChange={setDate} />
      </Row>
      <Row label="Tags" optional>
        <TagPicker tags={usable(options.tags, tagIds)} value={tagIds} onChange={setTagIds} />
      </Row>
      {initial ? null : out ? (
        <Hint>
          Foi no cartão, na Shopee ou parcelado? <SwitchLink onClick={() => onSwitch('compra')}>Use Compra no crédito</SwitchLink>.
        </Hint>
      ) : (
        <Hint>
          Veio de outra conta bancária sua? Não é receita: <SwitchLink onClick={() => onSwitch('transferencia')}>use Transferência</SwitchLink>.
        </Hint>
      )}
    </Shell>
  )
}

// ---------- Parcelamento ----------

// Parcelas e a fatura em que a primeira cai. O mês é calculado pelo fechamento
// do cartão, mas dá para trocar.
function usePlan(
  card: Account | undefined,
  date: string,
  defaultInstallments: number,
  initial?: { installments: number; firstInstallment: number; firstInvoiceMonth: string },
) {
  const [installments, setInstallments] = useState(initial?.installments ?? defaultInstallments)
  const [ongoing, setOngoing] = useState((initial?.firstInstallment ?? 1) > 1)
  const [paidText, setPaidText] = useState(String(Math.max(1, (initial?.firstInstallment ?? 2) - 1)))
  const [chosen, setChosen] = useState<string | undefined>(initial?.firstInvoiceMonth)
  const paid = ongoing ? Number(paidText) : 0
  const valid = Number.isInteger(paid) && paid >= (ongoing ? 1 : 0) && paid < installments
  const before = valid ? paid : 0
  const automatic = addMonths(firstInvoiceMonth(date, card?.closingDay ?? 1, card?.dueDay ?? 10), before)
  return {
    installments, setInstallments, ongoing, setOngoing, paidText, setPaidText, valid, automatic, chosen, setChosen,
    firstInstallment: before + 1,
    firstInvoiceMonth: chosen ?? automatic,
  }
}

function PlanFields({ plan }: { plan: ReturnType<typeof usePlan> }) {
  const id = useId()
  return (
    <>
      {plan.installments > 1 && (
        <Checkbox checked={plan.ongoing} onChange={plan.setOngoing}>
          Já paguei algumas parcelas <span className="text-zinc-500">(antes de usar o sistema)</span>
        </Checkbox>
      )}
      {plan.ongoing && (
        <Row label="Quantas já foram pagas" htmlFor={id} hint={`Vai começar na parcela ${plan.firstInstallment} de ${plan.installments}.`}>
          <NumberField id={id} value={plan.paidText} onChange={plan.setPaidText} min={1} max={Math.max(1, plan.installments - 1)} />
        </Row>
      )}
      <Row
        label={plan.ongoing ? 'Fatura da próxima parcela (mês do vencimento)' : 'Primeira fatura (mês do vencimento)'}
        hint={
          plan.firstInvoiceMonth === plan.automatic ? (
            'Calculada pelo fechamento. Confira no app e troque se for diferente.'
          ) : (
            <button type="button" onClick={() => plan.setChosen(undefined)} className="text-zinc-300 underline underline-offset-2">
              Usar a calculada pelo fechamento: {monthLabel(plan.automatic)}
            </button>
          )
        }
      >
        <MonthSelect value={plan.firstInvoiceMonth} onChange={plan.setChosen} />
      </Row>
    </>
  )
}

// ---------- Compra no crédito ----------

function PurchaseForm({ initial, options, onClose, onAgain }: FormProps & { initial?: CreditPurchase }) {
  const acc = useAccounts(options, initial?.creditAccountId)
  const [amount, setAmount] = useState(moneyText(initial?.total))
  const [description, setDescription] = useState(initial?.description ?? '')
  const [creditAccountId, setCreditAccountId] = useState(initial?.creditAccountId ?? acc.credit[0]?.id ?? '')
  const [isPix, setIsPix] = useState(initial?.kind === 'pix_credito')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '')
  const [date, setDate] = useState(initial?.date ?? todayISO())
  const [tagIds, setTagIds] = useState<string[]>(initial?.tagIds ?? [])
  const n = parseMoney(amount)
  const card = acc.byId(creditAccountId)

  const plan = usePlan(card, date, 1, initial)
  const { installments, firstInstallment } = plan

  // Parcelas que ainda vão para fatura.
  const schedule = isPositive(n)
    ? split(n, installments).slice(firstInstallment - 1).map((value, i) => {
        const month = addMonths(plan.firstInvoiceMonth, i)
        return { number: firstInstallment + i, month, value, due: dayOfMonth(month, card?.dueDay ?? 10) }
      })
    : []

  const preview: PreviewLine[] = [
    {
      tone: 'out',
      text: categoryId ? (
        <>Despesa de <b>{show(n)}</b> em <b>{catName(options, categoryId)}</b>, inteira em {monthLabel(monthOf(date))} (mês da compra).</>
      ) : (
        <>Despesa de <b>{show(n)}</b> inteira em {monthLabel(monthOf(date))}, o mês da compra.</>
      ),
    },
    { tone: 'neutral', text: <>Nada sai do saldo agora: sai quando você pagar cada fatura de {card?.name}.</> },
    { tone: 'warn', text: <>Usa {show(schedule.reduce((t, p) => t + p.value, 0))} do limite de {card?.name}.</> },
    ...(tagIds.length ? [{ tone: 'neutral' as const, text: <>Aparece nas tags: {tagNames(options, tagIds).join(', ')}.</> }] : []),
  ]

  return (
    <Shell
      title="Compra no crédito"
      description="Cartão, Shopee, Mercado Pago: à vista ou parcelado."
      doc={isPix ? 'pix-no-credito' : 'compra-no-credito'}
      onClose={onClose}
      onAgain={onAgain}
      valid={isPositive(n) && !!description.trim() && !!categoryId && !!creditAccountId && plan.valid}
      missing={missingText([[isPositive(n), 'valor'], [!!description.trim(), 'descrição'], [!!categoryId, 'categoria'], [plan.valid, 'parcelas pagas']])}
      submitLabel={initial ? 'Salvar' : 'Lançar compra'}
      doneTitle={initial ? undefined : 'Compra lançada'}
      preview={[
        ...preview,
        ...(schedule.length
          ? [{ tone: 'neutral' as const, text: <>Parcelas: {schedule.map((s) => `${s.number}/${installments} em ${shortMonthLabel(s.month)}`).join(' · ')}.</> }]
          : []),
      ]}
      save={() =>
        actions.savePurchase(
          {
            date,
            description,
            total: n,
            installments,
            firstInstallment,
            firstInvoiceMonth: plan.firstInvoiceMonth,
            creditAccountId,
            categoryId,
            kind: isPix ? 'pix_credito' : 'compra',
            ...splitTags(tagIds),
          },
          initial?.id,
        )
      }
    >
      <MoneyInput value={amount} onChange={setAmount} label="Valor total da compra" hint="O total, não o valor da parcela." />
      <Row label="Descrição">
        <TextInput value={description} onChange={setDescription} placeholder={isPix ? 'Ex.: Pix no crédito: eletricista' : 'Ex.: Fone Bluetooth'} />
      </Row>
      <Row label="Cartão ou crédito">
        <AccountPicker accounts={acc.credit} value={creditAccountId} onChange={setCreditAccountId} />
      </Row>
      <Row label="Parcelas">
        <InstallmentsPicker value={installments} onChange={plan.setInstallments} total={n} />
      </Row>
      <PlanFields plan={plan} />
      <Checkbox checked={isPix} onChange={setIsPix}>
        Foi um <b>pix no crédito</b> <span className="text-zinc-500">(aparece separado na fatura)</span>
      </Checkbox>
      <Row label="Categoria" hint="A do que você comprou.">
        <CategoryPicker categories={categoriesOf(options, 'despesa', initial?.categoryId)} value={categoryId} onChange={setCategoryId} />
      </Row>
      <Row label="Data da compra">
        <DatePicker value={date} onChange={setDate} />
      </Row>
      <Row label="Tags" optional>
        <TagPicker tags={usable(options.tags, tagIds)} value={tagIds} onChange={setTagIds} />
      </Row>

      {schedule.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-zinc-800">
          <p className="border-b border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Onde cada parcela cai
          </p>
          <ul className="max-h-48 divide-y divide-zinc-800/70 overflow-y-auto text-[13px]">
            {schedule.map((s) => (
              <li key={s.number} className="flex items-center justify-between gap-3 px-3 py-1.5">
                <span className="text-zinc-400">
                  <span className="tabular-nums text-zinc-200">{s.number}/{installments}</span> · fatura {shortMonthLabel(s.month)}{' '}
                  <span className="text-zinc-600">(vence {fullDate(s.due)})</span>
                </span>
                <span className="tabular-nums text-zinc-200">{money(s.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Hint>Lance a compra uma vez só, com o total. As parcelas vão para as faturas sozinhas; não lance cada uma.</Hint>
    </Shell>
  )
}

// ---------- Transferência ----------

function TransferForm({ initial, options, onClose, onAgain }: FormProps & { initial?: Transfer }) {
  const acc = useAccounts(options, initial?.fromAccountId, initial?.toAccountId)
  const [amount, setAmount] = useState(moneyText(initial?.amount))
  const [from, setFrom] = useState(initial?.fromAccountId ?? acc.defaultMoney)
  const [to, setTo] = useState(initial?.toAccountId ?? acc.money.find((a) => a.id !== acc.defaultMoney)?.id ?? '')
  const [date, setDate] = useState(initial?.date ?? todayISO())
  const [description, setDescription] = useState(initial?.description ?? '')
  const n = parseMoney(amount)
  const wallet = acc.money.find((a) => a.kind === 'carteira')
  const firstBank = acc.money.find((a) => a.id !== wallet?.id)?.id ?? ''

  const pickFrom = (id: string) => {
    if (id === to) setTo(from)
    setFrom(id)
  }
  const pickTo = (id: string) => {
    if (id === from) setFrom(to)
    setTo(id)
  }

  return (
    <Shell
      title="Transferência"
      description="Dinheiro entre contas bancárias suas: pix, saque, depósito."
      doc="transferencia"
      onClose={onClose}
      onAgain={onAgain}
      valid={isPositive(n) && !!from && !!to && from !== to}
      missing={missingText([[isPositive(n), 'valor'], [from !== to, 'bancos diferentes']])}
      submitLabel={initial ? 'Salvar' : 'Transferir'}
      doneTitle={initial ? undefined : 'Transferência lançada'}
      preview={[
        { tone: 'out', text: <>Sai <b>{show(n)}</b> de {acc.byId(from)?.name}.</> },
        { tone: 'in', text: <>Entra <b>{show(n)}</b> em {acc.byId(to)?.name}, {dateText(date)}.</> },
        { tone: 'neutral', text: <>Não é receita nem despesa: o resultado do mês não muda.</> },
      ]}
      save={() => actions.saveTransfer({ date, fromAccountId: from, toAccountId: to, amount: n, description }, initial?.id)}
    >
      <MoneyInput value={amount} onChange={setAmount} />
      {wallet && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
          Atalhos:
          <button
            type="button"
            onClick={() => {
              const bank = from !== wallet.id ? from : firstBank
              setFrom(bank)
              setTo(wallet.id)
            }}
            className="rounded-full border border-zinc-800 px-2.5 py-1 text-zinc-400 hover:text-zinc-200"
          >
            Saque
          </button>
          <button
            type="button"
            onClick={() => {
              const bank = to !== wallet.id ? to : firstBank
              setFrom(wallet.id)
              setTo(bank)
            }}
            className="rounded-full border border-zinc-800 px-2.5 py-1 text-zinc-400 hover:text-zinc-200"
          >
            Depósito
          </button>
        </div>
      )}
      <Row label="De">
        <AccountPicker accounts={acc.money} value={from} onChange={pickFrom} />
      </Row>
      <div className="-my-2 flex justify-center">
        <button
          type="button"
          onClick={() => {
            setFrom(to)
            setTo(from)
          }}
          aria-label="Inverter origem e destino"
          className="rounded-full border border-zinc-800 p-1.5 text-zinc-500 hover:text-zinc-200"
        >
          <ArrowLeftRight className="size-3.5 rotate-90" />
        </button>
      </div>
      <Row label="Para">
        <AccountPicker accounts={acc.money} value={to} onChange={pickTo} />
      </Row>
      <Row label="Data">
        <DatePicker value={date} onChange={setDate} />
      </Row>
      <Row label="Descrição" optional>
        <TextInput value={description} onChange={setDescription} placeholder="Ex.: Pix para o BB" />
      </Row>
      <Hint>Tarifa de TED ou saque? Lance à parte como despesa à vista em &quot;Juros e tarifas&quot;.</Hint>
    </Shell>
  )
}

// ---------- Conta a pagar e a receber ----------

function BillForm({ kind, initial, options, onClose, onSwitch, onAgain }: FormProps & { kind: 'pagar' | 'receber'; initial?: BillInitial }) {
  const pay = kind === 'pagar'
  const [description, setDescription] = useState(initial?.description ?? '')
  const [amount, setAmount] = useState(moneyText(initial?.amount))
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? todayISO())
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '')
  const [party, setParty] = useState(initial?.party ?? '')
  const [tagIds, setTagIds] = useState<string[]>(initial?.tagIds ?? [])
  const n = parseMoney(amount)
  const late = !initial?.settled && dueDate < todayISO()

  const preview: PreviewLine[] = [
    ...(initial?.settled ? [] : [{ tone: 'neutral' as const, text: <>Fica <b>{pay ? 'em aberto' : 'a receber'}</b> em Contas a {pay ? 'pagar' : 'receber'}, vencendo {dateText(dueDate)}, até você dar baixa.</> }]),
    {
      tone: pay ? 'out' : 'in',
      text: categoryId ? (
        <>{show(n)} contam como {pay ? 'despesa' : 'receita'} em <b>{catName(options, categoryId)}</b> no resultado de {monthLabel(monthOf(dueDate))}.</>
      ) : (
        <>Conta no resultado de {monthLabel(monthOf(dueDate))}, o mês do vencimento.</>
      ),
    },
    ...(initial?.settled ? [] : [{ tone: 'neutral' as const, text: <>O saldo não muda agora, só na baixa.</> }]),
    ...(late ? [{ tone: 'warn' as const, text: <>O vencimento já passou: vai aparecer como {pay ? 'vencida' : 'atrasada'}.</> }] : []),
  ]

  return (
    <Shell
      title={pay ? 'Conta a pagar' : 'Conta a receber'}
      description={pay ? 'Boleto, aluguel, luz, imposto: algo que vence depois.' : 'Valor que um cliente vai te pagar numa data.'}
      doc={pay ? 'conta-a-pagar' : 'conta-a-receber'}
      onClose={onClose}
      onAgain={onAgain}
      valid={isPositive(n) && !!description.trim() && !!categoryId}
      missing={missingText([[isPositive(n), 'valor'], [!!description.trim(), 'descrição'], [!!categoryId, 'categoria']])}
      submitLabel={initial ? 'Salvar' : pay ? 'Lançar conta a pagar' : 'Lançar conta a receber'}
      doneTitle={initial ? undefined : pay ? 'Conta a pagar lançada' : 'Conta a receber lançada'}
      preview={preview}
      save={() => actions.saveBill(kind, { description, amount: n, dueDate, categoryId, party, ...splitTags(tagIds) }, initial?.id)}
    >
      <MoneyInput
        value={amount}
        onChange={setAmount}
        disabled={initial?.settled}
        hint={initial?.settled ? 'Já baixada: para mudar o valor, desfaça a baixa.' : undefined}
      />
      <Row label="Descrição">
        <TextInput value={description} onChange={setDescription} placeholder={pay ? 'Ex.: Aluguel' : 'Ex.: Projeto Agroclima – parcela 2/3'} />
      </Row>
      <Row label="Vencimento">
        <DatePicker value={dueDate} onChange={setDueDate} future />
      </Row>
      <Row label="Categoria">
        <CategoryPicker categories={categoriesOf(options, pay ? 'despesa' : 'receita', initial?.categoryId)} value={categoryId} onChange={setCategoryId} />
      </Row>
      <Row label={pay ? 'Fornecedor' : 'Cliente'} optional>
        <TextInput value={party} onChange={setParty} placeholder={pay ? 'Ex.: Imobiliária' : 'Ex.: Agroclima'} />
      </Row>
      <Row label="Tags" optional>
        <TagPicker tags={usable(options.tags, tagIds)} value={tagIds} onChange={setTagIds} />
      </Row>
      {!initial && <Hint>
        {pay ? 'Já pagou?' : 'Já recebeu?'} Então não tem vencimento:{' '}
        <SwitchLink onClick={() => onSwitch(pay ? 'despesa' : 'receita')}>use {pay ? 'Despesa' : 'Receita'} à vista</SwitchLink>.
        {!pay && ' Projeto em parcelas: lance uma conta a receber para cada parcela.'}
      </Hint>}
    </Shell>
  )
}

// ---------- Empréstimo ----------

function LoanForm({ initial, options, onClose, onAgain }: FormProps & { initial?: Loan }) {
  const acc = useAccounts(options, initial?.creditAccountId, initial?.depositAccountId)
  const [principal, setPrincipal] = useState(moneyText(initial?.principal))
  const [description, setDescription] = useState(initial?.description ?? '')
  const [depositAccountId, setDepositAccountId] = useState(initial ? (initial.depositAccountId ?? '') : acc.defaultMoney)
  const [creditAccountId, setCreditAccountId] = useState(initial?.creditAccountId ?? acc.credit[0]?.id ?? '')
  const [installmentAmount, setInstallmentAmount] = useState(moneyText(initial?.installmentAmount))
  const [date, setDate] = useState(initial?.receivedAt ?? todayISO())
  const credit = acc.byId(creditAccountId)
  const plan = usePlan(credit, date, 6, initial)
  const { installments, firstInstallment } = plan
  const p = parseMoney(principal)
  const each = parseMoney(installmentAmount)
  const total = isPositive(each) ? round2(each * installments) : NaN
  const interest = isPositive(p) && isPositive(total) ? round2(total - p) : NaN
  const first = plan.firstInvoiceMonth
  const left = installments - firstInstallment + 1
  const last = addMonths(first, left - 1)

  const preview: PreviewLine[] = [
    depositAccountId
      ? { tone: 'in', text: <>Entra <b>{show(p)}</b> em {acc.byId(depositAccountId)?.name}, {dateText(date)}. <b>Não é receita.</b></> }
      : { tone: 'neutral', text: <>Não mexe no saldo: o dinheiro já está no saldo inicial.</> },
    {
      tone: 'neutral',
      text: <>{left} parcela{left > 1 ? 's' : ''} de {show(each)} nas faturas de {credit?.name}, de {shortMonthLabel(first)} a {shortMonthLabel(last)}.</>,
    },
    ...(Number.isFinite(interest)
      ? interest >= 0
        ? [
            {
              tone: 'out' as const,
              text: (
                <>
                  Juros: <b>{money(interest)}</b> (≈ {((interest / p / installments) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% a.m.). Só isso é despesa,{' '}
                  {money(interest / installments)} por mês.
                </>
              ),
            },
            { tone: 'neutral' as const, text: <>Total a devolver: {money(total)}.</> },
          ]
        : [{ tone: 'warn' as const, text: <>O total das parcelas ({money(total)}) é menor que o recebido. Confira os valores.</> }]
      : []),
  ]

  return (
    <Shell
      title="Empréstimo / dinheiro extra"
      description="Dinheiro que o app te empresta e você devolve em parcelas na fatura."
      doc="emprestimo"
      onClose={onClose}
      onAgain={onAgain}
      valid={isPositive(p) && isPositive(each) && !!description.trim() && !!creditAccountId && plan.valid}
      missing={missingText([[isPositive(p), 'valor recebido'], [!!description.trim(), 'descrição'], [isPositive(each), 'valor da parcela'], [plan.valid, 'parcelas pagas']])}
      submitLabel={initial ? 'Salvar' : 'Lançar empréstimo'}
      doneTitle={initial ? undefined : 'Empréstimo lançado'}
      preview={preview}
      save={() =>
        actions.saveLoan(
          {
            description,
            receivedAt: date,
            principal: p,
            depositAccountId: depositAccountId || undefined,
            creditAccountId,
            installments,
            firstInstallment,
            firstInvoiceMonth: plan.firstInvoiceMonth,
            installmentAmount: each,
          },
          initial?.id,
        )
      }
    >
      <MoneyInput value={principal} onChange={setPrincipal} label="Valor que você recebeu" />
      <Row label="Descrição">
        <TextInput value={description} onChange={setDescription} placeholder="Ex.: Dinheiro extra Mercado Pago" />
      </Row>
      <Row label="De quem (as parcelas caem nesta fatura)">
        <AccountPicker accounts={acc.credit} value={creditAccountId} onChange={setCreditAccountId} />
      </Row>
      <Row label="Caiu em">
        <AccountPicker accounts={acc.money} value={depositAccountId} onChange={setDepositAccountId} />
        <Checkbox checked={!depositAccountId} onChange={(v) => setDepositAccountId(v ? '' : acc.defaultMoney)}>
          Empréstimo antigo <span className="text-zinc-500">(o dinheiro já está no saldo inicial)</span>
        </Checkbox>
      </Row>
      <Row label="Parcelas">
        <InstallmentsPicker value={installments} onChange={plan.setInstallments} total={0} />
      </Row>
      <PlanFields plan={plan} />
      <Row label="Valor de cada parcela" hint="Com os juros, como aparece no app.">
        <MoneyField value={installmentAmount} onChange={setInstallmentAmount} />
      </Row>
      <Row label="Data em que caiu">
        <DatePicker value={date} onChange={setDate} />
      </Row>
      <Hint>O que você comprar com esse dinheiro é lançado à parte, normalmente, na categoria do que comprou.</Hint>
    </Shell>
  )
}

// ---------- Baixa ----------

function SettleForm({ target, options, onClose }: Omit<FormProps, 'onSwitch' | 'onAgain'> & { target: SettleTarget }) {
  const acc = useAccounts(options)
  const receive = target.kind === 'receber'
  const isInvoice = target.kind === 'fatura'
  const [date, setDate] = useState(todayISO())
  const [accountId, setAccountId] = useState(acc.defaultMoney)
  const [paid, setPaid] = useState(moneyText(target.amount))
  const paidN = target.kind === 'pagar' ? parseMoney(paid) : target.amount
  const diff = isPositive(paidN) ? round2(paidN - target.amount) : 0
  const today = todayISO()
  const lateDays = target.dueDate < today ? Math.round((Date.parse(today) - Date.parse(target.dueDate)) / 86_400_000) : 0

  const title = receive ? 'Receber' : isInvoice ? 'Pagar fatura' : 'Dar baixa'
  const preview: PreviewLine[] = [
    { tone: receive ? 'in' : 'out', text: <>{receive ? 'Entra' : 'Sai'} <b>{show(paidN)}</b> {receive ? 'em' : 'de'} {acc.byId(accountId)?.name}, {dateText(date)}.</> },
    { tone: 'neutral', text: <>Status vira <b>{receive ? 'recebida' : 'paga'}</b> e a movimentação aparece no extrato.</> },
    {
      tone: 'neutral',
      text: isInvoice ? (
        <>Não é despesa: as compras já contaram nas datas delas. Libera {money(target.amount)} do limite de {acc.byId(target.creditAccountId)?.name}.</>
      ) : (
        <>{receive ? 'A receita' : 'A despesa'} não é somada de novo: já entrou no lançamento.</>
      ),
    },
    ...(diff > 0 ? [{ tone: 'out' as const, text: <>{money(diff)} a mais (multa ou juros) vão como despesa em Juros e tarifas.</> }] : []),
    ...(diff < 0 ? [{ tone: 'in' as const, text: <>Desconto de {money(-diff)}: a despesa desta conta passa a ser {money(paidN)}.</> }] : []),
  ]

  return (
    <Shell
      title={title}
      description={receive ? 'Registrar que o dinheiro caiu.' : 'Registrar que você pagou.'}
      doc={receive ? 'baixa-conta-a-receber' : isInvoice ? 'pagar-fatura' : 'baixa-conta-a-pagar'}
      onClose={onClose}
      valid={isPositive(paidN) && !!accountId}
      missing="valor pago"
      submitLabel={title}
            preview={preview}
      save={() =>
        target.kind === 'fatura'
          ? actions.payInvoice({ creditAccountId: target.creditAccountId, month: target.month, date, accountId })
          : actions.settleBill(target.kind, target.id, { date, accountId, amount: paidN })
      }
    >
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3">
        <p className="text-sm text-zinc-200">{target.description}</p>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-3 text-xs text-zinc-500">
          <span className="text-lg font-semibold tabular-nums text-zinc-100">{money(target.amount)}</span>
          vence {fullDate(target.dueDate)}
          {lateDays > 0 && <span className="text-red-300">há {lateDays} dia(s)</span>}
        </p>
      </div>
      <Row label={receive ? 'Recebido em' : 'Pago em'}>
        <DatePicker value={date} onChange={setDate} />
      </Row>
      <Row label={receive ? 'Caiu em' : 'Pago com'}>
        <AccountPicker accounts={acc.money} value={accountId} onChange={setAccountId} />
      </Row>
      {target.kind === 'pagar' && (
        <Row label="Valor pago" hint="Mude só se pagou com multa, juros ou desconto.">
          <MoneyField value={paid} onChange={setPaid} />
        </Row>
      )}
    </Shell>
  )
}

// ---------- Cadastros ----------

const ACCOUNT_KINDS: { id: AccountKind; name: string }[] = [
  { id: 'corrente', name: 'Conta corrente' },
  { id: 'carteira', name: 'Carteira (dinheiro)' },
  { id: 'poupanca', name: 'Poupança' },
  { id: 'credito', name: 'Cartão / crédito (Shopee…)' },
]

function AccountForm({ initial, onClose }: { initial?: Account; onClose: () => void }) {
  const ids = { name: useId(), institution: useId(), closing: useId(), due: useId(), limit: useId(), opening: useId(), logo: useId() }
  const [kind, setKind] = useState<AccountKind>(initial?.kind ?? 'corrente')
  const [name, setName] = useState(initial?.name ?? '')
  const [institution, setInstitution] = useState(initial?.institution ?? '')
  const [opening, setOpening] = useState(moneyText(initial?.openingBalance ?? 0))
  const [limit, setLimit] = useState(moneyText(initial?.limit))
  const [closing, setClosing] = useState(String(initial?.closingDay ?? ''))
  const [due, setDue] = useState(String(initial?.dueDay ?? ''))
  const [logo, setLogo] = useState<LogoChange>()
  const credit = kind === 'credito'
  const openingN = opening.trim() ? parseMoney(opening) : 0
  const limitN = limit.trim() ? parseMoney(limit) : undefined
  const isDay = (v: string) => /^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 31
  const okMoney = credit ? limitN === undefined || limitN >= 0 : Number.isFinite(openingN)
  return (
    <Shell
      title={initial ? (credit ? 'Editar cartão ou crédito' : 'Editar conta bancária') : 'Novo banco ou cartão'}
      description="Onde o dinheiro está, ou de onde vem o crédito."
      onClose={onClose}
      valid={!!name.trim() && okMoney && !logoError(logo) && (!credit || (isDay(closing) && isDay(due)))}
      missing={missingText([
        [!!name.trim(), 'nome'],
        [okMoney, credit ? 'limite válido' : 'saldo válido'],
        [!logoError(logo), 'logo válida'],
        [!credit || isDay(closing), 'fechamento'],
        [!credit || isDay(due), 'vencimento'],
      ])}
      submitLabel={initial ? 'Salvar' : credit ? 'Cadastrar cartão ou crédito' : 'Cadastrar conta bancária'}
      save={() =>
        actions.saveAccount(
          {
            name,
            institution,
            kind,
            logo: logo?.trim() ? logo : logo === null ? null : undefined,
            ...(credit
              ? { limit: limitN, closingDay: Number(closing), dueDay: Number(due) }
              : { openingBalance: openingN }),
          },
          initial?.id,
        )
      }
    >
      {!initial && (
        <Row label="Tipo">
          <ChoicePicker options={ACCOUNT_KINDS} value={kind} onChange={setKind} />
        </Row>
      )}
      <Row label="Nome" htmlFor={ids.name}>
        <TextInput id={ids.name} value={name} onChange={setName} placeholder={credit ? 'Ex.: Cartão Nubank' : 'Ex.: Nubank'} />
      </Row>
      <Row label="Instituição" optional htmlFor={ids.institution}>
        <TextInput id={ids.institution} value={institution} onChange={setInstitution} />
      </Row>
      <Row label="Logo" optional htmlFor={ids.logo} hint="Código SVG. Prefira o símbolo quadrado, que fica legível em tamanho pequeno.">
        <LogoField id={ids.logo} name={name} current={initial?.logo} value={logo} onChange={setLogo} />
      </Row>
      {credit ? (
        <>
          <Row label="Limite" optional htmlFor={ids.limit}>
            <MoneyField id={ids.limit} value={limit} onChange={setLimit} />
          </Row>
          <div className="grid grid-cols-2 gap-4">
            <Row label="Fecha no dia" htmlFor={ids.closing}>
              <NumberField id={ids.closing} value={closing} onChange={setClosing} min={1} max={31} />
            </Row>
            <Row label="Vence no dia" htmlFor={ids.due}>
              <NumberField id={ids.due} value={due} onChange={setDue} min={1} max={31} />
            </Row>
          </div>
          {initial && <Hint>Mudar o fechamento só vale para novas compras. Mudar o vencimento muda a data de todas as faturas.</Hint>}
        </>
      ) : (
        <Row
          label="Saldo inicial"
          htmlFor={ids.opening}
          hint="O saldo antes do primeiro lançamento que você fizer aqui. Pode ser negativo."
        >
          <MoneyField id={ids.opening} value={opening} onChange={setOpening} negative />
        </Row>
      )}
    </Shell>
  )
}

const CATEGORY_KINDS = [
  { id: 'despesa' as const, name: 'Despesa' },
  { id: 'receita' as const, name: 'Receita' },
]

function CategoryForm({ initial, onClose }: { initial?: Category; onClose: () => void }) {
  const nameId = useId()
  const [name, setName] = useState(initial?.name ?? '')
  const [kind, setKind] = useState<'despesa' | 'receita'>(initial?.kind === 'receita' ? 'receita' : 'despesa')
  const [color, setColor] = useState(initial?.color ?? 'bg-sky-400')
  return (
    <Shell
      title={initial ? 'Editar categoria' : 'Nova categoria'}
      description="Diz o que foi o gasto ou o ganho."
      onClose={onClose}
      valid={!!name.trim()}
      missing="nome"
      submitLabel={initial ? 'Salvar' : 'Cadastrar categoria'}
      save={() => actions.saveCategory({ name, kind, color }, initial?.id)}
    >
      {!initial && (
        <Row label="Natureza">
          <ChoicePicker options={CATEGORY_KINDS} value={kind} onChange={setKind} />
        </Row>
      )}
      <Row label="Nome" htmlFor={nameId}>
        <TextInput id={nameId} value={name} onChange={setName} placeholder="Ex.: Educação" />
      </Row>
      <Row label="Cor">
        <ColorPicker value={color} onChange={setColor} />
      </Row>
    </Shell>
  )
}

function TagForm({ initial, onClose }: { initial?: FinanceTag; onClose: () => void }) {
  const nameId = useId()
  const descriptionId = useId()
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [color, setColor] = useState(initial?.color ?? 'bg-pink-400')
  return (
    <Shell
      title={initial ? 'Editar tag' : 'Nova tag'}
      description="Diz para que ou com quem foi o gasto."
      onClose={onClose}
      valid={!!name.trim()}
      missing="nome"
      submitLabel={initial ? 'Salvar' : 'Cadastrar tag'}
      save={() => actions.saveTag({ name, color, description }, initial?.id)}
    >
      <Row label="Nome" htmlFor={nameId}>
        <TextInput id={nameId} value={name} onChange={setName} placeholder="Ex.: Encontros" />
      </Row>
      <Row label="Descrição" optional htmlFor={descriptionId}>
        <TextInput id={descriptionId} value={description} onChange={setDescription} />
      </Row>
      <Row label="Cor">
        <ColorPicker value={color} onChange={setColor} />
      </Row>
    </Shell>
  )
}

// ---------- Confirmação e falta de conta ----------

function ConfirmForm({ request, onClose }: { request: ConfirmRequest; onClose: () => void }) {
  return (
    <Shell
      title={request.title}
      description={request.text}
      onClose={onClose}
      valid
      submitLabel={request.label}
      danger={request.danger}
      save={() => actions.runRowAction(request.action)}
    />
  )
}

// Sem a conta necessária, o formulário não teria o que escolher.
function missingAccount(request: FormRequest, options: FormOptions): string | undefined {
  const active = options.accounts.filter((a) => !a.archived)
  const moneyCount = active.filter((a) => a.kind !== 'credito').length
  const creditCount = active.length - moneyCount
  if ('initial' in request && request.initial) return undefined
  switch (request.type) {
    case 'despesa':
    case 'receita':
    case 'baixa':
      return moneyCount ? undefined : 'Cadastre primeiro uma conta bancária ou carteira.'
    case 'transferencia':
      return moneyCount > 1 ? undefined : 'Para transferir, cadastre pelo menos duas contas bancárias (ou uma e a carteira).'
    case 'compra':
    case 'emprestimo':
      return creditCount ? undefined : 'Cadastre primeiro um cartão ou crédito (Nubank, Mercado Pago, Shopee).'
  }
}

function NeedAccount({ text, onClose, onCreate }: { text: string; onClose: () => void; onCreate: () => void }) {
  return (
    <>
      <FormHeader title="Falta um cadastro" description={text} onClose={onClose} />
      <div className="flex justify-end px-5 py-4">
        <button
          type="button"
          onClick={onCreate}
          className="h-9 rounded-md bg-zinc-100 px-4 text-sm font-medium text-zinc-900 hover:bg-white"
        >
          Cadastrar banco ou cartão
        </button>
      </div>
    </>
  )
}

// ---------- Escolha do formulário ----------

export function FormSwitch({ request, ...props }: FormProps & { request: FormRequest }) {
  // Só na abertura: ao revalidar, as opções mudam com o formulário aberto.
  const [missing] = useState(() => missingAccount(request, props.options))
  if (missing) return <NeedAccount text={missing} onClose={props.onClose} onCreate={() => props.onSwitch('conta')} />
  switch (request.type) {
    case 'despesa':
      return <CashForm direction="saida" initial={request.initial} {...props} />
    case 'receita':
      return <CashForm direction="entrada" initial={request.initial} {...props} />
    case 'compra':
      return <PurchaseForm initial={request.initial} {...props} />
    case 'transferencia':
      return <TransferForm initial={request.initial} {...props} />
    case 'pagar':
      return <BillForm kind="pagar" initial={request.initial} {...props} />
    case 'receber':
      return <BillForm kind="receber" initial={request.initial} {...props} />
    case 'emprestimo':
      return <LoanForm initial={request.initial} {...props} />
    case 'conta':
      return <AccountForm initial={request.initial} onClose={props.onClose} />
    case 'categoria':
      return <CategoryForm initial={request.initial} onClose={props.onClose} />
    case 'tag':
      return <TagForm initial={request.initial} onClose={props.onClose} />
    case 'baixa':
      return <SettleForm target={request.target} options={props.options} onClose={props.onClose} />
    case 'confirmar':
      return <ConfirmForm request={request} onClose={props.onClose} />
  }
}
