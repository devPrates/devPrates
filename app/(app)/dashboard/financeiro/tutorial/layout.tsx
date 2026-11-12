import type { ReactNode } from 'react'
import { DocNav } from './_doc-nav'
import { DOC_NAV, DOCS_BASE } from './_docs'

// Documentação do Financeiro: menu próprio à esquerda, uma página por assunto.
export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
      <DocNav entries={DOC_NAV} base={DOCS_BASE} />
      <div className="min-w-0">{children}</div>
    </div>
  )
}
