'use server'

// Server Actions do financeiro. Cada uma confere o acesso (o layout não
// protege actions), valida a entrada e grava numa transação.
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { currentUser } from '@/app/lib/auth/require-user'
import { getDb, type Tx } from '@/app/lib/db'
import * as repo from '../_lib/repo'
import * as schemas from '../_lib/schemas'

export type ActionResult = { ok: true } | { ok: false; error: string }

// Erros do banco que fazem sentido para quem usa. O resto vira mensagem
// genérica e vai para o log.
function messageOf(error: unknown): string {
  if (error instanceof repo.FinanceError) return error.message
  const cause = (error as { cause?: { code?: string } })?.cause
  const code = cause?.code ?? (error as { code?: string })?.code
  // 23503 no Postgres até a 17; a 18 separa a regra RESTRICT em 23001.
  if (code === '23503' || code === '23001') return 'Está em uso em algum lançamento. Arquive em vez de excluir.'
  if (code === '23505') return 'Já existe um registro igual.'
  console.error('[financeiro]', error)
  return 'Não foi possível salvar. Tente de novo.'
}

async function run<S extends z.ZodType>(
  schema: S,
  input: unknown,
  work: (tx: Tx, data: z.output<S>) => Promise<unknown>,
): Promise<ActionResult> {
  try {
    if (!(await currentUser())) return { ok: false, error: 'Sua sessão expirou. Entre de novo.' }
    const parsed = schema.safeParse(input)
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Confira os campos.' }
    await getDb().transaction((tx) => work(tx, parsed.data))
  } catch (error) {
    return { ok: false, error: messageOf(error) }
  }
  revalidatePath('/dashboard/financeiro', 'layout')
  return { ok: true }
}

const withId = <S extends z.ZodType>(data: S) => z.object({ id: schemas.idSchema.optional(), data })
const billKind = z.enum(['pagar', 'receber'])

export async function saveAccount(data: unknown, id?: string) {
  return run(withId(schemas.accountSchema), { id, data }, (tx, v) => repo.saveAccount(tx, v.data, v.id))
}

export async function saveCategory(data: unknown, id?: string) {
  return run(withId(schemas.categorySchema), { id, data }, (tx, v) => repo.saveCategory(tx, v.data, v.id))
}

export async function saveTag(data: unknown, id?: string) {
  return run(withId(schemas.tagSchema), { id, data }, (tx, v) => repo.saveTag(tx, v.data, v.id))
}

export async function saveCash(data: unknown, id?: string) {
  return run(withId(schemas.cashSchema), { id, data }, (tx, v) => repo.saveCash(tx, v.data, v.id))
}

export async function saveTransfer(data: unknown, id?: string) {
  return run(withId(schemas.transferSchema), { id, data }, (tx, v) => repo.saveTransfer(tx, v.data, v.id))
}

export async function saveBill(kind: unknown, data: unknown, id?: string) {
  const schema = z.object({ kind: billKind, id: schemas.idSchema.optional(), data: schemas.billSchema })
  return run(schema, { kind, id, data }, (tx, v) => repo.saveBill(tx, v.kind, v.data, v.id))
}

export async function savePurchase(data: unknown, id?: string) {
  return run(withId(schemas.purchaseSchema), { id, data }, (tx, v) => repo.savePurchase(tx, v.data, v.id))
}

export async function saveLoan(data: unknown, id?: string) {
  return run(withId(schemas.loanSchema), { id, data }, (tx, v) => repo.saveLoan(tx, v.data, v.id))
}

export async function settleBill(kind: unknown, id: unknown, data: unknown) {
  const schema = z.object({ kind: billKind, id: schemas.idSchema, data: schemas.settleSchema })
  return run(schema, { kind, id, data }, (tx, v) => repo.settleBill(tx, v.kind, v.id, v.data))
}

export async function payInvoice(data: unknown) {
  return run(schemas.payInvoiceSchema, data, (tx, v) => repo.payInvoice(tx, v))
}

// Ações sem formulário, do menu de cada linha.
const rowSchema = z.object({
  kind: z.enum(['conta', 'categoria', 'tag', 'avista', 'transferencia', 'pagar', 'receber', 'compra', 'emprestimo', 'fatura']),
  op: z.enum(['excluir', 'arquivar', 'reativar', 'desfazer']),
  id: schemas.idSchema,
})

export async function runRowAction(input: unknown) {
  return run(rowSchema, input, (tx, { kind, op, id }) => {
    switch (`${kind}:${op}`) {
      case 'conta:excluir':
        return repo.deleteAccount(tx, id)
      case 'conta:arquivar':
      case 'conta:reativar':
        return repo.archiveAccount(tx, id, op === 'arquivar')
      case 'categoria:excluir':
        return repo.deleteCategory(tx, id)
      case 'categoria:arquivar':
      case 'categoria:reativar':
        return repo.archiveCategory(tx, id, op === 'arquivar')
      case 'tag:excluir':
        return repo.deleteTag(tx, id)
      case 'tag:arquivar':
      case 'tag:reativar':
        return repo.archiveTag(tx, id, op === 'arquivar')
      case 'avista:excluir':
        return repo.deleteCash(tx, id)
      case 'transferencia:excluir':
        return repo.deleteTransfer(tx, id)
      case 'pagar:excluir':
        return repo.deleteBill(tx, 'pagar', id)
      case 'receber:excluir':
        return repo.deleteBill(tx, 'receber', id)
      case 'pagar:desfazer':
        return repo.undoSettle(tx, 'pagar', id)
      case 'receber:desfazer':
        return repo.undoSettle(tx, 'receber', id)
      case 'compra:excluir':
        return repo.deletePurchase(tx, id)
      case 'emprestimo:excluir':
        return repo.deleteLoan(tx, id)
      case 'fatura:desfazer':
        return repo.undoInvoicePayment(tx, id)
      default:
        throw new repo.FinanceError('Ação inválida.')
    }
  })
}
