const test = require('node:test');
const assert = require('node:assert/strict');
require('dotenv').config();
const mongoose = require('mongoose');
const request = require('supertest');

const app = require('../app');
const Product = require('../models/Product');
const Wishlist = require('../models/Wishlist');

const TEST_DB_URI =
  process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/wishlist-storefront-test';

let productA;
let productB;

test.before(async () => {
  await mongoose.connect(TEST_DB_URI);
});

test.after(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

test.beforeEach(async () => {
  await Wishlist.deleteMany({});
  await Product.deleteMany({});
  [productA, productB] = await Product.create([
    { name: 'Product A', price: 10, image: 'a.png', category: 'Test' },
    { name: 'Product B', price: 20, image: 'b.png', category: 'Test' },
  ]);
});

test('merging an empty list into a populated one returns the populated list unchanged', async () => {
  const populated = await Wishlist.create({
    name: 'Populated',
    items: [{ productId: productA._id, dateAdded: new Date('2026-01-01') }],
  });
  const empty = await Wishlist.create({ name: 'Empty', items: [] });

  const res = await request(app)
    .post('/wishlists/merge')
    .send({ sourceId: empty._id.toString(), targetId: populated._id.toString() });

  assert.equal(res.status, 200);
  assert.equal(res.body.items.length, 1);
  assert.equal(res.body.items[0].productId, productA._id.toString());
  assert.equal(res.body.name, 'Populated');

  // source list should be gone (destructive merge)
  const sourceStillExists = await Wishlist.findById(empty._id);
  assert.equal(sourceStillExists, null);
});

test('merging a list into itself is rejected with 400, not a silent no-op', async () => {
  const list = await Wishlist.create({
    name: 'Self',
    items: [{ productId: productA._id, dateAdded: new Date() }],
  });

  const res = await request(app)
    .post('/wishlists/merge')
    .send({ sourceId: list._id.toString(), targetId: list._id.toString() });

  assert.equal(res.status, 400);
  assert.match(res.body.error, /cannot merge/i);

  // list must be untouched
  const stillThere = await Wishlist.findById(list._id);
  assert.ok(stillThere);
  assert.equal(stillThere.items.length, 1);
});

test('merging two lists with full product overlap results in zero duplicates', async () => {
  const earlier = new Date('2026-01-01');
  const later = new Date('2026-02-01');

  const listA = await Wishlist.create({
    name: 'List A',
    items: [
      { productId: productA._id, dateAdded: earlier },
      { productId: productB._id, dateAdded: earlier },
    ],
  });
  const listB = await Wishlist.create({
    name: 'List B',
    items: [
      { productId: productA._id, dateAdded: later },
      { productId: productB._id, dateAdded: later },
    ],
  });

  const res = await request(app)
    .post('/wishlists/merge')
    .send({ sourceId: listA._id.toString(), targetId: listB._id.toString() });

  assert.equal(res.status, 200);
  assert.equal(res.body.items.length, 2);

  const productIds = res.body.items.map((i) => i.productId).sort();
  const uniqueIds = [...new Set(productIds)];
  assert.equal(productIds.length, uniqueIds.length, 'result must contain no duplicate productIds');

  // earlier dateAdded should win for both overlapping items
  for (const item of res.body.items) {
    assert.equal(new Date(item.dateAdded).getTime(), earlier.getTime());
  }
});
