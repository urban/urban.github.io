import type { Effect } from "effect"
import type { Content } from "@/lib/services/Content"
import { dateRange, dateTenure } from "@/lib/utils"
import { Text } from "./Text"

type Work = Effect.Success<ReturnType<typeof Content.Service.getWork>>[0]

const WorkTransferOrPromotion = ({ children }: { children: React.ReactNode }) => (
  <div className="before:content-[' '] before:absolute before:-left-[calc(--spacing(7.25))] before:top-8 before:w-0.5 before:h-[calc(100%_-_1.5rem)] before:bg-gray-300 dark:before:bg-gray-500">
    {children}
  </div>
)

const WorkPostion = () => (
  <span className="absolute block rounded-full h-2.5 w-2.5 top-2 -left-8 bg-gray-300 dark:bg-gray-500" />
)

const WorkEntry = ({ entry, showCompany = true }: { entry: Work; showCompany?: boolean }) => (
  <>
    <Text variant="label">{entry.data.role}</Text>
    {showCompany && <Text variant="muted">{entry.data.company}</Text>}
    <Text variant="muted">{dateRange(entry.data.dateStart, entry.data.dateEnd)}</Text>
    <Text variant="muted">
      {entry.data.location} - {entry.data.locationType}
    </Text>
    <article>
      <entry.Content />
    </article>
  </>
)

const MultipleWorkEntries = ({ entries }: { entries: [Work, ...Work[]] }) => {
  return (
    <>
      <div className="pb-4">
        <Text variant="label">{entries[0].data.company}</Text>
        <Text variant="muted">
          {dateTenure(
            (entries[entries.length - 1] || entries[0]).data.dateStart,
            entries[0].data.dateEnd,
          )}
        </Text>
      </div>
      <ul className="flex flex-col pt-4 pl-12">
        {entries.map((entry, idx) => (
          <li key={entry.slug} className="animate">
            <WorkPostion />
            {idx !== entries.length - 1 ? (
              <WorkTransferOrPromotion>
                <WorkEntry entry={entry} showCompany={false} />
              </WorkTransferOrPromotion>
            ) : (
              <WorkEntry entry={entry} showCompany={false} />
            )}
          </li>
        ))}
      </ul>
    </>
  )
}

const WorkList = ({ work }: { work: [Work, ...Work[]][] }) => (
  <ul className="flex flex-col py-4">
    {work.map((entries, idx) => (
      <li key={idx} className="animate border-b border-gray-300 dark:border-gray-500 pt-5">
        {entries.length > 1 ? (
          <MultipleWorkEntries entries={entries} />
        ) : (
          <WorkEntry entry={entries[0]} />
        )}
      </li>
    ))}
  </ul>
)
export { WorkList }
