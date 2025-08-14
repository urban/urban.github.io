"use client";

import { usePathname } from "next/navigation";
import { Container } from "./Container";
import { Link } from "./Link";

const Header = ({ siteName }: { siteName: string }) => {
  const pathname = usePathname();

  return pathname === "/" ? null : (
    <header>
      <Container>
        <div className="flex flex-wrap gap-y-2 justify-between">
          <Link href="/" underline={false}>
            <div className="font-semibold">{siteName}</div>
          </Link>
          <nav className="flex gap-1">
            {/*<Link href="/articles">articles</Link>
            <span>{`/`}</span>
            <Link href="/work">work</Link>
            <span>{`/`}</span>
            <Link href="/projects">projects</Link>*/}
          </nav>
        </div>
      </Container>
    </header>
  );
};

export { Header };
