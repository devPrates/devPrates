import type { Metadata } from 'next'
import { DocArticle } from './_doc-article'
import { docBySlug } from './_docs'

export const metadata: Metadata = { title: 'Documentação do Financeiro' }

export default function DocsIndexPage() {
  return <DocArticle doc={docBySlug('')!} />
}
