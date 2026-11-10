import { homeContent } from '../../_content/home-content'
import { Wordmark } from '../brand/wordmark'
import { DashLine } from '../motion/dash-line'
import { FlipText } from '../motion/flip-text'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="frame relative z-10 pb-6 pt-24">
      <Wordmark className="w-full text-cream" />
      <DashLine className="mt-8" />
      <div className="label mt-5 flex flex-wrap items-center justify-between gap-4 text-driftwood">
        <span>© {year} Gabriel Prates Bitencourt</span>
        <ul className="flex gap-6 text-cream">
          {homeContent.contact.socials.map((social) => (
            <li key={social.href}>
              <a
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex"
              >
                <FlipText>{social.label}</FlipText>
              </a>
            </li>
          ))}
          <li>
            <a href="/curriculo" className="group inline-flex">
              <FlipText>Currículo</FlipText>
            </a>
          </li>
        </ul>
        <span>Naviraí — MS, Brasil</span>
      </div>
    </footer>
  )
}
