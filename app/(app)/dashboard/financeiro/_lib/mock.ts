// DADOS DE EXEMPLO do financeiro (só frontend, ainda sem banco). As datas são
// relativas ao mês atual para o exemplo nunca ficar velho. Quando o backend
// existir, este arquivo sai e as mesmas listas vêm do Postgres.
import type {
  Account,
  CashEntry,
  Category,
  CreditPurchase,
  FinanceTag,
  ISODate,
  Loan,
  Payable,
  Receivable,
  Transfer,
} from './types'

// Dia `day` do mês atual + `offset` meses, em ISO.
export function monthDay(offset: number, day: number, base = new Date()): ISODate {
  const d = new Date(base.getFullYear(), base.getMonth() + offset, 1)
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  const dd = Math.min(day, last)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
}

const m = monthDay
const today = new Date().getDate()
// Pago só se o vencimento já passou (dia do mês atual).
const paidIfPast = (day: number) => (day <= today ? m(0, day) : undefined)

export const ACCOUNTS: Account[] = [
  { id: 'nubank', name: 'Nubank', institution: 'Nubank', kind: 'corrente', openingBalance: 2350 },
  { id: 'bb', name: 'Banco do Brasil', institution: 'Banco do Brasil', kind: 'corrente', openingBalance: 480 },
  { id: 'carteira', name: 'Carteira', institution: 'Dinheiro', kind: 'carteira', openingBalance: 120 },
  { id: 'cartao-nubank', name: 'Cartão Nubank', institution: 'Nubank', kind: 'credito', limit: 3500, closingDay: 8, dueDay: 15 },
  { id: 'mercado-pago', name: 'Mercado Pago', institution: 'Mercado Pago', kind: 'credito', limit: 2800, closingDay: 28, dueDay: 7 },
  { id: 'shopee', name: 'Shopee', institution: 'SPayLater', kind: 'credito', limit: 1500, closingDay: 1, dueDay: 10 },
]

export const CATEGORIES: Category[] = [
  // Despesas
  { id: 'moradia', name: 'Moradia', kind: 'despesa', color: 'bg-sky-400' },
  { id: 'mercado', name: 'Mercado', kind: 'despesa', color: 'bg-emerald-400' },
  { id: 'combustivel', name: 'Combustível', kind: 'despesa', color: 'bg-yellow-400' },
  { id: 'transporte', name: 'Transporte', kind: 'despesa', color: 'bg-amber-400' },
  { id: 'assinaturas', name: 'Assinaturas', kind: 'despesa', color: 'bg-violet-400' },
  { id: 'casa', name: 'Casa', kind: 'despesa', color: 'bg-teal-400' },
  { id: 'eletronicos', name: 'Eletrônicos', kind: 'despesa', color: 'bg-indigo-400' },
  { id: 'vestuario', name: 'Vestuário', kind: 'despesa', color: 'bg-pink-400' },
  { id: 'saude', name: 'Saúde', kind: 'despesa', color: 'bg-rose-400' },
  { id: 'lazer', name: 'Lazer', kind: 'despesa', color: 'bg-orange-400' },
  { id: 'presentes', name: 'Presentes', kind: 'despesa', color: 'bg-fuchsia-400' },
  { id: 'impostos', name: 'Impostos e taxas', kind: 'despesa', color: 'bg-stone-400' },
  { id: 'juros', name: 'Juros e tarifas', kind: 'despesa', color: 'bg-red-400' },
  // Receitas
  { id: 'projetos', name: 'Projetos', kind: 'receita', color: 'bg-lime-400' },
  { id: 'manutencao', name: 'Manutenção mensal', kind: 'receita', color: 'bg-green-400' },
  { id: 'outras-receitas', name: 'Outras receitas', kind: 'receita', color: 'bg-cyan-400' },
  // Fora do resultado
  { id: 'emprestimo-recebido', name: 'Empréstimo recebido', kind: 'neutra', color: 'bg-zinc-400' },
  { id: 'pagamento-fatura', name: 'Pagamento de fatura', kind: 'neutra', color: 'bg-zinc-500' },
  { id: 'transferencia', name: 'Transferência entre contas', kind: 'neutra', color: 'bg-zinc-600' },
]

export const TAGS: FinanceTag[] = [
  { id: 'encontros', name: 'Encontros', color: 'bg-pink-400', description: 'Saídas a dois: gasolina, jantar, cinema, presentes.' },
  { id: 'trabalho', name: 'Trabalho', color: 'bg-sky-400', description: 'Gastos para atender clientes (deslocamento, visitas).' },
  { id: 'presentes', name: 'Presentes', color: 'bg-fuchsia-400' },
]

