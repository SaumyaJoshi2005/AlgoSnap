import type { Algorithm, Template } from '../templates';
import type { Language } from '../scanner';
import type { LegacyTemplate } from './legacy';
import { pythonBFS, pythonDP, pythonTree, pythonGraph, pythonDS } from './python';
import { cppBFS, cppDP, cppGraph, cppDS } from './cpp';
import { javaDP, javaDS } from './java';

function adapt(language: Language, id: string, source: LegacyTemplate, parameters: readonly string[] = [], contract = ''): Template {
  return { id: `${language}-${id}`, label: source.label, languages: [language], parameters,
    detail: `${source.detail} ${contract}`.trim(),
    render(context) {
      if (context.language !== language) throw new Error(`Template ${id} does not support ${context.language}`);
      // Multi-role names cannot be inferred safely from a flat nearby-variable list.
      // Keep deterministic defaults and expose explicit linked snippet parameters.
      return source.generate({ arrays: [], integers: [], strings: [] });
    }
  };
}
const pyBfs = [
  adapt('python','bfs-graph',pythonBFS[0],['graph','start'],'Mapping of hashable nodes to neighbors; omitted sinks allowed.'),
  adapt('python','bfs-shortest',pythonBFS[1],['graph','start'],'Mapping of hashable nodes to neighbors; omitted sinks allowed.'),
  adapt('python','bfs-grid',pythonBFS[2],['grid','start_r','start_c'],'Rectangular grid; # marks walls; invalid/blocked start returns {}.')
];
const pyDp = [
  adapt('python','knapsack',pythonDP[0],['weights','values','capacity'],'Integer weights/capacity >= 0; equal lengths.'),
  adapt('python','lcs',pythonDP[1],['s1','s2']),
  adapt('python','lis',pythonDP[2],['nums'],'Strictly increasing subsequence length.'),
  adapt('python','coin-change',pythonDP[3],['coins','amount'],'Integer coins > 0, amount >= 0.'),
  adapt('python','subset-sum',pythonDP[4],['nums','target'],'Nonnegative integers; each element used at most once.'),
  adapt('python','edit-distance',pythonDP[5],['s1','s2'])
];
const pyTrees = [
  adapt('python','tree-inorder',pythonTree[0],['root'],'Acyclic binary tree; iterative traversal.'),
  adapt('python','tree-level-order',pythonTree[1],['root'],'Nodes expose val/left/right; acyclic tree.'),
  adapt('python','tree-lca',pythonTree[2],['root','p','q'],'Distinct-value BST; p and q must belong to it.'),
  adapt('python','tree-depth',pythonTree[3],['root'],'Nodes expose left/right; acyclic tree.'),
  adapt('python','tree-validate',pythonTree[4],['root'],'Strict BST (duplicates invalid); numeric values, acyclic tree.')
];
const pyGraphs = [
  adapt('python','graph-build',pythonGraph[0],['edges'],'Undirected edges; hashable vertices.'),
  adapt('python','topological',pythonGraph[1],['n','edges'],'Vertices 0..n-1; [] on a cycle or empty graph.'),
  adapt('python','dijkstra',pythonGraph[2],['graph','src'],'Mapping to (neighbor, nonnegative integer weight) pairs.'),
  adapt('python','dsu',pythonGraph[3],['n'],'Indices 0..n-1; nonnegative size.')
];
const pyDs = [
  adapt('python','counter',pythonDS[0],['nums'],'Hashable items; returns Counter and defaultdict.'),
  adapt('python','stack',pythonDS[1],[],'Executable stack example and next_greater(nums) function.'),
  adapt('python','queue',pythonDS[2],[],'Executable deque example; maximum window requires 1 <= k <= length.'),
  adapt('python','heap',pythonDS[3],[],'Executable standard-library examples with sample values.'),
  adapt('python','linked-list',pythonDS[4],[],'reverse_list/find_middle require acyclic input; has_cycle detects cycles.'),
  adapt('python','trie',pythonDS[5],[],'Words/prefixes are strings; empty strings supported.'),
  adapt('python','segment-tree',pythonDS[6],['nums'],'Half-open ranges [lo, hi); bounds checked.'),
  adapt('python','sorted-list',pythonDS[7],[],'Standard library only; executable example; duplicate values allowed.')
];
const cppBfs = adapt('cpp','bfs-graph',cppBFS[0],['graph','src','n']);
const cppDp = [
  adapt('cpp','knapsack',cppDP[0],['weights','values','capacity']),
  adapt('cpp','lcs',cppDP[1],['s1','s2']),
  adapt('cpp','coin-change',cppDP[2],['coins','amount'])
];
const cppGraphs = [
  adapt('cpp','dijkstra',cppGraph[0],['graph','src','n']),
  adapt('cpp','topological',cppGraph[1],['n','graph'])
];
const cppDs = ['map','set','heap','stack-queue','dsu','trie'].map((id,i) => adapt('cpp',id,cppDS[i]));
const javaDp = [adapt('java','coin-change',javaDP[0],['coins','amount']), adapt('java','lcs',javaDP[1],['s1','s2'])];
const javaDs = ['map-set','heap','stack-queue','ordered'].map((id,i) => adapt('java',id,javaDS[i]));

