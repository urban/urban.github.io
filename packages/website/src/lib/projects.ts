import { Array, DateTime, Effect, flow, Order } from "effect"
import { Content } from "./services/Content"

// Share publication filtering and ordering between the homepage and project archive.
export const publishedProjects = Effect.gen(function* () {
  const content = yield* Content
  return yield* content.getProjects.pipe(
    Effect.map(
      flow(
        Array.filter(({ data }) => data.published ?? true),
        Array.sortBy(Order.flip(Order.mapInput(DateTime.Order, ({ data }) => data.updatedAt))),
      ),
    ),
  )
})
