import { Language, maskNonCode } from './scanner';
import { findAlgorithm } from './templates';
export const MAX_CONTEXT_CHARS = 200_000;
export interface TriggerMatch { algorithmId: string; start: number; end: number }
/** Only keyword-only lines in executable source, with optional indentation. */
export function matchTrigger(prefix: string, language: Language): TriggerMatch | undefined {
  if (prefix.length > MAX_CONTEXT_CHARS) return;
  const lineStart = prefix.lastIndexOf('\n') + 1;
  const line = prefix.slice(lineStart);
  const keyword = line.trim();
  const algorithm = findAlgorithm(keyword);
  if (!algorithm || maskNonCode(prefix, language).slice(lineStart).trim() !== keyword) return;
  return { algorithmId: algorithm.id, start: lineStart + line.search(/\S/), end: prefix.length };
}
export class Debouncer {
  private timer: ReturnType<typeof setTimeout> | undefined;
  schedule(callback: () => void, milliseconds: number): void {
    this.cancel();
    this.timer = setTimeout(() => { this.timer = undefined; callback(); }, milliseconds);
  }
  cancel(): void { if (this.timer) clearTimeout(this.timer); this.timer = undefined; }
  dispose(): void { this.cancel(); }
}
