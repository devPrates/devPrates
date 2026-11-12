// Conteúdo da documentação do Financeiro, no formato de doc de API: uma
// página por assunto. Lançamentos e baixas documentam os campos do modelo
// (_lib/types.ts) e mostram o registro e as movimentações que ele gera.
import type { ReactNode } from 'react'

export const DOCS_BASE = '/dashboard/financeiro/tutorial'

export type DocKind = 'lancamento' | 'baixa' | 'guia'

export type DocField = {
  name: string
  type: string
  required?: boolean
  description: ReactNode
}

export type DocExample = { title: string; code: string }

export type DocPage = {
  slug: string
  group: string
  title: string
  kind: DocKind
  summary: string
  // Tela e botão onde o lançamento é feito.
  screen?: { label: string; href: string; action?: string }
  // Modelo em _lib/types.ts.
  model?: string
  body?: ReactNode
  fields?: DocField[]
  effects?: ReactNode[]
  notes?: { tone: 'info' | 'warning'; text: ReactNode }[]
  examples?: DocExample[]
}

export const KIND_LABEL: Record<DocKind, string> = {
  lancamento: 'LANÇAR',
  baixa: 'BAIXA',
  guia: 'GUIA',
}

const FIN = '/dashboard/financeiro'

// ---------- Peças de texto ----------

const Code = ({ children }: { children: ReactNode }) => (
  <code className="rounded bg-zinc-800/80 px-1 py-0.5 font-mono text-[12px] text-zinc-200">{children}</code>
)

const P = ({ children }: { children: ReactNode }) => (
  <p className="text-sm leading-relaxed text-zinc-300">{children}</p>
)

const H = ({ children }: { children: ReactNode }) => (
  <h2 className="mt-4 text-base font-semibold text-zinc-100">{children}</h2>
)

