import { Layer, ManagedRuntime } from "effect";
import { Api } from "./Articles";

const MainLayer = Layer.mergeAll(Api.Live);

export const RuntimeServer = ManagedRuntime.make(MainLayer);
