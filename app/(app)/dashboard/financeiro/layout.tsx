import type { ReactNode } from 'react'
import { FinanceFormsProvider } from './_forms/launchers'
import { formOptions } from './_lib/finance'

// Layout do módulo Financeiro: disponibiliza os formulários de lançamento e
// baixa para todas as telas.
export default function FinanceLayout({ children }: { children: ReactNode }) {
  return <FinanceFormsProvider options={formOptions()}>{children}</FinanceFormsProvider>
}
