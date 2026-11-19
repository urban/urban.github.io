import type { HTMLAttributes } from "react"
import { clsx } from "../lib/utils"

type Props = HTMLAttributes<HTMLDivElement> & {
  width?: "site" | "reading"
}

const Container = ({ children, width = "site", className, ...rest }: Props) => (
  <div className={clsx("site-container", className)} data-width={width} {...rest}>
    {children}
  </div>
)

export { Container }
