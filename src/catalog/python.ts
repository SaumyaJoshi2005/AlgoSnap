// Migrated from main (070ca0f3); curated and tested with the v0.2 registry.
import { LegacyTemplate as Template, arr, target } from './legacy';

export const pythonBFS: Template[] = [
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
        for neighbor in ${g}.get(node, ()):
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
        for neighbor in ${g}.get(node, ()):
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
    if not ${g}:
        return {}
    rows, cols = len(${g}), len(${g}[0])
    if any(len(row) != cols for row in ${g}):
        raise ValueError("grid must be rectangular")
    if not (0 <= start_r < rows and 0 <= start_c < cols):
        return {}
    if ${g}[start_r][start_c] == '#':
        return {}
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

export const pythonDP: Template[] = [
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
    if ${cap} < 0 or len(${w}) != len(${v}) or any(w < 0 for w in ${w}):
        raise ValueError("nonnegative capacity/weights and equal lengths required")
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
    if ${amount} < 0 or any(c <= 0 for c in ${coins}):
        raise ValueError("amount must be nonnegative and coins positive")
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
    if ${t} < 0 or any(num < 0 for num in ${a}):
        raise ValueError("nonnegative target and values required")
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

export const pythonTree: Template[] = [
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
    result, stack = [], []
    while root or stack:
        while root:
            stack.append(root)
            root = root.left
        root = stack.pop()
        result.append(root.val)
        root = root.right
    return result`
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
    description: 'Height of tree using an explicit stack',
    detail: 'O(n) DFS.',
    generate: (_ctx) => (
`def max_depth(root):
    if not root:
        return 0
    stack, best = [(root, 1)], 0
    while stack:
        node, depth = stack.pop()
        best = max(best, depth)
        if node.left: stack.append((node.left, depth + 1))
        if node.right: stack.append((node.right, depth + 1))
    return best`
    )
  },
  {
    label: 'Validate BST',
    description: 'Check if tree is a valid BST',
    detail: 'O(n) with min/max bounds.',
    generate: (_ctx) => (
`def is_valid_bst(root, lo=float('-inf'), hi=float('inf')):
    stack = [(root, lo, hi)]
    while stack:
        node, lower, upper = stack.pop()
        if node is None:
            continue
        if not lower < node.val < upper:
            return False
        stack.append((node.left, lower, node.val))
        stack.append((node.right, node.val, upper))
    return True`
    )
  }
];

export const pythonGraph: Template[] = [
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
    if ${n_var} < 0:
        raise ValueError("node count must be nonnegative")
    graph = [[] for _ in range(${n_var})]
    in_degree = [0] * ${n_var}
    for u, v in ${edges}:
        if not (0 <= u < ${n_var} and 0 <= v < ${n_var}):
            raise ValueError("edge endpoint out of range")
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
from itertools import count

def dijkstra(${g}, src):
    if any(w < 0 for neighbors in ${g}.values() for _, w in neighbors):
        raise ValueError("Dijkstra requires nonnegative weights")
    sequence = count()
    dist = {src: 0}
    heap = [(0, next(sequence), src)]
    while heap:
        d, _, u = heapq.heappop(heap)
        if d > dist.get(u, float('inf')):
            continue
        for v, w in ${g}.get(u, ()):
            nd = d + w
            if nd < dist.get(v, float('inf')):
                dist[v] = nd
                heapq.heappush(heap, (nd, next(sequence), v))
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
        if n < 0:
            raise ValueError("size must be nonnegative")
        self.parent = list(range(n))
        self.rank = [0] * n
        self.components = n

    def find(self, x):
        if not 0 <= x < len(self.parent):
            raise IndexError("index out of range")
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

export const pythonDS: Template[] = [
  {
    label: 'HashMap / frequency counter',
    description: 'Count occurrences with defaultdict',
    detail: 'Most common dict pattern in interviews.',
    generate: (ctx) => {
      const a = arr(ctx);
      return (
`from collections import defaultdict, Counter

def frequency_counts(${a}):
    freq = Counter(${a})
    freq2 = defaultdict(int)
    for x in ${a}:
        freq2[x] += 1
    return freq, freq2`
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
    if not 1 <= k <= len(nums):
        raise ValueError("window size must be between 1 and length")
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
        if not 0 <= i < self.n:
            raise IndexError("index out of range")
        i += self.n
        self.tree[i] = val
        while i > 1:
            i //= 2
            self.tree[i] = self.tree[2*i] + self.tree[2*i+1]

    def query(self, lo, hi):  # sum in [lo, hi)
        if not 0 <= lo <= hi <= self.n:
            raise IndexError("invalid half-open query range")
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
    description: 'Sorted multiset using only the standard library',
    detail: 'O(log n) lookup, O(n) insertion/removal. Duplicates allowed.',
    generate: (_ctx) => (
`from bisect import bisect_left, insort

class SortedList:
    def __init__(self, values=()):
        self.values = sorted(values)

    def add(self, value):
        insort(self.values, value)

    def remove(self, value):
        index = bisect_left(self.values, value)
        if index == len(self.values) or self.values[index] != value:
            raise ValueError("value not found")
        self.values.pop(index)

    def bisect_left(self, value):
        return bisect_left(self.values, value)

    def __getitem__(self, index):
        return self.values[index]

    def __len__(self):
        return len(self.values)

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