export const LOANS: Loan[] = [
  {
    id: 'emp-mp',
    description: 'Dinheiro extra Mercado Pago',
    creditAccountId: 'mercado-pago',
    depositAccountId: 'nubank',
    receivedAt: m(-1, 20),
    principal: 1500,
    installments: 6,
    installmentAmount: 310,
  },
  {
    id: 'emp-shopee',
    description: 'Empréstimo Shopee',
    creditAccountId: 'shopee',
    depositAccountId: 'nubank',
    receivedAt: m(-2, 8),
    principal: 600,
    installments: 4,
    installmentAmount: 172,
  },
]

export const PURCHASES: CreditPurchase[] = [
  { id: 'c-fone', description: 'Fone Bluetooth', kind: 'compra', creditAccountId: 'shopee', categoryId: 'eletronicos', date: m(-1, 3), total: 189.9, installments: 3 },
  { id: 'c-organizadores', description: 'Organizadores de gaveta', kind: 'compra', creditAccountId: 'shopee', categoryId: 'casa', date: m(0, 2), total: 96, installments: 2 },
  { id: 'c-eletricista', description: 'Pix no crédito: eletricista', kind: 'pix_credito', creditAccountId: 'mercado-pago', categoryId: 'casa', date: m(-1, 26), total: 450, installments: 3 },
  { id: 'c-tenis', description: 'Tênis de corrida', kind: 'compra', creditAccountId: 'cartao-nubank', categoryId: 'vestuario', date: m(-2, 15), total: 399.6, installments: 4 },
  { id: 'c-mercado', description: 'Compra do mês no mercado', kind: 'compra', creditAccountId: 'cartao-nubank', categoryId: 'mercado', date: m(-1, 12), total: 312.45, installments: 1 },
  { id: 'c-perfume', description: 'Perfume (presente)', kind: 'compra', creditAccountId: 'cartao-nubank', categoryId: 'presentes', date: m(0, 1), total: 259.8, installments: 2, tagIds: ['encontros', 'presentes'] },
  { id: 'c-streaming', description: 'Streaming anual', kind: 'compra', creditAccountId: 'cartao-nubank', categoryId: 'assinaturas', date: m(-1, 5), total: 238.8, installments: 12 },
]

export const PAYABLES: Payable[] = [
  // Mês passado: tudo pago
  { id: 'p-aluguel-1', description: 'Aluguel', categoryId: 'moradia', amount: 1200, dueDate: m(-1, 10), paidAt: m(-1, 9), accountId: 'nubank', supplier: 'Imobiliária' },
  { id: 'p-internet-1', description: 'Internet fibra', categoryId: 'assinaturas', amount: 99.9, dueDate: m(-1, 15), paidAt: m(-1, 15), accountId: 'nubank', supplier: 'Provedor' },
  { id: 'p-luz-1', description: 'Energia elétrica', categoryId: 'moradia', amount: 184.37, dueDate: m(-1, 20), paidAt: m(-1, 19), accountId: 'nubank', supplier: 'Energisa' },
  // Mês atual
  { id: 'p-aluguel-0', description: 'Aluguel', categoryId: 'moradia', amount: 1200, dueDate: m(0, 10), paidAt: paidIfPast(10), accountId: 'nubank', supplier: 'Imobiliária' },
  { id: 'p-ipva', description: 'IPVA – parcela 3/3', categoryId: 'impostos', amount: 287.4, dueDate: m(0, 8), supplier: 'Detran' },
  { id: 'p-internet-0', description: 'Internet fibra', categoryId: 'assinaturas', amount: 99.9, dueDate: m(0, 15), paidAt: paidIfPast(15), accountId: 'nubank', supplier: 'Provedor' },
  { id: 'p-luz-0', description: 'Energia elétrica', categoryId: 'moradia', amount: 171.2, dueDate: m(0, 20), paidAt: paidIfPast(20), accountId: 'nubank', supplier: 'Energisa' },
  { id: 'p-academia-0', description: 'Academia', categoryId: 'saude', amount: 89.9, dueDate: m(0, 25), paidAt: paidIfPast(25), accountId: 'nubank', supplier: 'Academia' },
  // Próximo mês
  { id: 'p-aluguel+1', description: 'Aluguel', categoryId: 'moradia', amount: 1200, dueDate: m(1, 10), supplier: 'Imobiliária' },
  { id: 'p-internet+1', description: 'Internet fibra', categoryId: 'assinaturas', amount: 99.9, dueDate: m(1, 15), supplier: 'Provedor' },
]

