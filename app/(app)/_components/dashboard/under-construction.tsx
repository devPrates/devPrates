import { Hammer } from 'lucide-react'
import { Card } from '../ui'

// Estado vazio das seções que ainda não têm tela.
export function UnderConstruction({ title }: { title: string }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="flex size-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 text-zinc-500">
        <Hammer className="size-[18px]" strokeWidth={1.5} />
      </span>
      <div>
        <p className="font-medium text-zinc-200">Em construção</p>
        <p className="mt-1 max-w-sm text-sm text-zinc-500">
          A seção {title} ainda não tem tela. Ela entra aqui quando for
          construída.
        </p>
      </div>
    </Card>
  )
}
