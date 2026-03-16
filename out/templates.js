"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRIGGER_KEYWORDS = void 0;
exports.getTemplatesForKeyword = getTemplatesForKeyword;
exports.getAllKeywords = getAllKeywords;
// Pick best variable name with fallback
function arr(ctx, fallback = 'nums') {
    return ctx.arrays[0] ?? fallback;
}
function lo(ctx) {
    return ctx.integers.find(v => /^lo|left|start|low$/i.test(v)) ?? ctx.integers[0] ?? 'lo';
}
function hi(ctx) {
    return ctx.integers.find(v => /^hi|right|end|high$/i.test(v)) ?? ctx.integers[1] ?? 'hi';
}
function target(ctx) {
    return ctx.integers.find(v => /target|key|val/i.test(v)) ?? 'target';
}
function n(ctx) {
    return ctx.integers.find(v => /^n$|^size$|^len$|^length$/i.test(v)) ?? 'n';
}
// ──────────────────────────────────────────
// PYTHON TEMPLATES
// ──────────────────────────────────────────
const pythonBinarySearch = [
    {
        label: 'Classic — find exact target',
        description: 'Returns index of target or -1',
        detail: 'Standard iterative binary search. O(log n).',
        generate: (ctx) => {
            const a = arr(ctx);
            const t = target(ctx);
            return (`def binary_search(${a}, ${t}):
    left, right = 0, len(${a}) - 1
    while left <= right:
        mid = left + (right - left) // 2
        if ${a}[mid] == ${t}:
            return mid
        elif ${a}[mid] < ${t}:
            left = mid + 1
        else:
            right = mid - 1
    return -1`);
        }
    },
    {
        label: 'Left bound — first occurrence',
        description: 'Finds leftmost index where arr[i] >= target',
        detail: 'Useful for lower_bound style queries.',
        generate: (ctx) => {
            const a = arr(ctx);
            const t = target(ctx);
            return (`def lower_bound(${a}, ${t}):
    left, right = 0, len(${a})
    while left < right:
        mid = left + (right - left) // 2
        if ${a}[mid] < ${t}:
            left = mid + 1
        else:
            right = mid
    return left`);
        }
    },
    {
        label: 'Right bound — last occurrence',
        description: 'Finds rightmost index where arr[i] <= target',
        detail: 'Useful for upper_bound style queries.',
        generate: (ctx) => {
            const a = arr(ctx);
            const t = target(ctx);
            return (`def upper_bound(${a}, ${t}):
    left, right = 0, len(${a})
    while left < right:
        mid = left + (right - left) // 2
        if ${a}[mid] <= ${t}:
            left = mid + 1
        else:
            right = mid
    return left - 1`);
        }
    },
    {
        label: 'Rotated sorted array',
        description: 'Search in array rotated at unknown pivot',
        detail: 'Handles arrays like [4,5,6,1,2,3].',
        generate: (ctx) => {
            const a = arr(ctx);
            const t = target(ctx);
            return (`def search_rotated(${a}, ${t}):
    left, right = 0, len(${a}) - 1
    while left <= right:
        mid = left + (right - left) // 2
        if ${a}[mid] == ${t}:
            return mid
        if ${a}[left] <= ${a}[mid]:
            if ${a}[left] <= ${t} < ${a}[mid]:
                right = mid - 1
            else:
                left = mid + 1
        else:
            if ${a}[mid] < ${t} <= ${a}[right]:
                left = mid + 1
            else:
                right = mid - 1
    return -1`);
        }
    }
];
const pythonTwoPointers = [
    {
        label: 'Two sum — sorted array',
        description: 'Find pair summing to target',
        detail: 'O(n) on a sorted array.',
        generate: (ctx) => {
            const a = arr(ctx);
            const t = target(ctx);
            return (`def two_sum(${a}, ${t}):
    left, right = 0, len(${a}) - 1
    while left < right:
        s = ${a}[left] + ${a}[right]
        if s == ${t}:
            return [left, right]
        elif s < ${t}:
            left += 1
        else:
            right -= 1
    return []`);
        }
    },
    {
        label: 'Remove duplicates in-place',
        description: 'Deduplicate sorted array, return new length',
        detail: 'Classic slow/fast pointer pattern.',
        generate: (ctx) => {
            const a = arr(ctx);
            return (`def remove_duplicates(${a}):
    if not ${a}:
        return 0
    slow = 0
    for fast in range(1, len(${a})):
        if ${a}[fast] != ${a}[slow]:
            slow += 1
            ${a}[slow] = ${a}[fast]
    return slow + 1`);
        }
    }
];
const pythonSlidingWindow = [
    {
        label: 'Fixed window — max sum',
        description: 'Max sum subarray of size k',
        detail: 'Classic O(n) fixed-size window.',
        generate: (ctx) => {
            const a = arr(ctx);
            const k = n(ctx);
            return (`def max_sum_window(${a}, ${k}):
    window_sum = sum(${a}[:${k}])
    max_sum = window_sum
    for i in range(${k}, len(${a})):
        window_sum += ${a}[i] - ${a}[i - ${k}]
        max_sum = max(max_sum, window_sum)
    return max_sum`);
        }
    },
    {
        label: 'Variable window — longest subarray',
        description: 'Longest subarray satisfying a condition',
        detail: 'Shrink left when condition breaks.',
        generate: (ctx) => {
            const a = arr(ctx);
            return (`def longest_subarray(${a}):
    left = 0
    best = 0
    window = {}  # track frequency or sum
    for right in range(len(${a})):
        # TODO: expand window with ${a}[right]
        window[${a}[right]] = window.get(${a}[right], 0) + 1
        while not is_valid(window):   # define is_valid
            window[${a}[left]] -= 1
            if window[${a}[left]] == 0:
                del window[${a}[left]]
            left += 1
        best = max(best, right - left + 1)
    return best`);
        }
    }
];
const pythonDFS = [
    {
        label: 'DFS on grid',
        description: 'Flood fill / island counting pattern',
        detail: 'Recursive DFS with visited tracking.',
        generate: (ctx) => {
            const g = ctx.arrays.find(v => /grid|matrix|board/i.test(v)) ?? 'grid';
            return (`def dfs(${g}, row, col, visited):
    rows, cols = len(${g}), len(${g}[0])
    if (row < 0 or row >= rows or
        col < 0 or col >= cols or
        visited[row][col] or ${g}[row][col] == 0):
        return
    visited[row][col] = True
    for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
        dfs(${g}, row + dr, col + dc, visited)

def count_islands(${g}):
    rows, cols = len(${g}), len(${g}[0])
    visited = [[False]*cols for _ in range(rows)]
    count = 0
    for r in range(rows):
        for c in range(cols):
            if ${g}[r][c] == 1 and not visited[r][c]:
                dfs(${g}, r, c, visited)
                count += 1
    return count`);
        }
    }
];
// ──────────────────────────────────────────
// C++ TEMPLATES
// ──────────────────────────────────────────
const cppBinarySearch = [
    {
        label: 'Classic — find exact target',
        description: 'Returns index or -1',
        detail: 'Iterative, avoids overflow with mid formula.',
        generate: (ctx) => {
            const a = arr(ctx);
            const t = target(ctx);
            return (`int binarySearch(vector<int>& ${a}, int ${t}) {
    int left = 0, right = (int)${a}.size() - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (${a}[mid] == ${t}) return mid;
        else if (${a}[mid] < ${t}) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`);
        }
    },
    {
        label: 'STL lower_bound wrapper',
        description: 'First index where arr[i] >= target',
        detail: 'Wraps std::lower_bound cleanly.',
        generate: (ctx) => {
            const a = arr(ctx);
            const t = target(ctx);
            return (`#include <algorithm>
int lowerBound(vector<int>& ${a}, int ${t}) {
    auto it = lower_bound(${a}.begin(), ${a}.end(), ${t});
    if (it == ${a}.end()) return -1;
    return (int)(it - ${a}.begin());
}`);
        }
    },
    {
        label: 'Binary search on answer',
        description: 'Search on a range of possible answers',
        detail: 'For "minimum max" or "maximum min" problems.',
        generate: (ctx) => {
            const a = arr(ctx);
            return (`// Define: bool feasible(int mid, vector<int>& ${a})
// Returns true if mid is a valid answer
int binarySearchOnAnswer(vector<int>& ${a}) {
    int left = *min_element(${a}.begin(), ${a}.end());
    int right = *max_element(${a}.begin(), ${a}.end());
    int ans = right;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (feasible(mid, ${a})) {
            ans = mid;
            right = mid - 1;
        } else {
            left = mid + 1;
        }
    }
    return ans;
}`);
        }
    }
];
const cppTwoPointers = [
    {
        label: 'Two sum — sorted array',
        description: 'Find pair summing to target',
        detail: 'O(n) two pointer approach.',
        generate: (ctx) => {
            const a = arr(ctx);
            const t = target(ctx);
            return (`vector<int> twoSum(vector<int>& ${a}, int ${t}) {
    int left = 0, right = (int)${a}.size() - 1;
    while (left < right) {
        int sum = ${a}[left] + ${a}[right];
        if (sum == ${t}) return {left, right};
        else if (sum < ${t}) left++;
        else right--;
    }
    return {};
}`);
        }
    }
];
const cppSlidingWindow = [
    {
        label: 'Fixed window — max sum',
        description: 'Max subarray sum of size k',
        detail: 'Classic O(n) sliding window.',
        generate: (ctx) => {
            const a = arr(ctx);
            const k = n(ctx);
            return (`int maxSumWindow(vector<int>& ${a}, int ${k}) {
    int windowSum = 0;
    for (int i = 0; i < ${k}; i++) windowSum += ${a}[i];
    int maxSum = windowSum;
    for (int i = ${k}; i < (int)${a}.size(); i++) {
        windowSum += ${a}[i] - ${a}[i - ${k}];
        maxSum = max(maxSum, windowSum);
    }
    return maxSum;
}`);
        }
    }
];
// ──────────────────────────────────────────
// JAVA TEMPLATES
// ──────────────────────────────────────────
const javaBinarySearch = [
    {
        label: 'Classic — find exact target',
        description: 'Returns index or -1',
        detail: 'Standard iterative binary search.',
        generate: (ctx) => {
            const a = arr(ctx);
            const t = target(ctx);
            return (`public int binarySearch(int[] ${a}, int ${t}) {
    int left = 0, right = ${a}.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (${a}[mid] == ${t}) return mid;
        else if (${a}[mid] < ${t}) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`);
        }
    },
    {
        label: 'Arrays.binarySearch wrapper',
        description: 'Uses Java standard library',
        detail: 'Returns negative value if not found.',
        generate: (ctx) => {
            const a = arr(ctx);
            const t = target(ctx);
            return (`import java.util.Arrays;

// Returns index >= 0 if found, negative if not found
int idx = Arrays.binarySearch(${a}, ${t});
if (idx >= 0) {
    // found at index idx
} else {
    // insertion point is: -(idx + 1)
}`);
        }
    }
];
const javaTwoPointers = [
    {
        label: 'Two sum — sorted array',
        description: 'Find pair summing to target',
        detail: 'O(n) two pointer approach.',
        generate: (ctx) => {
            const a = arr(ctx);
            const t = target(ctx);
            return (`public int[] twoSum(int[] ${a}, int ${t}) {
    int left = 0, right = ${a}.length - 1;
    while (left < right) {
        int sum = ${a}[left] + ${a}[right];
        if (sum == ${t}) return new int[]{left, right};
        else if (sum < ${t}) left++;
        else right--;
    }
    return new int[]{};
}`);
        }
    }
];
// ──────────────────────────────────────────
// REGISTRY
// ──────────────────────────────────────────
const ALGO_REGISTRY = [
    {
        keywords: ['binary search', 'binarysearch', 'bisect', 'binary_search'],
        templates: [] // filled per-language at runtime
    },
    {
        keywords: ['two pointer', 'twopointer', 'two_pointer', '2 pointer', '2pointer'],
        templates: []
    },
    {
        keywords: ['sliding window', 'slidingwindow', 'sliding_window'],
        templates: []
    },
    {
        keywords: ['dfs', 'depth first', 'depth_first', 'flood fill'],
        templates: []
    }
];
function getTemplatesForKeyword(keyword, ctx) {
    const kw = keyword.toLowerCase().trim();
    const lang = ctx.language;
    if (/binary.?search|bisect/.test(kw)) {
        if (lang === 'python')
            return pythonBinarySearch;
        if (lang === 'cpp' || lang === 'c')
            return cppBinarySearch;
        if (lang === 'java')
            return javaBinarySearch;
    }
    if (/two.?pointer|2.?pointer/.test(kw)) {
        if (lang === 'python')
            return pythonTwoPointers;
        if (lang === 'cpp' || lang === 'c')
            return cppTwoPointers;
        if (lang === 'java')
            return javaTwoPointers;
    }
    if (/sliding.?window/.test(kw)) {
        if (lang === 'python')
            return pythonSlidingWindow;
        if (lang === 'cpp' || lang === 'c')
            return cppSlidingWindow;
        return pythonSlidingWindow; // fallback
    }
    if (/dfs|depth.?first|flood.?fill/.test(kw)) {
        return pythonDFS; // Python only for now
    }
    return [];
}
function getAllKeywords() {
    return ALGO_REGISTRY.flatMap(e => e.keywords);
}
// Keywords that should trigger the popup when typed
exports.TRIGGER_KEYWORDS = [
    'binary search', 'binary_search', 'binarysearch',
    'two pointer', 'two_pointer', 'twopointer', '2pointer',
    'sliding window', 'sliding_window', 'slidingwindow',
    'dfs', 'depth first search', 'flood fill'
];
