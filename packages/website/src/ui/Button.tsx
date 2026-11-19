import type { ButtonHTMLAttributes } from "react"
import { clsx } from "../lib/utils"

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "outline" | "ghost"
}

const Button = ({ children, variant = "outline", className, type = "button", ...rest }: Props) => (
  <button className={clsx("site-button", className)} data-variant={variant} type={type} {...rest}>
    {children}
  </button>
)

export { Button }
