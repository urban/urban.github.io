import type { DateTime } from "effect"
import { Heading } from "./Heading"
import { Text } from "./Text"
import { Link } from "./NavLink"
import { FormattedDate } from "./FormattedDate"

type Props = {
  title: string
  description: string
  href: string
  headingLevel?: 2 | 3
} & ({ variant: "project"; number: number } | { variant: "essay"; date: DateTime.Utc })

// Each content kind carries only the metadata its visual treatment needs.
const ContentCard = (props: Props) => (
  <article className="content-card" data-variant={props.variant}>
    {props.variant === "project" && (
      <span className="content-card-number" aria-hidden="true">
        {String(props.number).padStart(2, "0")}
      </span>
    )}
    <div className="content-card-content">
      {props.variant === "essay" && (
        <Text variant="muted">
          <FormattedDate date={props.date} />
        </Text>
      )}
      <Heading level={props.headingLevel ?? 3} variant="item">
        {props.title}
      </Heading>
      <Text>{props.description}</Text>
      <Link
        href={props.href}
        showExternalIcon={props.variant === "project"}
        aria-label={`${props.variant === "project" ? "View project" : "Read essay"}: ${props.title}`}
      >
        {props.variant === "project" ? "View project" : "Read essay"}
      </Link>
    </div>
  </article>
)

export { ContentCard }
