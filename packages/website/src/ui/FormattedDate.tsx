import { DateTime } from "effect"

type Props = {
  date: DateTime.Utc
}

const FormattedDate = ({ date }: Props) => {
  const jsDate = DateTime.toDateUtc(date)

  return (
    <time dateTime={DateTime.formatIsoDateUtc(date)}>
      {jsDate.toLocaleDateString("en-us", {
        timeZone: "UTC",
        month: "short",
        day: "numeric",
        year: "numeric",
      })}
    </time>
  )
}

export { FormattedDate }
