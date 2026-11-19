import type { ReactNode } from "react"
import { clsx } from "../lib/utils"

type Level = 1 | 2 | 3 | 4

type Props = {
  children: ReactNode
  level: Level
  variant: "display" | "page" | "section" | "item"
  id?: string
  className?: string
}

const tags: Record<Level, "h1" | "h2" | "h3" | "h4"> = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
}

// Heading level expresses document structure; variant controls presentation independently.
const Heading = ({ children, level, variant, id, className }: Props) => {
  const Tag = tags[level]
  return (
    <Tag id={id} className={clsx("site-heading", className)} data-variant={variant}>
      {children}
    </Tag>
  )
}

export { Heading }
