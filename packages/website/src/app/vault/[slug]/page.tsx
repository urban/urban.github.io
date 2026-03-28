import type { Metadata, ResolvingMetadata } from "next"
import { RuntimeServer } from "../../../lib/RuntimeServer"
import { VaultEntryPage, getRequiredVaultEntry, getVaultStaticParams } from "../VaultEntryPage"

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return await RuntimeServer.runPromise(getVaultStaticParams)
}

export async function generateMetadata(
  { params }: PageProps,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params
  const entry = await getRequiredVaultEntry(slug)

  return {
    title: entry.data.title,
    description: entry.data.description,
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params
  const entry = await getRequiredVaultEntry(slug)

  return <VaultEntryPage entry={entry} />
}
