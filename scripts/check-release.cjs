const manifest = require('../package.json');
const assert = require('node:assert/strict');
assert.ok(manifest.publisher && manifest.publisher !== 'algosnap-local',
  'Create your Marketplace publisher, then replace algosnap-local in package.json. This identity is for local VSIX testing only.');
assert.match(manifest.repository.url, /^https:\/\/github\.com\/[^/]+\/[^/]+/);
console.log('Release identity configured. Verify publisher ownership and repository visibility before publishing.');
