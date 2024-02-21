import { HiArrowNarrowLeft } from 'react-icons/hi'
import { Link } from '../components/link'

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
              <p>(67)99177-6488</p>
              <span>|</span>
              <a href="#" className="underline">
                devprates@gmail.com
              </a>
              <span>|</span>
              <p>Jardim Progresso, Naviraí - MS</p>
              <span>|</span>
              <a
                href="www.linkedin.com/in/devprates"
                className="underline"
                target="_blank"
              >
                www.linkedin.com/in/devprates
              </a>
            </div>

            <h1 className="text-2xl mt-10 font-semibold">Objetivo</h1>
            <p className="mt-1 text-justify">
              Sou um profissional altamente motivado e dedicado, com uma paixão
              por resolver problemas complexos e alcançar resultados
              excepcionais. Com uma sólida formação acadêmica em Análise e
              Desenvolvimento de Sistemas e com experiência prática em
              atividades administrativas. Minha trajetória profissional me
              permitiu desenvolver habilidades, como resolução de problemas,
              liderança, comunicação e trabalho em equipe. Além disso, possuo
              uma mentalidade proativa e estou sempre buscando oportunidades de
              aprendizado e crescimento. Sou adaptável a novos ambientes e
              rápido em assimilar novos conceitos e tecnologias. Estou
              entusiasmado com a possibilidade de contribuir e trabalharmos
              juntos!
            </p>

            <h1 className="text-2xl mt-10 font-semibold mb-3">Experiência</h1>
            <div>
              <span className="text-sm text-gray-600">
                fev 2023 – o momento
              </span>
              <h3 className="font-semibold">
                Suporte aos Sites | Prefeitura de Naviraí
              </h3>
              <p className="mt-2">
                Atendimento aos usuários, manutenção, otimização e resolução de
                problemas relacionados ao sites desenvolvidos com PHP e
                WordPress para a Prefeitura de Naviraí.
              </p>
              <ul className="list-disc list-inside">
                <li className="ml-4">
                  Prover suporte técnico e assistência aos clientes que utilizam
                  o sistema.
                </li>
                <li className="ml-4">
                  Diagnosticar e resolver problemas técnicos, como erros de
                  código, plugins conflitantes, falhas de segurança e problemas
                  de desempenho.
                </li>
                <li className="ml-4">
                  Realizar atualizações de software, patches de segurança e
                  melhorias de desempenho no site.
                </li>
                <li className="ml-4">
                  Colaborar com a equipe de desenvolvimento para implementar
                  novos recursos, corrigir bugs e garantir a estabilidade do
                  site.
                </li>
                <li className="ml-4">
                  Gerenciar backups regulares e procedimentos de recuperação de
                  desastres para garantir a integridade dos dados dos usuários.
                </li>
              </ul>
            </div>

            <div className="mt-5">
              <span className="text-sm text-gray-600">mar 2020 – jan 2021</span>
              <h3 className="font-semibold">
                Assistente de TI | Exército Brasileiro
              </h3>
              <p className="mt-2">
                Atendimento aos usuários, manutenção, otimização e resolução de
                Manutenção de Computadores, Manutenção de interfaces utilizando
                HTML, CSS e JavaScript e treinamento do sistema para controle de
                frotas e Abastecimento do Exército Brasileiro.
              </p>
              <ul className="list-disc list-inside">
                <li className="ml-4">Manutenção de Computadores</li>
                <li className="ml-4">Manutenção de interfaces</li>
                <li className="ml-4">treinamento do sistema</li>
              </ul>
            </div>

            <h1 className="text-2xl mt-10 font-semibold">Formação</h1>
            <ul className="list-disc list-inside">
              <li className="ml-4">
                <strong>Análise e Desenvolvimento de Sistemas</strong> -
                Instituto Federal de ciência e tecnologia do Mato Grosso do Sul
                (IFMS) - Naviraí | Cursando.
              </li>
            </ul>

            <h1 className="text-2xl mt-10 font-semibold">Idiomas</h1>
            <ul className="list-disc list-inside">
              <li className="ml-4">
                <strong>Inglês</strong> - Intermediário
              </li>
            </ul>

            <h1 className="text-2xl mt-10 font-semibold">
              Informações Adicionais
            </h1>
            <ul className="list-disc list-inside">
              <li className="ml-4">
                <strong>Formação Next.js</strong> - Alura | Conclusão: jan 2024
              </li>
              <li className="ml-4">
                <strong>Formação APIs com Express</strong> - Alura | Conclusão:
                jan 2024
              </li>
              <li className="ml-4">
                <strong>Formação Modelagem de dados</strong> - Alura |
                Conclusão: jan 2024
              </li>
              <li className="ml-4">
                <strong>Formação PostgreSQL</strong> - Alura | Conclusão: jan
                2024
              </li>
              <li className="ml-4">
                <strong>Formação MongoDB</strong> - Alura | Conclusão: dez 2023
              </li>
              <li className="ml-4">
                <strong>Formação Começando em DevOps</strong> - Alura |
                Conclusão: dez 2023
              </li>
              <li className="ml-4">
                <strong>Formação TypeScript</strong> - Alura | Conclusão: out
                2024
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}
