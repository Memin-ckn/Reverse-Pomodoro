// Unit tests for app/logic.js. Run with: node tests/test.js
const assert = require("assert");
const { restFor, fmt } = require("../app/logic.js");

assert.strictEqual(restFor(0, 0), 0);
assert.strictEqual(restFor(3, 0), 0);
assert.strictEqual(restFor(4, 0), 1);
assert.strictEqual(restFor(59, 0), 14);
assert.strictEqual(restFor(2400, 0), 600);
assert.strictEqual(restFor(3601, 0), 900);
assert.strictEqual(restFor(2400, 5), 300); // capped
assert.strictEqual(restFor(100, 5), 25); // under cap

assert.strictEqual(fmt(0), "0:00");
assert.strictEqual(fmt(65), "1:05");
assert.strictEqual(fmt(3600), "1:00:00");
assert.strictEqual(fmt(3725), "1:02:05");
console.log("All tests passed");
