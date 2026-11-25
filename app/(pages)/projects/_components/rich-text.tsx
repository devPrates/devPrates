import { RichText as CMSRichText } from '@graphcms/rich-text-react-renderer'
import type { RichTextContent } from '@graphcms/rich-text-types'

// Rich text do Hygraph no tema Prates.
export function RichText({ content }: { content: RichTextContent }) {
  return (
    <div className="flex flex-col gap-5 text-base leading-relaxed text-cream/70 md:text-lg">
      <CMSRichText
        content={content}
        renderers={{
          bold: ({ children }) => (
            <strong className="font-medium text-cream">{children}</strong>
          ),
          ul: ({ children }) => (
            <ul className="flex list-none flex-col gap-2 [&>li]:relative [&>li]:pl-6 [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:text-gold-bright [&>li]:before:content-['—']">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="flex list-inside list-decimal flex-col gap-2 marker:text-gold-bright">
              {children}
            </ol>
          ),
          h2: ({ children }) => (
            <h2 className="mt-6 text-heading-sm font-medium uppercase text-cream">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-4 text-sub font-medium uppercase text-cream">
              {children}
            </h3>
          ),
          a: ({ children, href, openInNewTab }) => (
            <a
              href={href}
              target={openInNewTab ? '_blank' : undefined}
              rel={openInNewTab ? 'noreferrer' : undefined}
              className="text-cream underline decoration-gold-bright decoration-dashed underline-offset-4 transition-colors hover:text-gold-bright"
            >
              {children}
            </a>
          ),
        }}
      />
    </div>
  )
}
