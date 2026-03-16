"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanContext = scanContext;
const vscode = __importStar(require("vscode"));
/**
 * Scans the code block surrounding the cursor and extracts
 * variable names by type so templates can use real names.
 */
function scanContext(editor) {
    const doc = editor.document;
    const cursorLine = editor.selection.active.line;
    const language = doc.languageId; // 'python', 'cpp', 'java'
    // Grab up to 60 lines around cursor for context
    const startLine = Math.max(0, cursorLine - 40);
    const endLine = Math.min(doc.lineCount - 1, cursorLine + 20);
    const codeBlock = doc.getText(new vscode.Range(startLine, 0, endLine, 9999));
    const arrays = [];
    const integers = [];
    const strings = [];
    const booleans = [];
    if (language === 'python') {
        scanPython(codeBlock, arrays, integers, strings, booleans);
    }
    else if (language === 'cpp' || language === 'c') {
        scanCpp(codeBlock, arrays, integers, strings, booleans);
    }
    else if (language === 'java') {
        scanJava(codeBlock, arrays, integers, strings, booleans);
    }
    return { arrays, integers, strings, booleans, language };
}
function scanPython(code, arrays, integers, strings, booleans) {
    // List/array assignments: name = [...] or name = list(...)
    const listRe = /\b([a-zA-Z_]\w*)\s*=\s*(?:\[|\blist\()/g;
    let m;
    while ((m = listRe.exec(code)) !== null) {
        pushUnique(arrays, m[1]);
    }
    // Integer-looking vars: n, lo, hi, mid, left, right, count, size, length, start, end
    const intRe = /\b([a-zA-Z_]\w*)\s*=\s*(?:-?\d+|len\()/g;
    while ((m = intRe.exec(code)) !== null) {
        pushUnique(integers, m[1]);
    }
    // Function parameters that look like arrays (e.g. def search(nums, target):)
    const paramRe = /def\s+\w+\s*\(([^)]*)\)/g;
    while ((m = paramRe.exec(code)) !== null) {
        const params = m[1].split(',').map(p => p.trim().split(':')[0].trim());
        for (const p of params) {
            if (/nums|arr|lst|items|values|data/i.test(p)) {
                pushUnique(arrays, p);
            }
            else if (/n|lo|hi|mid|left|right|start|end|count|size|target|k/i.test(p)) {
                pushUnique(integers, p);
            }
        }
    }
}
function scanCpp(code, arrays, integers, strings, booleans) {
    // vector declarations: vector<...> name
    const vecRe = /\bvector\s*<[^>]+>\s+([a-zA-Z_]\w*)/g;
    let m;
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
                if (/vector|int\s*\[/.test(param))
                    pushUnique(arrays, nameMatch[1]);
                else if (/\bint\b|\blong\b/.test(param))
                    pushUnique(integers, nameMatch[1]);
            }
        }
    }
}
function scanJava(code, arrays, integers, strings, booleans) {
    // int[] or Integer[] declarations
    const arrRe = /(?:int|Integer|long|Long|double|String)\s*\[\s*\]\s+([a-zA-Z_]\w*)/g;
    let m;
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
function pushUnique(arr, val) {
    const reserved = new Set(['if', 'else', 'for', 'while', 'return', 'true', 'false',
        'null', 'this', 'new', 'class', 'def', 'import', 'from', 'void', 'static',
        'public', 'private', 'int', 'long', 'float', 'double', 'String', 'bool']);
    if (!reserved.has(val) && !arr.includes(val) && val.length > 0) {
        arr.push(val);
    }
}