export const RECEIVABLES: Receivable[] = [
  { id: 'r-manut-1', description: 'Manutenção do sistema – Puro Queijo', categoryId: 'manutencao', amount: 600, dueDate: m(-1, 10), receivedAt: m(-1, 10), accountId: 'nubank', customer: 'Puro Queijo' },
  { id: 'r-agro-1', description: 'Projeto Agroclima – parcela 1/3', categoryId: 'projetos', amount: 1800, dueDate: m(-1, 18), receivedAt: m(-1, 19), accountId: 'nubank', customer: 'Agroclima' },
  { id: 'r-landing', description: 'Landing page – entrega final', categoryId: 'projetos', amount: 750, dueDate: m(0, 1), customer: 'Cliente da landing' },
  { id: 'r-manut-0', description: 'Manutenção do sistema – Puro Queijo', categoryId: 'manutencao', amount: 600, dueDate: m(0, 10), receivedAt: paidIfPast(10), accountId: 'nubank', customer: 'Puro Queijo' },
  { id: 'r-agro-2', description: 'Projeto Agroclima – parcela 2/3', categoryId: 'projetos', amount: 1800, dueDate: m(0, 18), receivedAt: paidIfPast(18), accountId: 'nubank', customer: 'Agroclima' },
  { id: 'r-agro-3', description: 'Projeto Agroclima – parcela 3/3', categoryId: 'projetos', amount: 1800, dueDate: m(1, 18), customer: 'Agroclima' },
  { id: 'r-manut+1', description: 'Manutenção do sistema – Puro Queijo', categoryId: 'manutencao', amount: 600, dueDate: m(1, 10), customer: 'Puro Queijo' },
]

// Despesas e receitas à vista (pix, débito, dinheiro), já resolvidas.
export const CASH_ENTRIES: CashEntry[] = [
  { id: 'v-mercado-1', date: m(-1, 6), description: 'Mercado do bairro (pix)', categoryId: 'mercado', accountId: 'nubank', amount: 143.7, direction: 'saida' },
  { id: 'v-gasolina-1', date: m(-1, 14), description: 'Gasolina (débito)', categoryId: 'combustivel', accountId: 'nubank', amount: 150, direction: 'saida' },
  { id: 'v-gasolina-enc-1', date: m(-1, 17), description: 'Gasolina para sair', categoryId: 'combustivel', accountId: 'nubank', amount: 80, direction: 'saida', tagIds: ['encontros'] },
  { id: 'v-jantar-1', date: m(-1, 17), description: 'Jantar no restaurante', categoryId: 'lazer', accountId: 'nubank', amount: 142, direction: 'saida', tagIds: ['encontros'] },
  { id: 'v-uber-cliente-1', date: m(-1, 24), description: 'Uber até o cliente', categoryId: 'transporte', accountId: 'nubank', amount: 27.9, direction: 'saida', tagIds: ['trabalho'] },
  { id: 'v-farmacia-1', date: m(-1, 22), description: 'Farmácia', categoryId: 'saude', amount: 58.4, accountId: 'nubank', direction: 'saida' },
  { id: 'v-mercado-0', date: m(0, Math.min(3, today)), description: 'Mercado do bairro (pix)', categoryId: 'mercado', accountId: 'nubank', amount: 96.35, direction: 'saida' },
  { id: 'v-cinema-0', date: m(0, Math.min(4, today)), description: 'Cinema', categoryId: 'lazer', accountId: 'nubank', amount: 64, direction: 'saida', tagIds: ['encontros'] },
  { id: 'v-gasolina-0', date: m(0, Math.min(5, today)), description: 'Gasolina (débito)', categoryId: 'combustivel', accountId: 'nubank', amount: 160, direction: 'saida', tagIds: ['trabalho'] },
  { id: 'v-gasolina-enc-0', date: m(0, Math.min(8, today)), description: 'Gasolina para sair', categoryId: 'combustivel', accountId: 'nubank', amount: 70, direction: 'saida', tagIds: ['encontros'] },
  { id: 'v-lanche-0', date: m(0, Math.min(7, today)), description: 'Lanche', categoryId: 'lazer', accountId: 'carteira', amount: 32, direction: 'saida' },
  { id: 'v-venda-0', date: m(0, Math.min(9, today)), description: 'Venda de monitor usado', categoryId: 'outras-receitas', accountId: 'nubank', amount: 350, direction: 'entrada' },
]

// Transferências entre contas próprias. Cada uma vira duas movimentações.
export const TRANSFERS: Transfer[] = [
  { id: 't-saque-1', date: m(-1, 4), fromAccountId: 'nubank', toAccountId: 'carteira', amount: 200, description: 'Saque no caixa eletrônico' },
  { id: 't-deposito-1', date: m(-1, 21), fromAccountId: 'carteira', toAccountId: 'bb', amount: 150, description: 'Depósito do dinheiro da semana' },
  { id: 't-pix-0', date: m(0, Math.min(2, today)), fromAccountId: 'nubank', toAccountId: 'bb', amount: 500, description: 'Pix para a conta do BB' },
  { id: 't-saque-0', date: m(0, Math.min(6, today)), fromAccountId: 'bb', toAccountId: 'carteira', amount: 100, description: 'Saque' },
]
