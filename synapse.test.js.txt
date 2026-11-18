// Tests for Synapse's hand-written neural network.
// Run with: node --test
const test = require('node:test');
const assert = require('node:assert');
const { createNet, forward, train, preset } = require('./synapse.js');

test('the network outputs a probability between 0 and 1', () => {
  const net = createNet([2, 6, 6, 1], 1);
  const out = forward(net, 0.3, -0.4);
  assert.ok(out > 0 && out < 1, `expected 0 < out < 1, got ${out}`);
});

test('the same seed always builds the same network', () => {
  const a = createNet([2, 4, 1], 7);
  const b = createNet([2, 4, 1], 7);
  assert.deepStrictEqual(Array.from(a.W[0]), Array.from(b.W[0]));
});

test('training lowers the loss on the "corners" data', () => {
  const net = createNet([2, 8, 8, 1], 3);
  const pts = preset('corners');
  const first = train(net, pts, 0.03).loss;
  let last = first;
  for (let i = 0; i < 300; i++) last = train(net, pts, 0.03).loss;
  assert.ok(last < first, `loss should drop: ${first} -> ${last}`);
});

test('the network learns the "rings" data to at least 90% accuracy', () => {
  const net = createNet([2, 8, 8, 1], 2);
  const pts = preset('rings');
  let stats;
  for (let i = 0; i < 800; i++) stats = train(net, pts, 0.03);
  assert.ok(stats.acc >= 0.9, `accuracy was ${stats.acc}`);
});
