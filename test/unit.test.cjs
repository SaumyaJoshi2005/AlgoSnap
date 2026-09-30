const { test } = require('node:test');
const assert = require('node:assert/strict');
const { maskNonCode, scanSource, chooseNames, isLanguage } = require('../out/scanner');
const { ALGORITHMS, CORE_ALGORITHMS, getTemplates, findAlgorithm } = require('../out/templates');
const { matchTrigger, Debouncer, MAX_CONTEXT_CHARS } = require('../out/trigger');

test('comments and literals preserve source positions and cannot supply names', () => {
  for (const [language, source] of [
    ['python', '# ghost = []\ntext = "fake = []"\nnums = [1,2]\ntarget = 2\n'],
    ['cpp', '/* int ghost[2]; */\nstd::string s = R"tag(int fake[3];)tag";\nstd::vector<int> nums; int target = 2;'],
    ['java', '// int[] ghost;\nString s = "int[] fake;";\nint[] nums; int target = 2;']
  ]) {
    const masked = maskNonCode(source, language);
    assert.equal(masked.length, source.length);
    assert.equal(masked.split('\n').length, source.split('\n').length);
    assert.deepEqual(scanSource(source, language).arrays, ['nums']);
    assert.deepEqual(chooseNames(scanSource(source, language)), {array:'nums',target:'target',window:'k'});
  }
});
test('typed Python parameters and nearest preceding declarations', () => {
  const context = scanSource('old = []\nrecent = []\ndef run(data: list[int], key: int, windowSize: int):\n', 'python');
  assert.equal(context.arrays[0], 'data');
  assert.deepEqual(chooseNames(context), {array:'data',target:'key',window:'windowSize'});
});
test('do not reuse internal names or Python builtins', () => {
  const context = scanSource('left=[]\nlen=[]\nmax=[]\nrange=[]\ntarget=[]\nk=[]\n', 'python');
  assert.deepEqual(chooseNames(context), {array:'nums',target:'target',window:'k'});
});
test('aliases are exact, unique, and come from the registry', () => {
  const aliases = ALGORITHMS.flatMap(a => a.aliases);
  assert.equal(new Set(aliases).size, aliases.length);
  for (const algorithm of ALGORITHMS) {
    for (const alias of algorithm.aliases) assert.equal(findAlgorithm(` ${alias.toUpperCase()} `), algorithm);
  }
  assert.equal(findAlgorithm('notbinarysearch'), undefined);
  assert.equal(isLanguage('c'), false);
  assert.equal(isLanguage('markdown'), false);
});
test('all 24 template/language combinations render complete code', () => {
  const ids = CORE_ALGORITHMS.flatMap(a => a.templates.map(t => t.id));
  assert.equal(new Set(ids).size, 8);
  for (const language of ['python', 'cpp', 'java']) {
    for (const algorithm of CORE_ALGORITHMS) {
      for (const template of algorithm.templates) {
        const code = template.render({language,arrays:['data'],integers:['key','windowSize']});
        assert.ok(code.length > 100);
        assert.doesNotMatch(code, /TODO|is_valid|feasible|undefined/);
        if (language !== 'python') assert.doesNotMatch(code, /^def /m);
      }
    }
  }
});
test('triggers match only entire keyword lines, respecting offsets and case', () => {
  const source = 'nums = [1,2]\n    BINARY SEARCH';
  const match = matchTrigger(source, 'python');
  assert.equal(match.algorithmId, 'binary-search');
  assert.equal(source.slice(match.start, match.end), 'BINARY SEARCH');
  for (const text of ['mydfs', 'print dfs', 'dfs # comment', '# dfs', 'x = "dfs"', '"""\ndfs', "'''\ndfs"])
    assert.equal(matchTrigger(text, 'python'), undefined, text);
  for (const text of ['// dfs', '/*\ndfs', 'R"tag(\ndfs'])
    assert.equal(matchTrigger(text, 'cpp'), undefined, text);
  assert.equal(matchTrigger('String s = """\ndfs', 'java'), undefined);
  assert.ok(matchTrigger('/* comment */\ndfs', 'cpp'));
});
test('large prefixes are declined without expensive lexical scanning', () => {
  assert.equal(matchTrigger(' '.repeat(MAX_CONTEXT_CHARS) + '\ndfs', 'python'), undefined);
});
test('restored catalog retains every native implementation without language fallbacks or duplicate picker rows', () => {
  const counts = {python:34, cpp:20, java:14};
  for (const [language, count] of Object.entries(counts)) {
    const templates = getTemplates(language);
    assert.equal(templates.length, count);
    assert.equal(new Set(templates.map(t => t.id)).size, count);
    for (const template of templates) {
      assert.ok(!template.languages || template.languages.includes(language));
      assert.ok(template.render({language,arrays:[],integers:[]}).length > 50);
    }
  }
  for (const alias of ['bfs','dp','knapsack','coin change','edit distance','subset sum','lcs','lis',
    'tree','binary tree','bst','treenode','level order','lca','graph','dijkstra','topo sort',
    'topological sort','union find','dsu','hashmap','hash map','stack','queue','deque','heap',
    'priority queue','linked list','trie','segment tree','treemap','treeset','sorted list']) {
    assert.ok(findAlgorithm(alias), alias);
    assert.ok(matchTrigger(alias,'python'), alias);
  }
  assert.equal(getTemplates('java',findAlgorithm('bfs')).length,0);
  assert.equal(getTemplates('cpp',findAlgorithm('tree')).length,0);
  assert.equal(getTemplates('java',findAlgorithm('trie')).length,0);
  assert.deepEqual(getTemplates('cpp',findAlgorithm('dsu')).map(t=>t.id),['cpp-dsu']);
  assert.deepEqual(getTemplates('java',findAlgorithm('coin change')).map(t=>t.id),['java-coin-change']);
  assert.throws(()=>getTemplates('python',findAlgorithm('tree'))[0].render({language:'java',arrays:[],integers:[]}),/does not support/);
});
test('debouncer only fires the last event and cancels on disposal', async () => {
  const debounce = new Debouncer(); let calls = 0;
  debounce.schedule(() => calls += 100, 5);
  debounce.schedule(() => calls++, 5);
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.equal(calls, 1);
  debounce.schedule(() => calls++, 5); debounce.dispose();
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.equal(calls, 1);
});
