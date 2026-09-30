const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const {getTemplates} = require('../out/templates');
const root = process.cwd();
const directory = path.resolve('.test-work/catalog');
fs.mkdirSync(directory,{recursive:true});
function run(command,args) {
  const result=spawnSync(command,args,{cwd:root,encoding:'utf8',timeout:60000});
  if(result.error || result.status!==0) throw new Error(`${command} ${args.join(' ')}\n${result.error || ''}\n${result.stdout}\n${result.stderr}`);
  if(result.stdout.trim()) console.log(result.stdout.trim());
}
const extra = language => getTemplates(language).filter(t=>t.languages).map(t=>({id:t.id,code:t.render({language,arrays:[],integers:[]})}));
const pythonPath=path.join(directory,'python.json');
fs.writeFileSync(pythonPath,JSON.stringify(extra('python')));
run(process.env.ALGOSNAP_PYTHON || 'python',['test/catalog-python.py',pythonPath]);

const cppTests = {
  'cpp-map': 'mapExample();',
  'cpp-set': 'setExample();',
  'cpp-heap': 'heapExample();',
  'cpp-stack-queue': 'stackQueueExample();',
  'cpp-dsu': `DSU uf(4); assert(uf.unite(0,1)); assert(uf.unite(1,2)); assert(!uf.unite(0,2));
    assert(uf.find(0)==uf.find(2) && uf.components==2);
    bool threw=false; try { uf.find(-1); } catch(const std::out_of_range&) { threw=true; } assert(threw);
    threw=false; try { DSU bad(-1); } catch(const std::invalid_argument&) { threw=true; } assert(threw);`,
  'cpp-trie': `Trie trie; trie.insert("apple"); trie.insert(""); trie.insert("apple");
    assert(trie.search("apple") && trie.search("") && !trie.search("app") && trie.startsWith("app"));
    assert(!trie.startsWith("bad"));
    for(int i=0;i<1000;++i) trie.insert(std::to_string(i));
    for(int i=0;i<1000;++i) assert(trie.search(std::to_string(i)));
    Trie copied=trie; copied.insert("other"); assert(copied.search("other") && !trie.search("other"));`,
  'cpp-bfs-graph': `assert((bfs({{1,2},{0,3},{3},{},{}},0,5)==std::vector<int>{0,1,1,2,-1}));
    bool threw=false; try { bfs({},0,0); } catch(const std::invalid_argument&) { threw=true; } assert(threw);
    threw=false; try { bfs({{2},{}},0,2); } catch(const std::out_of_range&) { threw=true; } assert(threw);`,
  'cpp-knapsack': `assert(knapsack({1,2,3},{6,10,12},5)==22); assert(knapsack({}, {}, 0)==0);
    assert(knapsack({0,1},{3,5},0)==3); assert(knapsack({1,1},{2147483647,2147483647},2)==4294967294LL);
    bool threw=false; try { knapsack({1},{},1); } catch(const std::invalid_argument&) { threw=true; } assert(threw);
    threw=false; try { knapsack({-1},{2},1); } catch(const std::invalid_argument&) { threw=true; } assert(threw);
    for(int capacity=0;capacity<10;++capacity) {
      std::vector<int> w={0,2,3,4}, v={3,5,7,-2}; long long best=0;
      for(int mask=0;mask<16;++mask) { int weight=0; long long value=0;
        for(int i=0;i<4;++i) if(mask&(1<<i)) {weight+=w[i];value+=v[i];}
        if(weight<=capacity && value>best) best=value;
      } assert(knapsack(w,v,capacity)==best);
    }`,
  'cpp-lcs': 'assert(lcs("abcde","ace")==3); assert(lcs("","abc")==0); assert(lcs("aa","a")==1);',
  'cpp-coin-change': `assert(coinChange({1,2,5},11)==3); assert(coinChange({2},3)==-1); assert(coinChange({},0)==0);
    bool threw=false; try {coinChange({0},2);} catch(const std::invalid_argument&) {threw=true;} assert(threw);
    threw=false; try {coinChange({1},-1);} catch(const std::invalid_argument&) {threw=true;} assert(threw);`,
  'cpp-dijkstra': `auto dist=dijkstra({{{1,2147483647}},{{2,2147483647}},{},{}},0,4);
    assert(dist[2]==4294967294LL && dist[3]==std::numeric_limits<long long>::max());
    assert((dijkstra({{{1,5},{2,1}},{},{{1,1}}},0,3)==std::vector<long long>{0,2,1}));
    bool threw=false; try {dijkstra({{{1,-1}},{}},0,2);} catch(const std::invalid_argument&) {threw=true;} assert(threw);
    threw=false; try {dijkstra({{{9,1}},{}},0,2);} catch(const std::invalid_argument&) {threw=true;} assert(threw);`,
  'cpp-topological': `assert((topoSort(3,{{1},{2},{}})==std::vector<int>{0,1,2}));
    assert(topoSort(2,{{1},{0}}).empty()); assert(topoSort(0,{}).empty());
    bool threw=false; try {topoSort(2,{{2},{}});} catch(const std::out_of_range&) {threw=true;} assert(threw);`
};
for(const item of extra('cpp')) {
  assert.ok(Object.hasOwn(cppTests,item.id),`Missing behavior test: ${item.id}`);
  // Compile each variant independently with only its documented headers.
  const headers=[...item.code.split('\n')[0].matchAll(/<([a-z_]+)>/g)].map(m=>`#include <${m[1]}>`).join('\n');
  const source=path.join(directory,item.id+'.cpp');
  const binary=path.join(directory,item.id+(process.platform==='win32'?'.exe':''));
  fs.writeFileSync(source,`${headers}\n#include <cassert>\n${item.code}\nint main() { ${cppTests[item.id]} }\n`);
  run(process.env.ALGOSNAP_CXX || 'g++',['-std=c++17','-Wall','-Wextra','-Werror',source,'-o',binary]);
  run(binary,[]);
}
console.log('PASS: 12 restored C++ variants compiled independently with documented headers and passed runtime checks');

