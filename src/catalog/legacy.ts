/** Migration boundary for the original template generators. The adapter gives
 * these complex templates deterministic names and explicit editable parameters. */
export interface LegacyContext { arrays: string[]; integers: string[]; strings: string[] }
export interface LegacyTemplate {
  label: string;
  description: string;
  detail: string;
  generate(context: LegacyContext): string;
}
export function arr(context: LegacyContext): string { return context.arrays[0] ?? 'nums'; }
export function target(context: LegacyContext): string { return context.integers[0] ?? 'target'; }
