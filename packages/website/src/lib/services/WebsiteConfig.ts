import { ServiceMap, Layer } from "effect"

export class WebsiteConfig extends ServiceMap.Service<
  WebsiteConfig,
  {
    readonly assetDir: string
    readonly contentDir: string
  }
>()("@lib/services/WebsiteConfig") {
  static readonly layer = Layer.sync(WebsiteConfig, () => {
    const contentDir = "./content"
    const assetDir = "./public/assets"

    return WebsiteConfig.of({ assetDir, contentDir })
  })
}
