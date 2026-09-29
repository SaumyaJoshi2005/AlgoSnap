// Build and execute actual generated code using independent oracle cases.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { ALGORITHMS } = require('../out/templates');
const directory = path.resolve('.test-work/algorithms');
fs.mkdirSync(directory, { recursive: true });
const render = language => ALGORITHMS.flatMap(a => a.templates).map(t =>
  t.render({language, arrays:['data'], integers:['key','windowSize']})).join('\n\n');
function run(command, args, cwd = directory) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout: 60000 });
  if (result.error || result.status !== 0) throw new Error(`${command} failed: ${result.error ?? ''}\n${result.stdout}\n${result.stderr}`);
  if (result.stdout.trim()) console.log(result.stdout.trim());
}
fs.writeFileSync(path.join(directory, 'generated.py'), render('python') + `
import bisect, random
assert binary_search([], 1) == -1
assert lower_bound([], 1) == upper_bound([], 1) == 0
assert two_sum([], 0) == []
assert remove_duplicates([]) == 0
assert count_islands([]) == count_islands([[]]) == 0
assert count_islands([[1,0,1],[1,0,0],[0,1,1]]) == 3
assert count_islands([[1]*100 for _ in range(100)]) == 1
assert two_sum([2147483647,2147483647], -2) == []
assert max_sum_window([2147483647,2147483647], 2) == 4294967294
for a,k in [([],1),([1],0),([1],2),([1],-1)]:
    try: max_sum_window(a,k)
    except ValueError: pass
    else: raise AssertionError('invalid window accepted')
try: count_islands([[1],[]])
except ValueError: pass
else: raise AssertionError('ragged grid accepted')
rng = random.Random(42)
for _ in range(500):
    a = sorted(rng.randint(-20,20) for _ in range(rng.randint(0,30)))
    t = rng.randint(-25,25)
    idx = binary_search(a,t)
    assert (idx == -1 and t not in a) or (0 <= idx < len(a) and a[idx] == t)
    assert lower_bound(a,t) == bisect.bisect_left(a,t)
    assert upper_bound(a,t) == bisect.bisect_right(a,t)
    pair = two_sum(a,t)
    exists = any(a[i]+a[j] == t for i in range(len(a)) for j in range(i+1,len(a)))
    assert bool(pair) == exists
    if pair: assert pair[0] < pair[1] and a[pair[0]] + a[pair[1]] == t
    copy = a[:]
    length = remove_duplicates(copy)
    assert copy[:length] == sorted(set(a))
    if a:
        k = rng.randint(1,len(a))
        assert max_sum_window(a,k) == max(sum(a[i:i+k]) for i in range(len(a)-k+1))
for size in range(20):
    ordered = list(range(size))
    for pivot in range(max(1,size)):
        rotated = ordered[pivot:]+ordered[:pivot]
        for target in range(-1,size+1):
            assert search_rotated(rotated,target) == (rotated.index(target) if target in rotated else -1)
print('Python: all 8 templates passed edge cases and 500 randomized oracle cases')
`);
run(process.env.ALGOSNAP_PYTHON || 'python', ['generated.py']);
fs.writeFileSync(path.join(directory, 'generated.cpp'), `#include <vector>
#include <utility>
#include <stdexcept>
#include <algorithm>
#include <cassert>
#include <iostream>
` + render('cpp') + `
int main() {
    assert(binarySearch({},1) == -1);
    assert(lowerBound({},1) == 0 && upperBound({},1) == 0);
    assert(twoSum({},0).empty());
    assert(twoSum({2147483647,2147483647},-2).empty());
    assert(maxSumWindow({2147483647,2147483647},2) == 4294967294LL);
    assert(maxSumWindow({-8,-2,-3},2) == -5);
    for (int k : {-1,0,4}) {
        bool threw = false; try { maxSumWindow({1,2,3}, k); } catch(const std::invalid_argument&) { threw = true; }
        assert(threw);
    }
    std::vector<int> empty; assert(removeDuplicates(empty) == 0);
    std::vector<int> dup = {1,1,2,2,3}; assert(removeDuplicates(dup) == 3 && dup[0]==1 && dup[1]==2 && dup[2]==3);
    assert(countIslands({}) == 0 && countIslands({{}}) == 0);
    std::vector<std::vector<int>> grid = {{1,0,1},{1,0,0},{0,1,1}};
    auto copy = grid; assert(countIslands(grid) == 3 && grid == copy);
    assert(countIslands(std::vector<std::vector<int>>(100, std::vector<int>(100,1))) == 1);
    bool threw = false; try { countIslands({{1},{}}); } catch(const std::invalid_argument&) { threw = true; } assert(threw);
    for (int size=0; size<30; ++size) {
        std::vector<int> a; for (int i=0;i<size;++i) a.push_back(i/2-5);
        for (int t=-10;t<20;++t) {
            assert(lowerBound(a,t) == std::lower_bound(a.begin(),a.end(),t)-a.begin());
            assert(upperBound(a,t) == std::upper_bound(a.begin(),a.end(),t)-a.begin());
            int idx=binarySearch(a,t); assert((idx==-1 && !std::binary_search(a.begin(),a.end(),t)) || (idx>=0 && a[idx]==t));
        }
    }
    for (int pivot=0;pivot<20;++pivot) {
        std::vector<int> a; for(int i=0;i<20;++i) a.push_back((i+pivot)%20);
        for(int t=-1;t<=20;++t) assert(searchRotated(a,t) == ((t<0 || t==20) ? -1 : (t-pivot+20)%20));
    }
    std::cout << "C++17: all 8 templates passed runtime assertions";
}
`);
const executable = process.platform === 'win32' ? 'generated.exe' : 'generated';
run(process.env.ALGOSNAP_CXX || 'g++', ['-std=c++17','-Wall','-Wextra','-Werror','generated.cpp','-o',executable]);
run(path.join(directory, executable), []);
fs.writeFileSync(path.join(directory, 'Generated.java'), 'public class Generated {\n' + render('java') + `
public static void main(String[] args) {
    assert binarySearch(new int[]{},1) == -1;
    assert lowerBound(new int[]{},1) == 0 && upperBound(new int[]{},1) == 0;
    assert twoSum(new int[]{},0).length == 0;
    assert twoSum(new int[]{Integer.MAX_VALUE,Integer.MAX_VALUE},-2).length == 0;
    assert maxSumWindow(new int[]{Integer.MAX_VALUE,Integer.MAX_VALUE},2) == 4294967294L;
    assert maxSumWindow(new int[]{-8,-2,-3},2) == -5;
    for(int k : new int[]{-1,0,4}) {
        boolean threw=false; try { maxSumWindow(new int[]{1,2,3},k); } catch(IllegalArgumentException e) { threw=true; } assert threw;
    }
    assert removeDuplicates(new int[]{}) == 0;
    int[] dup={1,1,2,2,3}; assert removeDuplicates(dup)==3 && dup[0]==1 && dup[1]==2 && dup[2]==3;
    assert countIslands(new int[][]{})==0 && countIslands(new int[][]{{}})==0;
    int[][] grid={{1,0,1},{1,0,0},{0,1,1}};
    assert countIslands(grid)==3 && grid[0][0]==1;
    int[][] large=new int[100][100]; for(int[] row:large) java.util.Arrays.fill(row,1); assert countIslands(large)==1;
    boolean threw=false; try { countIslands(new int[][]{{1},{}}); } catch(IllegalArgumentException e) { threw=true; } assert threw;
    for(int size=0;size<30;++size) {
        int[] a=new int[size]; for(int i=0;i<size;++i) a[i]=i/2-5;
        for(int t=-10;t<20;++t) {
            int lo=0,hi=0; while(lo<size && a[lo]<t) lo++; while(hi<size && a[hi]<=t) hi++;
            assert lowerBound(a,t)==lo && upperBound(a,t)==hi;
            int idx=binarySearch(a,t); assert (idx==-1 && java.util.Arrays.binarySearch(a,t)<0) || (idx>=0 && a[idx]==t);
        }
    }
    for(int pivot=0;pivot<20;++pivot) {
        int[] a=new int[20]; for(int i=0;i<20;++i) a[i]=(i+pivot)%20;
        for(int t=-1;t<=20;++t) assert searchRotated(a,t)==((t<0 || t==20) ? -1 : (t-pivot+20)%20);
    }
    System.out.println("Java: all 8 templates passed runtime assertions");
}
}
`);
// Use explicit output paths and task-specific executable overrides.
const relativeDirectory = path.relative(process.cwd(), directory);
run(process.env.ALGOSNAP_JAVAC || 'javac', ['-d', relativeDirectory, path.join(relativeDirectory, 'Generated.java')], process.cwd());
run(process.env.ALGOSNAP_JAVA || 'java', ['-ea','-cp',relativeDirectory,'Generated'], process.cwd());
console.log('PASS: 24 generated template/language combinations compiled and executed.');
