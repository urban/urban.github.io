import { expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { Header } from "./Header"
import { Link } from "./NavLink"
import { Button } from "./Button"
import { ContentCard } from "./ContentCard"

test("primary navigation exposes only Now and The Garden before hydration", () => {
  const markup = renderToStaticMarkup(<Header siteName="Urban Faubion" pathname="/" />)
  expect(markup).toContain('href="/now/"')
  expect(markup).toContain('href="/garden/"')
  expect(markup).not.toContain('href="/projects/"')
  expect(markup).not.toContain('href="/work/"')
  expect(markup).not.toContain('aria-current="page"')
})

test("garden notes identify The Garden as the current navigation section on the server", () => {
  const markup = renderToStaticMarkup(
    <Header siteName="Urban Faubion" pathname="/garden/a-note/" />,
  )
  expect(markup).toMatch(/<a[^>]+href="\/garden\/"[^>]+aria-current="page"/u)
  expect(markup).not.toMatch(/<a[^>]+href="\/now\/"[^>]+aria-current="page"/u)
})

test("web links open safely in a new tab while local and email links retain native navigation", () => {
  const external = renderToStaticMarkup(<Link href="https://example.com/">Example</Link>)
  expect(external).toContain('target="_blank"')
  expect(external).toContain('rel="noreferrer noopener"')
  for (const href of ["/garden/", "mailto:urban@example.com"]) {
    expect(renderToStaticMarkup(<Link href={href}>Link</Link>)).not.toContain("target=")
  }
})

test("buttons avoid implicit form submission and preserve explicit native behavior", () => {
  expect(renderToStaticMarkup(<Button>Switch theme</Button>)).toContain('type="button"')
  const submit = renderToStaticMarkup(
    <Button type="submit" disabled>
      Save
    </Button>,
  )
  expect(submit).toContain('type="submit"')
  expect(submit).toContain('disabled=""')
})

test("project links have distinct accessible names and external navigation", () => {
  const markup = renderToStaticMarkup(
    <ContentCard
      variant="project"
      number={1}
      title="dotai"
      description="Agent environment management."
      href="https://github.com/urban/dotai"
    />,
  )
  expect(markup).toContain('aria-label="View project: dotai"')
  expect(markup).toContain('target="_blank"')
})
