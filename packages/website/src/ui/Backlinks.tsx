import Link from "next/link"
import type { Backlink } from "@/lib/noteGraph"

const Backlinks = ({ backlinks }: { backlinks: readonly Backlink[] }) => {
  return (
    <>
      <h2 className="text-lg font-semibold text-black dark:text-white">Backlinks</h2>
      {backlinks.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">No backlinks yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {backlinks.map((backlink) => (
            <li
              key={backlink.nodeId}
              className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
            >
              <Link
                href={backlink.routePath}
                className="font-medium text-black/50 hover:text-black/80 underline-offset-4 hover:underline dark:text-white/50 dark:hover:text-white"
              >
                {backlink.title}
              </Link>
              <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                {backlink.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
const BacklinksAlt = ({ backlinks }: { backlinks: readonly Backlink[] }) => {
  return (
    <>
      <h2 className="text-lg font-semibold text-black dark:text-white">Backlinks</h2>
      {backlinks.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">No backlinks yet.</p>
      ) : (
        <ul>
          {backlinks.map((backlink) => (
            <li key={backlink.nodeId}>
              <div className="flex items-center justify-between gap-4">
                <Link className="styled-link" href={backlink.routePath}>
                  <span>{backlink.title}</span>
                </Link>
                <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                  {backlink.count}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export { Backlinks, BacklinksAlt }
