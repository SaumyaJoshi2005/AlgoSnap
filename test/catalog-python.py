"""Behavior tests for every restored Python template, with independent oracles."""
import contextlib
import io
import json
import random
import sys

with open(sys.argv[1], encoding='utf-8') as source:
    fixtures = json.load(source)

modules = {}
for item in fixtures:
    namespace = {}
    with contextlib.redirect_stdout(io.StringIO()):
        exec(compile(item['code'], item['id'], 'exec'), namespace)
    modules[item['id']] = namespace

covered = set()
def module(name):
    name = 'python-' + name
    covered.add(name)
    return modules[name]

def raises(error, function, *args):
    try:
        function(*args)
    except error:
        return
    raise AssertionError('expected ' + error.__name__)

bfs = module('bfs-graph')['bfs']
shortest = module('bfs-shortest')['bfs_shortest']
graph = {0: [1, 2], 1: [0, 3], 2: [3], 3: [], 4: []}
assert bfs(graph, 0) == {0, 1, 2, 3}
assert bfs({}, 'missing') == {'missing'}
assert shortest(graph, 0) == {0: 0, 1: 1, 2: 1, 3: 2}
assert shortest({0: [1]}, 0) == {0: 0, 1: 1}
grid_bfs = module('bfs-grid')['bfs_grid']
assert grid_bfs([], 0, 0) == grid_bfs([[]], 0, 0) == {}
assert grid_bfs([['#']], 0, 0) == grid_bfs([['.']], -1, 0) == {}
assert grid_bfs(['..', '#.'], 0, 0)[1, 1] == 2
raises(ValueError, grid_bfs, ['..', '.'], 0, 0)

knapsack = module('knapsack')['knapsack']
lcs = module('lcs')['lcs']
lis = module('lis')['lis']
coin_change = module('coin-change')['coin_change']
subset_sum = module('subset-sum')['subset_sum']
edit_distance = module('edit-distance')['edit_distance']
assert knapsack([], [], 0) == 0
assert knapsack([0, 1], [3, 5], 0) == 3
raises(ValueError, knapsack, [1], [], 1)
raises(ValueError, knapsack, [-1], [2], 2)
raises(ValueError, knapsack, [], [], -1)
assert lcs('abcde', 'ace') == 3 and lcs('', 'abc') == 0
assert lis([]) == 0 and lis([2, 2, 2]) == 1
assert coin_change([1, 2, 5], 11) == 3 and coin_change([2], 3) == -1
assert coin_change([], 0) == 0
raises(ValueError, coin_change, [0, 1], 2)
raises(ValueError, coin_change, [1], -1)
assert subset_sum([], 0) and not subset_sum([], 1)
raises(ValueError, subset_sum, [-1], 1)
raises(ValueError, subset_sum, [1], -1)
assert edit_distance('kitten', 'sitting') == 3
assert edit_distance('', 'abc') == 3 and edit_distance('same', 'same') == 0

Node = module('tree-inorder')['TreeNode']
inorder = modules['python-tree-inorder']['inorder']
level_order = module('tree-level-order')['level_order']
lca = module('tree-lca')['lca_bst']
depth = module('tree-depth')['max_depth']
valid_bst = module('tree-validate')['is_valid_bst']
root = Node(2, Node(1), Node(3))
assert inorder(root) == [1, 2, 3]
assert level_order(root) == [[2], [1, 3]]
assert lca(root, root.left, root.right) is root
assert depth(root) == 2 and valid_bst(root)
assert inorder(None) == level_order(None) == [] and depth(None) == 0 and valid_bst(None)
assert not valid_bst(Node(2, Node(2)))
chain = None
for value in reversed(range(3000)):
    chain = Node(value, None, chain)
assert depth(chain) == 3000 and valid_bst(chain) and len(inorder(chain)) == 3000

build = module('graph-build')['build_graph']
assert dict(build([(1, 2), (2, 3)])) == {1: [2], 2: [1, 3], 3: [2]}
topo = module('topological')['topo_sort']
assert topo(3, [(0, 1), (1, 2)]) == [0, 1, 2]
assert topo(2, [(0, 1), (1, 0)]) == [] and topo(0, []) == []
raises(ValueError, topo, 2, [(0, 2)])
raises(ValueError, topo, -1, [])
dijkstra = module('dijkstra')['dijkstra']
assert dijkstra({0: [(1, 5), (2, 1)], 2: [(1, 1)]}, 0) == {0: 0, 1: 2, 2: 1}
assert dijkstra({}, 0) == {0: 0}
assert dijkstra({0: [('sink', 0), (1, 0)]}, 0) == {0: 0, 'sink': 0, 1: 0}
raises(ValueError, dijkstra, {0: [(1, -1)]}, 0)
UnionFind = module('dsu')['UnionFind']
uf = UnionFind(4)
assert uf.union(0, 1) and uf.union(1, 2) and not uf.union(0, 2)
assert uf.find(0) == uf.find(2) and uf.components == 2
raises(IndexError, uf.find, -1)
raises(IndexError, uf.find, 4)
raises(ValueError, UnionFind, -1)

