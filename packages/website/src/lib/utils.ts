import { twMerge } from "tailwind-merge";

type ClassValue = Parameters<typeof twMerge>[0];

const clsx = (...classes: ClassValue[]) => classes.filter(Boolean).join(" ");

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

const formatDate = (date: Date) =>
  Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);

const readingTime = (html: string) => {
  const textOnly = html.replace(/<[^>]+>/g, "");
  const wordCount = textOnly.split(/\s+/).length;
  const readingTimeMinutes = (wordCount / 200 + 1).toFixed();
  return `${readingTimeMinutes} min read`;
};

const dateTenure = (startDate: Date, endDate?: Date | string) => {
  const _endDate = endDate === undefined || typeof endDate == "string" ? new Date() : endDate;
  let years = _endDate.getFullYear() - startDate.getFullYear();
  let months = _endDate.getMonth() - startDate.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  const formattedYears = years > 0 ? `${years} yrs` : "";
  const formattedMonths = months > 0 ? `${months} mo` : "";

  return [formattedYears, formattedMonths].filter(Boolean).join(" ");
};

const dateRange = (startDate: Date, endDate?: Date | string) => {
  const startMonth = startDate.toLocaleString("default", { month: "short" });
  const startYear = startDate.getFullYear().toString();
  let endMonth;
  let endYear;

  if (endDate) {
    if (typeof endDate === "string") {
      endMonth = "";
      endYear = endDate;
    } else {
      endMonth = endDate.toLocaleString("default", { month: "short" });
      endYear = endDate.getFullYear().toString();
    }
  }

  const tenure = dateTenure(startDate, endDate);

  return `${startMonth} ${startYear} – ${endMonth} ${endYear} · ${tenure}`;
};

export { cn, formatDate, readingTime, dateRange, dateTenure };
