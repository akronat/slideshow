
export default interface ContentSource {
  /** An ID that (deterministically) identifies the source as uniquely as possible. */
  readonly id: string;
  /** The user friendly name of the source. */
  readonly name: string;
  /** The URL returned MUST be released via URL.revokeObjectURL when done with. */
  getObjectUrl: () => string;
}
