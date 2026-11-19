import type { Backlink } from "@/lib/noteGraph"
import { Heading } from "./Heading"
import { Link } from "./NavLink"
import { Text } from "./Text"

const Backlinks = ({ backlinks }: { backlinks: readonly Backlink[] }) => (
  <>
    <Heading level={2} variant="section" id="backlinks-title">
      Backlinks
    </Heading>
    {backlinks.length === 0 ? (
      <Text className="mt-4" variant="muted">
        No backlinks yet.
      </Text>
    ) : (
      <ul className="backlinks-list">
        {backlinks.map((backlink) => (
          <li key={backlink.nodeId}>
            <Link href={backlink.routePath}>{backlink.title}</Link>
            <span className="backlinks-count" aria-label={`${backlink.count} references`}>
              {backlink.count}
            </span>
          </li>
        ))}
      </ul>
    )}
  </>
)

export { Backlinks }