function group(id: string, label: string, aliases: string[], templates: Template[]): Algorithm {
  return { id, label, aliases, templates };
}
/** Alias groups may share templates. getTemplates deduplicates the manual picker. */
export const EXTRA_ALGORITHMS: readonly Algorithm[] = [
  group('bfs','Breadth-first search',['bfs','breadth first','breadth first search','breadth_first'],[...pyBfs,cppBfs]),
  group('dp','Dynamic programming',['dp','dynamic programming','dynamic_programming'],[...pyDp,...cppDp,...javaDp]),
  group('knapsack','Knapsack',['knapsack'],[pyDp[0],cppDp[0]]),
  group('lcs','LCS',['lcs','longest common subsequence'],[pyDp[1],cppDp[1],javaDp[1]]),
  group('lis','LIS',['lis','longest increasing subsequence'],[pyDp[2]]),
  group('coin-change','Coin change',['coin change','coin_change'],[pyDp[3],cppDp[2],javaDp[0]]),
  group('subset-sum','Subset sum',['subset sum','subset_sum'],[pyDp[4]]),
  group('edit-distance','Edit distance',['edit distance','edit_distance'],[pyDp[5]]),
  group('tree','Binary trees',['tree','binary tree','bst','treenode','tree node'],pyTrees),
  group('inorder','Inorder',['inorder'],[pyTrees[0]]),
  group('level-order','Level order',['level order','level_order'],[pyTrees[1]]),
  group('lca','LCA',['lca'],[pyTrees[2]]),
  group('graph','Graphs',['graph'],[...pyGraphs,...cppGraphs,cppDs[4]]),
  group('dijkstra','Dijkstra',['dijkstra'],[pyGraphs[2],cppGraphs[0]]),
  group('topological','Topological sort',['topo sort','topological','topological sort','topo_sort'],[pyGraphs[1],cppGraphs[1]]),
  group('dsu','Disjoint sets',['dsu','union find','union_find'],[pyGraphs[3],cppDs[4]]),
  group('map','Maps and counters',['hashmap','hash map','hash_map','map','dict','freq','frequency','counter'],[pyDs[0],cppDs[0],javaDs[0]]),
  group('set','Sets',['set','hashset','hash set','hash_set'],[cppDs[1],javaDs[0]]),
  group('stack','Stack',['stack'],[pyDs[1],cppDs[3],javaDs[2]]),
  group('queue','Queue',['queue','deque'],[pyDs[2],cppDs[3],javaDs[2]]),
  group('heap','Heaps',['heap','priority queue','priority_queue'],[pyDs[3],cppDs[2],javaDs[1]]),
  group('linked-list','Linked list',['linked list','linked_list','listnode'],[pyDs[4]]),
  group('trie','Trie',['trie','prefix tree'],[pyDs[5],cppDs[5]]),
  group('segment-tree','Segment tree',['segment tree','segment_tree','seg tree'],[pyDs[6]]),
  group('sorted-list','Ordered collections',['sorted list','ordered set','treemap','treeset'],[pyDs[7],cppDs[1],javaDs[3]]),
  group('data-structures','Data structures',['data structures','data structure','data_structures','ds'],[...pyDs,pyGraphs[3],...cppDs,...javaDs])
];