counter = module('counter')['frequency_counts']
assert counter([1, 2, 1])[0] == counter([1, 2, 1])[1] == {1: 2, 2: 1}
assert counter([])[0] == {}
next_greater = module('stack')['next_greater']
assert next_greater([2, 1, 2, 4, 3]) == [4, 2, 4, -1, -1]
max_window = module('queue')['max_sliding_window']
assert max_window([1, 3, -1, -3, 5, 3, 6, 7], 3) == [3, 3, 5, 5, 6, 7]
raises(ValueError, max_window, [], 1)
raises(ValueError, max_window, [1], 0)
heap = module('heap')
assert heap['smallest'] == 1 and heap['largest'] == 5 and heap['k_largest'] == [5, 4, 3]
linked = module('linked-list')
head = linked['ListNode'](1, linked['ListNode'](2, linked['ListNode'](3)))
assert linked['find_middle'](head).val == 2 and not linked['has_cycle'](head)
rev = linked['reverse_list'](head)
assert [rev.val, rev.next.val, rev.next.next.val] == [3, 2, 1]
rev.next.next.next = rev
assert linked['has_cycle'](rev) and not linked['has_cycle'](None)
Trie = module('trie')['Trie']
trie = Trie()
trie.insert('apple'); trie.insert('')
assert trie.search('apple') and not trie.search('app') and trie.starts_with('app') and trie.search('')
assert not trie.starts_with('bad')
SegmentTree = module('segment-tree')['SegmentTree']
segment = SegmentTree([1, 2, 3, 4])
assert segment.query(0, 4) == 10 and segment.query(2, 2) == 0
segment.update(1, 7)
assert segment.query(1, 3) == 10
assert SegmentTree([]).query(0, 0) == 0
raises(IndexError, segment.update, 4, 10)
raises(IndexError, segment.query, -1, 2)
raises(IndexError, SegmentTree([]).update, 0, 1)
SortedList = module('sorted-list')['SortedList']
sl = SortedList([3, 1, 3]); sl.add(2); sl.remove(3)
assert [sl[i] for i in range(len(sl))] == [1, 2, 3] and sl.bisect_left(2) == 1
raises(ValueError, sl.remove, 8)

rng = random.Random(1204)
for _ in range(100):
    size = rng.randrange(8)
    weights = [rng.randrange(5) for _ in range(size)]
    values = [rng.randrange(-3, 9) for _ in range(size)]
    capacity = rng.randrange(10)
    masks = [[i for i in range(size) if mask & (1 << i)] for mask in range(1 << size)]
    expected = max(sum(values[i] for i in indices) for indices in masks if sum(weights[i] for i in indices) <= capacity)
    assert knapsack(weights, values, capacity) == expected
    assert subset_sum(weights, capacity) == any(sum(weights[i] for i in indices) == capacity for indices in masks)
    increasing = [[values[i] for i in indices] for indices in masks]
    assert lis(values) == max(len(a) for a in increasing if all(a[i] < a[i+1] for i in range(len(a)-1)))
    if size:
        width = rng.randrange(1, size+1)
        assert max_window(values, width) == [max(values[i:i+width]) for i in range(size-width+1)]
        tree = SegmentTree(values)
        for lo in range(size+1):
            for hi in range(lo, size+1):
                assert tree.query(lo, hi) == sum(values[lo:hi])
    # Dijkstra compared with Bellman-Ford on random nonnegative graphs.
    graph = {i: [(j, rng.randrange(7)) for j in range(5) if rng.random() < .25] for i in range(5)}
    reference = [float('inf')]*5; reference[0] = 0
    for _pass in range(4):
        for u, edges in graph.items():
            for v, w in edges: reference[v] = min(reference[v], reference[u]+w)
    assert dijkstra(graph, 0) == {i: value for i, value in enumerate(reference) if value != float('inf')}

assert covered == set(modules), 'Every restored Python variant must have a behavior check'
print('PASS: 26 restored Python variants, edge cases, deep trees, and randomized DP/graph/window/range-query oracles')