function Rows({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full min-w-[560px] text-left text-[13px]">
        <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs text-zinc-500">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/70">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td key={j} className="px-3 py-2.5 align-top text-zinc-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const DocLink = ({ slug, children }: { slug: string; children: ReactNode }) => (
  <a
    href={slug ? `${DOCS_BASE}/${slug}` : DOCS_BASE}
    className="text-zinc-100 underline decoration-zinc-600 underline-offset-2 hover:decoration-zinc-300"
  >
    {children}
  </a>
)

const YES = <span className="text-emerald-400">Sim</span>
const NO = <span className="text-zinc-500">Não</span>

// Campos que se repetem.
const F = {
  date: (d = 'Data em que aconteceu.'): DocField => ({ name: 'date', type: 'ISODate', required: true, description: d }),
  description: (d = 'Texto livre que aparece nas listas.'): DocField => ({ name: 'description', type: 'string', required: true, description: d }),
  amount: (d = 'Valor em reais, sempre positivo.'): DocField => ({ name: 'amount', type: 'number', required: true, description: d }),
  category: (d: ReactNode): DocField => ({ name: 'categoryId', type: 'Category', required: true, description: d }),
  tags: (): DocField => ({
    name: 'tagIds',
    type: 'Tag[]',
    description: (
      <>
        Zero ou mais tags para filtrar depois (Encontros, Trabalho). Veja <DocLink slug="tags">Tags</DocLink>.
      </>
    ),
  }),
}

// ---------- Páginas ----------

export const DOCS: DocPage[] = [
  // ===== Introdução =====
  {
    slug: '',
    group: 'Introdução',
    title: 'Visão geral',
    kind: 'guia',
    summary: 'Como o Financeiro está organizado e como ler esta documentação.',
    body: (
      <>
        <P>
          O Financeiro segue o modelo dos ERPs: você <strong className="text-zinc-100">lança</strong> o que
          aconteceu ou vai acontecer, e <strong className="text-zinc-100">dá baixa</strong> quando o dinheiro de
          fato sai ou entra. Faturas, extrato, saldos e totais não são digitados: o sistema calcula tudo a partir dos
          lançamentos, por isso os números batem entre as telas.
        </P>
        <H>A regra de ouro</H>
        <P>Todo dinheiro entra no sistema uma vez só, em um lugar só. Antes de lançar, responda:</P>
        <Rows
          head={['Pergunta', 'Se sim']}
          rows={[
            ['O dinheiro é meu e só mudou de lugar?', <DocLink key="t" slug="transferencia">Transferência</DocLink>],
            ['Foi no crédito (cartão, Shopee, Mercado Pago)?', <><DocLink slug="compra-no-credito">Compra no crédito</DocLink> ou <DocLink slug="emprestimo">Empréstimo</DocLink></>],
            ['Tem vencimento no futuro?', <><DocLink slug="conta-a-pagar">Conta a pagar</DocLink> / <DocLink slug="conta-a-receber">a receber</DocLink>, depois a baixa</>],
            ['Nenhuma das anteriores', <><DocLink slug="despesa-a-vista">Despesa</DocLink> ou <DocLink slug="receita-a-vista">receita à vista</DocLink></>],
          ]}
        />
        <H>Como ler as páginas</H>
        <P>
          Cada lançamento tem o selo <Code>LANÇAR</Code> e cada baixa o selo <Code>BAIXA</Code>. A página mostra a
          tela onde fazer, a tabela de <strong className="text-zinc-100">campos</strong> (com o nome usado no banco),
          os <strong className="text-zinc-100">efeitos</strong> e, ao lado, o JSON do registro e das movimentações
          que ele gera.
        </P>
      </>
    ),
    notes: [
      {
        tone: 'warning',
        text: 'Os formulários já existem (botões nas telas e Novo lançamento na Visão geral), mas ainda não salvam: o banco entra na próxima fase. Ao lançar, eles mostram os dados que seriam salvos.',
      },
    ],
  },
  {
    slug: 'conceitos',
    group: 'Introdução',
    title: 'Conceitos',
    kind: 'guia',
    summary: 'Lançamento, baixa, competência, resultado, categorias e status.',
    body: (
      <>
        <H>Lançamento × baixa</H>
        <P>
          <strong className="text-zinc-100">Lançar</strong> é registrar que algo existe: uma conta que vai vencer,
          uma compra parcelada, um valor a receber. <strong className="text-zinc-100">Dar baixa</strong> é registrar
          que foi pago ou recebido de verdade (data, conta e valor). A baixa cria a movimentação e muda o saldo; ela
          não é um lançamento novo.
        </P>
        <H>Competência × caixa</H>
        <P>
          O gasto conta no mês em que aconteceu (data da compra ou vencimento): isso é a{' '}
          <strong className="text-zinc-100">competência</strong>. O saldo muda no dia em que o dinheiro sai: isso é o{' '}
          <strong className="text-zinc-100">caixa</strong>. Uma compra de R$ 300 em 3x pesa R$ 300 no mês da compra, e
          o saldo cai R$ 100 por mês, quando cada fatura é paga.
        </P>
        <H>Resultado e categorias</H>
        <P>Resultado do mês = receitas − despesas. Cada categoria tem uma natureza:</P>
        <Rows
          head={['Natureza', 'Exemplos', 'Entra no resultado?']}
          rows={[
            [<Code key="d">despesa</Code>, 'Moradia, Mercado, Juros e tarifas', YES],
            [<Code key="r">receita</Code>, 'Projetos, Manutenção mensal', YES],
            [<Code key="n">neutra</Code>, 'Empréstimo recebido, Pagamento de fatura, Transferência', NO],
          ]}
        />
        <H>Status</H>
        <Rows
          head={['Onde', 'Status']}
          rows={[
            ['Contas a pagar', <><Code>aberta</Code> → <Code>vencida</Code> (passou do dia) → <Code>paga</Code> (baixa)</>],
            ['Contas a receber', <><Code>a receber</Code> → <Code>atrasada</Code> → <Code>recebida</Code> (baixa)</>],
            ['Faturas', <><Code>futura</Code> → <Code>aberta</Code> (mês atual) → <Code>vencida</Code> → <Code>paga</Code></>],
          ]}
        />
      </>
    ),
  },
  {
    slug: 'onde-lancar',
    group: 'Introdução',
    title: 'Onde lançar cada coisa',
    kind: 'guia',
    summary: 'Tabela de referência rápida: o que aconteceu → qual lançamento usar.',
    body: (
      <Rows
        head={['O que aconteceu', 'Lançamento', 'Categoria', 'No resultado?']}
        rows={[
          ['Paguei na hora (pix, débito, dinheiro)', <DocLink key="1" slug="despesa-a-vista">Despesa à vista</DocLink>, 'a do gasto', YES],
          ['Recebi na hora', <DocLink key="2" slug="receita-a-vista">Receita à vista</DocLink>, 'a da receita', YES],
          ['Boleto ou conta para pagar depois', <DocLink key="3" slug="conta-a-pagar">Conta a pagar</DocLink>, 'a do gasto', YES],
          ['Cliente vai me pagar depois', <DocLink key="4" slug="conta-a-receber">Conta a receber</DocLink>, 'a da receita', YES],
          ['Comprei no cartão / Shopee / parcelado', <DocLink key="5" slug="compra-no-credito">Compra no crédito</DocLink>, 'a do que comprei', YES],
          ['Fiz um pix no crédito', <DocLink key="6" slug="pix-no-credito">Pix no crédito</DocLink>, 'a do que paguei', YES],
          ['Peguei dinheiro extra / empréstimo', <DocLink key="7" slug="emprestimo">Empréstimo</DocLink>, 'Empréstimo recebido', <span key="j" className="text-amber-300">Só os juros</span>],
          ['Passei dinheiro entre contas minhas', <DocLink key="8" slug="transferencia">Transferência</DocLink>, 'Transferência', NO],
          ['Paguei um boleto já lançado', <DocLink key="9" slug="baixa-conta-a-pagar">Baixa de conta a pagar</DocLink>, '(a da conta)', NO],
          ['Recebi de um cliente já lançado', <DocLink key="10" slug="baixa-conta-a-receber">Baixa de conta a receber</DocLink>, '(a da conta)', NO],
          ['Paguei a fatura', <DocLink key="11" slug="pagar-fatura">Pagar fatura</DocLink>, 'Pagamento de fatura', NO],
        ]}
      />
    ),
    notes: [
      { tone: 'info', text: 'Na baixa, "Não" quer dizer que ela não soma de novo: a despesa ou receita já contou quando a conta foi lançada.' },
    ],
  },

  // ===== Lançamentos =====
  {
    slug: 'despesa-a-vista',
    group: 'Lançamentos',
    title: 'Despesa à vista',
    kind: 'lancamento',
    summary: 'Gasto pago na hora, por pix, débito ou dinheiro. Já nasce pago, sem baixa.',
    screen: { label: 'Movimentações', href: `${FIN}/movimentacoes`, action: 'Nova saída' },
    model: 'CashEntry',
    fields: [
      F.date(),
      F.description(),
      F.amount(),
      { name: 'accountId', type: 'Account', required: true, description: 'Conta de onde o dinheiro saiu: Nubank, Banco do Brasil, Carteira.' },
      F.category('Categoria de despesa (Mercado, Transporte…).'),
      F.tags(),
      { name: 'direction', type: "'saida'", required: true, description: 'Preenchido pelo botão Nova saída.' },
    ],
    effects: [
      'Cria uma saída no extrato da conta e diminui o saldo.',
      'Soma em "gastos por categoria" no mês da data.',
    ],
    notes: [{ tone: 'info', text: 'Débito é à vista. Só é crédito o que vai cair numa fatura.' }],
    examples: [
      {
        title: 'Registro',
        code: `{
  "date": "2026-11-08",
  "description": "Gasolina para sair",
  "amount": 70,
  "accountId": "nubank",
  "categoryId": "combustivel",
  "tagIds": ["encontros"],
  "direction": "saida"
}`,
      },
      {
        title: 'Movimentação gerada',
        code: `{
  "accountId": "nubank",
  "direction": "saida",
  "amount": 70,
  "source": "a_vista",
  "tagIds": ["encontros"]
}
// resultado do mês: -70  ·  aparece em Tags → Encontros`,
      },
    ],
  },
  {
    slug: 'receita-a-vista',
    group: 'Lançamentos',
    title: 'Receita à vista',
    kind: 'lancamento',
    summary: 'Dinheiro que entrou na hora e não estava lançado como conta a receber.',
    screen: { label: 'Movimentações', href: `${FIN}/movimentacoes`, action: 'Nova entrada' },
    model: 'CashEntry',
    fields: [
      F.date(),
      F.description(),
      F.amount(),
      { name: 'accountId', type: 'Account', required: true, description: 'Conta onde o dinheiro caiu.' },
      F.category('Categoria de receita (Projetos, Outras receitas…).'),
      F.tags(),
      { name: 'direction', type: "'entrada'", required: true, description: 'Preenchido pelo botão Nova entrada.' },
    ],
    effects: ['Cria uma entrada no extrato e aumenta o saldo.', 'Soma na receita do mês.'],
    notes: [
      { tone: 'warning', text: 'Se o dinheiro veio de outra conta sua, não é receita: use Transferência.' },
      { tone: 'info', text: 'Se o cliente já estava em Contas a receber, não lance aqui: dê baixa na conta.' },
    ],
    examples: [
      {
        title: 'Registro',
        code: `{
  "date": "2026-11-09",
  "description": "Venda de monitor usado",
  "amount": 350,
  "accountId": "nubank",
  "categoryId": "outras-receitas",
  "direction": "entrada"
}`,
      },
      {
        title: 'Movimentação gerada',
        code: `{
  "accountId": "nubank",
  "direction": "entrada",
  "amount": 350,
  "source": "a_vista"
}
// resultado do mês: +350`,
      },
    ],
  },
  {
    slug: 'conta-a-pagar',
    group: 'Lançamentos',
    title: 'Conta a pagar',
    kind: 'lancamento',
    summary: 'Boleto, aluguel, luz, imposto: algo com vencimento que você paga depois.',
    screen: { label: 'Contas a pagar', href: `${FIN}/contas-a-pagar`, action: 'Nova conta' },
    model: 'Payable',
    fields: [
      F.description(),
      F.amount('Valor do boleto.'),
      { name: 'dueDate', type: 'ISODate', required: true, description: 'Vencimento. Define o mês em que a despesa conta.' },
      F.category('Categoria de despesa (Moradia, Impostos…).'),
      F.tags(),
      { name: 'supplier', type: 'string', description: 'Para quem você paga (Imobiliária, Energisa).' },
    ],
    effects: [
      'Aparece em Contas a pagar como aberta e nos próximos vencimentos da Visão geral.',
      'A despesa conta no mês do vencimento. O saldo ainda não muda.',
      <>Passou do vencimento sem baixa: vira <Code>vencida</Code>.</>,
      <>Para pagar, veja <DocLink slug="baixa-conta-a-pagar">Baixa de conta a pagar</DocLink>.</>,
    ],
    notes: [{ tone: 'info', text: 'Lance assim que a conta chegar, mesmo que vença daqui a semanas. Contas fixas (aluguel, internet) vão ter lançamento recorrente.' }],
    examples: [
      {
        title: 'Registro',
        code: `{
  "description": "Aluguel",
  "amount": 1200,
  "dueDate": "2026-11-10",
  "categoryId": "moradia",
  "supplier": "Imobiliária"
}
// status: "aberta"  ·  movimentações: nenhuma`,
      },
    ],
  },
  {
    slug: 'conta-a-receber',
    group: 'Lançamentos',
    title: 'Conta a receber',
    kind: 'lancamento',
    summary: 'Valor que um cliente vai te pagar numa data: parcela de projeto, mensalidade.',
    screen: { label: 'Contas a receber', href: `${FIN}/contas-a-receber`, action: 'Nova conta' },
    model: 'Receivable',
    fields: [
      F.description(),
      F.amount(),
      { name: 'dueDate', type: 'ISODate', required: true, description: 'Data combinada. Define o mês em que a receita conta.' },
      F.category('Categoria de receita (Projetos, Manutenção mensal).'),
      F.tags(),
      { name: 'customer', type: 'string', description: 'Quem vai pagar.' },
    ],
    effects: [
      'Aparece em Contas a receber e na previsão da Visão geral.',
      'A receita conta no mês do vencimento. O saldo ainda não muda.',
      <>Passou do dia sem receber: vira <Code>atrasada</Code>.</>,
      <>Quando o dinheiro cair, veja <DocLink slug="baixa-conta-a-receber">Baixa de conta a receber</DocLink>.</>,
    ],
    notes: [{ tone: 'info', text: 'Projeto em parcelas: lance uma conta a receber para cada parcela.' }],
    examples: [
      {
        title: 'Registro',
        code: `{
  "description": "Projeto Agroclima – parcela 2/3",
  "amount": 1800,
  "dueDate": "2026-11-18",
  "categoryId": "projetos",
  "customer": "Agroclima"
}
// status: "aberta"  ·  movimentações: nenhuma`,
      },
    ],
  },
  {
    slug: 'compra-no-credito',
    group: 'Lançamentos',
    title: 'Compra no crédito',
    kind: 'lancamento',
    summary: 'Compra no cartão, na Shopee ou no Mercado Pago, à vista ou parcelada.',
    screen: { label: 'Faturas', href: `${FIN}/faturas`, action: 'Nova compra' },
    model: 'CreditPurchase',
    fields: [
      F.date('Data da compra. A despesa conta neste mês.'),
      F.description(),
      { name: 'total', type: 'number', required: true, description: <>Valor <strong className="text-zinc-100">total</strong> da compra, não o da parcela.</> },
      { name: 'installments', type: 'number', required: true, description: 'Número de parcelas. À vista no cartão = 1.' },
      { name: 'creditAccountId', type: 'Account (crédito)', required: true, description: 'Cartão Nubank, Mercado Pago, Shopee.' },
      F.category('Categoria do que foi comprado (Eletrônicos, Casa…).'),
      F.tags(),
      { name: 'kind', type: "'compra'", required: true, description: <>Use <Code>pix_credito</Code> para <DocLink slug="pix-no-credito">pix no crédito</DocLink>.</> },
    ],
    effects: [
      'A compra inteira conta como despesa no mês da compra.',
      'O sistema divide em parcelas e põe cada uma na fatura do mês certo (a 1ª na fatura seguinte).',
      'Diminui o limite disponível da conta de crédito.',
      <>Nada sai do saldo agora: só quando você <DocLink slug="pagar-fatura">pagar a fatura</DocLink>.</>,
    ],
    notes: [{ tone: 'warning', text: 'Não lance cada parcela como despesa todo mês. A despesa já foi contada na compra.' }],
    examples: [
      {
        title: 'Registro',
        code: `{
  "date": "2026-10-03",
  "description": "Fone Bluetooth",
  "total": 189.90,
  "installments": 3,
  "creditAccountId": "shopee",
  "categoryId": "eletronicos",
  "kind": "compra"
}`,
      },
      {
        title: 'Parcelas geradas (itens de fatura)',
        code: `[
  { "month": "2026-11", "number": 1, "of": 3, "amount": 63.30 },
  { "month": "2026-12", "number": 2, "of": 3, "amount": 63.30 },
  { "month": "2027-01", "number": 3, "of": 3, "amount": 63.30 }
]
// resultado de out/2026: -189.90  ·  saldo: sem mudança`,
      },
    ],
  },
  {
    slug: 'pix-no-credito',
    group: 'Lançamentos',
    title: 'Pix no crédito',
    kind: 'lancamento',
    summary: 'Pix pago com o limite do crédito (Mercado Pago, Nubank), parcelado ou não.',
    screen: { label: 'Faturas', href: `${FIN}/faturas`, action: 'Nova compra → Pix no crédito' },
    model: 'CreditPurchase',
    body: (
      <P>
        Funciona igual à <DocLink slug="compra-no-credito">compra no crédito</DocLink>. A diferença é o campo{' '}
        <Code>kind</Code>, que faz o item aparecer na fatura com a etiqueta &quot;Pix no crédito&quot;, separado das
        compras e das parcelas de empréstimo.
      </P>
    ),
    fields: [
      F.date('Data do pix.'),
      F.description('Ex.: "Pix no crédito: eletricista".'),
      { name: 'total', type: 'number', required: true, description: 'Total que você vai pagar, com os juros do app.' },
      { name: 'installments', type: 'number', required: true, description: 'Número de parcelas.' },
      { name: 'creditAccountId', type: 'Account (crédito)', required: true, description: 'Conta de crédito usada.' },
      F.category('Categoria do que foi pago com o pix (Casa, Saúde…).'),
      F.tags(),
      { name: 'kind', type: "'pix_credito'", required: true, description: 'Marca como pix no crédito.' },
    ],
    effects: ['Igual à compra no crédito: despesa no mês do pix, parcelas nas faturas, limite reduzido.'],
    notes: [{ tone: 'info', text: 'Quer ver os juros do pix à parte? Lance o valor do pix na categoria do gasto e a diferença como outra compra em "Juros e tarifas".' }],
    examples: [
      {
        title: 'Registro',
        code: `{
  "date": "2026-10-26",
  "description": "Pix no crédito: eletricista",
  "total": 450,
  "installments": 3,
  "creditAccountId": "mercado-pago",
  "categoryId": "casa",
  "kind": "pix_credito"
}`,
      },
    ],
  },
  {
    slug: 'emprestimo',
    group: 'Lançamentos',
    title: 'Empréstimo / dinheiro extra',
    kind: 'lancamento',
    summary: 'Dinheiro que o app te empresta (Mercado Pago, Shopee) e você devolve em parcelas na fatura.',
    screen: { label: 'Empréstimos', href: `${FIN}/emprestimos`, action: 'Novo empréstimo' },
    model: 'Loan',
    fields: [
      F.description(),
      { name: 'receivedAt', type: 'ISODate', required: true, description: 'Dia em que o dinheiro caiu.' },
      { name: 'principal', type: 'number', required: true, description: 'Valor que você recebeu.' },
      { name: 'depositAccountId', type: 'Account', required: true, description: 'Conta onde o dinheiro caiu (Nubank).' },
      { name: 'creditAccountId', type: 'Account (crédito)', required: true, description: 'Conta cujas faturas vão ter as parcelas.' },
      { name: 'installments', type: 'number', required: true, description: 'Número de parcelas.' },
      { name: 'installmentAmount', type: 'number', required: true, description: 'Valor de cada parcela, com juros.' },
    ],
    effects: [
      <>Cria uma entrada na conta de depósito na categoria <Code>Empréstimo recebido</Code>, que <strong className="text-zinc-100">não é receita</strong>.</>,
      'Põe as parcelas nas faturas da conta de crédito, com a etiqueta "Empréstimo".',
      <>Calcula os juros: <Code>installments × installmentAmount − principal</Code>. Só eles são despesa, divididos ao longo das parcelas.</>,
      'Mostra saldo devedor, parcelas pagas e taxa média em Empréstimos.',
    ],
    notes: [{ tone: 'info', text: 'O que você comprar com esse dinheiro é lançado à parte, normalmente, na categoria do que comprou.' }],
    examples: [
      {
        title: 'Registro',
        code: `{
  "description": "Dinheiro extra Mercado Pago",
  "receivedAt": "2026-10-20",
  "principal": 1500,
  "depositAccountId": "nubank",
  "creditAccountId": "mercado-pago",
  "installments": 6,
  "installmentAmount": 310
}`,
      },
      {
        title: 'O que é gerado',
        code: `// movimentação
{ "accountId": "nubank", "direction": "entrada",
  "amount": 1500, "categoryId": "emprestimo-recebido" }

// itens de fatura: nov/2026 a abr/2027
{ "number": 1, "of": 6, "amount": 310 }  // ...6x

// juros = 6 × 310 − 1500 = 360
// resultado: -60 por mês, por 6 meses`,
      },
    ],
  },
  {
    slug: 'transferencia',
    group: 'Lançamentos',
    title: 'Transferência entre contas',
    kind: 'lancamento',
    summary: 'Pix entre contas suas, saque e depósito. O dinheiro só muda de lugar.',
    screen: { label: 'Movimentações', href: `${FIN}/movimentacoes?tipo=transferencias`, action: 'Nova transferência' },
    model: 'Transfer',
    fields: [
      F.date(),
      { name: 'fromAccountId', type: 'Account', required: true, description: 'De onde sai. Saque: o banco.' },
      { name: 'toAccountId', type: 'Account', required: true, description: 'Para onde vai. Saque: Carteira.' },
      F.amount(),
      { name: 'description', type: 'string', description: 'Opcional. Sem ela, aparece "Transferência para …".' },
    ],
    effects: [
      'Gera duas movimentações ligadas: saída na origem e entrada no destino.',
      'Os saldos das duas contas se ajustam; o total do seu dinheiro não muda.',
      'Não é receita nem despesa. Fica fora de Entradas e Saídas na visão de todas as contas.',
      'Editar ou excluir a transferência mexe nas duas pernas juntas.',
    ],
    notes: [{ tone: 'info', text: 'Tarifa de TED ou saque: lance à parte como despesa à vista em "Juros e tarifas".' }],
    examples: [
      {
        title: 'Registro',
        code: `{
  "date": "2026-11-02",
  "fromAccountId": "nubank",
  "toAccountId": "bb",
  "amount": 500,
  "description": "Pix para a conta do BB"
}`,
      },
      {
        title: 'Movimentações geradas',
        code: `[
  { "accountId": "nubank", "direction": "saida",
    "amount": 500, "counterpartAccountId": "bb" },
  { "accountId": "bb", "direction": "entrada",
    "amount": 500, "counterpartAccountId": "nubank" }
]
// resultado do mês: 0`,
      },
    ],
  },

  // ===== Baixas =====
  {
    slug: 'baixa-conta-a-pagar',
    group: 'Baixas',
    title: 'Baixa de conta a pagar',
    kind: 'baixa',
    summary: 'Registrar que você pagou uma conta que já estava lançada.',
    screen: { label: 'Contas a pagar', href: `${FIN}/contas-a-pagar`, action: 'Dar baixa (na linha da conta)' },
    model: 'Payable',
    fields: [
      { name: 'paidAt', type: 'ISODate', required: true, description: 'Dia em que você pagou.' },
      { name: 'accountId', type: 'Account', required: true, description: 'Conta usada para pagar.' },
      { name: 'paidAmount', type: 'number', description: 'Só se pagou valor diferente (multa, juros, desconto). A diferença vai para "Juros e tarifas". Campo novo, entra com o formulário.' },
    ],
    effects: [
      <>A conta vira <Code>paga</Code>.</>,
      'Cria a saída em Movimentações (origem "Conta paga") e diminui o saldo.',
      'Não soma despesa de novo: ela já contou quando a conta foi lançada.',
    ],
    notes: [{ tone: 'warning', text: 'Não lance uma despesa à vista para o mesmo pagamento: isso conta o gasto duas vezes.' }],
    examples: [
      {
        title: 'Baixa',
        code: `// PATCH na conta "p-aluguel-0"
{
  "paidAt": "2026-11-09",
  "accountId": "nubank"
}`,
      },
      {
        title: 'Movimentação gerada',
        code: `{
  "accountId": "nubank",
  "direction": "saida",
  "amount": 1200,
  "categoryId": "moradia",
  "source": "baixa_pagar"
}
// resultado: sem mudança (já contou no lançamento)`,
      },
    ],
  },
  {
    slug: 'baixa-conta-a-receber',
    group: 'Baixas',
    title: 'Baixa de conta a receber',
    kind: 'baixa',
    summary: 'Registrar que o cliente pagou uma conta a receber.',
    screen: { label: 'Contas a receber', href: `${FIN}/contas-a-receber`, action: 'Receber (na linha da conta)' },
    model: 'Receivable',
    fields: [
      { name: 'receivedAt', type: 'ISODate', required: true, description: 'Dia em que o dinheiro caiu.' },
      { name: 'accountId', type: 'Account', required: true, description: 'Conta onde caiu.' },
    ],
    effects: [
      <>A conta vira <Code>recebida</Code>.</>,
      'Cria a entrada em Movimentações (origem "Recebimento") e aumenta o saldo.',
      'Não soma receita de novo.',
    ],
    examples: [
      {
        title: 'Baixa',
        code: `// PATCH na conta "r-agro-2"
{
  "receivedAt": "2026-11-18",
  "accountId": "nubank"
}`,
      },
      {
        title: 'Movimentação gerada',
        code: `{
  "accountId": "nubank",
  "direction": "entrada",
  "amount": 1800,
  "source": "baixa_receber"
}`,
      },
    ],
  },
  {
    slug: 'pagar-fatura',
    group: 'Baixas',
    title: 'Pagar fatura',
    kind: 'baixa',
    summary: 'Baixa da fatura de uma conta de crédito. A fatura não é lançada: ela é montada sozinha.',
    screen: { label: 'Faturas', href: `${FIN}/faturas`, action: 'Pagar fatura (ou na linha da fatura em Contas a pagar)' },
    model: 'Invoice (calculada)',
    body: (
      <P>
        A fatura de cada mês é a soma das parcelas que caem nela: compras, pix no crédito e parcelas de empréstimo.
        Confira os itens na tela Faturas e, no dia do pagamento, dê baixa.
      </P>
    ),
    fields: [
      { name: 'paidAt', type: 'ISODate', required: true, description: 'Dia do pagamento.' },
      { name: 'accountId', type: 'Account', required: true, description: 'Conta de onde saiu o dinheiro.' },
    ],
    effects: [
      <>A fatura vira <Code>paga</Code> e libera o limite.</>,
      <>Cria a saída em Movimentações na categoria <Code>Pagamento de fatura</Code>, que é neutra.</>,
      'Não é despesa: as compras já contaram nas datas delas, e os juros de empréstimo já contaram mês a mês.',
    ],
    examples: [
      {
        title: 'Fatura (calculada)',
        code: `{
  "accountId": "mercado-pago",
  "month": "2026-11",
  "dueDate": "2026-11-07",
  "items": [
    { "origin": "emprestimo", "number": 1, "of": 6, "amount": 310 },
    { "origin": "pix_credito", "number": 1, "of": 3, "amount": 150 }
  ],
  "total": 460
}`,
      },
      {
        title: 'Baixa e movimentação',
        code: `{ "paidAt": "2026-11-07", "accountId": "nubank" }

// gera
{ "accountId": "nubank", "direction": "saida",
  "amount": 460, "categoryId": "pagamento-fatura",
  "source": "fatura" }`,
      },
    ],
  },
  {
    slug: 'desfazer-baixa',
    group: 'Baixas',
    title: 'Desfazer baixa',
    kind: 'baixa',
    summary: 'Voltar uma conta ou fatura para em aberto quando a baixa foi feita errada.',
    screen: { label: 'Contas a pagar / a receber / Faturas', href: `${FIN}/contas-a-pagar`, action: 'Desfazer baixa' },
    fields: [],
    effects: [
      <>Apaga <Code>paidAt</Code> / <Code>receivedAt</Code> e a movimentação que a baixa criou.</>,
      'O saldo volta ao que era. A despesa ou receita continua lançada.',
      'Depois, dê a baixa de novo com os dados certos.',
    ],
    notes: [{ tone: 'info', text: 'Para corrigir valor, data ou categoria de um lançamento, edite o lançamento. Não crie outro para compensar.' }],
  },

  // ===== Guias =====
  {
    slug: 'tags',
    group: 'Guias',
    title: 'Tags',
    kind: 'guia',
    summary: 'Marcadores livres para juntar lançamentos de categorias diferentes e filtrar depois.',
    screen: { label: 'Tags', href: `${FIN}/tags` },
    model: 'FinanceTag',
    body: (
      <>
        <P>
          A <strong className="text-zinc-100">categoria</strong> diz <em>o que</em> foi o gasto e decide o resultado: cada
          lançamento tem uma só. A <strong className="text-zinc-100">tag</strong> diz <em>para que</em> ou{' '}
          <em>com quem</em>: é opcional, um lançamento pode ter várias, e ela não muda nenhum total.
        </P>
        <Rows
          head={['Lançamento', 'Categoria', 'Tags']}
          rows={[
            ['Gasolina para sair', 'Combustível', <Code key="1">encontros</Code>],
            ['Jantar no restaurante', 'Lazer', <Code key="2">encontros</Code>],
            ['Perfume de presente (2x no cartão)', 'Presentes', <><Code>encontros</Code> <Code>presentes</Code></>],
            ['Gasolina para visitar cliente', 'Combustível', <Code key="4">trabalho</Code>],
          ]}
        />
        <P>
          Em <a href={`${FIN}/tags?tag=encontros`} className="text-zinc-100 underline decoration-zinc-600 underline-offset-2">Tags → Encontros</a>{' '}
          aparecem os três primeiros, com o total, a divisão por categoria e o filtro por mês. Em Combustível (categoria)
          aparecem as duas gasolinas, com ou sem tag.
        </P>
        <H>Onde a tag aparece</H>
        <Rows
          head={['Tela', 'O que mostra']}
          rows={[
            ['Tags', 'Tudo com a tag: à vista, compras no crédito (valor total, na data da compra), contas a pagar e a receber.'],
            ['Movimentações', <>Só o que já movimentou dinheiro. Clique num chip de tag para filtrar (<Code>?tag=</Code>).</>],
          ]}
        />
        <H>Boas práticas</H>
        <P>
          Prefira poucas tags e com nome de assunto (Encontros, Viagem para a praia, Reforma do quarto). Se você quer
          que o valor mude o resultado ou apareça em &quot;gastos por categoria&quot;, isso é categoria, não tag.
        </P>
      </>
    ),
    fields: [
      { name: 'name', type: 'string', required: true, description: 'Nome que aparece no chip.' },
      { name: 'color', type: 'string', required: true, description: 'Cor do marcador.' },
      { name: 'description', type: 'string', description: 'Para que serve a tag.' },
    ],
    examples: [
      {
        title: 'Tag',
        code: `{
  "id": "encontros",
  "name": "Encontros",
  "color": "pink",
  "description": "Saídas a dois"
}`,
      },
      {
        title: 'Lançamento com tags',
        code: `{
  "description": "Perfume (presente)",
  "total": 259.80,
  "installments": 2,
  "categoryId": "presentes",
  "tagIds": ["encontros", "presentes"]
}
// no banco: tabela de ligação
// entry_tags (entry_id, tag_id)`,
      },
    ],
  },
  {
    slug: 'erros-comuns',
    group: 'Guias',
    title: 'Erros comuns',
    kind: 'guia',
    summary: 'O que dava errado no sistema antigo e o jeito certo de lançar.',
    body: (
      <Rows
        head={['Errado', 'Certo']}
        rows={[
          ['Transferência entre contas lançada como receita.', <DocLink key="1" slug="transferencia">Transferência</DocLink>],
          ['Empréstimo recebido lançado como receita.', <DocLink key="2" slug="emprestimo">Empréstimo</DocLink>],
          ['Pagamento da fatura lançado como despesa.', <DocLink key="3" slug="pagar-fatura">Pagar fatura</DocLink>],
          ['Cada parcela lançada como despesa todo mês.', <><DocLink slug="compra-no-credito">Compra no crédito</DocLink> uma vez, com o total</>],
          ['Boleto pago lançado como despesa à vista nova.', <DocLink key="5" slug="baixa-conta-a-pagar">Baixa da conta a pagar</DocLink>],
          ['Valor "de ajuste" para o saldo bater.', 'Achar e corrigir o lançamento que faltou ou está errado.'],
        ].map(([w, r]) => [<span key="w" className="text-red-300/90">✕ {w}</span>, <span key="r">✓ {r}</span>])}
      />
    ),
  },
  {
    slug: 'rotina',
    group: 'Guias',
    title: 'Rotina e conciliação',
    kind: 'guia',
    summary: 'O que fazer todo dia, toda semana e todo mês para os números baterem.',
    body: (
      <>
        <Rows
          head={['Quando', 'O que fazer']}
          rows={[
            ['Todo dia', 'Lançar gastos à vista e compras no crédito; dar baixa no que pagou ou recebeu.'],
            ['Toda semana', 'Ver os próximos vencimentos na Visão geral; lançar as contas que chegaram; conferir vencidas e atrasadas.'],
            ['Todo mês', 'Conciliar as contas; conferir a fatura antes de pagar; ver gastos por categoria e o resultado.'],
          ]}
        />
        <H>Conciliação</H>
        <P>
          Conciliar é comparar o saldo de cada conta no sistema com o saldo no app do banco. Use o filtro de conta em{' '}
          <a href={`${FIN}/movimentacoes`} className="text-zinc-100 underline decoration-zinc-600 underline-offset-2">Movimentações</a>{' '}
          para ver o extrato de uma conta só e comparar linha a linha. Se não bater, falta ou sobra algum lançamento:
          ache e corrija, sem lançar um ajuste.
        </P>
      </>
    ),
  },
]

export const docHref = (slug: string) => (slug ? `${DOCS_BASE}/${slug}` : DOCS_BASE)

export const docBySlug = (slug: string) => DOCS.find((d) => d.slug === slug)

export function docNeighbors(slug: string) {
  const i = DOCS.findIndex((d) => d.slug === slug)
  return { prev: DOCS[i - 1], next: DOCS[i + 1] }
}

// Só o que o menu lateral precisa (serializável para o componente cliente).
export const DOC_NAV = DOCS.map(({ slug, group, title, kind }) => ({ slug, group, title, kind }))
