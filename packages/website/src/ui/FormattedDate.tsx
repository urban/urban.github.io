type Props = {
  date: Date;
};

const FormattedDate = ({ date }: Props) => (
  <time dateTime={date.toISOString()}>
    {date.toLocaleDateString("en-us", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}
  </time>
);

export { FormattedDate };
