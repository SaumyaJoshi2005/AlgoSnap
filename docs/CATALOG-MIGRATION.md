# Catalog reconciliation: main to 0.3.0

Source inspected: `070ca0f3ae2f19680e7c52c77ccf838911cc312f` on GitHub main.
The provided ZIP omitted these template collections. All 44 native-language
implementations are now registered and behavior-tested alongside the 24 core
implementations. Wrong-language fallbacks are intentionally not preserved.

| Original collection | New module | Native variants retained |
| --- | --- | --- |
| pythonBFS | catalog/python.ts | 3: graph reachability, shortest distances, grid BFS |
| pythonDP | catalog/python.ts | 6: knapsack, LCS, LIS, coin change, subset sum, edit distance |
| pythonTree | catalog/python.ts | 5: node/inorder, level order, BST LCA, depth, validation |
| pythonGraph | catalog/python.ts | 4: adjacency list, topological sort, Dijkstra, DSU |
| pythonDS | catalog/python.ts | 8: counter, stack, deque, heap, linked list, trie, segment tree, sorted list |
| cppBFS | catalog/cpp.ts | 1: graph BFS |
| cppDP | catalog/cpp.ts | 3: knapsack, LCS, coin change |
| cppGraph | catalog/cpp.ts | 2: Dijkstra, topological sort |
| cppDS | catalog/cpp.ts | 6: map, set, heap, stack/queue, DSU, trie |
| javaDP | catalog/java.ts | 2: coin change, LCS |
| javaDS | catalog/java.ts | 4: map/set, heap, stack/deque, ordered map/set |

## Deliberate correctness changes

- Python graph BFS and Dijkstra accept adjacency mappings with omitted sink nodes.
  Dijkstra rejects negative weights and supports equal-distance heterogeneous
  hashable node labels via a separate heap sequence counter.
- Grid BFS returns no distances for empty grids or invalid/blocked starts, and
  rejects ragged input. It retains the original `#` wall convention.
- Knapsack checks nonnegative weights/capacity and matching lengths. Coin change
  requires positive coins and nonnegative amounts; subset sum requires nonnegative
  values/target. DP resource complexity still limits feasible input sizes.
- Python inorder, tree depth, and BST validation are iterative. Tree inputs must
  be acyclic. BST LCA retains its precondition that both nodes belong to the BST.
- C++ BFS now returns the distances it computes rather than discarding them.
  Graph sizes/endpoints are checked. Dijkstra returns long long distances and
  uses LLONG_MAX for unreachable nodes. Topological sort returns an empty vector
  on a cycle (also the valid order for an empty graph).
- The C++ trie owns nodes by vector index, with no raw allocation or leaking
  root. Copying the trie produces an independent value.
- Segment-tree ranges/updates are bounds checked, including empty trees.
- Python frequency counting is a callable function returning both counters.
  The sorted-list example uses a standard-library sorted multiset (O(n) mutation),
  replacing the undeclared sortedcontainers dependency. Duplicates are supported.
- C++ examples are standalone functions/structs with required headers in their
  first comment and qualified standard names. Java examples are standalone static
  methods with fully qualified collection names and initialized sample variables.
  Java priority comparison uses Integer.compare, avoiding subtraction overflow.

## Scope

This reconciliation restores the extra collections listed above. The 0.2 core
cleanup remains: removed undefined-predicate sliding-window/answer-search skeletons
and mixed Java import/statements are documented omissions, not silently executable
templates. Core bounds have consistent insertion-index semantics. C remains unsupported.

Do not claim full language parity: trees/linked lists/segment trees/LIS/edit distance
currently exist only in Python; other availability is in README.md. Restored
parameters use descriptive defaults and explicit tab stops rather than unverified
multi-role context inference. Every restored template has a stable language-prefixed ID.
