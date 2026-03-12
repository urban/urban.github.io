import { plugin } from "bun"
import { join } from "node:path"

plugin({
  name: "website-alias",
  setup(build) {
    build.onResolve({ filter: /^@\// }, (args) => ({
      path: join(process.cwd(), "src", args.path.slice(2)),
    }))
  },
})
