const express = require('express');
const mongoose = require('mongoose');
const Item = require('./itemModel');
const Redis = require('ioredis');

const app = express();
app.use(express.json());

const PORT = 3000;

// Straight to localhost for now — this is before you Dockerize the API itself.
// Once you write your Dockerfile in Hour 2, this will need to change to point
// at the mongo *container* instead of localhost. Think about why.
const MONGO_URL = 'mongodb://mongo:27017/itemsdb';
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const redis = new Redis({ host: REDIS_HOST, port: REDIS_PORT });
const CACHE_TTL_SECONDS = 60;
const ITEMS_CACHE_KEY = 'items:all';

redis.on('connect', () => console.log('[redis] connected'));
redis.on('error', (err) => console.error('[redis] error:', err.message));

mongoose
  .connect(MONGO_URL)
  .then(() => console.log('[mongo] connected'))
  .catch((err) => console.error('[mongo] connection error:', err.message));
  async function invalidateItemsCache() {
  await redis.del(ITEMS_CACHE_KEY);
}

  function timed(label, fn) {
  return async (req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      console.log(`[timing] ${label} -> ${ms.toFixed(2)}ms`);
    });
    try {
      await fn(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', mongoState: mongoose.connection.readyState });
});

app.get('/items', timed('GET /items', async (req, res) => {
  const cached = await redis.get(ITEMS_CACHE_KEY);

  if (cached) {
    return res.json({ source: 'cache', data: JSON.parse(cached) });
  }

  const items = await Item.find().sort({ createdAt: -1 }).lean();

  await redis.set(ITEMS_CACHE_KEY, JSON.stringify(items), 'EX', CACHE_TTL_SECONDS);

  res.json({ source: 'database', data: items });
}));

app.get('/items/:id', async (req, res) => {
  const item = await Item.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json({ data: item });
});

app.post('/items', async (req, res) => {
  const { name, description, price } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const item = await Item.create({ name, description, price });
  await invalidateItemsCache();
  res.status(201).json({ data: item });
});

app.put('/items/:id', async (req, res) => {
  const item = await Item.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!item) return res.status(404).json({ error: 'Item not found' });
  await invalidateItemsCache();
  res.json({ data: item });
});

app.delete('/items/:id', async (req, res) => {
  const item = await Item.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  await invalidateItemsCache();
  res.json({ data: item });
});

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
