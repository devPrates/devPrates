import Image from 'next/image'

export const ProjectsCard = () => {
  return (
    <div className="rounded-lg h-[436px] flex flex-col bg-gray-800 overflow-hidden border-2 border-gray-800 hover:border-cyan-500 opacity-70 hover:opacity-100 transition-all group">
      <div className="w-full h-48 overflow-hidden">
        <Image
          width={380}
          height={200}
          src="https://media.graphassets.com/FRhUdgUQTHmLmwf9u0BA"
          alt="Tumb do projeto"
          unoptimized
          className="w-full h-full object-cover group-hover:scale-110 duration-500 transition-all"
        />
      </div>

      <div className="flex-1 flex flex-col p-8">
        <strong className="font-medium text-gray-50/90 group-hover:text-cyan-500">
          BookWize
        </strong>
        <p className="mt-2 text-gray-400 line-clamp-4">
          BookWise é uma plataforma de avaliação de livros que foi desenvolvida
          durante o bootcamp Ignite da Rocketseat. Com apenas um Figma
          precisavamos desenvolver essa aplicação completa Full Stack com
          Next.js.
        </p>
        <span className="text-gray-300 text-sm font-medium block mt-auto truncate">
          Next,js, Next Auth, Stiches
        </span>
      </div>
    </div>
  )
}
