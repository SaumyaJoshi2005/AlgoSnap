import { ScannedContext } from './scanner';

export interface Template {
  label: string;
  description: string;
  detail: string;
  generate: (ctx: ScannedContext) => string;
}

export interface AlgoEntry {
  keywords: string[];
  templates: Template[];
}

// Pick best variable name with fallback
function arr(ctx: ScannedContext, fallback = 'nums'): string {
  return ctx.arrays[0] ?? fallback;
}
function lo(ctx: ScannedContext): string {
  return ctx.integers.find(v => /^lo|left|start|low$/i.test(v)) ?? ctx.integers[0] ?? 'lo';
}
function hi(ctx: ScannedContext): string {
  return ctx.integers.find(v => /^hi|right|end|high$/i.test(v)) ?? ctx.integers[1] ?? 'hi';
}
function target(ctx: ScannedContext): string {
  return ctx.integers.find(v => /target|key|val/i.test(v)) ?? 'target';
}
function n(ctx: ScannedContext): string {
  return ctx.integers.find(v => /^n$|^size$|^len$|^length$/i.test(v)) ?? 'n';
}

// ──────────────────────────────────────────
// PYTHON TEMPLATES
// ──────────────────────────────────────────
const pythonBinarySearch: Template[] = [
  {
    label: 'Classic — find exact target',
    description: 'Returns index of target or -1',
    detail: 'Standard iterative binary search. O(log n).',
    generate: (ctx) => {
      const a = arr(ctx); const t = target(ctx);
      return (
`def binary_search(${a}, ${t}):
    left, right = 0, len(${a}) - 1
    while left <= right:
        mid = left + (right - left) // 2
        if ${a}[mid] == ${t}:
            return mid
        elif ${a}[mid] < ${t}:
            left = mid + 1
        else:
            right = mid - 1
    return -1`
      );
    }
  },
  {
    label: 'Left bound — first occurrence',
    description: 'Finds leftmost index where arr[i] >= target',
    detail: 'Useful for lower_bound style queries.',
    generate: (ctx) => {
      const a = arr(ctx); const t = target(ctx);
      return (
`def lower_bound(${a}, ${t}):
    left, right = 0, len(${a})
    while left < right:
        mid = left + (right - left) // 2
        if ${a}[mid] < ${t}:
            left = mid + 1
        else:
            right = mid
    return left`
      );
    }
  },
  {
    label: 'Right bound — last occurrence',
    description: 'Finds rightmost index where arr[i] <= target',
    detail: 'Useful for upper_bound style queries.',
    generate: (ctx) => {
      const a = arr(ctx); const t = target(ctx);
      return (
`def upper_bound(${a}, ${t}):
    left, right = 0, len(${a})
    while left < right:
        mid = left + (right - left) // 2
        if ${a}[mid] <= ${t}:
            left = mid + 1
        else:
            right = mid
    return left - 1`
      );
    }
  },
  {
    label: 'Rotated sorted array',
    description: 'Search in array rotated at unknown pivot',
    detail: 'Handles arrays like [4,5,6,1,2,3].',
    generate: (ctx) => {
      const a = arr(ctx); const t = target(ctx);
      return (
`def search_rotated(${a}, ${t}):
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
    return -1`
      );
    }
  }
];

const pythonTwoPointers: Template[] = [
  {
    label: 'Two sum — sorted array',
    description: 'Find pair summing to target',
    detail: 'O(n) on a sorted array.',
    generate: (ctx) => {
      const a = arr(ctx); const t = target(ctx);
      return (
`def two_sum(${a}, ${t}):
    left, right = 0, len(${a}) - 1
    while left < right:
        s = ${a}[left] + ${a}[right]
        if s == ${t}:
            return [left, right]
        elif s < ${t}:
            left += 1
        else:
            right -= 1
    return []`
      );
    }
  },
  {
    label: 'Remove duplicates in-place',
    description: 'Deduplicate sorted array, return new length',
    detail: 'Classic slow/fast pointer pattern.',
    generate: (ctx) => {
      const a = arr(ctx);
      return (
`def remove_duplicates(${a}):
    if not ${a}:
        return 0
    slow = 0
    for fast in range(1, len(${a})):
        if ${a}[fast] != ${a}[slow]:
            slow += 1
            ${a}[slow] = ${a}[fast]
    return slow + 1`
      );
    }
  }
];

const pythonSlidingWindow: Template[] = [
  {
    label: 'Fixed window — max sum',
    description: 'Max sum subarray of size k',
    detail: 'Classic O(n) fixed-size window.',
    generate: (ctx) => {
      const a = arr(ctx); const k = n(ctx);
      return (
`def max_sum_window(${a}, ${k}):
    window_sum = sum(${a}[:${k}])
    max_sum = window_sum
    for i in range(${k}, len(${a})):
        window_sum += ${a}[i] - ${a}[i - ${k}]
        max_sum = max(max_sum, window_sum)
    return max_sum`
      );
    }
  },
  {
    label: 'Variable window — longest subarray',
    description: 'Longest subarray satisfying a condition',
    detail: 'Shrink left when condition breaks.',
    generate: (ctx) => {
      const a = arr(ctx);
      return (
`def longest_subarray(${a}):
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
    return best`
      );
    }
  }
];

const pythonDFS: Template[] = [
  {
    label: 'DFS on grid',
    description: 'Flood fill / island counting pattern',
    detail: 'Recursive DFS with visited tracking.',
    generate: (ctx) => {
      const g = ctx.arrays.find(v => /grid|matrix|board/i.test(v)) ?? 'grid';
      return (
`def dfs(${g}, row, col, visited):
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
    return count`
      );
    }
  }
];

