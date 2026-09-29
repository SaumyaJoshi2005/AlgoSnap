import { chooseNames, Language, ScannedContext } from './scanner';

export interface Template { id: string; label: string; detail: string; render(context: ScannedContext): string }
export interface Algorithm { id: string; label: string; aliases: readonly string[]; templates: readonly Template[] }
type Bodies = Record<Language, (array: string, target: string, window: string) => string>;
function template(id: string, label: string, detail: string, bodies: Bodies): Template {
  return { id, label, detail, render(context) {
    const names = chooseNames(context);
    return bodies[context.language](names.array, names.target, names.window);
  } };
}
const binary = template('binary-exact', 'Binary search: exact match',
  'Sorted ascending input. O(log n) time, O(1) space. Returns -1 if absent.', {
  python: (a, t) => `def binary_search(${a}, ${t}):
    left, right = 0, len(${a}) - 1
    while left <= right:
        mid = left + (right - left) // 2
        if ${a}[mid] == ${t}:
            return mid
        if ${a}[mid] < ${t}:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
  cpp: (a, t) => `// Requires <vector>. Sorted ascending input.
int binarySearch(const std::vector<int>& ${a}, int ${t}) {
    int left = 0, right = static_cast<int>(${a}.size()) - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (${a}[mid] == ${t}) return mid;
        if (${a}[mid] < ${t}) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
  java: (a, t) => `// Sorted ascending input. Insert inside a class, outside other methods.
public static int binarySearch(int[] ${a}, int ${t}) {
    int left = 0, right = ${a}.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (${a}[mid] == ${t}) return mid;
        if (${a}[mid] < ${t}) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`
});
function bound(upper: boolean): Template {
  const op = upper ? '<=' : '<';
  const snake = upper ? 'upper_bound' : 'lower_bound';
  const camel = upper ? 'upperBound' : 'lowerBound';
  return template(upper ? 'binary-upper' : 'binary-lower', upper ? 'Upper bound' : 'Lower bound',
    `Sorted ascending input. First index with value ${upper ? '>' : '>='} target, or length. O(log n).`, {
    python: (a, t) => `def ${snake}(${a}, ${t}):
    left, right = 0, len(${a})
    while left < right:
        mid = left + (right - left) // 2
        if ${a}[mid] ${op} ${t}:
            left = mid + 1
        else:
            right = mid
    return left`,
    cpp: (a, t) => `// Requires <vector>. Sorted ascending input; returns size if no match.
int ${camel}(const std::vector<int>& ${a}, int ${t}) {
    int left = 0, right = static_cast<int>(${a}.size());
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (${a}[mid] ${op} ${t}) left = mid + 1;
        else right = mid;
    }
    return left;
}`,
    java: (a, t) => `// Sorted ascending input; returns length if no match.
public static int ${camel}(int[] ${a}, int ${t}) {
    int left = 0, right = ${a}.length;
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (${a}[mid] ${op} ${t}) left = mid + 1;
        else right = mid;
    }
    return left;
}`
  });
}
const twoSum = template('two-sum', 'Two sum: sorted array',
  'Sorted ascending input. Zero-based indices or an empty result. O(n) time.', {
  python: (a, t) => `def two_sum(${a}, ${t}):
    left, right = 0, len(${a}) - 1
    while left < right:
        value = ${a}[left] + ${a}[right]
        if value == ${t}:
            return [left, right]
        if value < ${t}:
            left += 1
        else:
            right -= 1
    return []`,
  cpp: (a, t) => `// Requires <vector>. Sorted ascending input.
std::vector<int> twoSum(const std::vector<int>& ${a}, int ${t}) {
    int left = 0, right = static_cast<int>(${a}.size()) - 1;
    while (left < right) {
        long long value = static_cast<long long>(${a}[left]) + ${a}[right];
        if (value == ${t}) return {left, right};
        if (value < ${t}) ++left;
        else --right;
    }
    return {};
}`,
  java: (a, t) => `// Sorted ascending input.
public static int[] twoSum(int[] ${a}, int ${t}) {
    int left = 0, right = ${a}.length - 1;
    while (left < right) {
        long value = (long) ${a}[left] + ${a}[right];
        if (value == ${t}) return new int[]{left, right};
        if (value < ${t}) ++left;
        else --right;
    }
    return new int[0];
}`
});
const deduplicate = template('deduplicate', 'Remove duplicates in place',
  'Sorted input. Mutates the prefix; returns its logical length. O(n) time.', {
  python: a => `def remove_duplicates(${a}):
    if not ${a}:
        return 0
    slow = 0
    for fast in range(1, len(${a})):
        if ${a}[fast] != ${a}[slow]:
            slow += 1
            ${a}[slow] = ${a}[fast]
    return slow + 1`,
  cpp: a => `// Requires <vector>. Mutates the prefix of a sorted array.
int removeDuplicates(std::vector<int>& ${a}) {
    if (${a}.empty()) return 0;
    int slow = 0;
    for (int fast = 1; fast < static_cast<int>(${a}.size()); ++fast) {
        if (${a}[fast] != ${a}[slow]) ${a}[++slow] = ${a}[fast];
    }
    return slow + 1;
}`,
  java: a => `// Mutates the prefix of a sorted array.
public static int removeDuplicates(int[] ${a}) {
    if (${a}.length == 0) return 0;
    int slow = 0;
    for (int fast = 1; fast < ${a}.length; ++fast) {
        if (${a}[fast] != ${a}[slow]) ${a}[++slow] = ${a}[fast];
    }
    return slow + 1;
}`
});
const windowSum = template('window-sum', 'Fixed window: maximum sum',
  'Requires 1 <= k <= length; throws otherwise. O(n) time, O(1) space.', {
  python: (a, _t, k) => `def max_sum_window(${a}, ${k}):
    if not 1 <= ${k} <= len(${a}):
        raise ValueError("window size must be between 1 and length")
    value = 0
    for i in range(${k}):
        value += ${a}[i]
    best = value
    for i in range(${k}, len(${a})):
        value += ${a}[i] - ${a}[i - ${k}]
        best = max(best, value)
    return best`,
  cpp: (a, _t, k) => `// Requires <vector> and <stdexcept>.
long long maxSumWindow(const std::vector<int>& ${a}, int ${k}) {
    if (${k} < 1 || ${k} > static_cast<int>(${a}.size()))
        throw std::invalid_argument("window size must be between 1 and length");
    long long value = 0;
    for (int i = 0; i < ${k}; ++i) value += ${a}[i];
    long long best = value;
    for (int i = ${k}; i < static_cast<int>(${a}.size()); ++i) {
        value += static_cast<long long>(${a}[i]) - ${a}[i - ${k}];
        if (value > best) best = value;
    }
    return best;
}`,
  java: (a, _t, k) => `public static long maxSumWindow(int[] ${a}, int ${k}) {
    if (${k} < 1 || ${k} > ${a}.length)
        throw new IllegalArgumentException("window size must be between 1 and length");
    long value = 0;
    for (int i = 0; i < ${k}; ++i) value += ${a}[i];
    long best = value;
    for (int i = ${k}; i < ${a}.length; ++i) {
        value += (long) ${a}[i] - ${a}[i - ${k}];
        if (value > best) best = value;
    }
    return best;
}`
});
const islands = template('grid-dfs', 'Iterative DFS: count islands',
  'Rectangular 0/1 grid; four-way adjacency. Preserves input. O(rows * cols) time/space.', {
  python: () => `def count_islands(grid):
    if not grid:
        return 0
    rows, cols = len(grid), len(grid[0])
    if any(len(row) != cols for row in grid):
        raise ValueError("grid must be rectangular")
    seen = set()
    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != 1 or (r, c) in seen:
                continue
            count += 1
            stack = [(r, c)]
            seen.add((r, c))
            while stack:
                row, col = stack.pop()
                for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    nr, nc = row + dr, col + dc
                    if (0 <= nr < rows and 0 <= nc < cols
                            and grid[nr][nc] == 1 and (nr, nc) not in seen):
                        seen.add((nr, nc))
                        stack.append((nr, nc))
    return count`,
  cpp: () => `// Requires <vector>, <utility>, and <stdexcept>.
int countIslands(const std::vector<std::vector<int>>& grid) {
    if (grid.empty()) return 0;
    int rows = static_cast<int>(grid.size()), cols = static_cast<int>(grid[0].size());
    for (const auto& row : grid)
        if (static_cast<int>(row.size()) != cols) throw std::invalid_argument("grid must be rectangular");
    std::vector<std::vector<bool>> seen(rows, std::vector<bool>(cols, false));
    const int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
    int count = 0;
    for (int r = 0; r < rows; ++r) {
        for (int c = 0; c < cols; ++c) {
            if (grid[r][c] != 1 || seen[r][c]) continue;
            ++count;
            std::vector<std::pair<int, int>> stack = {{r, c}};
            seen[r][c] = true;
            while (!stack.empty()) {
                auto [row, col] = stack.back();
                stack.pop_back();
                for (int i = 0; i < 4; ++i) {
                    int nr = row + dr[i], nc = col + dc[i];
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1 && !seen[nr][nc]) {
                        seen[nr][nc] = true;
                        stack.emplace_back(nr, nc);
                    }
                }
            }
        }
    }
    return count;
}`,
  java: () => `public static int countIslands(int[][] grid) {
    if (grid.length == 0) return 0;
    int rows = grid.length, cols = grid[0].length;
    for (int[] row : grid)
        if (row.length != cols) throw new IllegalArgumentException("grid must be rectangular");
    boolean[][] seen = new boolean[rows][cols];
    int[] dr = {-1, 1, 0, 0}, dc = {0, 0, -1, 1};
    int count = 0;
    for (int r = 0; r < rows; ++r) {
        for (int c = 0; c < cols; ++c) {
            if (grid[r][c] != 1 || seen[r][c]) continue;
            ++count;
            java.util.ArrayDeque<int[]> stack = new java.util.ArrayDeque<>();
            stack.push(new int[]{r, c});
            seen[r][c] = true;
            while (!stack.isEmpty()) {
                int[] index = stack.pop();
                for (int i = 0; i < 4; ++i) {
                    int nr = index[0] + dr[i], nc = index[1] + dc[i];
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1 && !seen[nr][nc]) {
                        seen[nr][nc] = true;
                        stack.push(new int[]{nr, nc});
                    }
                }
            }
        }
    }
    return count;
}`
});
function rotatedBraces(a: string, t: string, java: boolean): string {
  const signature = java ? `public static int searchRotated(int[] ${a}, int ${t})` : `int searchRotated(const std::vector<int>& ${a}, int ${t})`;
  const length = java ? `${a}.length` : `static_cast<int>(${a}.size())`;
  return `// Rotated ascending array of DISTINCT values.${java ? '' : ' Requires <vector>.'}
${signature} {
    int left = 0, right = ${length} - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (${a}[mid] == ${t}) return mid;
        if (${a}[left] <= ${a}[mid]) {
            if (${a}[left] <= ${t} && ${t} < ${a}[mid]) right = mid - 1;
            else left = mid + 1;
        } else {
            if (${a}[mid] < ${t} && ${t} <= ${a}[right]) left = mid + 1;
            else right = mid - 1;
        }
    }
    return -1;
}`;
}
const rotated = template('binary-rotated', 'Binary search: rotated array',
  'Rotated ascending array of DISTINCT values. O(log n) time. Returns -1 if absent.', {
  python: (a, t) => `def search_rotated(${a}, ${t}):
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
    return -1`,
  cpp: (a, t) => rotatedBraces(a, t, false),
  java: (a, t) => rotatedBraces(a, t, true)
});
/** Single source of truth for aliases, routing, and picker entries. */
export const ALGORITHMS: readonly Algorithm[] = [
  { id: 'binary-search', label: 'Binary search', aliases: ['binary search', 'binary_search', 'binarysearch', 'bisect'], templates: [binary, bound(false), bound(true), rotated] },
  { id: 'two-pointers', label: 'Two pointers', aliases: ['two pointer', 'two pointers', 'two_pointer', 'twopointer', '2pointer', '2 pointer'], templates: [twoSum, deduplicate] },
  { id: 'sliding-window', label: 'Sliding window', aliases: ['sliding window', 'sliding_window', 'slidingwindow'], templates: [windowSum] },
  { id: 'dfs', label: 'Grid DFS', aliases: ['dfs', 'depth first', 'depth first search', 'depth_first', 'flood fill'], templates: [islands] }
];
export function findAlgorithm(keyword: string): Algorithm | undefined {
  const normalized = keyword.trim().toLowerCase();
  return ALGORITHMS.find(algorithm => algorithm.aliases.includes(normalized));
}
