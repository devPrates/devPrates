// Conteúdo MOCKADO da home nova. Os tipos espelham os modelos que vão
// existir no Hygraph; quando o conteúdo for real, só a origem muda.

export type NavItem = { label: string; href: `#${string}` }

export type Service = {
  index: string
  title: string
  body: string
  tags: string[]
}

export type SpecCounter = {
  label: string
  value: number
  suffix?: string
}

export type SpecRow = { label: string; value: string }

export type ProjectHighlight = {
  slug: string
  title: string
  category: string
  year: string
  thumbnail: string
}

export type Experience = {
  period: string
  role: string
  company: string
  summary: string
}

export type Testimonial = {
  quote: string
  author: string
  role: string
  rating: number
}

export type ComparisonRow = {
  topic: string
  without: string
  with: string
}

const HYGRAPH_ASSETS = 'https://sa-east-1.graphassets.com/AYnkdiyktTw6btCR8j83nz'

export const homeContent = {
  nav: [
    { label: 'Início', href: '#inicio' },
    { label: 'Sobre', href: '#sobre' },
    { label: 'Projetos', href: '#projetos' },
    { label: 'Contato', href: '#contato' },
  ] satisfies NavItem[],

  sideLabel: 'Prates — Portfólio 2026',

  hero: {
    tagline: 'Código, dados e café. Nessa ordem.',
    cardTitle: 'Programador e analista de dados em Naviraí – MS.',
    cardBody:
      'Sistemas, dashboards e sites que resolvem problema de verdade, sem firula e dentro do prazo.',
    status: 'Disponível para projetos',
    scrollHint: 'Role para descobrir',
  },

  manifesto: {
    eyebrow: '01 — Sobre',
    heading: 'Não é só código.',
    body: 'É entender o processo, cortar o retrabalho e entregar algo que alguém usa todo dia. O código é só a parte que aparece.',
  },

  services: {
    eyebrow: '02 — Serviços',
    heading: 'O que eu resolvo.',
    items: [
      {
        index: '01',
        title: 'Sistemas sob medida',
        body: 'Do controle de estoque ao financeiro: software feito para o jeito que a sua empresa já trabalha, não o contrário.',
        tags: ['Next.js', 'Node', 'Postgres'],
      },
      {
        index: '02',
        title: 'Dados e dashboards',
        body: 'Planilhas soltas viram indicadores claros. Você para de adivinhar e passa a decidir com números.',
        tags: ['SQL', 'Python', 'Power BI'],
      },
      {
        index: '03',
        title: 'Sites e landing pages',
        body: 'Páginas rápidas, bonitas e fáceis de editar, pensadas para transformar visita em contato.',
        tags: ['React', 'Headless CMS', 'SEO'],
      },
    ] satisfies Service[],
  },

  specs: {
    eyebrow: '03 — Especificações',
    heading: 'Ficha técnica.',
    counters: [
      { label: 'Anos de experiência', value: 4, suffix: '+' },
      { label: 'Projetos entregues', value: 12 },
      { label: 'Tecnologias no dia a dia', value: 15 },
      { label: 'Cafés por semana', value: 38 },
    ] satisfies SpecCounter[],
    rows: [
      { label: 'Linguagens', value: 'TypeScript, Python, SQL' },
      { label: 'Front-end', value: 'React, Next.js, Tailwind' },
      { label: 'Back-end', value: 'Node.js, APIs REST, GraphQL' },
      { label: 'Dados', value: 'Postgres, Power BI, Pandas' },
      { label: 'Infra', value: 'Vercel, Neon, redes e telecom' },
      { label: 'Garantia', value: 'Suporte depois da entrega. Sem sumiço.' },
    ] satisfies SpecRow[],
  },

  projects: {
    eyebrow: '04 — Projetos',
    heading: 'Trabalhos selecionados.',
    cta: 'Ver todos os projetos',
    items: [
      {
        slug: 'software-puroqueijo',
        title: 'Puro Queijo',
        category: 'Sistema web',
        year: '2025',
        thumbnail: `${HYGRAPH_ASSETS}/XeDhqnxRcOUVTlzhorfu`,
      },
      {
        slug: 'agroclima-net',
        title: 'Agroclima.NET',
        category: 'Sistema web',
        year: '2025',
        thumbnail: `${HYGRAPH_ASSETS}/cmgs1n3gf04y507kjc8q21jn1`,
      },
      {
        slug: 'curso-react-ifms',
        title: 'Curso React IFMS',
        category: 'Ensino',
        year: '2025',
        thumbnail: `${HYGRAPH_ASSETS}/JQyHCUERQOnnMfxBMBgQ`,
      },
      {
        slug: 'curso-python-ifms',
        title: 'Curso Python IFMS',
        category: 'Ensino',
        year: '2025',
        thumbnail: `${HYGRAPH_ASSETS}/cmgs1zhos050w07lrw1u5vc5d`,
      },
    ] satisfies ProjectHighlight[],
  },

  experience: {
    eyebrow: '05 — Trajetória',
    heading: 'Por onde passei.',
    items: [
      {
        period: '2025',
        role: 'Analista de redes e telecom',
        company: 'Vouu Telecom',
        summary:
          'Infraestrutura de redes, monitoramento de equipamentos e suporte técnico.',
      },
      {
        period: '2023 — 2024',
        role: 'Programador',
        company: 'Prefeitura de Naviraí',
        summary:
          'Sistemas internos e automação de processos administrativos. (texto mockado)',
      },
      {
        period: '2021 — 2022',
        role: 'Suporte de TI',
        company: 'Exército Brasileiro',
        summary:
          'Manutenção de equipamentos e apoio à rede da unidade. (texto mockado)',
      },
    ] satisfies Experience[],
  },

  testimonials: {
    eyebrow: '06 — Depoimentos',
    heading: 'Quem já trabalhou comigo.',
    items: [
      {
        quote:
          'Entendeu o problema antes de eu terminar de explicar. O sistema está rodando até hoje.',
        author: 'Cliente A.',
        role: 'Sócia, comércio local',
        rating: 5,
      },
      {
        quote:
          'Prazo cumprido e ainda sobrou tempo para ajustar o que a gente nem tinha pedido.',
        author: 'Cliente B.',
        role: 'Gestor, agronegócio',
        rating: 5,
      },
      {
        quote:
          'Explicou cada decisão sem tecniquês. Raro encontrar dev assim.',
        author: 'Cliente C.',
        role: 'Coordenadora, educação',
        rating: 5,
      },
    ] satisfies Testimonial[],
  },

  comparison: {
    eyebrow: '07 — Comparativo',
    heading: 'Sem Prates × com Prates.',
    columns: { without: 'Sem Prates', with: 'Com Prates' },
    rows: [
      {
        topic: 'Prazo',
        without: 'Depois a gente vê',
        with: 'Combinado e cumprido',
      },
      {
        topic: 'Comunicação',
        without: 'Some por semanas',
        with: 'Atualização toda semana',
      },
      {
        topic: 'Código',
        without: 'Funciona na minha máquina',
        with: 'Testado e documentado',
      },
      {
        topic: 'Depois da entrega',
        without: 'Boa sorte',
        with: 'Suporte incluso',
      },
      { topic: 'Café', without: 'Nenhum', with: 'Muito' },
    ] satisfies ComparisonRow[],
  },

  contact: {
    eyebrow: '08 — Contato',
    heading: 'Vamos construir algo juntos?',
    body: 'Conte o que você precisa. Eu respondo em até um dia útil com os próximos passos.',
    email: 'devprates@gmail.com',
    socials: [
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/devprates/' },
      { label: 'GitHub', href: 'https://github.com/devPrates' },
    ],
  },
}
