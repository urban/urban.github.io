import { NodeServices } from "@effect/platform-node"
import { Layer, ManagedRuntime } from "effect"
import { Content } from "./services/Content"
import { Mdx } from "./services/Mdx"
import { Metadata } from "./services/Metadata"

const MainLayer = Content.layer.pipe(
  Layer.provide(Layer.mergeAll(Mdx.layer, Metadata.layer, NodeServices.layer)),
)

export const RuntimeServer = ManagedRuntime.make(MainLayer)
