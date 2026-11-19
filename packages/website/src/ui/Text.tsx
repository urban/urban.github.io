import type { ReactNode } from "react"
import { clsx } from "../lib/utils"

type Props = {
  children: ReactNode
  variant?: "body" | "label" | "muted" | "eyebrow" | "lede"
  as?: "p" | "span" | "div"
  className?: string
}

const Text = ({ as = "p", children, variant = "body", className }: Props) => {
  const Tag = as

  return (
    <Tag className={clsx("site-text", className)} data-variant={variant}>
      {children}
    </Tag>
  )
}

export { Text }
