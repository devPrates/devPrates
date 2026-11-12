'use client'

// Formulários de lançamento e baixa. Cada tipo tem o seu, só com os campos
// que ele precisa; o que dá para deduzir vem preenchido (hoje, Nubank, à
// vista). Ainda sem banco: "Lançar" valida e mostra o que seria salvo.
import { ArrowLeftRight } from 'lucide-react'
import { type FormEvent, type ReactNode, useState } from 'react'
import type { FormOptions } from '../_lib/finance'
import { addMonths, dayOfMonth, monthOf, round2, split, todayISO } from '../_lib/dates'
import { fullDate, money, monthLabel, shortMonthLabel } from '../_lib/format'
import type { Account, CategoryKind } from '../_lib/types'
import {
  AccountPicker,
  CategoryPicker,
  Checkbox,
  DatePicker,
  dateText,
  Done,
  FormBody,
  FormFooter,
  FormHeader,
  Hint,
  InstallmentsPicker,
  isPositive,
  MoneyInput,
  parseMoney,
  Preview,
  type PreviewLine,
  Row,
  TagPicker,
  TextInput,
} from './fields'
import type { FormRequest, NewFormType, SettleTarget } from './types'

const DOC = '/dashboard/financeiro/tutorial'

type FormProps = {
  options: FormOptions
  onClose: () => void
  onSwitch: (type: NewFormType) => void
  onAgain: () => void
}

// ---------- Utilidades ----------

function useAccounts(options: FormOptions) {
  const money = options.accounts.filter((a) => a.kind !== 'credito')
  const credit = options.accounts.filter((a) => a.kind === 'credito')
  const byId = (id?: string): Account | undefined => options.accounts.find((a) => a.id === id)
  const defaultMoney = money.find((a) => a.id === 'nubank')?.id ?? money[0]?.id ?? ''
  return { money, credit, byId, defaultMoney }
}

const categoriesOf = (options: FormOptions, kind: CategoryKind) => options.categories.filter((c) => c.kind === kind)

const catName = (options: FormOptions, id: string) => options.categories.find((c) => c.id === id)?.name

const tagNames = (options: FormOptions, ids: string[]) =>
  ids.map((id) => options.tags.find((t) => t.id === id)?.name ?? id.replace(/^nova-/, '').replace(/-/g, ' '))

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

// Casca comum: cabeçalho, corpo, rodapé e a tela de concluído.
function Shell({
  title,
  description,
  doc,
  onClose,
  onAgain,
  valid,
  missing,
  submitLabel,
  preview,
  payload,
  doneTitle,
  children,
}: {
  title: string
  description: string
  doc?: string
  onClose: () => void
  onAgain?: () => void
  valid: boolean
  missing: string
  submitLabel: string
  preview: PreviewLine[]
  payload: () => unknown
  doneTitle: string
  children: ReactNode
}) {
  const [done, setDone] = useState<{ payload: unknown } | null>(null)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    const data = payload()
    console.info('[financeiro] lançamento simulado', data)
    setDone({ payload: data })
  }
  if (done) {
    return (
      <>
        <FormHeader title={title} description={description} onClose={onClose} />
        <Done title={doneTitle} lines={preview} payload={done.payload} onAgain={onAgain} onClose={onClose} />
      </>
    )
  }
  return (
    <form onSubmit={submit}>
      <FormHeader title={title} description={description} docHref={doc ? `${DOC}/${doc}` : undefined} onClose={onClose} />
      <FormBody>
        {children}
        <Preview lines={preview} />
      </FormBody>
      <FormFooter onCancel={onClose} submitLabel={submitLabel} disabled={!valid} missing={missing} />
    </form>
  )
}

// ---------- Despesa e receita à vista ----------