// ──────────────────────────────────────────
// C++ TEMPLATES
// ──────────────────────────────────────────
const cppBinarySearch: Template[] = [
  {
    label: 'Classic — find exact target',
    description: 'Returns index or -1',
    detail: 'Iterative, avoids overflow with mid formula.',
    generate: (ctx) => {
      const a = arr(ctx); const t = target(ctx);
      return (
`int binarySearch(vector<int>& ${a}, int ${t}) {
    int left = 0, right = (int)${a}.size() - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (${a}[mid] == ${t}) return mid;
        else if (${a}[mid] < ${t}) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`
      );
    }
  },
  {
    label: 'STL lower_bound wrapper',
    description: 'First index where arr[i] >= target',
    detail: 'Wraps std::lower_bound cleanly.',
    generate: (ctx) => {
      const a = arr(ctx); const t = target(ctx);
      return (
`#include <algorithm>
int lowerBound(vector<int>& ${a}, int ${t}) {
    auto it = lower_bound(${a}.begin(), ${a}.end(), ${t});
    if (it == ${a}.end()) return -1;
    return (int)(it - ${a}.begin());
}`
      );
    }
  },
  {
    label: 'Binary search on answer',
    description: 'Search on a range of possible answers',
    detail: 'For "minimum max" or "maximum min" problems.',
    generate: (ctx) => {
      const a = arr(ctx);
      return (
`// Define: bool feasible(int mid, vector<int>& ${a})
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
}`
      );
    }
  }
];

const cppTwoPointers: Template[] = [
  {
    label: 'Two sum — sorted array',
    description: 'Find pair summing to target',
    detail: 'O(n) two pointer approach.',
    generate: (ctx) => {
      const a = arr(ctx); const t = target(ctx);
      return (
`vector<int> twoSum(vector<int>& ${a}, int ${t}) {
    int left = 0, right = (int)${a}.size() - 1;
    while (left < right) {
        int sum = ${a}[left] + ${a}[right];
        if (sum == ${t}) return {left, right};
        else if (sum < ${t}) left++;
        else right--;
    }
    return {};
}`
      );
    }
  }
];

const cppSlidingWindow: Template[] = [
  {
    label: 'Fixed window — max sum',
    description: 'Max subarray sum of size k',
    detail: 'Classic O(n) sliding window.',
    generate: (ctx) => {
      const a = arr(ctx); const k = n(ctx);
      return (
`int maxSumWindow(vector<int>& ${a}, int ${k}) {
    int windowSum = 0;
    for (int i = 0; i < ${k}; i++) windowSum += ${a}[i];
    int maxSum = windowSum;
    for (int i = ${k}; i < (int)${a}.size(); i++) {
        windowSum += ${a}[i] - ${a}[i - ${k}];
        maxSum = max(maxSum, windowSum);
    }
    return maxSum;
}`
      );
    }
  }
];

// ──────────────────────────────────────────
// JAVA TEMPLATES
// ──────────────────────────────────────────
const javaBinarySearch: Template[] = [
  {
    label: 'Classic — find exact target',
    description: 'Returns index or -1',
    detail: 'Standard iterative binary search.',
    generate: (ctx) => {
      const a = arr(ctx); const t = target(ctx);
      return (
`public int binarySearch(int[] ${a}, int ${t}) {
    int left = 0, right = ${a}.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (${a}[mid] == ${t}) return mid;
        else if (${a}[mid] < ${t}) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`
      );
    }
  },
  {
    label: 'Arrays.binarySearch wrapper',
    description: 'Uses Java standard library',
    detail: 'Returns negative value if not found.',
    generate: (ctx) => {
      const a = arr(ctx); const t = target(ctx);
      return (
`import java.util.Arrays;

// Returns index >= 0 if found, negative if not found
int idx = Arrays.binarySearch(${a}, ${t});
if (idx >= 0) {
    // found at index idx
} else {
    // insertion point is: -(idx + 1)
}`
      );
    }
  }
];

const javaTwoPointers: Template[] = [
  {
    label: 'Two sum — sorted array',
    description: 'Find pair summing to target',
    detail: 'O(n) two pointer approach.',
    generate: (ctx) => {
      const a = arr(ctx); const t = target(ctx);
      return (
`public int[] twoSum(int[] ${a}, int ${t}) {
    int left = 0, right = ${a}.length - 1;
    while (left < right) {
        int sum = ${a}[left] + ${a}[right];
        if (sum == ${t}) return new int[]{left, right};
        else if (sum < ${t}) left++;
        else right--;
    }
    return new int[]{};
}`
      );
    }
  }
];

