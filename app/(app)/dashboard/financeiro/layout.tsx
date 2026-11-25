import type { ReactNode } from 'react'
import { FinanceFormsProvider } from './_forms/launchers'
import { getLedger } from './_lib/data'

// Layout do módulo Financeiro: disponibiliza os formulários de lançamento,
// baixa e cadastro para todas as telas.
export default async function FinanceLayout({ children }: { children: ReactNode }) {
  const { accounts, categories, tags } = (await getLedger()).data
  return <FinanceFormsProvider options={{ accounts, categories, tags }}>{children}</FinanceFormsProvider>
}
