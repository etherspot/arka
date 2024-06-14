// This file enables type checking and editor autocomplete for this Ponder project.
// After upgrading, you may find that changes have been made to this file.
// If this happens, please commit the changes. Do not manually edit this file.
// See https://ponder.sh/docs/guides/typescript for more information.

declare module "@/generated" {
  import type {
    PonderContext,
    PonderEvent,
    PonderEventNames,
    PonderApp,
  } from "@ponder/core";

  type ArkaConfig = typeof import("./ponder.config.ts").default;
  type Schema = typeof import("./ponder.schema.ts").default;

  export const ponder: PonderApp<ArkaConfig, Schema>;
  export type EventNames = PonderEventNames<ArkaConfig>;
  export type Event<name extends EventNames = EventNames> = PonderEvent<
    ArkaConfig,
    name
  >;
  export type Context<name extends EventNames = EventNames> = PonderContext<
    ArkaConfig,
    Schema,
    name
  >;
  export type IndexingFunctionArgs<name extends EventNames = EventNames> = {
    event: Event<name>;
    context: Context<name>;
  };
}
