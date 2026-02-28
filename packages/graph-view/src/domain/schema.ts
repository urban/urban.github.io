export type GraphSnapshot = {
  readonly nodes: ReadonlyArray<unknown>
  readonly edges: ReadonlyArray<unknown>
  readonly diagnostics: ReadonlyArray<unknown>
}
