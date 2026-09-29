export const LANGUAGES = ['python', 'cpp', 'java'] as const;
export type Language = typeof LANGUAGES[number];
export function isLanguage(value: string): value is Language {
  return LANGUAGES.some(language => language === value);
}
export interface ScannedContext { language: Language; arrays: string[]; integers: string[] }

/** Preserve offsets while masking comments/literals. Heuristic, not an AST.
 * Unclosed literals conservatively mask the remaining input. */
export function maskNonCode(source: string, language: Language): string {
  const chunks: string[] = [];
  let i = 0;
  const blank = (value: string) => value.replace(/[^\r\n]/g, ' ');
  while (i < source.length) {
    if ((language === 'python' && source[i] === '#') ||
        (language !== 'python' && source.startsWith('//', i))) {
      const end = source.indexOf('\n', i);
      const stop = end < 0 ? source.length : end;
      chunks.push(blank(source.slice(i, stop))); i = stop; continue;
    }
    if (language !== 'python' && source.startsWith('/*', i)) {
      const end = source.indexOf('*/', i + 2);
      const stop = end < 0 ? source.length : end + 2;
      chunks.push(blank(source.slice(i, stop))); i = stop; continue;
    }
    const raw = language === 'cpp' && source.startsWith('R"', i)
      ? /^R"([^\s()\\]{0,16})\(/.exec(source.slice(i, i + 20)) : null;
    if (raw) {
      const terminator = `)${raw[1]}"`;
      const end = source.indexOf(terminator, i + raw[0].length);
      const stop = end < 0 ? source.length : end + terminator.length;
      chunks.push(blank(source.slice(i, stop))); i = stop; continue;
    }
    if (source[i] === '"' || source[i] === "'") {
      const quote = source[i];
      const triple = language !== 'cpp' && source.startsWith(quote.repeat(3), i);
      const delimiter = triple ? quote.repeat(3) : quote;
      const start = i;
      i += delimiter.length;
      while (i < source.length) {
        if (source[i] === '\\') { i = Math.min(i + 2, source.length); continue; }
        if (source.startsWith(delimiter, i)) { i += delimiter.length; break; }
        i++;
      }
      chunks.push(blank(source.slice(start, i))); continue;
    }
    chunks.push(source[i++]);
  }
  return chunks.join('');
}

const INTERNAL_NAMES = new Set([
  'left', 'right', 'mid', 'slow', 'fast', 'i', 'sum', 'best', 'row', 'col',
  'rows', 'cols', 'seen', 'stack', 'count', 'r', 'c', 'nr', 'nc', 'dr', 'dc',
  'index', 'value', 'answer', 'grid', 'result', 'self', 'cls', 'None', 'True', 'False',
  'int', 'long', 'class', 'def', 'return', 'void', 'new', 'public', 'static',
  'len', 'range', 'max', 'any', 'set', 'ValueError', 'std', 'java', 'boolean',
  'binary_search', 'lower_bound', 'upper_bound', 'two_sum', 'max_sum_window',
  'remove_duplicates', 'count_islands', 'search_rotated'
]);

/** Prefer nearby preceding declarations; no guarantee of scope or inferred type. */
export function scanSource(source: string, language: Language): ScannedContext {
  const code = maskNonCode(source, language);
  const arrays: string[] = [];
  const integers: string[] = [];
  const collect = (pattern: RegExp, destination: string[]) => {
    for (const match of code.matchAll(pattern)) {
      const name = match[1];
      if (INTERNAL_NAMES.has(name)) continue;
      const existing = destination.indexOf(name);
      if (existing >= 0) destination.splice(existing, 1);
      destination.unshift(name);
      if (destination.length > 32) destination.length = 32;
    }
  };
  if (language === 'python') {
    collect(/\b([A-Za-z_]\w*)\s*(?::\s*(?:list|List)(?:\[[^\]\n]*\])?\s*)?=\s*(?:\[|list\s*\()/g, arrays);
    collect(/\b([A-Za-z_]\w*)\s*:\s*(?:list|List)(?:\[|\b)/g, arrays);
    collect(/\b([A-Za-z_]\w*)\s*(?::\s*int\s*)?=\s*(?:-?\d+\b|len\s*\()/g, integers);
    collect(/\b([A-Za-z_]\w*)\s*:\s*int\b/g, integers);
    for (const match of code.matchAll(/\bdef\s+\w+\s*\(([^)]*)\)/g)) {
      for (const parameter of match[1].split(',')) {
        const name = /^\s*([A-Za-z_]\w*)/.exec(parameter)?.[1];
        if (!name || INTERNAL_NAMES.has(name)) continue;
        if (/^(nums|arr|items|values|data|matrix|board)$/.test(name) && !arrays.includes(name)) arrays.unshift(name);
        if (/^(target|key|k|n|size|length)$/.test(name) && !integers.includes(name)) integers.unshift(name);
      }
    }
  } else {
    if (language === 'cpp') {
      collect(/\b(?:std::)?vector\s*<\s*int\s*>\s*[&*]?\s*([A-Za-z_]\w*)/g, arrays);
      collect(/\bint\s+([A-Za-z_]\w*)\s*\[/g, arrays);
    } else {
      collect(/\bint\s*\[\s*\]\s+([A-Za-z_]\w*)/g, arrays);
    }
    collect(/\b(?:int|long|size_t)\s+([A-Za-z_]\w*)\s*(?=[=,;)])/g, integers);
  }
  return { language, arrays, integers };
}

export function chooseNames(context: ScannedContext): { array: string; target: string; window: string } {
  const array = context.arrays.find(name => !['target', 'key', 'k'].includes(name)) ?? 'nums';
  const target = context.integers.find(name => /^(target|key|searchValue)$/i.test(name) && name !== array) ?? 'target';
  const window = context.integers.find(name => /^(k|windowSize)$/i.test(name) && name !== array) ?? 'k';
  return { array, target, window };
}
