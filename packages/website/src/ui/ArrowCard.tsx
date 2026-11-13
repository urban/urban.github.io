import type { Essay, Project } from "../lib/schemas"
import { ArrowCardIcon } from "./ArrowCardIcon"

type Props = {
  href: string
  isExternal?: boolean
  metadata: typeof Essay.Type | typeof Project.Type
}

const ArrowCard = ({ metadata, isExternal, href }: Props) => (
  <a
    href={href}
    target={isExternal ? "_blank" : undefined}
    rel={isExternal ? 'noopener noreferrer' : undefined}
    className="relative group flex flex-nowrap py-3 px-4 pr-10 rounded-lg border border-black/15 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white transition-colors duration-300 ease-in-out"
  >
    <div className="flex flex-col flex-1 truncate">
      <div className="font-semibold">{metadata.title}</div>
      <div className="text-sm">{metadata.description}</div>
    </div>
    <ArrowCardIcon />
  </a>
)

export { ArrowCard }
