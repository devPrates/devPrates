import {
  ArrowLeftRight,
  Banknote,
  BookOpen,
  Briefcase,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  ChartColumn,
  ChartPie,
  CircleCheck,
  Cpu,
  CreditCard,
  Dumbbell,
  ExternalLink,
  FileSignature,
  Files,
  FolderKanban,
  GraduationCap,
  HandCoins,
  HeartPulse,
  House,
  Landmark,
  LayoutDashboard,
  Library,
  ListTodo,
  type LucideIcon,
  Mail,
  NotebookPen,
  Receipt,
  Ruler,
  Search,
  Sparkles,
  Sun,
  Tag,
  Tags,
  TrendingUp,
  User,
  Users,
  Wallet,
  Workflow,
} from 'lucide-react'

// Navegação da área restrita. Cada módulo tem a própria sidebar (grupos e
// itens); o seletor do topo troca de módulo. Para mudar menus, edite só este
// arquivo: rotas, títulos da página e busca saem daqui.

export type NavItem = {
  id: string
  title: string
  icon: LucideIcon
  // Rota interna (montada a partir do slug) ou link externo.
  href?: string
  external?: boolean
  // Item especial que abre a busca em vez de navegar.
  action?: 'search'
  shortcut?: string
  badge?: string | number
  children?: NavItem[]
}

export type NavGroup = { heading?: string; items: NavItem[] }

export type Module = {
  id: string
  title: string
  description: string
  icon: LucideIcon
  href: string
  groups: NavGroup[]
}

// Formato de escrita: itens com `slug` (o href é montado depois).
type RawItem = Omit<NavItem, 'id' | 'href' | 'children'> & {
  slug?: string
  url?: string
  children?: RawItem[]
}
type RawModule = Omit<Module, 'href' | 'groups'> & {
  groups: { heading?: string; items: RawItem[] }[]
}

const s = (
  slug: string,
  title: string,
  icon: LucideIcon,
  children?: RawItem[],
): RawItem => ({ slug, title, icon, children })

// Primeiro grupo de todos os módulos: busca e visão geral.
const START: RawItem[] = [
  { title: 'Buscar', icon: Search, action: 'search', shortcut: '⌘K' },
  { slug: '', title: 'Visão geral', icon: LayoutDashboard },
]