// ──────────────────────────────────────────
// PYTHON — BFS
// ──────────────────────────────────────────
const pythonBFS: Template[] = [
  {
    label: 'BFS on graph (adjacency list)',
    description: 'Level-order traversal, shortest path',
    detail: 'O(V+E), uses deque.',
    generate: (ctx) => {
      const g = ctx.arrays.find(v => /graph|adj|edges/i.test(v)) ?? 'graph';
      return (
`from collections import deque

def bfs(${g}, start):
    visited = set([start])
    queue = deque([start])
    while queue:
        node = queue.popleft()
        for neighbor in ${g}[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
    return visited`
      );
    }
  },
  {
    label: 'BFS shortest path',
    description: 'Returns distance from start to every node',
    detail: 'O(V+E), dist dict tracks levels.',
    generate: (ctx) => {
      const g = ctx.arrays.find(v => /graph|adj|edges/i.test(v)) ?? 'graph';
      return (
`from collections import deque

def bfs_shortest(${g}, start):
    dist = {start: 0}
    queue = deque([start])
    while queue:
        node = queue.popleft()
        for neighbor in ${g}[node]:
            if neighbor not in dist:
                dist[neighbor] = dist[node] + 1
                queue.append(neighbor)
    return dist`
      );
    }
  },
  {
    label: 'BFS on grid',
    description: 'Shortest path in a 2D grid',
    detail: 'O(rows*cols), 4-directional.',
    generate: (ctx) => {
      const g = ctx.arrays.find(v => /grid|matrix|board/i.test(v)) ?? 'grid';
      return (
`from collections import deque

def bfs_grid(${g}, start_r, start_c):
    rows, cols = len(${g}), len(${g}[0])
    dist = {(start_r, start_c): 0}
    queue = deque([(start_r, start_c)])
    while queue:
        r, c = queue.popleft()
        for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
            nr, nc = r + dr, c + dc
            if (0 <= nr < rows and 0 <= nc < cols
                    and ${g}[nr][nc] != '#'
                    and (nr, nc) not in dist):
                dist[(nr, nc)] = dist[(r, c)] + 1
                queue.append((nr, nc))
    return dist`
      );
    }
  }
];

// ──────────────────────────────────────────
// PYTHON — DYNAMIC PROGRAMMING
// ──────────────────────────────────────────
const pythonDP: Template[] = [
  {
    label: 'Knapsack 0/1',
    description: 'Max value within weight capacity',
    detail: 'O(n*W) bottom-up DP.',
    generate: (ctx) => {
      const w = ctx.arrays.find(v => /weight/i.test(v)) ?? 'weights';
      const v = ctx.arrays.find(v => /value|profit/i.test(v)) ?? 'values';
      const cap = ctx.integers.find(i => /cap|W|capacity/i.test(i)) ?? 'capacity';
      return (
`def knapsack(${w}, ${v}, ${cap}):
    n = len(${w})
    dp = [[0] * (${cap} + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for c in range(${cap} + 1):
            dp[i][c] = dp[i-1][c]
            if ${w}[i-1] <= c:
                dp[i][c] = max(dp[i][c], dp[i-1][c - ${w}[i-1]] + ${v}[i-1])
    return dp[n][${cap}]`
      );
    }
  },
  {
    label: 'Longest Common Subsequence',
    description: 'LCS of two strings',
    detail: 'O(m*n) classic DP.',
    generate: (ctx) => {
      const s1 = ctx.strings[0] ?? 's1';
      const s2 = ctx.strings[1] ?? 's2';
      return (
`def lcs(${s1}, ${s2}):
    m, n = len(${s1}), len(${s2})
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if ${s1}[i-1] == ${s2}[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    return dp[m][n]`
      );
    }
  },
  {
    label: 'Longest Increasing Subsequence',
    description: 'LIS length in O(n log n)',
    detail: 'Patience sorting with binary search.',
    generate: (ctx) => {
      const a = arr(ctx);
      return (
`import bisect

def lis(${a}):
    tails = []
    for x in ${a}:
        pos = bisect.bisect_left(tails, x)
        if pos == len(tails):
            tails.append(x)
        else:
            tails[pos] = x
    return len(tails)`
      );
    }
  },
  {
    label: 'Coin change — minimum coins',
    description: 'Fewest coins to make amount',
    detail: 'O(amount * len(coins)) bottom-up.',
    generate: (ctx) => {
      const coins = ctx.arrays[0] ?? 'coins';
      const amount = ctx.integers.find(i => /amount|target|sum/i.test(i)) ?? 'amount';
      return (
`def coin_change(${coins}, ${amount}):
    dp = [float('inf')] * (${amount} + 1)
    dp[0] = 0
    for c in ${coins}:
        for x in range(c, ${amount} + 1):
            dp[x] = min(dp[x], dp[x - c] + 1)
    return dp[${amount}] if dp[${amount}] != float('inf') else -1`
      );
    }
  },
  {
    label: 'Subset sum',
    description: 'Can we reach target sum from array?',
    detail: 'O(n * target) boolean DP.',
    generate: (ctx) => {
      const a = arr(ctx);
      const t = target(ctx);
      return (
`def subset_sum(${a}, ${t}):
    dp = [False] * (${t} + 1)
    dp[0] = True
    for num in ${a}:
        for j in range(${t}, num - 1, -1):
            dp[j] = dp[j] or dp[j - num]
    return dp[${t}]`
      );
    }
  },
  {
    label: 'Edit distance',
    description: 'Min operations to convert s1 to s2',
    detail: 'O(m*n) Levenshtein distance.',
    generate: (ctx) => {
      const s1 = ctx.strings[0] ?? 's1';
      const s2 = ctx.strings[1] ?? 's2';
      return (
`def edit_distance(${s1}, ${s2}):
    m, n = len(${s1}), len(${s2})
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1): dp[i][0] = i
    for j in range(n + 1): dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if ${s1}[i-1] == ${s2}[j-1]:
                dp[i][j] = dp[i-1][j-1]
            else:
                dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
    return dp[m][n]`
      );
    }
  }
];

