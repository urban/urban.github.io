import NextLink from "next/link"
import type { ComponentProps } from "react"
import { clsx } from "../lib/utils"

type Props = Omit<ComponentProps<typeof NextLink>, "href"> & {
  href: string
}

const MdxLink = ({ href, children, className, ...rest }: Props) => (
  <NextLink className={clsx("styled-link", className)} href={href} {...rest}>
    <span>{children}</span>
  </NextLink>
)

export { MdxLink }
