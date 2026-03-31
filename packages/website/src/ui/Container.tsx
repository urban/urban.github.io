import type { ReactNode } from "react"

const Container = ({ children }: { children: ReactNode }) => (
  <div className="mx-auto max-w-4xl px-5">{children}</div>
)

export { Container }
