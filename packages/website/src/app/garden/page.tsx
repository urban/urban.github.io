import type { Metadata } from "next"
import { getRequiredGardenEntry, GardenEntryPage } from "./GardenEntryPage"

export async function generateMetadata(): Promise<Metadata> {
  const entry = await getRequiredGardenEntry("index")

  return {
    title: entry.data.title,
    description: entry.data.description,
  }
}

export default async function Page() {
  const entry = await getRequiredGardenEntry("index")

  return <GardenEntryPage entry={entry} showBackTo={false} />
}
