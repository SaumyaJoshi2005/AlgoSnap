import * as vscode from 'vscode';

export interface ScannedContext {
  arrays: string[];
  integers: string[];
  strings: string[];
  booleans: string[];
  language: string;
}

/**
 * Scans the code block surrounding the cursor and extracts
 * variable names by type so templates can use real names.
 */
export function scanContext(editor: vscode.TextEditor): ScannedContext {
  const doc = editor.document;
  const cursorLine = editor.selection.active.line;
  const language = doc.languageId; // 'python', 'cpp', 'java'

  // Grab up to 60 lines around cursor for context
  const startLine = Math.max(0, cursorLine - 40);
  const endLine = Math.min(doc.lineCount - 1, cursorLine + 20);
  const codeBlock = doc.getText(new vscode.Range(startLine, 0, endLine, 9999));

  const arrays: string[] = [];
  const integers: string[] = [];
  const strings: string[] = [];
  const booleans: string[] = [];

  if (language === 'python') {
    scanPython(codeBlock, arrays, integers, strings, booleans);
  } else if (language === 'cpp' || language === 'c') {
    scanCpp(codeBlock, arrays, integers, strings, booleans);
  } else if (language === 'java') {
    scanJava(codeBlock, arrays, integers, strings, booleans);
  }

  return { arrays, integers, strings, booleans, language };
}

function scanPython(
  code: string,
  arrays: string[], integers: string[], strings: string[], booleans: string[]
) {
  // List/array assignments: name = [...] or name = list(...)
  const listRe = /\b([a-zA-Z_]\w*)\s*=\s*(?:\[|\blist\()/g;
  let m: RegExpExecArray | null;
  while ((m = listRe.exec(code)) !== null) {
    pushUnique(arrays, m[1]);
  }

  // Integer-looking vars: n, lo, hi, mid, left, right, count, size, length, start, end
  const intRe = /\b([a-zA-Z_]\w*)\s*=\s*(?:-?\d+|len\()/g;
  while ((m = intRe.exec(code)) !== null) {
    pushUnique(integers, m[1]);
  }

  // String assignments: name = "..." or name = '...'
  const strRe = /\b([a-zA-Z_]\w*)\s*=\s*["']/g;
  while ((m = strRe.exec(code)) !== null) {
    pushUnique(strings, m[1]);
  }

  // Function parameters that look like arrays (e.g. def search(nums, target):)
  const paramRe = /def\s+\w+\s*\(([^)]*)\)/g;
  while ((m = paramRe.exec(code)) !== null) {
    const params = m[1].split(',').map(p => p.trim().split(':')[0].trim());
    for (const p of params) {
      if (/nums|arr|lst|items|values|data/i.test(p)) {
        pushUnique(arrays, p);
      } else if (/n|lo|hi|mid|left|right|start|end|count|size|target|k/i.test(p)) {
        pushUnique(integers, p);
      }
    }
  }
}

function scanCpp(
  code: string,
  arrays: string[], integers: string[], strings: string[], booleans: string[]
) {
  // vector declarations: vector<...> name
  const vecRe = /\bvector\s*<[^>]+>\s+([a-zA-Z_]\w*)/g;
  let m: RegExpExecArray | null;
  while ((m = vecRe.exec(code)) !== null) {
    pushUnique(arrays, m[1]);
  }

  // Array declarations: int name[] or int name[N]
  const arrRe = /\b(?:int|long|double|float|char)\s+([a-zA-Z_]\w*)\s*\[/g;
  while ((m = arrRe.exec(code)) !== null) {
    pushUnique(arrays, m[1]);
  }

  // Integer vars: int n, lo, hi etc.
  const intRe = /\b(?:int|long long|long|size_t)\s+([a-zA-Z_]\w*)(?:\s*=|\s*,|\s*;)/g;
  while ((m = intRe.exec(code)) !== null) {
    pushUnique(integers, m[1]);
  }

  // Function params
  const funcRe = /\w+\s+\w+\s*\(([^)]*)\)/g;
  while ((m = funcRe.exec(code)) !== null) {
    const params = m[1].split(',');
    for (const param of params) {
      const nameMatch = param.trim().match(/(\w+)\s*(?:=|$)/);
      if (nameMatch) {
        if (/vector|int\s*\[/.test(param)) pushUnique(arrays, nameMatch[1]);
        else if (/\bint\b|\blong\b/.test(param)) pushUnique(integers, nameMatch[1]);
      }
    }
  }
}

function scanJava(
  code: string,
  arrays: string[], integers: string[], strings: string[], booleans: string[]
) {
  // int[] or Integer[] declarations
  const arrRe = /(?:int|Integer|long|Long|double|String)\s*\[\s*\]\s+([a-zA-Z_]\w*)/g;
  let m: RegExpExecArray | null;
  while ((m = arrRe.exec(code)) !== null) {
    pushUnique(arrays, m[1]);
  }

  // ArrayList / List declarations
  const listRe = /(?:ArrayList|List)\s*<[^>]+>\s+([a-zA-Z_]\w*)/g;
  while ((m = listRe.exec(code)) !== null) {
    pushUnique(arrays, m[1]);
  }

  // Integer variables
  const intRe = /\b(?:int|long)\s+([a-zA-Z_]\w*)\s*(?:=|;|,)/g;
  while ((m = intRe.exec(code)) !== null) {
    pushUnique(integers, m[1]);
  }

  // boolean vars
  const boolRe = /\bboolean\s+([a-zA-Z_]\w*)/g;
  while ((m = boolRe.exec(code)) !== null) {
    pushUnique(booleans, m[1]);
  }
}

function pushUnique(arr: string[], val: string) {
  const reserved = new Set(['if', 'else', 'for', 'while', 'return', 'true', 'false',
    'null', 'this', 'new', 'class', 'def', 'import', 'from', 'void', 'static',
    'public', 'private', 'int', 'long', 'float', 'double', 'String', 'bool']);
  if (!reserved.has(val) && !arr.includes(val) && val.length > 0) {
    arr.push(val);
  }
}