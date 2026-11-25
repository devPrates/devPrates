// Só roda no servidor. Carrega o financeiro do banco, já com a checagem de
// acesso. cache() evita repetir as consultas na mesma requisição.
import { cache } from 'react'
import { requireUser } from '@/app/lib/auth/require-user'
import { getDb } from '@/app/lib/db'
import { createLedger } from './finance'
import { loadFinance } from './load'

export const getLedger = cache(async () => {
  await requireUser()
  return createLedger(await loadFinance(getDb()))
})
