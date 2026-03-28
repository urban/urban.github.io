import type { Metadata } from "next"
import { getRequiredVaultEntry, VaultEntryPage } from "./VaultEntryPage"

export async function generateMetadata(): Promise<Metadata> {
  const entry = await getRequiredVaultEntry("index")

  return {
    title: entry.data.title,
    description: entry.data.description,
  }
}

export default async function Page() {
  const entry = await getRequiredVaultEntry("index")

  return <VaultEntryPage entry={entry} showBackToVault={false} />
}
