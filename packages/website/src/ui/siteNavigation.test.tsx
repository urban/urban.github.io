import { expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { Header } from "./Header"
import { Link } from "./NavLink"
import { Button } from "./Button"
import { ContentCard } from "./ContentCard"

test("primary navigation exposes only Now and The Garden before hydration", () => {
  const markup = renderToStaticMarkup(
    <Header siteName="Urban Faubion" pathname="/" sections={{ now: true, garden: true }} />,
  )
  expect(markup).toContain('src="/uf-logo.svg"')
  expect(markup).toContain('alt=""')
  expect(markup).toContain('href="/now/"')
  expect(markup).toContain('href="/garden/"')
  expect(markup).not.toContain('href="/projects/"')
  expect(markup).not.toContain('href="/work/"')
  expect(markup).not.toContain('aria-current="page"')
})

test("garden notes identify The Garden as the current navigation section on the server", () => {
  const markup = renderToStaticMarkup(
    <Header
      siteName="Urban Faubion"
      pathname="/garden/a-note/"
      sections={{ now: true, garden: true }}
    />,
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

test("disabled sections omit their links and the empty navigation landmark", () => {
  const markup = renderToStaticMarkup(
    <Header siteName="Urban Faubion" pathname="/" sections={{ now: false, garden: false }} />,
  )
  expect(markup).not.toContain("<nav")
  expect(markup).not.toContain('href="/now/"')
  expect(markup).not.toContain('href="/garden/"')
  expect(markup).toContain('href="/"')
})

test("sections can be released independently", () => {
  for (const sections of [
    { now: true, garden: false },
    { now: false, garden: true },
  ]) {
    const markup = renderToStaticMarkup(
      <Header siteName="Urban Faubion" pathname="/" sections={sections} />,
    )
    expect(markup.includes('href="/now/"')).toBe(sections.now)
    expect(markup.includes('href="/garden/"')).toBe(sections.garden)
  }
})
