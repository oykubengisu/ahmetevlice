require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  enrichMediaGalleryWithSlugs,
  nextSlugForNewItem,
  slugAfterDescriptionUpdate
} = require('./media-slug');

const app = express();
const PORT = process.env.PORT || 4000;

// Admin giriş: Render Environment Variables'da ayarla
// ADMIN_USERNAME=admin
// ADMIN_PASSWORD_HASH=  (aşağıdaki script ile üret: node -e "require('bcryptjs').hash('sifren', 10).then(h=>console.log(h))")
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';

// Oturum token'ları (bellek)
const sessions = new Map();
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 gün

function createToken() {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { createdAt: Date.now() });
  return token;
}

function isValidToken(token) {
  if (!token) return false;
  const s = sessions.get(token);
  if (!s) return false;
  if (Date.now() - s.createdAt > TOKEN_TTL_MS) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!isValidToken(token)) {
    return res.status(401).json({ error: 'Giriş gerekli' });
  }
  next();
}

// Basit dosya tabanlı veritabanı
const DATA_FILE = path.join(__dirname, 'data.json');

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const initial = {
        blogs: [],
        page_hero: {},
        page_about: {},
        page_contact: {},
        page_social: {},
        media_gallery: []
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }

    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (err) {
    console.error('Veri dosyası okunamadı:', err);
    return {
      blogs: [],
      page_hero: {},
      page_about: {},
      page_contact: {},
      page_social: {},
      media_gallery: []
    };
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Orta katmanlar
app.use(helmet());
app.use(
  cors({
    origin: '*'
  })
);
app.use(express.json({ limit: '10mb' })); // Base64 görseller/PDF'ler için limit

// Sağlık kontrolü
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Content API is running' });
});

// ================================
// Auth API
// ================================
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
    const token = createToken();
    return res.json({ token });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ error: 'Giriş işlemi başarısız' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!isValidToken(token)) {
    return res.status(401).json({ error: 'Oturum geçersiz' });
  }
  res.json({ ok: true });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) sessions.delete(token);
  res.json({ ok: true });
});

// ================================
// Blog API (yazma korumalı)
// ================================
app.get('/api/blogs', (req, res) => {
  const data = loadData();
  res.json(data.blogs || []);
});

app.post('/api/blogs', requireAuth, (req, res) => {
  const data = loadData();
  const blog = req.body;

  if (!blog || !blog.title || !blog.category) {
    return res.status(400).json({ error: 'title ve category zorunludur' });
  }

  const id = blog.id || Date.now().toString(36) + Math.random().toString(36).slice(2);
  const now = new Date().toISOString();

  const existingIndex = (data.blogs || []).findIndex(b => b.id === id);
  if (existingIndex >= 0) {
    data.blogs[existingIndex] = {
      ...data.blogs[existingIndex],
      ...blog,
      id,
      updatedAt: now
    };
  } else {
    data.blogs = [
      {
        ...blog,
        id,
        createdAt: now,
        updatedAt: now,
        views: blog.views || 0
      },
      ...(data.blogs || [])
    ];
  }

  saveData(data);
  res.json({ ok: true, blog: data.blogs.find(b => b.id === id) });
});

app.delete('/api/blogs/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const data = loadData();
  const before = (data.blogs || []).length;
  data.blogs = (data.blogs || []).filter(b => b.id !== id);
  const after = data.blogs.length;

  saveData(data);
  res.json({ ok: true, deleted: before - after });
});

// ================================
// Sayfa içerikleri (hero/about/contact/social)
// ================================
const PAGE_KEYS = ['page_hero', 'page_about', 'page_contact', 'page_social'];

app.get('/api/pages/:key', (req, res) => {
  const { key } = req.params;
  const storageKey = `page_${key}`;

  if (!PAGE_KEYS.includes(storageKey)) {
    return res.status(400).json({ error: 'Geçersiz sayfa anahtarı' });
  }

  const data = loadData();
  res.json(data[storageKey] || {});
});

app.put('/api/pages/:key', requireAuth, (req, res) => {
  const { key } = req.params;
  const storageKey = `page_${key}`;

  if (!PAGE_KEYS.includes(storageKey)) {
    return res.status(400).json({ error: 'Geçersiz sayfa anahtarı' });
  }

  const payload = req.body || {};
  const data = loadData();
  data[storageKey] = payload;

  saveData(data);
  res.json({ ok: true, data: payload });
});

// ================================
// Medya galerisi
// ================================
app.get('/api/media', (req, res) => {
  const data = loadData();
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
    saveData(data);
  }
  res.json(enriched);
});

app.post('/api/media', requireAuth, (req, res) => {
  const data = loadData();
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

  saveData(data);
  res.json({ ok: true, item: data.media_gallery.find(m => m.id === id) });
});

app.put('/api/media/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const data = loadData();
  const media = data.media_gallery || [];
  const idx = media.findIndex(m => m.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Öğe bulunamadı' });
  }
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
  saveData(data);
  res.json({ ok: true, item: media[idx] });
});

app.delete('/api/media/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const data = loadData();
  const before = (data.media_gallery || []).length;
  data.media_gallery = (data.media_gallery || []).filter(m => m.id !== id);
  const after = data.media_gallery.length;

  saveData(data);
  res.json({ ok: true, deleted: before - after });
});

app.listen(PORT, () => {
  console.log(`Content API listening on port ${PORT}`);
});

