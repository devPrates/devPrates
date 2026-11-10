import { HiArrowNarrowLeft } from 'react-icons/hi'
import { Link } from '../components/link'
import { baseOpenGraph } from '../lib/site'
import type { Metadata } from 'next'

const description =
  'Currículo de Gabriel Prates Bitencourt: objetivo profissional, experiências, formação e competências.'

export const metadata: Metadata = {
  title: 'Currículo',
  description,
  alternates: { canonical: '/curriculo' },
  openGraph: {
    ...baseOpenGraph,
    type: 'profile',
    title: 'Currículo | Gabriel Prates',
    description,
    url: '/curriculo',
  },
}

export default async function Curriculo() {
  return (
    <>
      <section className="w-full bg-hero-image flex flex-col pb-10 sm:pb-32 ">
        <div className="container mt-32">
          <Link href="/" className="inline-flex text-sm mb-2">
            <HiArrowNarrowLeft />
            Voltar para a Home
          </Link>
          <div className="bg-white text-black px-16 py-20">
            <h1 className="text-4xl font-semibold">
              Gabriel Prates Bitencourt
            </h1>
            <div className="flex flex-wrap gap-2 text-sm mt-2">
              <p>Jardim Progresso, Naviraí – MS</p>
              <span>|</span>
              <p>(67) 99177-6488</p>
              <span>|</span>
              <a href="mailto:devprates@gmail.com" className="underline">
                devprates@gmail.com
              </a>
              <span>|</span>
              <a
                href="https://www.linkedin.com/in/devprates"
                className="underline"
                target="_blank"
                rel="noreferrer"
              >
                linkedin.com/in/devprates
              </a>
              <span>|</span>
              <a
                href="https://devprates.vercel.app"
                className="underline"
                target="_blank"
                rel="noreferrer"
              >
                devprates.vercel.app
              </a>
            </div>

            <h1 className="text-2xl mt-10 font-semibold">
              Objetivo Profissional
            </h1>
            <p className="mt-1 text-justify">
              Atuar como <strong>Programador e Analista de Dados</strong>,
              aplicando conhecimento técnico em desenvolvimento e análise para
              otimizar processos internos e apoiar decisões estratégicas. Busco
              contribuir com soluções inovadoras integrando tecnologia, dados e
              eficiência operacional.
            </p>

            <h1 className="text-2xl mt-10 font-semibold mb-3">Experiência</h1>
            <div>
              <span className="text-sm text-gray-600">jun 2025 – ago 2025</span>
              <h3 className="font-semibold">
                Analista de Redes e Telecom | Vouu Telecom
              </h3>
              <p className="mt-2">
                Responsável pela administração e manutenção da infraestrutura de
                redes, garantindo segurança e estabilidade da comunicação
                interna e externa.
              </p>
              <p className="text-sm font-semibold mt-2">
                Principais atividades:
              </p>
              <ul className="list-disc list-inside">
                <li className="ml-4">
                  Atendimento e suporte técnico aos usuários.
                </li>
                <li className="ml-4">
                  Instalação, configuração e monitoramento de equipamentos de
                  rede.
                </li>
                <li className="ml-4">
                  Resolução de falhas e implementação de melhorias de
                  performance e segurança.
                </li>
                <li className="ml-4">
                  Apoio em sistemas de telefonia digital (VoIP).
                </li>
                <li className="ml-4">
                  Participação em projetos de expansão da infraestrutura de
                  comunicação.
                </li>
              </ul>
            </div>

            <div className="mt-5">
              <span className="text-sm text-gray-600">fev 2023 – dez 2024</span>
              <h3 className="font-semibold">
                Suporte aos Sites | Prefeitura de Naviraí
              </h3>
              <p className="mt-2">
                Atuação no suporte e manutenção de sites institucionais
                desenvolvidos em <strong>PHP</strong> e
                <strong> WordPress</strong>, com foco em desempenho e segurança.
              </p>
              <p className="text-sm font-semibold mt-2">
                Principais atividades:
              </p>
              <ul className="list-disc list-inside">
                <li className="ml-4">
                  Diagnóstico e resolução de falhas técnicas e de código.
                </li>
                <li className="ml-4">
                  Atualização de sistemas e implementação de melhorias.
                </li>
                <li className="ml-4">
                  Colaboração com a equipe de desenvolvimento na criação de
                  novos recursos.
                </li>
                <li className="ml-4">
                  Gerenciamento de backups e recuperação de dados.
                </li>
              </ul>
            </div>

            <div className="mt-5">
              <span className="text-sm text-gray-600">mar 2020 – jan 2021</span>
              <h3 className="font-semibold">
                Assistente de TI | Exército Brasileiro
              </h3>
              <p className="mt-2">
                Responsável pela manutenção de computadores e desenvolvimento de
                interfaces web com
                <strong> HTML</strong>, <strong>CSS</strong> e{' '}
                <strong>JavaScript</strong>.
              </p>
              <p className="text-sm font-semibold mt-2">
                Principais atividades:
              </p>
              <ul className="list-disc list-inside">
                <li className="ml-4">
                  Manutenção preventiva e corretiva de equipamentos.
                </li>
                <li className="ml-4">
                  Desenvolvimento e atualização de interfaces do sistema de
                  controle de frotas.
                </li>
                <li className="ml-4">
                  Treinamento de usuários no uso do sistema interno.
                </li>
              </ul>
            </div>

            <h1 className="text-2xl mt-10 font-semibold">Formação</h1>
            <ul className="list-disc list-inside">
              <li className="ml-4">
                <strong>Análise e Desenvolvimento de Sistemas</strong> -
                Instituto Federal de Ciência e Tecnologia do Mato Grosso do Sul
                (IFMS) – Naviraí | <em>Cursando</em>.
              </li>
            </ul>

            <h1 className="text-2xl mt-10 font-semibold">
              Formações Complementares
            </h1>
            <ul className="list-disc list-inside">
              <li className="ml-4">
                <strong>Next.js</strong> – jan 2025
              </li>
              <li className="ml-4">
                <strong>APIs com Express</strong> – jan 2025
              </li>
              <li className="ml-4">
                <strong>Modelagem de Dados</strong> – jan 2025
              </li>
              <li className="ml-4">
                <strong>PostgreSQL</strong> – jan 2025
              </li>
              <li className="ml-4">
                <strong>MongoDB</strong> – dez 2024
              </li>
              <li className="ml-4">
                <strong>DevOps: Fundamentos</strong> – dez 2024
              </li>
              <li className="ml-4">
                <strong>TypeScript</strong> – out 2024
              </li>
            </ul>

            <h1 className="text-2xl mt-10 font-semibold">
              Principais Competências
            </h1>
            <ul className="list-disc list-inside">
              <li className="ml-4">
                Desenvolvimento Web (Next.js, TypeScript, Node.js, Express,
                WordPress)
              </li>
              <li className="ml-4">
                Modelagem e Análise de Dados (SQL, PostgreSQL, MongoDB)
              </li>
              <li className="ml-4">Automação de Processos</li>
              <li className="ml-4">
                Lógica de Programação e Estrutura de Dados
              </li>
              <li className="ml-4">
                Suporte Técnico e Infraestrutura de Redes
              </li>
              <li className="ml-4">Trabalho em equipe e comunicação eficaz</li>
            </ul>

            <h1 className="text-2xl mt-10 font-semibold">
              Resumo Profissional
            </h1>
            <p className="mt-1 text-justify">
              Profissional com perfil analítico e visão sistêmica, capaz de unir{' '}
              <strong>programação e análise de dados</strong>
              para gerar insights e soluções eficazes. Forte interesse em
              aplicar tecnologia para otimizar rotinas, reduzir erros e apoiar
              decisões baseadas em dados.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
