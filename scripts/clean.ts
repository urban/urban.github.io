import { Glob } from "bun"
import * as Path from "node:path"
import { fileURLToPath } from "node:url"
import * as Fs from "node:fs"

const __dirname = Path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = Path.resolve(__dirname, "..")
const filesToClean = [".next", ".turbo", ".tsbuildinfo", "out", "coverage"]

async function main() {
  const glob = new Glob("packages/*")
  const dirs: string[] = [workspaceRoot]

  for await (const entry of glob.scan({ cwd: workspaceRoot, onlyFiles: false })) {
    const fullPath = Path.join(workspaceRoot, entry)
    const stat = await Bun.file(fullPath).stat()
    if (stat.isDirectory()) {
      dirs.push(Path.join(workspaceRoot, entry))
    }
  }

  dirs.forEach((dir) => {
    filesToClean.forEach((file) => {
      const filePath = Path.join(dir, file)
      if (Fs.existsSync(filePath)) {
        console.log(`Cleaning ${filePath}`)
        Fs.rmSync(`${filePath}`, { recursive: true, force: true })
      }
    })
  })
}

main()
