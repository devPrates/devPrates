import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/app/lib/utils'
import { type DocKind, type DocPage, docHref, docNeighbors, KIND_LABEL } from './_docs'

const KIND_STYLE: Record<DocKind, string> = {
  lancamento: 'border-emerald-900/70 bg-emerald-950/40 text-emerald-300',
  baixa: 'border-sky-900/70 bg-sky-950/40 text-sky-300',
  guia: 'border-zinc-700 bg-zinc-800/60 text-zinc-300',
}

// Realce simples de JSON com comentários `//`.
function highlight(code: string): ReactNode[] {
  return code.split('\n').map((line, i) => {
    const at = line.indexOf('//')
    const src = at >= 0 ? line.slice(0, at) : line
    const comment = at >= 0 ? line.slice(at) : ''
    const parts: ReactNode[] = []
    const re = /("(?:\\.|[^"\\])*")(\s*:)?|(-?\b\d+(?:\.\d+)?\b)|\b(true|false|null)\b/g
    let last = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(src))) {
      if (m.index > last) parts.push(src.slice(last, m.index))
      if (m[1]) {
        parts.push(
          <span key={m.index} className={m[2] ? 'text-sky-300' : 'text-amber-200'}>
            {m[1]}
          </span>,
        )
        if (m[2]) parts.push(m[2])
      } else if (m[3]) {
        parts.push(<span key={m.index} className="text-emerald-300">{m[3]}</span>)
      } else {
        parts.push(<span key={m.index} className="text-violet-300">{m[4]}</span>)
      }
      last = re.lastIndex
    }
    if (last < src.length) parts.push(src.slice(last))
    return (
      <span key={i} className="block">
        {parts}
        {comment && <span className="text-zinc-500">{comment}</span>}
        {!line && '\u00a0'}
      </span>
    )
  })
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-3 py-1.5">
        <span className="text-xs text-zinc-400">{title}</span>
        <span className="font-mono text-[10px] text-zinc-600">json</span>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[12px] leading-relaxed text-zinc-300">
        <code>{highlight(code)}</code>
      </pre>
    </div>
  )
}

function Note({ tone, children }: { tone: 'info' | 'warning'; children: ReactNode }) {
  return (
    <div
      className={cn(
        'rounded-lg border-l-2 px-3 py-2 text-[13px] leading-relaxed',
        tone === 'info' ? 'border-sky-500 bg-sky-950/20 text-sky-100/90' : 'border-amber-500 bg-amber-950/20 text-amber-100/90',
      )}
    >
      {children}
    </div>
  )
}

const H2 = ({ children }: { children: ReactNode }) => (
  <h2 className="border-b border-zinc-800 pb-2 text-sm font-semibold text-zinc-100">{children}</h2>
)

export function DocArticle({ doc }: { doc: DocPage }) {
  const { prev, next } = docNeighbors(doc.slug)
  const hasExamples = !!doc.examples?.length

  return (
    <article className={cn('grid gap-8', hasExamples && 'xl:grid-cols-[minmax(0,1fr)_380px]')}>
      <div className="grid min-w-0 content-start gap-6">
        <header className="grid gap-2">
          <p className="text-xs text-zinc-500">
            Financeiro / Documentação / <span className="text-zinc-400">{doc.group}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={cn('rounded border px-1.5 py-0.5 font-mono text-[11px] font-semibold', KIND_STYLE[doc.kind])}>
              {KIND_LABEL[doc.kind]}
            </span>
            <h1 className="text-2xl font-semibold tracking-tight">{doc.title}</h1>
          </div>
          <p className="max-w-2xl text-sm text-zinc-400">{doc.summary}</p>
        </header>

        {(doc.screen || doc.model) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 font-mono text-[12px]">
            {doc.screen && (
              <Link href={doc.screen.href} className="group flex items-center gap-2 text-zinc-300 hover:text-zinc-100">
                <span className="text-zinc-500">tela</span>
                <span>
                  {doc.screen.label}
                  {doc.screen.action && <span className="text-zinc-500"> → </span>}
                  {doc.screen.action}
                </span>
                <ExternalLink className="size-3 text-zinc-600 group-hover:text-zinc-400" />
              </Link>
            )}
            {doc.model && (
              <span className="flex items-center gap-2">
                <span className="text-zinc-500">modelo</span>
                <span className="text-sky-300">{doc.model}</span>
              </span>
            )}
          </div>
        )}

        {doc.body && <div className="grid gap-3">{doc.body}</div>}

        {!!doc.fields?.length && (
          <section className="grid gap-3">
            <H2>Campos</H2>
            <dl className="divide-y divide-zinc-800/70">
              {doc.fields.map((f) => (
                <div key={f.name} className="grid gap-1 py-3">
                  <dt className="flex flex-wrap items-baseline gap-2 font-mono text-[13px]">
                    <span className="font-semibold text-zinc-100">{f.name}</span>
                    <span className="text-xs text-zinc-500">{f.type}</span>
                    {f.required ? (
                      <span className="text-[11px] text-amber-300">obrigatório</span>
                    ) : (
                      <span className="text-[11px] text-zinc-600">opcional</span>
                    )}
                  </dt>
                  <dd className="text-[13px] text-zinc-400">{f.description}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {!!doc.effects?.length && (
          <section className="grid gap-3">
            <H2>Efeitos</H2>
            <ul className="grid list-disc gap-1.5 pl-5 text-[13px] leading-relaxed text-zinc-300 marker:text-zinc-600">
              {doc.effects.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </section>
        )}

        {!!doc.notes?.length && (
          <div className="grid gap-2">
            {doc.notes.map((n, i) => (
              <Note key={i} tone={n.tone}>
                {n.text}
              </Note>
            ))}
          </div>
        )}

        <nav className="mt-4 grid gap-3 border-t border-zinc-800 pt-5 sm:grid-cols-2" aria-label="Paginação">
          {prev ? (
            <Link href={docHref(prev.slug)} className="group rounded-lg border border-zinc-800 p-3 hover:border-zinc-700">
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <ArrowLeft className="size-3" /> Anterior
              </span>
              <span className="mt-0.5 block text-sm text-zinc-200 group-hover:text-zinc-100">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={docHref(next.slug)} className="group rounded-lg border border-zinc-800 p-3 text-right hover:border-zinc-700">
              <span className="flex items-center justify-end gap-1 text-xs text-zinc-500">
                Próximo <ArrowRight className="size-3" />
              </span>
              <span className="mt-0.5 block text-sm text-zinc-200 group-hover:text-zinc-100">{next.title}</span>
            </Link>
          )}
        </nav>
      </div>

      {hasExamples && (
        <aside className="grid content-start gap-3 xl:sticky xl:top-20 xl:self-start">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Exemplo</p>
          {doc.examples!.map((ex) => (
            <CodeBlock key={ex.title} title={ex.title} code={ex.code} />
          ))}
        </aside>
      )}
    </article>
  )
}
