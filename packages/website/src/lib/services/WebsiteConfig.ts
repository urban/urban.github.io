import { Context, Layer } from "effect"

class WebsiteConfig extends Context.Tag("@lib/services/WebsiteConfig")<
  WebsiteConfig,
  {
    readonly assetDir: string
    readonly contentDir: string
  }
>() {
  static readonly layer = Layer.sync(WebsiteConfig, () => {
    const contentDir = "./content"
    const assetDir = "./public/assets"

    return WebsiteConfig.of({ assetDir, contentDir })
  })
}

export { WebsiteConfig }
