/**
 * Vercel Serverless API - Prof. Dr. Ahmet Evlice CMS
 * Tüm /api/* istekleri bu dosyaya yönlendirilir (vercel.json rewrites)
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { loadData, saveData, getSession, setSession, deleteSession } = require('./storage');
const {
  enrichMediaGalleryWithSlugs,
  nextSlugForNewItem,
  slugAfterDescriptionUpdate
} = require('./media-slug');

const app = express();
const TOKEN_TTL = 7 * 24 * 60 * 60; // 7 gün saniye

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';

async function createToken() {
  const token = crypto.randomBytes(32).toString('hex');
  await setSession(token, { createdAt: Date.now() }, TOKEN_TTL);
  return token;
}

async function isValidToken(token) {
  if (!token) return false;
  const s = await getSession(token);
  if (!s) return false;
  const data = typeof s === 'string' ? JSON.parse(s) : s;
  if (Date.now() - data.createdAt > TOKEN_TTL * 1000) {
    await deleteSession(token);
    return false;
  }
  return true;
}

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!(await isValidToken(token))) {
    return res.status(401).json({ error: 'Giriş gerekli' });
  }
  next();
}

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Rewrite: /api?path=blogs -> /api/blogs (Vercel rewrite path koruması)
app.use((req, res, next) => {
  const p = req.query.path;
  if (p) {
    req.url = '/api/' + p + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
  }
  next();
});

app.get('/api', (req, res) => {
  res.json({ ok: true, message: 'Content API is running' });
});

// Auth
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!ADMIN_PASSWORD_HASH) {
    return res.status(503).json({ error: 'Sunucuda admin şifresi ayarlanmamış (ADMIN_PASSWORD_HASH)' });
  }
  if (!username || !password) {
    return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
  }
  if (username !== ADMIN_USERNAME) {
    return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
  }
  try {
    const match = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!match) {
      return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
    }
    const token = await createToken();
    return res.json({ token });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ error: err.message || 'Giriş işlemi başarısız' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!(await isValidToken(token))) {
    return res.status(401).json({ error: 'Oturum geçersiz' });
  }
  res.json({ ok: true });
});

app.post('/api/auth/logout', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) await deleteSession(token);
  res.json({ ok: true });
});

// Blogs
app.get('/api/blogs', async (req, res) => {
  const data = await loadData();
  res.json(data.blogs || []);
});

app.post('/api/blogs', requireAuth, async (req, res) => {
  const data = await loadData();
  const blog = req.body;
  if (!blog || !blog.title || !blog.category) {
    return res.status(400).json({ error: 'title ve category zorunludur' });
  }
  const id = blog.id || Date.now().toString(36) + Math.random().toString(36).slice(2);
  const now = new Date().toISOString();
  const existingIndex = (data.blogs || []).findIndex(b => b.id === id);
  if (existingIndex >= 0) {
    data.blogs[existingIndex] = { ...data.blogs[existingIndex], ...blog, id, updatedAt: now };
  } else {
    data.blogs = [{ ...blog, id, createdAt: now, updatedAt: now, views: blog.views || 0 }, ...(data.blogs || [])];
  }
  await saveData(data);
  res.json({ ok: true, blog: data.blogs.find(b => b.id === id) });
});

app.delete('/api/blogs/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const data = await loadData();
  const before = (data.blogs || []).length;
  data.blogs = (data.blogs || []).filter(b => b.id !== id);
  await saveData(data);
  res.json({ ok: true, deleted: before - data.blogs.length });
});

// Pages
const PAGE_KEYS = ['page_hero', 'page_about', 'page_contact', 'page_social'];

app.get('/api/pages/:key', async (req, res) => {
  const { key } = req.params;
  const storageKey = `page_${key}`;
  if (!PAGE_KEYS.includes(storageKey)) {
    return res.status(400).json({ error: 'Geçersiz sayfa anahtarı' });
  }
  const data = await loadData();
  res.json(data[storageKey] || {});
});

app.put('/api/pages/:key', requireAuth, async (req, res) => {
  const { key } = req.params;
  const storageKey = `page_${key}`;
  if (!PAGE_KEYS.includes(storageKey)) {
    return res.status(400).json({ error: 'Geçersiz sayfa anahtarı' });
  }
  const data = await loadData();
  data[storageKey] = req.body || {};
  await saveData(data);
  res.json({ ok: true, data: data[storageKey] });
});

// Media
app.get('/api/media', async (req, res) => {
  const data = await loadData();
  const list = Array.isArray(data.media_gallery) ? data.media_gallery : [];
  const enriched = enrichMediaGalleryWithSlugs(list);
  let dirty = false;
  const merged = list.map((orig, i) => {
    const slug = enriched[i].slug;
    if (orig.slug !== slug) dirty = true;
    return { ...orig, slug };
  });
  if (dirty) {
    data.media_gallery = merged;
    await saveData(data);
  }
  res.json(enriched);
});

app.post('/api/media', requireAuth, async (req, res) => {
  const data = await loadData();
  const item = req.body;
  if (!item || !item.data || !item.name) {
    return res.status(400).json({ error: 'name ve data zorunludur' });
  }
  const id = item.id || Date.now().toString(36) + Math.random().toString(36).slice(2);
  const now = new Date().toISOString();
  const existing = data.media_gallery || [];
  const newRow = {
    ...item,
    description: (item.description || '').toString(),
    id,
    uploadedAt: now
  };
  newRow.slug = nextSlugForNewItem(newRow, id, existing);
  data.media_gallery = [newRow, ...existing];
  await saveData(data);
  res.json({ ok: true, item: data.media_gallery.find(m => m.id === id) });
});

app.put('/api/media/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const data = await loadData();
  const media = data.media_gallery || [];
  const idx = media.findIndex(m => m.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Öğe bulunamadı' });
  const body = req.body || {};
  const nextDesc = body.description !== undefined ? String(body.description || '') : media[idx].description;
  const updated = {
    ...media[idx],
    description: nextDesc
  };
  if (body.description !== undefined) {
    updated.slug = slugAfterDescriptionUpdate(updated, id, media);
  }
  media[idx] = updated;
  data.media_gallery = media;
  await saveData(data);
  res.json({ ok: true, item: media[idx] });
});

app.delete('/api/media/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const data = await loadData();
  const before = (data.media_gallery || []).length;
  data.media_gallery = (data.media_gallery || []).filter(m => m.id !== id);
  await saveData(data);
  res.json({ ok: true, deleted: before - data.media_gallery.length });
});

module.exports = app;