function CashForm({ direction, options, onClose, onSwitch, onAgain }: FormProps & { direction: 'saida' | 'entrada' }) {
  const out = direction === 'saida'
  const acc = useAccounts(options)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState(acc.defaultMoney)
  const [date, setDate] = useState(todayISO())
  const [tagIds, setTagIds] = useState<string[]>([])
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
      valid={isPositive(n) && !!description.trim() && !!categoryId}
      missing={missingText([[isPositive(n), 'valor'], [!!description.trim(), 'descrição'], [!!categoryId, 'categoria']])}
      submitLabel={out ? 'Lançar despesa' : 'Lançar receita'}
      doneTitle={out ? 'Despesa lançada' : 'Receita lançada'}
      preview={preview}
      payload={() => ({ date, description: description.trim(), amount: n, accountId, categoryId, direction, ...(tagIds.length ? { tagIds } : {}) })}
    >
      <MoneyInput value={amount} onChange={setAmount} />
      <Row label="Descrição">
        <TextInput value={description} onChange={setDescription} placeholder={out ? 'Ex.: Gasolina para sair' : 'Ex.: Venda de monitor usado'} />
      </Row>
      <Row label="Categoria">
        <CategoryPicker categories={categoriesOf(options, out ? 'despesa' : 'receita')} value={categoryId} onChange={setCategoryId} />
      </Row>
      <Row label={out ? 'Saiu de' : 'Caiu em'}>
        <AccountPicker accounts={acc.money} value={accountId} onChange={setAccountId} />
      </Row>
      <Row label="Data">
        <DatePicker value={date} onChange={setDate} />
      </Row>
      <Row label="Tags" optional>
        <TagPicker tags={options.tags} value={tagIds} onChange={setTagIds} />
      </Row>
      {out ? (
        <Hint>
          Foi no cartão, na Shopee ou parcelado? <SwitchLink onClick={() => onSwitch('compra')}>Use Compra no crédito</SwitchLink>.
        </Hint>
      ) : (
        <Hint>
          Veio de outra conta sua? Não é receita: <SwitchLink onClick={() => onSwitch('transferencia')}>use Transferência</SwitchLink>.
        </Hint>
      )}
    </Shell>
  )
}

// ---------- Compra no crédito ----------

