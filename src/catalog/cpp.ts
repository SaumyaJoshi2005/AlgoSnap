import { LegacyTemplate } from './legacy';
function sample(label: string, detail: string, code: string): LegacyTemplate {
  return { label, description: label, detail, generate: () => code };
}
export const cppDS: LegacyTemplate[] = [
  sample('unordered_map / map', 'Hash and ordered map examples; insert at namespace scope.',
`// Requires <unordered_map> and <map>.
void mapExample() {
    int key = 7, val = 42;
    std::unordered_map<int, int> freq;
    ++freq[key];
    bool exists = freq.count(key) != 0;
    freq.erase(key);
    std::map<int, int> ordered;
    ordered[key] = val;
    auto smallest = ordered.begin();
    auto largest = ordered.rbegin();
    (void)exists; (void)smallest; (void)largest;
}`),
  sample('unordered_set / set', 'Hash and sorted-set operations; O(1) average / O(log n).',
`// Requires <unordered_set> and <set>.
void setExample() {
    int x = 7;
    std::unordered_set<int> seen;
    seen.insert(x);
    bool exists = seen.count(x) != 0;
    seen.erase(x);
    std::set<int> ordered;
    ordered.insert(x);
    auto firstAtLeast = ordered.lower_bound(x);
    auto firstGreater = ordered.upper_bound(x);
    (void)exists; (void)firstAtLeast; (void)firstGreater;
}`),
  sample('Priority queue (heap)', 'Min/max heaps and priority-value pairs.',
`// Requires <queue>, <vector>, <functional>, and <utility>.
void heapExample() {
    std::priority_queue<int> maxHeap;
    maxHeap.push(3);
    int top = maxHeap.top();
    maxHeap.pop();
    std::priority_queue<int, std::vector<int>, std::greater<int>> minHeap;
    minHeap.push(3);
    std::priority_queue<std::pair<int, int>, std::vector<std::pair<int, int>>, std::greater<>> pq;
    int dist = 2, node = 7;
    pq.push({dist, node});
    (void)top;
}`),
  sample('Stack and Queue', 'Stack, queue, and deque examples. O(1) push/pop.',
`// Requires <stack>, <queue>, and <deque>.
void stackQueueExample() {
    std::stack<int> st;
    st.push(1);
    int top = st.top();
    st.pop();
    std::queue<int> q;
    q.push(1);
    int front = q.front();
    q.pop();
    std::deque<int> dq;
    dq.push_front(0);
    dq.push_back(1);
    dq.pop_front();
    dq.pop_back();
    (void)top; (void)front;
}`),
  sample('Union-Find (DSU)', 'Path compression and union by rank; amortized O(alpha(n)).',
`// Requires <vector>, <numeric>, <utility>, and <stdexcept>.
struct DSU {
    std::vector<int> parent, rank;
    int components;
    explicit DSU(int n) : components(n) {
        if (n < 0) throw std::invalid_argument("size must be nonnegative");
        parent.resize(n);
        rank.assign(n, 0);
        std::iota(parent.begin(), parent.end(), 0);
    }
    int find(int x) {
        if (x < 0 || x >= static_cast<int>(parent.size())) throw std::out_of_range("index");
        if (parent[x] != x) parent[x] = find(parent[x]);
        return parent[x];
    }
    bool unite(int x, int y) {
        x = find(x); y = find(y);
        if (x == y) return false;
        if (rank[x] < rank[y]) std::swap(x, y);
        parent[y] = x;
        if (rank[x] == rank[y]) ++rank[x];
        --components;
        return true;
    }
};`),
  sample('Trie', 'Owns its nodes in a vector; O(L) average insert/search, no raw allocations.',
`// Requires <vector>, <unordered_map>, <string>, and <cstddef>.
struct Trie {
    struct Node {
        std::unordered_map<char, std::size_t> children;
        bool isEnd = false;
    };
    std::vector<Node> nodes{1};
    void insert(const std::string& word) {
        std::size_t node = 0;
        for (char ch : word) {
            auto it = nodes[node].children.find(ch);
            if (it == nodes[node].children.end()) {
                std::size_t next = nodes.size();
                nodes[node].children.emplace(ch, next);
                nodes.emplace_back();
                node = next;
            } else node = it->second;
        }
        nodes[node].isEnd = true;
    }
    bool search(const std::string& word) const {
        std::size_t node = 0;
        for (char ch : word) {
            auto it = nodes[node].children.find(ch);
            if (it == nodes[node].children.end()) return false;
            node = it->second;
        }
        return nodes[node].isEnd;
    }
    bool startsWith(const std::string& prefix) const {
        std::size_t node = 0;
        for (char ch : prefix) {
            auto it = nodes[node].children.find(ch);
            if (it == nodes[node].children.end()) return false;
            node = it->second;
        }
        return true;
    }
};`)
];
export const cppBFS: LegacyTemplate[] = [sample('BFS on graph',
  'Adjacency list with vertices 0..n-1. Returns distances (-1 for unreachable). O(V+E).',
`// Requires <vector>, <queue>, and <stdexcept>.
std::vector<int> bfs(const std::vector<std::vector<int>>& graph, int src, int n) {
    if (n < 0 || static_cast<std::size_t>(n) != graph.size() || src < 0 || src >= n)
        throw std::invalid_argument("invalid graph size or source");
    for (const auto& row : graph) for (int v : row)
        if (v < 0 || v >= n) throw std::out_of_range("edge endpoint");
    std::vector<int> dist(n, -1);
    std::queue<int> q;
    dist[src] = 0;
    q.push(src);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : graph[u]) if (dist[v] == -1) {
            dist[v] = dist[u] + 1;
            q.push(v);
        }
    }
    return dist;
}`)];
export const cppDP: LegacyTemplate[] = [
  sample('Knapsack 0/1', 'Nonnegative weights/capacity, equal-length vectors. O(n*capacity).',
`// Requires <vector>, <algorithm>, <limits>, and <stdexcept>.
long long knapsack(const std::vector<int>& weights, const std::vector<int>& values, int capacity) {
    if (capacity < 0 || capacity == std::numeric_limits<int>::max() || weights.size() != values.size())
        throw std::invalid_argument("invalid capacity or lengths");
    for (int w : weights) if (w < 0) throw std::invalid_argument("negative weight");
    std::vector<long long> dp(static_cast<std::size_t>(capacity) + 1, 0);
    for (std::size_t i = 0; i < weights.size(); ++i)
        for (int c = capacity; c >= weights[i]; --c)
            dp[c] = std::max(dp[c], dp[c - weights[i]] + values[i]);
    return dp[capacity];
}`),
  sample('Longest Common Subsequence', 'Length of LCS. O(m*n) time and space.',
`// Requires <string>, <vector>, and <algorithm>.
int lcs(const std::string& s1, const std::string& s2) {
    std::size_t m = s1.size(), n = s2.size();
    std::vector<std::vector<int>> dp(m + 1, std::vector<int>(n + 1, 0));
    for (std::size_t i = 1; i <= m; ++i)
        for (std::size_t j = 1; j <= n; ++j)
            dp[i][j] = s1[i - 1] == s2[j - 1] ? dp[i - 1][j - 1] + 1
                : std::max(dp[i - 1][j], dp[i][j - 1]);
    return dp[m][n];
}`),
  sample('Coin change: minimum coins', 'Positive coins, nonnegative amount. O(amount*coins).',
`// Requires <vector>, <algorithm>, <limits>, and <stdexcept>.
int coinChange(const std::vector<int>& coins, int amount) {
    if (amount < 0 || amount == std::numeric_limits<int>::max()) throw std::invalid_argument("invalid amount");
    for (int c : coins) if (c <= 0) throw std::invalid_argument("coins must be positive");
    std::vector<int> dp(static_cast<std::size_t>(amount) + 1, amount + 1);
    dp[0] = 0;
    for (int c : coins)
        for (int x = c; x <= amount; ++x)
            if (dp[x - c] <= amount) dp[x] = std::min(dp[x], dp[x - c] + 1);
    return dp[amount] > amount ? -1 : dp[amount];
}`)
];
export const cppGraph: LegacyTemplate[] = [
  sample("Dijkstra's shortest path", 'Nonnegative int weights; long long distances, LLONG_MAX if unreachable.',
`// Requires <vector>, <queue>, <utility>, <functional>, <limits>, and <stdexcept>.
std::vector<long long> dijkstra(const std::vector<std::vector<std::pair<int, int>>>& graph, int src, int n) {
    if (n < 0 || static_cast<std::size_t>(n) != graph.size() || src < 0 || src >= n)
        throw std::invalid_argument("invalid graph size or source");
    for (const auto& row : graph) for (auto [v, w] : row)
        if (v < 0 || v >= n || w < 0) throw std::invalid_argument("invalid edge");
    const long long inf = std::numeric_limits<long long>::max();
    std::vector<long long> dist(n, inf);
    using Entry = std::pair<long long, int>;
    std::priority_queue<Entry, std::vector<Entry>, std::greater<Entry>> pq;
    dist[src] = 0;
    pq.push({0, src});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d != dist[u]) continue;
        for (auto [v, w] : graph[u]) {
            if (d <= inf - w && d + w < dist[v]) {
                dist[v] = d + w;
                pq.push({dist[v], v});
            }
        }
    }
    return dist;
}`),
  sample('Topological sort (Kahn)', 'Returns an order or empty on a cycle. O(V+E).',
`// Requires <vector>, <queue>, and <stdexcept>.
std::vector<int> topoSort(int n, const std::vector<std::vector<int>>& graph) {
    if (n < 0 || static_cast<std::size_t>(n) != graph.size()) throw std::invalid_argument("invalid size");
    std::vector<std::size_t> inDegree(n, 0);
    for (const auto& row : graph) for (int v : row) {
        if (v < 0 || v >= n) throw std::out_of_range("edge endpoint");
        ++inDegree[v];
    }
    std::queue<int> q;
    for (int i = 0; i < n; ++i) if (inDegree[i] == 0) q.push(i);
    std::vector<int> order;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        order.push_back(u);
        for (int v : graph[u]) if (--inDegree[v] == 0) q.push(v);
    }
    if (order.size() != graph.size()) return {};
    return order;
}`)
];
