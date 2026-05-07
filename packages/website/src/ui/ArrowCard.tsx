import { Essay, Project } from "../lib/schemas"
import NextLink from "next/link"
import { ArrowCardIcon } from "./ArrowCardIcon"

type Props = {
  collection: "essays" | "projects"
  metadata: typeof Essay.Type | typeof Project.Type
  slug: string
}

const ArrowCard = ({ collection, metadata, slug }: Props) => (
  <NextLink
    href={`/${collection}/${slug}`}
    className="relative group flex flex-nowrap py-3 px-4 pr-10 rounded-lg border border-black/15 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white transition-colors duration-300 ease-in-out"
  >
    <div className="flex flex-col flex-1 truncate">
      <div className="font-semibold">{metadata.title}</div>
      <div className="text-sm">{metadata.description}</div>
    </div>
    <ArrowCardIcon />
  </NextLink>
)

export { ArrowCard }