// ──────────────────────────────────────────
// PYTHON — TREES
// ──────────────────────────────────────────
const pythonTree: Template[] = [
  {
    label: 'TreeNode class + inorder traversal',
    description: 'Binary tree node definition + inorder',
    detail: 'Standard LC-style TreeNode.',
    generate: (_ctx) => (
`class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def inorder(root):
    if not root:
        return []
    return inorder(root.left) + [root.val] + inorder(root.right)`
    )
  },
  {
    label: 'Level order traversal (BFS)',
    description: 'Returns list of levels',
    detail: 'O(n), classic BFS on tree.',
    generate: (_ctx) => (
`from collections import deque

def level_order(root):
    if not root:
        return []
    result, queue = [], deque([root])
    while queue:
        level = []
        for _ in range(len(queue)):
            node = queue.popleft()
            level.append(node.val)
            if node.left:  queue.append(node.left)
            if node.right: queue.append(node.right)
        result.append(level)
    return result`
    )
  },
  {
    label: 'Lowest Common Ancestor',
    description: 'LCA of two nodes in BST',
    detail: 'O(h) using BST property.',
    generate: (_ctx) => (
`def lca_bst(root, p, q):
    while root:
        if p.val < root.val and q.val < root.val:
            root = root.left
        elif p.val > root.val and q.val > root.val:
            root = root.right
        else:
            return root
    return None`
    )
  },
  {
    label: 'Max depth of binary tree',
    description: 'Height of tree recursively',
    detail: 'O(n) DFS.',
    generate: (_ctx) => (
`def max_depth(root):
    if not root:
        return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))`
    )
  },
  {
    label: 'Validate BST',
    description: 'Check if tree is a valid BST',
    detail: 'O(n) with min/max bounds.',
    generate: (_ctx) => (
`def is_valid_bst(root, lo=float('-inf'), hi=float('inf')):
    if not root:
        return True
    if not (lo < root.val < hi):
        return False
    return (is_valid_bst(root.left, lo, root.val) and
            is_valid_bst(root.right, root.val, hi))`
    )
  }
];

// ──────────────────────────────────────────
// PYTHON — GRAPHS
// ──────────────────────────────────────────
const pythonGraph: Template[] = [
  {
    label: 'Build adjacency list from edges',
    description: 'Convert edge list to adj list',
    detail: 'defaultdict(list) pattern.',
    generate: (ctx) => {
      const edges = ctx.arrays.find(v => /edge/i.test(v)) ?? 'edges';
      return (
`from collections import defaultdict

def build_graph(${edges}):
    graph = defaultdict(list)
    for u, v in ${edges}:
        graph[u].append(v)
        graph[v].append(u)  # remove for directed
    return graph`
      );
    }
  },
  {
    label: 'Topological sort (Kahns BFS)',
    description: 'For DAGs — detects cycles too',
    detail: 'O(V+E), uses in-degree array.',
    generate: (ctx) => {
      const n_var = ctx.integers.find(i => /^n$|nodes/i.test(i)) ?? 'n';
      const edges = ctx.arrays.find(v => /edge|prereq/i.test(v)) ?? 'edges';
      return (
`from collections import deque

def topo_sort(${n_var}, ${edges}):
    graph = [[] for _ in range(${n_var})]
    in_degree = [0] * ${n_var}
    for u, v in ${edges}:
        graph[u].append(v)
        in_degree[v] += 1
    queue = deque(i for i in range(${n_var}) if in_degree[i] == 0)
    order = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for nei in graph[node]:
            in_degree[nei] -= 1
            if in_degree[nei] == 0:
                queue.append(nei)
    return order if len(order) == ${n_var} else []  # [] = cycle detected`
      );
    }
  },
  {
    label: "Dijkstra's shortest path",
    description: 'Single source shortest path (weighted)',
    detail: 'O((V+E) log V) with min-heap.',
    generate: (ctx) => {
      const g = ctx.arrays.find(v => /graph|adj/i.test(v)) ?? 'graph';
      return (
`import heapq

def dijkstra(${g}, src):
    dist = {src: 0}
    heap = [(0, src)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist.get(u, float('inf')):
            continue
        for v, w in ${g}[u]:
            nd = d + w
            if nd < dist.get(v, float('inf')):
                dist[v] = nd
                heapq.heappush(heap, (nd, v))
    return dist`
      );
    }
  },
  {
    label: 'Union-Find (DSU)',
    description: 'Disjoint set union with path compression',
    detail: 'O(α(n)) per operation.',
    generate: (_ctx) => (
`class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n
        self.components = n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x, y):
        px, py = self.find(x), self.find(y)
        if px == py:
            return False
        if self.rank[px] < self.rank[py]:
            px, py = py, px
        self.parent[py] = px
        if self.rank[px] == self.rank[py]:
            self.rank[px] += 1
        self.components -= 1
        return True`
    )
  }
];