function PurchaseForm({ options, onClose, onAgain }: FormProps) {
  const acc = useAccounts(options)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [creditAccountId, setCreditAccountId] = useState(acc.credit[0]?.id ?? '')
  const [installments, setInstallments] = useState(1)
  const [isPix, setIsPix] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(todayISO())
  const [tagIds, setTagIds] = useState<string[]>([])
  const n = parseMoney(amount)
  const card = acc.byId(creditAccountId)

  // Mesma regra do servidor: a 1ª parcela cai na fatura do mês seguinte.
  const schedule = isPositive(n)
    ? split(n, installments).map((value, i) => {
        const month = addMonths(monthOf(date), i + 1)
        return { number: i + 1, month, value, due: dayOfMonth(month, card?.dueDay ?? 10) }
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
    { tone: 'warn', text: <>Usa {show(n)} do limite de {card?.name}.</> },
    ...(tagIds.length ? [{ tone: 'neutral' as const, text: <>Aparece nas tags: {tagNames(options, tagIds).join(', ')}.</> }] : []),
  ]

  return (
    <Shell
      title="Compra no crédito"
      description="Cartão, Shopee, Mercado Pago: à vista ou parcelado."
      doc={isPix ? 'pix-no-credito' : 'compra-no-credito'}
      onClose={onClose}
      onAgain={onAgain}
      valid={isPositive(n) && !!description.trim() && !!categoryId && !!creditAccountId}
      missing={missingText([[isPositive(n), 'valor'], [!!description.trim(), 'descrição'], [!!categoryId, 'categoria']])}
      submitLabel="Lançar compra"
      doneTitle="Compra lançada"
      preview={[
        ...preview,
        ...(schedule.length
          ? [{ tone: 'neutral' as const, text: <>Parcelas: {schedule.map((s) => `${s.number}/${installments} em ${shortMonthLabel(s.month)}`).join(' · ')}.</> }]
          : []),
      ]}
      payload={() => ({
        date,
        description: description.trim(),
        total: n,
        installments,
        creditAccountId,
        categoryId,
        kind: isPix ? 'pix_credito' : 'compra',
        ...(tagIds.length ? { tagIds } : {}),
      })}
    >
      <MoneyInput value={amount} onChange={setAmount} label="Valor total da compra" hint="O total, não o valor da parcela." />
      <Row label="Descrição">
        <TextInput value={description} onChange={setDescription} placeholder={isPix ? 'Ex.: Pix no crédito: eletricista' : 'Ex.: Fone Bluetooth'} />
      </Row>
      <Row label="Cartão / conta de crédito">
        <AccountPicker accounts={acc.credit} value={creditAccountId} onChange={setCreditAccountId} />
      </Row>
      <Row label="Parcelas">
        <InstallmentsPicker value={installments} onChange={setInstallments} total={n} />
      </Row>
      <Checkbox checked={isPix} onChange={setIsPix}>
        Foi um <b>pix no crédito</b> <span className="text-zinc-500">(aparece separado na fatura)</span>
      </Checkbox>
      <Row label="Categoria" hint="A do que você comprou.">
        <CategoryPicker categories={categoriesOf(options, 'despesa')} value={categoryId} onChange={setCategoryId} />
      </Row>
      <Row label="Data da compra">
        <DatePicker value={date} onChange={setDate} />
      </Row>
      <Row label="Tags" optional>
        <TagPicker tags={options.tags} value={tagIds} onChange={setTagIds} />
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

function TransferForm({ options, onClose, onAgain }: FormProps) {
  const acc = useAccounts(options)
  const [amount, setAmount] = useState('')
  const [from, setFrom] = useState(acc.defaultMoney)
  const [to, setTo] = useState(acc.money.find((a) => a.id !== acc.defaultMoney)?.id ?? '')
  const [date, setDate] = useState(todayISO())
  const [description, setDescription] = useState('')
  const n = parseMoney(amount)
  const wallet = acc.money.find((a) => a.kind === 'carteira')

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
      description="Dinheiro entre contas suas: pix entre contas, saque, depósito."
      doc="transferencia"
      onClose={onClose}
      onAgain={onAgain}
      valid={isPositive(n) && !!from && !!to && from !== to}
      missing={missingText([[isPositive(n), 'valor'], [from !== to, 'contas diferentes']])}
      submitLabel="Transferir"
      doneTitle="Transferência lançada"
      preview={[
        { tone: 'out', text: <>Sai <b>{show(n)}</b> de {acc.byId(from)?.name}.</> },
        { tone: 'in', text: <>Entra <b>{show(n)}</b> em {acc.byId(to)?.name}, {dateText(date)}.</> },
        { tone: 'neutral', text: <>Não é receita nem despesa: o resultado do mês não muda.</> },
      ]}
      payload={() => ({ date, fromAccountId: from, toAccountId: to, amount: n, ...(description.trim() ? { description: description.trim() } : {}) })}
    >
      <MoneyInput value={amount} onChange={setAmount} />
      {wallet && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
          Atalhos:
          <button
            type="button"
            onClick={() => {
              const bank = from !== wallet.id ? from : acc.defaultMoney
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
              const bank = to !== wallet.id ? to : acc.defaultMoney
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
          aria-label="Inverter contas"
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
        <TextInput value={description} onChange={setDescription} placeholder="Ex.: Pix para a conta do BB" />
      </Row>
      <Hint>Tarifa de TED ou saque? Lance à parte como despesa à vista em &quot;Juros e tarifas&quot;.</Hint>
    </Shell>
  )
}

// ---------- Conta a pagar e a receber ----------

function BillForm({ kind, options, onClose, onSwitch, onAgain }: FormProps & { kind: 'pagar' | 'receber' }) {
  const pay = kind === 'pagar'
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState(todayISO())
  const [categoryId, setCategoryId] = useState('')
  const [party, setParty] = useState('')
  const [tagIds, setTagIds] = useState<string[]>([])
  const n = parseMoney(amount)
  const late = dueDate < todayISO()

  const preview: PreviewLine[] = [
    { tone: 'neutral', text: <>Fica <b>{pay ? 'em aberto' : 'a receber'}</b> em Contas a {pay ? 'pagar' : 'receber'}, vencendo {dateText(dueDate)}, até você dar baixa.</> },
    {
      tone: pay ? 'out' : 'in',
      text: categoryId ? (
        <>{show(n)} contam como {pay ? 'despesa' : 'receita'} em <b>{catName(options, categoryId)}</b> no resultado de {monthLabel(monthOf(dueDate))}.</>
      ) : (
        <>Conta no resultado de {monthLabel(monthOf(dueDate))}, o mês do vencimento.</>
      ),
    },
    { tone: 'neutral', text: <>O saldo não muda agora, só na baixa.</> },
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
      submitLabel={pay ? 'Lançar conta' : 'Lançar conta'}
      doneTitle={pay ? 'Conta a pagar lançada' : 'Conta a receber lançada'}
      preview={preview}
      payload={() => ({
        description: description.trim(),
        amount: n,
        dueDate,
        categoryId,
        ...(party.trim() ? { [pay ? 'supplier' : 'customer']: party.trim() } : {}),
        ...(tagIds.length ? { tagIds } : {}),
      })}
    >
      <MoneyInput value={amount} onChange={setAmount} />
      <Row label="Descrição">
        <TextInput value={description} onChange={setDescription} placeholder={pay ? 'Ex.: Aluguel' : 'Ex.: Projeto Agroclima – parcela 2/3'} />
      </Row>
      <Row label="Vencimento">
        <DatePicker value={dueDate} onChange={setDueDate} future />
      </Row>
      <Row label="Categoria">
        <CategoryPicker categories={categoriesOf(options, pay ? 'despesa' : 'receita')} value={categoryId} onChange={setCategoryId} />
      </Row>
      <Row label={pay ? 'Fornecedor' : 'Cliente'} optional>
        <TextInput value={party} onChange={setParty} placeholder={pay ? 'Ex.: Imobiliária' : 'Ex.: Agroclima'} />
      </Row>
      <Row label="Tags" optional>
        <TagPicker tags={options.tags} value={tagIds} onChange={setTagIds} />
      </Row>
      <Hint>
        {pay ? 'Já pagou?' : 'Já recebeu?'} Então não tem vencimento:{' '}
        <SwitchLink onClick={() => onSwitch(pay ? 'despesa' : 'receita')}>use {pay ? 'Despesa' : 'Receita'} à vista</SwitchLink>.
        {!pay && ' Projeto em parcelas: lance uma conta para cada parcela.'}
      </Hint>
    </Shell>
  )
}

// ---------- Empréstimo ----------

function LoanForm({ options, onClose, onAgain }: FormProps) {
  const acc = useAccounts(options)
  const [principal, setPrincipal] = useState('')
  const [description, setDescription] = useState('')
  const [depositAccountId, setDepositAccountId] = useState(acc.defaultMoney)
  const [creditAccountId, setCreditAccountId] = useState(acc.credit.find((a) => a.id === 'mercado-pago')?.id ?? acc.credit[0]?.id ?? '')
  const [installments, setInstallments] = useState(6)
  const [installmentAmount, setInstallmentAmount] = useState('')
  const [date, setDate] = useState(todayISO())
  const p = parseMoney(principal)
  const each = parseMoney(installmentAmount)
  const total = isPositive(each) ? round2(each * installments) : NaN
  const interest = isPositive(p) && isPositive(total) ? round2(total - p) : NaN
  const first = addMonths(monthOf(date), 1)
  const last = addMonths(monthOf(date), installments)
  const credit = acc.byId(creditAccountId)

  const preview: PreviewLine[] = [
    { tone: 'in', text: <>Entra <b>{show(p)}</b> em {acc.byId(depositAccountId)?.name}, {dateText(date)}. <b>Não é receita.</b></> },
    {
      tone: 'neutral',
      text: <>{installments} parcela{installments > 1 ? 's' : ''} de {show(each)} nas faturas de {credit?.name}, de {shortMonthLabel(first)} a {shortMonthLabel(last)}.</>,
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
      valid={isPositive(p) && isPositive(each) && !!description.trim() && !!creditAccountId}
      missing={missingText([[isPositive(p), 'valor recebido'], [!!description.trim(), 'descrição'], [isPositive(each), 'valor da parcela']])}
      submitLabel="Lançar empréstimo"
      doneTitle="Empréstimo lançado"
      preview={preview}
      payload={() => ({
        description: description.trim(),
        receivedAt: date,
        principal: p,
        depositAccountId,
        creditAccountId,
        installments,
        installmentAmount: each,
      })}
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
      </Row>
      <Row label="Parcelas">
        <InstallmentsPicker value={installments} onChange={setInstallments} total={0} />
      </Row>
      <Row label="Valor de cada parcela" hint="Com os juros, como aparece no app.">
        <div className="flex h-10 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 focus-within:border-zinc-500">
          <span className="text-sm text-zinc-500">R$</span>
          <input
            inputMode="decimal"
            placeholder="0,00"
            value={installmentAmount}
            onChange={(e) => setInstallmentAmount(e.target.value.replace(/[^\d.,]/g, ''))}
            className="min-w-0 flex-1 bg-transparent text-sm tabular-nums text-zinc-100 outline-none placeholder:text-zinc-600"
          />
        </div>
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
  const [accountId, setAccountId] = useState(target.accountId ?? acc.defaultMoney)
  const [paid, setPaid] = useState(target.amount.toFixed(2).replace('.', ','))
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
        <>{receive ? 'A receita' : 'A despesa'} não conta de novo: já contou quando a conta foi lançada.</>
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
      doneTitle={receive ? 'Recebimento registrado' : 'Pagamento registrado'}
      preview={preview}
      payload={() => ({
        id: target.id,
        [receive ? 'receivedAt' : 'paidAt']: date,
        accountId,
        ...(diff !== 0 ? { paidAmount: paidN } : {}),
      })}
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
          <div className="flex h-10 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 focus-within:border-zinc-500">
            <span className="text-sm text-zinc-500">R$</span>
            <input
              inputMode="decimal"
              value={paid}
              onChange={(e) => setPaid(e.target.value.replace(/[^\d.,]/g, ''))}
              className="min-w-0 flex-1 bg-transparent text-sm tabular-nums text-zinc-100 outline-none"
            />
          </div>
        </Row>
      )}
    </Shell>
  )
}

// ---------- Escolha do formulário ----------

export function FormSwitch({
  request,
  ...props
}: FormProps & { request: FormRequest }) {
  switch (request.type) {
    case 'despesa':
      return <CashForm direction="saida" {...props} />
    case 'receita':
      return <CashForm direction="entrada" {...props} />
    case 'compra':
      return <PurchaseForm {...props} />
    case 'transferencia':
      return <TransferForm {...props} />
    case 'pagar':
      return <BillForm kind="pagar" {...props} />
    case 'receber':
      return <BillForm kind="receber" {...props} />
    case 'emprestimo':
      return <LoanForm {...props} />
    case 'baixa':
      return <SettleForm target={request.target} options={props.options} onClose={props.onClose} />
  }
}
