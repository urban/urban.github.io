import type { Project } from "@/lib/schemas"
import { ContentCard } from "./ContentCard"
import { Text } from "./Text"

type Props = {
  projects: ReadonlyArray<{ slug: string; data: typeof Project.Type }>
  headingLevel?: 2 | 3
}

const ProjectList = ({ projects, headingLevel = 3 }: Props) =>
  projects.length === 0 ? (
    <Text>Projects coming soon.</Text>
  ) : (
    <ol className="project-grid">
      {projects.map(({ slug, data }, index) => (
        <li key={slug}>
          <ContentCard
            variant="project"
            headingLevel={headingLevel}
            number={index + 1}
            title={data.title}
            description={data.description}
            href={data.repoURL}
          />
        </li>
      ))}
    </ol>
  )

export { ProjectList }