// ──────────────────────────────────────────
// PYTHON — DATA STRUCTURES
// ──────────────────────────────────────────
const pythonDS: Template[] = [
  {
    label: 'HashMap / frequency counter',
    description: 'Count occurrences with defaultdict',
    detail: 'Most common dict pattern in interviews.',
    generate: (ctx) => {
      const a = arr(ctx);
      return (
`from collections import defaultdict, Counter

# Frequency count
freq = Counter(${a})

# Or manually with defaultdict
freq2 = defaultdict(int)
for x in ${a}:
    freq2[x] += 1

# Access safely
print(freq.most_common(3))   # top 3 elements
print(freq.get('key', 0))    # 0 if missing`
      );
    }
  },
  {
    label: 'Stack',
    description: 'LIFO stack using list',
    detail: 'push=append, pop=pop, peek=[-1].',
    generate: (_ctx) => (
`stack = []

stack.append(1)      # push
stack.append(2)
top = stack[-1]      # peek
val = stack.pop()    # pop

# Monotonic stack (next greater element)
def next_greater(nums):
    result = [-1] * len(nums)
    stack = []
    for i, x in enumerate(nums):
        while stack and nums[stack[-1]] < x:
            result[stack.pop()] = x
        stack.append(i)
    return result`
    )
  },
  {
    label: 'Queue / Deque',
    description: 'FIFO queue and double-ended queue',
    detail: 'O(1) appendleft and popleft.',
    generate: (_ctx) => (
`from collections import deque

q = deque()
q.append(1)          # enqueue right
q.appendleft(0)      # enqueue left
front = q[0]         # peek front
val = q.popleft()    # dequeue front
val2 = q.pop()       # dequeue back

# Sliding window maximum using deque
def max_sliding_window(nums, k):
    dq, result = deque(), []
    for i, x in enumerate(nums):
        while dq and nums[dq[-1]] < x:
            dq.pop()
        dq.append(i)
        if dq[0] < i - k + 1:
            dq.popleft()
        if i >= k - 1:
            result.append(nums[dq[0]])
    return result`
    )
  },
  {
    label: 'Heap / Priority Queue',
    description: 'Min-heap and max-heap patterns',
    detail: 'heapq is min-heap; negate for max.',
    generate: (_ctx) => (
`import heapq

# Min-heap
heap = []
heapq.heappush(heap, 3)
heapq.heappush(heap, 1)
smallest = heapq.heappop(heap)   # 1

# Max-heap (negate values)
max_heap = []
heapq.heappush(max_heap, -5)
heapq.heappush(max_heap, -2)
largest = -heapq.heappop(max_heap)   # 5

# Heapify existing list
nums = [3, 1, 4, 1, 5]
heapq.heapify(nums)

# K largest elements
k = 3
k_largest = heapq.nlargest(k, nums)

# Heap with tuples (priority, value)
tasks = []
heapq.heappush(tasks, (1, 'low priority'))
heapq.heappush(tasks, (0, 'urgent'))`
    )
  },
  {
    label: 'Linked List node',
    description: 'Singly linked list with common ops',
    detail: 'Node class + reverse + detect cycle.',
    generate: (_ctx) => (
`class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverse_list(head):
    prev, curr = None, head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev

def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            return True
    return False

def find_middle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow`
    )
  },
  {
    label: 'Trie (Prefix Tree)',
    description: 'Insert and search words',
    detail: 'O(L) insert/search where L = word length.',
    generate: (_ctx) => (
`class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.is_end = True

    def search(self, word):
        node = self.root
        for ch in word:
            if ch not in node.children:
                return False
            node = node.children[ch]
        return node.is_end

    def starts_with(self, prefix):
        node = self.root
        for ch in prefix:
            if ch not in node.children:
                return False
            node = node.children[ch]
        return True`
    )
  },
  {
    label: 'Segment Tree',
    description: 'Range sum query + point update',
    detail: 'O(log n) query and update.',
    generate: (ctx) => {
      const a = arr(ctx);
      return (
`class SegmentTree:
    def __init__(self, ${a}):
        self.n = len(${a})
        self.tree = [0] * (2 * self.n)
        for i, v in enumerate(${a}):
            self.tree[self.n + i] = v
        for i in range(self.n - 1, 0, -1):
            self.tree[i] = self.tree[2*i] + self.tree[2*i+1]

    def update(self, i, val):
        i += self.n
        self.tree[i] = val
        while i > 1:
            i //= 2
            self.tree[i] = self.tree[2*i] + self.tree[2*i+1]

    def query(self, lo, hi):  # sum in [lo, hi)
        lo += self.n
        hi += self.n
        res = 0
        while lo < hi:
            if lo & 1:
                res += self.tree[lo]; lo += 1
            if hi & 1:
                hi -= 1; res += self.tree[hi]
            lo //= 2; hi //= 2
        return res`
      );
    }
  },
  {
    label: 'Ordered set / sorted list',
    description: 'Maintain sorted order with fast insert',
    detail: 'Uses sortedcontainers (pip install).',
    generate: (_ctx) => (
`from sortedcontainers import SortedList

sl = SortedList()
sl.add(5)
sl.add(2)
sl.add(8)
sl.remove(2)
idx = sl.bisect_left(5)   # first index >= 5
print(sl[0], sl[-1])      # min, max`
    )
  }
];

