import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DocArticle } from '../_doc-article'
import { DOCS, docBySlug } from '../_docs'

export const dynamicParams = false

export function generateStaticParams() {
  return DOCS.filter((d) => d.slug).map((d) => ({ slug: d.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const doc = docBySlug((await params).slug)
  return { title: doc ? `${doc.title} · Documentação` : 'Documentação' }
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const doc = docBySlug((await params).slug)
  if (!doc || !doc.slug) notFound()
  return <DocArticle doc={doc} />
}
