import type { Effect } from "effect"
import type { Content } from "../lib/services/Content"
import { dateRange, dateTenure } from "../lib/utils"
import { Heading } from "./Heading"
import { Text } from "./Text"

type Work = Effect.Success<Content["Service"]["getWork"]>[number]

const WorkEntry = ({ entry, showCompany = true }: { entry: Work; showCompany?: boolean }) => (
  <>
    <Heading level={showCompany ? 2 : 3} variant="item">
      {entry.data.role}
    </Heading>
    {showCompany && <Text variant="label">{entry.data.company}</Text>}
    <Text variant="muted">{dateRange(entry.data.dateStart, entry.data.dateEnd)}</Text>
    <Text variant="muted">
      {entry.data.location} · {entry.data.locationType}
    </Text>
    <article className="prose">
      <entry.Content />
    </article>
  </>
)

const WorkList = ({ work }: { work: [Work, ...Work[]][] }) => (
  <ul className="work-list">
    {work.map((entries) => (
      <li key={entries[0].data.company} className="work-entry">
        {entries.length > 1 ? (
          <>
            <Heading level={2} variant="item">
              {entries[0].data.company}
            </Heading>
            <Text variant="muted">
              {dateTenure(
                (entries[entries.length - 1] ?? entries[0]).data.dateStart,
                entries[0].data.dateEnd,
              )}
            </Text>
            <ul className="work-positions">
              {entries.map((entry) => (
                <li key={entry.slug}>
                  <WorkEntry entry={entry} showCompany={false} />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <WorkEntry entry={entries[0]} />
        )}
      </li>
    ))}
  </ul>
)

export { WorkList }