// ──────────────────────────────────────────
// C++ — DATA STRUCTURES
// ──────────────────────────────────────────
const cppDS: Template[] = [
  {
    label: 'unordered_map / map',
    description: 'Hash map and ordered map',
    detail: 'O(1) avg vs O(log n) ordered.',
    generate: (_ctx) => (
`#include <unordered_map>
#include <map>

// Hash map — O(1) average
unordered_map<int, int> freq;
freq[key]++;
if (freq.count(key)) { /* exists */ }
freq.erase(key);

// Ordered map — O(log n), sorted by key
map<int, int> ordered;
ordered[key] = val;
auto it = ordered.begin();   // smallest
auto it2 = ordered.rbegin(); // largest`
    )
  },
  {
    label: 'unordered_set / set',
    description: 'Hash set and ordered set',
    detail: 'Fast lookup vs sorted iteration.',
    generate: (_ctx) => (
`#include <unordered_set>
#include <set>

unordered_set<int> seen;
seen.insert(x);
if (seen.count(x)) { /* exists */ }
seen.erase(x);

// Ordered set — sorted, unique
set<int> s;
s.insert(x);
auto it = s.lower_bound(x);  // first >= x
auto it2 = s.upper_bound(x); // first > x`
    )
  },
  {
    label: 'Priority queue (heap)',
    description: 'Max-heap and min-heap',
    detail: 'STL priority_queue.',
    generate: (_ctx) => (
`#include <queue>

// Max-heap (default)
priority_queue<int> maxHeap;
maxHeap.push(3);
int top = maxHeap.top();
maxHeap.pop();

// Min-heap
priority_queue<int, vector<int>, greater<int>> minHeap;
minHeap.push(3);

// With pairs: {priority, value}
priority_queue<pair<int,int>, vector<pair<int,int>>, greater<>> pq;
pq.push({dist, node});`
    )
  },
  {
    label: 'Stack and Queue',
    description: 'STL stack and queue',
    detail: 'Both O(1) push/pop.',
    generate: (_ctx) => (
`#include <stack>
#include <queue>
#include <deque>

stack<int> st;
st.push(1);
int top = st.top();
st.pop();

queue<int> q;
q.push(1);
int front = q.front();
q.pop();

// Deque — O(1) both ends
deque<int> dq;
dq.push_front(0);
dq.push_back(1);
dq.pop_front();
dq.pop_back();`
    )
  },
  {
    label: 'Union-Find (DSU)',
    description: 'Path compression + union by rank',
    detail: 'O(α(n)) per operation.',
    generate: (_ctx) => (
`struct DSU {
    vector<int> parent, rank;
    int components;

    DSU(int n) : parent(n), rank(n, 0), components(n) {
        iota(parent.begin(), parent.end(), 0);
    }

    int find(int x) {
        if (parent[x] != x)
            parent[x] = find(parent[x]);
        return parent[x];
    }

    bool unite(int x, int y) {
        x = find(x); y = find(y);
        if (x == y) return false;
        if (rank[x] < rank[y]) swap(x, y);
        parent[y] = x;
        if (rank[x] == rank[y]) rank[x]++;
        components--;
        return true;
    }
};`
    )
  },
  {
    label: 'Trie',
    description: 'Prefix tree for string search',
    detail: 'O(L) insert and search.',
    generate: (_ctx) => (
`struct TrieNode {
    unordered_map<char, TrieNode*> children;
    bool isEnd = false;
};

struct Trie {
    TrieNode* root = new TrieNode();

    void insert(const string& word) {
        auto* node = root;
        for (char c : word) {
            if (!node->children.count(c))
                node->children[c] = new TrieNode();
            node = node->children[c];
        }
        node->isEnd = true;
    }

    bool search(const string& word) {
        auto* node = root;
        for (char c : word) {
            if (!node->children.count(c)) return false;
            node = node->children[c];
        }
        return node->isEnd;
    }

    bool startsWith(const string& prefix) {
        auto* node = root;
        for (char c : prefix) {
            if (!node->children.count(c)) return false;
            node = node->children[c];
        }
        return true;
    }
};`
    )
  }
];

// ──────────────────────────────────────────
// C++ — BFS
// ──────────────────────────────────────────
const cppBFS: Template[] = [
  {
    label: 'BFS on graph',
    description: 'Level-order traversal',
    detail: 'O(V+E) with adjacency list.',
    generate: (ctx) => {
      const n_var = ctx.integers.find(i => /^n$/i.test(i)) ?? 'n';
      return (
`void bfs(vector<vector<int>>& graph, int src, int ${n_var}) {
    vector<int> dist(${n_var}, -1);
    queue<int> q;
    dist[src] = 0;
    q.push(src);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : graph[u]) {
            if (dist[v] == -1) {
                dist[v] = dist[u] + 1;
                q.push(v);
            }
        }
    }
}`
      );
    }
  }
];

// ──────────────────────────────────────────
// C++ — DP
// ──────────────────────────────────────────
const cppDP: Template[] = [
  {
    label: 'Knapsack 0/1',
    description: 'Max value within weight capacity',
    detail: 'O(n*W) bottom-up DP.',
    generate: (ctx) => {
      const cap = ctx.integers.find(i => /cap|W|capacity/i.test(i)) ?? 'W';
      return (
`int knapsack(vector<int>& weights, vector<int>& values, int ${cap}) {
    int n = weights.size();
    vector<vector<int>> dp(n + 1, vector<int>(${cap} + 1, 0));
    for (int i = 1; i <= n; i++) {
        for (int c = 0; c <= ${cap}; c++) {
            dp[i][c] = dp[i-1][c];
            if (weights[i-1] <= c)
                dp[i][c] = max(dp[i][c], dp[i-1][c - weights[i-1]] + values[i-1]);
        }
    }
    return dp[n][${cap}];
}`
      );
    }
  },
  {
    label: 'Longest Common Subsequence',
    description: 'LCS of two strings',
    detail: 'O(m*n) classic DP.',
    generate: (_ctx) => (
`int lcs(const string& s1, const string& s2) {
    int m = s1.size(), n = s2.size();
    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            dp[i][j] = (s1[i-1] == s2[j-1])
                ? dp[i-1][j-1] + 1
                : max(dp[i-1][j], dp[i][j-1]);
    return dp[m][n];
}`
    )
  },
  {
    label: 'Coin change — minimum coins',
    description: 'Fewest coins to make amount',
    detail: 'O(amount * coins) bottom-up.',
    generate: (ctx) => {
      const amount = ctx.integers.find(i => /amount|target/i.test(i)) ?? 'amount';
      return (
`int coinChange(vector<int>& coins, int ${amount}) {
    vector<int> dp(${amount} + 1, INT_MAX);
    dp[0] = 0;
    for (int c : coins)
        for (int x = c; x <= ${amount}; x++)
            if (dp[x - c] != INT_MAX)
                dp[x] = min(dp[x], dp[x - c] + 1);
    return dp[${amount}] == INT_MAX ? -1 : dp[${amount}];
}`
      );
    }
  }
];

