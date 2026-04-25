import type { Metadata, ResolvingMetadata } from "next"
import { RuntimeServer } from "@/lib/RuntimeServer"
import { GardenEntryPage, getRequiredGardenEntry, getGardenStaticParams } from "../GardenEntryPage"

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return await RuntimeServer.runPromise(getGardenStaticParams)
}

export async function generateMetadata(
  { params }: PageProps,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params
  const entry = await getRequiredGardenEntry(slug)

  return {
    title: entry.data.title,
    description: entry.data.description,
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params
  const entry = await getRequiredGardenEntry(slug)

  return <GardenEntryPage entry={entry} />
}