const RAW_MODULES: RawModule[] = [
  {
    id: 'portfolio',
    title: 'Portfólio',
    description: 'Conteúdo do site e contatos',
    icon: Briefcase,
    groups: [
      { items: START },
      {
        heading: 'Conteúdo',
        items: [
          s('pagina-inicial', 'Página inicial', House),
          s('projetos', 'Projetos', FolderKanban),
          s('experiencias', 'Experiências', Workflow),
          s('tecnologias', 'Tecnologias', Cpu),
          s('cursos', 'Cursos', GraduationCap),
        ],
      },
      {
        heading: 'Site',
        items: [
          s('mensagens', 'Mensagens de contato', Mail),
          {
            title: 'Ver site',
            icon: ExternalLink,
            url: 'https://devprates.vercel.app',
            external: true,
          },
        ],
      },
    ],
  },
  {
    id: 'financeiro',
    title: 'Financeiro',
    description: 'Contas, lançamentos e relatórios',
    icon: Wallet,
    groups: [
      { items: [...START, s('tutorial', 'Como usar', BookOpen)] },
      {
        heading: 'Dia a dia',
        items: [
          s('movimentacoes', 'Movimentações', ArrowLeftRight),
          s('contas-a-pagar', 'Contas a pagar', Receipt),
          s('contas-a-receber', 'Contas a receber', HandCoins),
        ],
      },
      {
        heading: 'Crédito',
        items: [
          s('faturas', 'Faturas', CreditCard),
          s('emprestimos', 'Empréstimos', Banknote),
        ],
      },
      {
        heading: 'Cadastros',
        items: [
          s('contas', 'Contas', Landmark),
          s('categorias', 'Categorias', Tags),
          s('tags', 'Tags', Tag),
        ],
      },
      {
        heading: 'Relatórios',
        items: [
          s('relatorios', 'Relatórios', ChartColumn, [
            s('fluxo-de-caixa', 'Fluxo de caixa', TrendingUp),
            s('por-categoria', 'Por categoria', ChartPie),
          ]),
        ],
      },
    ],
  },
  {
    id: 'organizacao',
    title: 'Organização',
    description: 'Tarefas, projetos e clientes',
    icon: ListTodo,
    groups: [
      { items: START },
      {
        heading: 'Trabalho',
        items: [
          s('tarefas', 'Tarefas', ListTodo, [
            s('hoje', 'Hoje', Sun),
            s('proximas', 'Próximas', CalendarClock),
            s('concluidas', 'Concluídas', CircleCheck),
          ]),
          s('projetos', 'Projetos', FolderKanban),
          s('calendario', 'Calendário', CalendarDays),
        ],
      },
      {
        heading: 'Notas',
        items: [
          s('anotacoes', 'Anotações', NotebookPen),
          s('documentos', 'Documentos', Files),
        ],
      },
      {
        heading: 'Clientes',
        items: [
          s('clientes', 'Clientes', Users),
          s('propostas', 'Propostas', FileSignature),
        ],
      },
    ],
  },
  {
    id: 'pessoal',
    title: 'Pessoal',
    description: 'Rotina, saúde, estudos e metas',
    icon: User,
    groups: [
      { items: START },
      {
        heading: 'Rotina',
        items: [
          s('habitos', 'Hábitos', Sparkles),
          s('agenda', 'Agenda', CalendarCheck),
        ],
      },
      {
        heading: 'Saúde',
        items: [
          s('treinos', 'Treinos', Dumbbell),
          s('medidas', 'Medidas', Ruler),
        ],
      },
      {
        heading: 'Estudos',
        items: [
          s('cursos', 'Cursos', BookOpen),
          s('leituras', 'Leituras', Library),
        ],
      },
      {
        heading: 'Objetivos',
        items: [s('metas', 'Metas', HeartPulse)],
      },
    ],
  },
]

const BASE = '/dashboard'

function build(moduleId: string, items: RawItem[], parent: string): NavItem[] {
  return items.map(({ slug, url, children, ...rest }, i) => {
    const path =
      slug === undefined ? undefined : slug ? `${parent}/${slug}` : parent
    return {
      ...rest,
      id: `${moduleId}:${path ?? url ?? rest.action ?? i}`,
      href: url ?? path,
      children: children && build(moduleId, children, path ?? parent),
    }
  })
}

export const MODULES: Module[] = RAW_MODULES.map((m) => {
  const href = `${BASE}/${m.id}`
  return {
    ...m,
    href,
    groups: m.groups.map((g) => ({
      heading: g.heading,
      items: build(m.id, g.items, href),
    })),
  }
})

export const DEFAULT_MODULE = MODULES[0]

export function flatten(items: NavItem[]): NavItem[] {
  return items.flatMap((item) => [item, ...flatten(item.children ?? [])])
}

export const moduleItems = (module: Module) =>
  flatten(module.groups.flatMap((g) => g.items))

export function findModule(pathname: string) {
  const id = pathname.split('/')[2]
  return MODULES.find((m) => m.id === id)
}

// Item da rota atual (o mais específico que bate com o caminho).
export function findItem(module: Module, pathname: string) {
  return moduleItems(module)
    .filter((i) => i.href && !i.external && i.href === pathname)
    .at(0)
}

// O item (ou algum filho dele) é a rota atual?
export function containsPath(item: NavItem, pathname: string): boolean {
  if (item.href === pathname) return true
  return (item.children ?? []).some((c) => containsPath(c, pathname))
}

// Todos os destinos da busca: módulos + itens com rota.
export function searchEntries() {
  return MODULES.flatMap((m) => [
    { id: m.id, title: m.title, module: m, item: undefined, href: m.href },
    ...moduleItems(m)
      .filter((i) => i.href && !i.action && i.href !== m.href)
      .map((i) => ({ id: i.id, title: i.title, module: m, item: i, href: i.href! })),
  ])
}