// ──────────────────────────────────────────
// C++ — GRAPHS
// ──────────────────────────────────────────
const cppGraph: Template[] = [
  {
    label: "Dijkstra's shortest path",
    description: 'Single source shortest path',
    detail: 'O((V+E) log V) min-heap.',
    generate: (ctx) => {
      const n_var = ctx.integers.find(i => /^n$/i.test(i)) ?? 'n';
      return (
`vector<int> dijkstra(vector<vector<pair<int,int>>>& graph, int src, int ${n_var}) {
    vector<int> dist(${n_var}, INT_MAX);
    priority_queue<pair<int,int>, vector<pair<int,int>>, greater<>> pq;
    dist[src] = 0;
    pq.push({0, src});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) continue;
        for (auto [v, w] : graph[u]) {
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
    return dist;
}`
      );
    }
  },
  {
    label: 'Topological sort (Kahns)',
    description: 'BFS topo sort for DAG',
    detail: 'O(V+E), detects cycles.',
    generate: (ctx) => {
      const n_var = ctx.integers.find(i => /^n$/i.test(i)) ?? 'n';
      return (
`vector<int> topoSort(int ${n_var}, vector<vector<int>>& graph) {
    vector<int> inDegree(${n_var}, 0);
    for (int u = 0; u < ${n_var}; u++)
        for (int v : graph[u]) inDegree[v]++;
    queue<int> q;
    for (int i = 0; i < ${n_var}; i++)
        if (inDegree[i] == 0) q.push(i);
    vector<int> order;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        order.push_back(u);
        for (int v : graph[u])
            if (--inDegree[v] == 0) q.push(v);
    }
    return order.size() == ${n_var} ? order : {}; // {} = cycle
}`
      );
    }
  }
];

// ──────────────────────────────────────────
// JAVA — DATA STRUCTURES
// ──────────────────────────────────────────
const javaDS: Template[] = [
  {
    label: 'HashMap and HashSet',
    description: 'Standard Java map and set',
    detail: 'O(1) average operations.',
    generate: (_ctx) => (
`import java.util.*;

// HashMap
Map<Integer, Integer> map = new HashMap<>();
map.put(key, val);
map.getOrDefault(key, 0);
map.containsKey(key);
map.remove(key);
for (Map.Entry<Integer,Integer> e : map.entrySet())
    System.out.println(e.getKey() + " -> " + e.getValue());

// HashSet
Set<Integer> set = new HashSet<>();
set.add(x);
set.contains(x);
set.remove(x);`
    )
  },
  {
    label: 'PriorityQueue (heap)',
    description: 'Min-heap and max-heap',
    detail: 'O(log n) add/poll.',
    generate: (_ctx) => (
`import java.util.*;

// Min-heap (default)
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
minHeap.add(3);
int top = minHeap.peek();
minHeap.poll();

// Max-heap
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
maxHeap.add(3);

// With custom comparator (e.g. by second element of int[])
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
pq.add(new int[]{node, dist});`
    )
  },
  {
    label: 'Stack and Deque',
    description: 'Stack and double-ended queue',
    detail: 'Use ArrayDeque, not Stack class.',
    generate: (_ctx) => (
`import java.util.*;

// Stack (use Deque, not Stack class)
Deque<Integer> stack = new ArrayDeque<>();
stack.push(1);
int top = stack.peek();
stack.pop();

// Queue
Queue<Integer> queue = new LinkedList<>();
queue.offer(1);
int front = queue.peek();
queue.poll();

// Deque — both ends
Deque<Integer> dq = new ArrayDeque<>();
dq.offerFirst(0);
dq.offerLast(1);
dq.pollFirst();
dq.pollLast();`
    )
  },
  {
    label: 'TreeMap and TreeSet',
    description: 'Sorted map and set',
    detail: 'O(log n), ordered by key.',
    generate: (_ctx) => (
`import java.util.*;

TreeMap<Integer, Integer> tmap = new TreeMap<>();
tmap.put(key, val);
tmap.floorKey(x);    // largest key <= x
tmap.ceilingKey(x);  // smallest key >= x
tmap.firstKey();
tmap.lastKey();

TreeSet<Integer> tset = new TreeSet<>();
tset.add(x);
tset.floor(x);       // largest <= x
tset.ceiling(x);     // smallest >= x`
    )
  }
];

// ──────────────────────────────────────────
// JAVA — DP
// ──────────────────────────────────────────
const javaDP: Template[] = [
  {
    label: 'Coin change — minimum coins',
    description: 'Fewest coins to make amount',
    detail: 'O(amount * coins) bottom-up.',
    generate: (ctx) => {
      const amount = ctx.integers.find(i => /amount|target/i.test(i)) ?? 'amount';
      return (
`public int coinChange(int[] coins, int ${amount}) {
    int[] dp = new int[${amount} + 1];
    Arrays.fill(dp, ${amount} + 1);
    dp[0] = 0;
    for (int c : coins)
        for (int x = c; x <= ${amount}; x++)
            dp[x] = Math.min(dp[x], dp[x - c] + 1);
    return dp[${amount}] > ${amount} ? -1 : dp[${amount}];
}`
      );
    }
  },
  {
    label: 'Longest Common Subsequence',
    description: 'LCS of two strings',
    detail: 'O(m*n) classic DP.',
    generate: (_ctx) => (
`public int lcs(String s1, String s2) {
    int m = s1.length(), n = s2.length();
    int[][] dp = new int[m + 1][n + 1];
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            dp[i][j] = s1.charAt(i-1) == s2.charAt(j-1)
                ? dp[i-1][j-1] + 1
                : Math.max(dp[i-1][j], dp[i][j-1]);
    return dp[m][n];
}`
    )
  }
];

