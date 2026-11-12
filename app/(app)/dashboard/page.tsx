import { redirect } from 'next/navigation'
import { DEFAULT_MODULE } from '../_components/dashboard/nav-config'

// A dashboard abre no primeiro módulo (Portfólio).
export default function DashboardPage() {
  redirect(DEFAULT_MODULE.href)
}