const javaTests={
  'java-map-set':'mapSetExample();',
  'java-heap':'heapExample();',
  'java-stack-queue':'stackQueueExample();',
  'java-ordered':'orderedExample();',
  'java-coin-change': `assert coinChange(new int[]{1,2,5},11)==3;
    assert coinChange(new int[]{2},3)==-1 && coinChange(new int[]{},0)==0;
    boolean threw=false; try {coinChange(new int[]{0},2);} catch(IllegalArgumentException e) {threw=true;} assert threw;
    threw=false; try {coinChange(new int[]{1},-1);} catch(IllegalArgumentException e) {threw=true;} assert threw;`,
  'java-lcs':'assert lcs("abcde","ace")==3; assert lcs("","abc")==0; assert lcs("aa","a")==1;'
};
const javaFiles=[];
for(const item of extra('java')) {
  assert.ok(Object.hasOwn(javaTests,item.id),`Missing behavior test: ${item.id}`);
  const name=item.id.replaceAll('-','_');
  const source=path.join(directory,name+'.java');
  fs.writeFileSync(source,`public class ${name} {\n${item.code}\npublic static void main(String[] args) {${javaTests[item.id]}}\n}\n`);
  javaFiles.push({source,name});
}
run(process.env.ALGOSNAP_JAVAC || 'javac',['-d',path.relative(root,directory),...javaFiles.map(f=>path.relative(root,f.source))]);
for(const {name} of javaFiles) run(process.env.ALGOSNAP_JAVA || 'java',['-ea','-cp',path.relative(root,directory),name]);
console.log('PASS: 6 restored Java variants compiled independently and passed runtime checks');
console.log('PASS: every one of the 44 restored native-language implementations has a behavior test.');