// ──────────────────────────────────────────
// REGISTRY
// ──────────────────────────────────────────
const ALGO_REGISTRY: AlgoEntry[] = [
  {
    keywords: ['binary search', 'binarysearch', 'bisect', 'binary_search'],
    templates: []  // filled per-language at runtime
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

export function getTemplatesForKeyword(keyword: string, ctx: ScannedContext): Template[] {
  const kw = keyword.toLowerCase().trim();
  const lang = ctx.language;

  // ── Search ──
  if (/binary.?search|bisect/.test(kw)) {
    if (lang === 'python') return pythonBinarySearch;
    if (lang === 'cpp' || lang === 'c') return cppBinarySearch;
    if (lang === 'java') return javaBinarySearch;
  }

  // ── Two pointers ──
  if (/two.?pointer|2.?pointer/.test(kw)) {
    if (lang === 'python') return pythonTwoPointers;
    if (lang === 'cpp' || lang === 'c') return cppTwoPointers;
    if (lang === 'java') return javaTwoPointers;
  }

  // ── Sliding window ──
  if (/sliding.?window/.test(kw)) {
    if (lang === 'python') return pythonSlidingWindow;
    if (lang === 'cpp' || lang === 'c') return cppSlidingWindow;
    return pythonSlidingWindow;
  }

  // ── DFS ──
  if (/^dfs$|depth.?first|flood.?fill/.test(kw)) {
    return pythonDFS;
  }

  // ── BFS ──
  if (/^bfs$|breadth.?first/.test(kw)) {
    if (lang === 'python') return pythonBFS;
    if (lang === 'cpp' || lang === 'c') return cppBFS;
    return pythonBFS;
  }

  // ── Dynamic Programming ──
  if (/^dp$|dynamic.?prog|knapsack|lcs|lis|coin.?change|edit.?dist|subset.?sum/.test(kw)) {
    if (lang === 'python') return pythonDP;
    if (lang === 'cpp' || lang === 'c') return cppDP;
    if (lang === 'java') return javaDP;
  }

  // ── Trees ──
  if (/^tree$|binary.?tree|bst|tree.?node|treenode|level.?order|inorder|lca/.test(kw)) {
    return pythonTree;
  }

  // ── Graphs ──
  if (/^graph$|dijkstra|topo.?sort|topological|union.?find|dsu/.test(kw)) {
    if (lang === 'python') return pythonGraph;
    if (lang === 'cpp' || lang === 'c') return cppGraph;
    return pythonGraph;
  }

  // ── Data Structures ──
  if (/hashmap|hash.?map|hash.?set|^map$|^dict$|freq|counter/.test(kw)) {
    if (lang === 'python') return [pythonDS[0]];
    if (lang === 'cpp' || lang === 'c') return [cppDS[0]];
    if (lang === 'java') return [javaDS[0]];
  }
  if (/^stack$/.test(kw)) {
    if (lang === 'python') return [pythonDS[1]];
    if (lang === 'cpp' || lang === 'c') return [cppDS[3]];
    if (lang === 'java') return [javaDS[2]];
  }
  if (/^queue$|^deque$/.test(kw)) {
    if (lang === 'python') return [pythonDS[2]];
    if (lang === 'cpp' || lang === 'c') return [cppDS[3]];
    if (lang === 'java') return [javaDS[2]];
  }
  if (/^heap$|priority.?queue/.test(kw)) {
    if (lang === 'python') return [pythonDS[3]];
    if (lang === 'cpp' || lang === 'c') return [cppDS[2]];
    if (lang === 'java') return [javaDS[1]];
  }
  if (/linked.?list|listnode/.test(kw)) {
    return [pythonDS[4]];
  }
  if (/^trie$|prefix.?tree/.test(kw)) {
    if (lang === 'python') return [pythonDS[5]];
    if (lang === 'cpp' || lang === 'c') return [cppDS[5]];
    return [pythonDS[5]];
  }
  if (/segment.?tree|seg.?tree/.test(kw)) {
    return [pythonDS[6]];
  }
  if (/sorted.?list|ordered.?set|treemap|treeset/.test(kw)) {
    if (lang === 'java') return [javaDS[3]];
    return [pythonDS[7]];
  }
  if (/^set$|^hashset$/.test(kw)) {
    if (lang === 'cpp' || lang === 'c') return [cppDS[1]];
    if (lang === 'java') return [javaDS[0]];
  }

  // ── All data structures (catch-all) ──
  if (/data.?struct|ds$/.test(kw)) {
    if (lang === 'python') return pythonDS;
    if (lang === 'cpp' || lang === 'c') return cppDS;
    if (lang === 'java') return javaDS;
  }

  return [];
}

export function getAllKeywords(): string[] {
  return ALGO_REGISTRY.flatMap(e => e.keywords);
}

// Keywords that trigger the popup automatically when typed at end of line
export const TRIGGER_KEYWORDS = [
  // Search
  'binary search', 'binary_search', 'binarysearch',
  // Pointers
  'two pointer', 'two_pointer', 'twopointer', '2pointer',
  // Window
  'sliding window', 'sliding_window', 'slidingwindow',
  // Graph traversal
  'dfs', 'depth first search',
  'bfs', 'breadth first search',
  // DP
  'dp', 'dynamic programming',
  'knapsack', 'coin change', 'edit distance', 'subset sum',
  'lcs', 'lis',
  // Trees
  'tree', 'binary tree', 'bst', 'treenode', 'level order', 'lca',
  // Graphs
  'graph', 'dijkstra', 'topo sort', 'topological sort', 'union find', 'dsu',
  // Data structures
  'hashmap', 'hash map', 'stack', 'queue', 'deque', 'heap',
  'priority queue', 'linked list', 'trie', 'segment tree',
  'treemap', 'treeset', 'sorted list'
];