import { LegacyTemplate } from './legacy';
function sample(label: string, detail: string, code: string): LegacyTemplate {
  return { label, description: label, detail, generate: () => code };
}
export const javaDS: LegacyTemplate[] = [
  sample('HashMap and HashSet', 'Executable examples inside a class; O(1) average operations.',
`public static void mapSetExample() {
    int key = 7, val = 42, x = 3;
    java.util.Map<Integer, Integer> map = new java.util.HashMap<>();
    map.put(key, val);
    map.getOrDefault(key, 0);
    map.containsKey(key);
    map.remove(key);
    for (java.util.Map.Entry<Integer, Integer> entry : map.entrySet())
        System.out.println(entry.getKey() + " -> " + entry.getValue());
    java.util.Set<Integer> set = new java.util.HashSet<>();
    set.add(x);
    set.contains(x);
    set.remove(x);
}`),
  sample('PriorityQueue (heap)', 'Min/max heaps; overflow-safe priority comparison.',
`public static void heapExample() {
    java.util.PriorityQueue<Integer> minHeap = new java.util.PriorityQueue<>();
    minHeap.add(3);
    int top = minHeap.peek();
    minHeap.poll();
    java.util.PriorityQueue<Integer> maxHeap = new java.util.PriorityQueue<>(java.util.Collections.reverseOrder());
    maxHeap.add(top);
    java.util.PriorityQueue<int[]> pq = new java.util.PriorityQueue<>((a, b) -> Integer.compare(a[1], b[1]));
    int node = 7, dist = 2;
    pq.add(new int[]{node, dist});
}`),
  sample('Stack and Deque', 'ArrayDeque for stack, queue, and double-ended operations.',
`public static void stackQueueExample() {
    java.util.Deque<Integer> stack = new java.util.ArrayDeque<>();
    stack.push(1);
    int top = stack.peek();
    stack.pop();
    java.util.Queue<Integer> queue = new java.util.ArrayDeque<>();
    queue.offer(top);
    int front = queue.peek();
    queue.poll();
    java.util.Deque<Integer> dq = new java.util.ArrayDeque<>();
    dq.offerFirst(0);
    dq.offerLast(front);
    dq.pollFirst();
    dq.pollLast();
}`),
  sample('TreeMap and TreeSet', 'Sorted map/set, O(log n) lookups and updates.',
`public static void orderedExample() {
    int key = 7, val = 42, x = 3;
    java.util.TreeMap<Integer, Integer> map = new java.util.TreeMap<>();
    map.put(key, val);
    map.floorKey(x);
    map.ceilingKey(x);
    map.firstKey();
    map.lastKey();
    java.util.TreeSet<Integer> set = new java.util.TreeSet<>();
    set.add(x);
    set.floor(x);
    set.ceiling(x);
}`)
];
export const javaDP: LegacyTemplate[] = [
  sample('Coin change: minimum coins', 'Positive coins, nonnegative amount. O(amount*coins).',
`public static int coinChange(int[] coins, int amount) {
    if (amount < 0 || amount == Integer.MAX_VALUE) throw new IllegalArgumentException("invalid amount");
    for (int c : coins) if (c <= 0) throw new IllegalArgumentException("coins must be positive");
    int[] dp = new int[amount + 1];
    java.util.Arrays.fill(dp, amount + 1);
    dp[0] = 0;
    for (int c : coins)
        for (int x = c; x <= amount; ++x)
            if (dp[x - c] <= amount) dp[x] = Math.min(dp[x], dp[x - c] + 1);
    return dp[amount] > amount ? -1 : dp[amount];
}`),
  sample('Longest Common Subsequence', 'Length of LCS for non-null strings. O(m*n).',
`public static int lcs(String s1, String s2) {
    int m = s1.length(), n = s2.length();
    int[][] dp = new int[m + 1][n + 1];
    for (int i = 1; i <= m; ++i)
        for (int j = 1; j <= n; ++j)
            dp[i][j] = s1.charAt(i - 1) == s2.charAt(j - 1) ? dp[i - 1][j - 1] + 1
                : Math.max(dp[i - 1][j], dp[i][j - 1]);
    return dp[m][n];
}`)
];
