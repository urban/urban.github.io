import NextLink from "next/link"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type Props = {
  children: ReactNode
  href: string
  external?: boolean
  underline?: boolean
}

const Link = ({ href, external, underline = true, ...rest }: Props) => (
  <NextLink
    href={href}
    target={external ? "_blank" : "_self"}
    className={cn(
      "inline-block decoration-black/15 dark:decoration-white/30 hover:decoration-black/25 hover:dark:decoration-white/50 text-current hover:text-black hover:dark:text-white transition-colors duration-300 ease-in-out",
      underline && "underline underline-offset-2",
    )}
    {...rest}
  />
)

export { Link }
