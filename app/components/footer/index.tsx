import Image from 'next/image'
import { IoMdHeart } from 'react-icons/io'

export const Footer = () => {
  return (
    <footer className="h-14 w-full flex items-center justify-center bg-gray-950">
      <span className="flex items-center gap-1.5 text-xs sm:text-sm font-mono text-gray-400">
        Made with by
        <strong className="font-medium">Gabriel Prates</strong>
        <Image
          width={30}
          height={30}
          src="/icone.svg"
          alt="Logo Gabriel Prates"
        />
      </span>
    </footer>
  )
}
