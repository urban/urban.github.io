import { NodeContext } from "@effect/platform-node";
import { Layer, ManagedRuntime } from "effect";
import { Content } from "./services/Content";
import { Mdx } from "./services/Mdx";
import { Metadata } from "./services/Metadata";

const MainLayer = Content.Default.pipe(
  Layer.provide(Layer.mergeAll(Mdx.Default, Metadata.Default, NodeContext.layer)),
);

export const RuntimeServer = ManagedRuntime.make(MainLayer);
