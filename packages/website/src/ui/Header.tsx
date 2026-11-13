"use client"

import { Container } from "./Container"
import { Link } from "./NavLink"

const Header = ({ siteName }: { siteName: string }) => {
  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <Container>
        <div className="flex flex-wrap gap-y-2 justify-between">
          <a href="/" target={"_self"}>
            <div className="font-semibold">{siteName}</div>
          </a>
          <nav className="flex gap-6">
            {/*<Link href="/essays">Essays</Link>*/}
            <Link href="/projects">Projects</Link>
            <Link href="/work">Work</Link>
            <Link href="/garden">The Garden</Link>
            {/*<Link href="/about">About</Link>*/}
          </nav>
        </div>
      </Container>
    </header>
  )
}

export { Header }
