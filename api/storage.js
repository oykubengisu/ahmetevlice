/**
 * Vercel KV (Upstash Redis) depolama katmanı
 * Vercel Dashboard → Storage → Upstash Redis ekleyin
 */

let redis = null;

function getRedis() {
  if (redis) return redis;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  try {
    const { Redis } = require('@upstash/redis');
    redis = new Redis({ url, token });
    return redis;
  } catch (e) {
    return null;
  }
}

// Geliştirme için bellek fallback (KV yoksa)
const memoryStore = {
  blogs: [],
  page_hero: {},
  page_about: {},
  page_contact: {},
  page_social: {},
  media_gallery: [],
  sessions: {}
};

const KEYS = {
  blogs: 'cms:blogs',
  page_hero: 'cms:page_hero',
  page_about: 'cms:page_about',
  page_contact: 'cms:page_contact',
  page_social: 'cms:page_social',
  media_gallery: 'cms:media_gallery',
  sessions: 'cms:sessions'
};

async function loadData() {
  const r = getRedis();
  if (!r) return memoryStore;

  try {
    const [blogs, page_hero, page_about, page_contact, page_social, media_gallery] = await Promise.all([
      r.get(KEYS.blogs),
      r.get(KEYS.page_hero),
      r.get(KEYS.page_about),
      r.get(KEYS.page_contact),
      r.get(KEYS.page_social),
      r.get(KEYS.media_gallery)
    ]);
    return {
      blogs: blogs || [],
      page_hero: page_hero || {},
      page_about: page_about || {},
      page_contact: page_contact || {},
      page_social: page_social || {},
      media_gallery: media_gallery || []
    };
  } catch (err) {
    console.error('KV load error:', err);
    return memoryStore;
  }
}

async function saveData(data) {
  const r = getRedis();
  if (!r) {
    Object.assign(memoryStore, data);
    return;
  }
  try {
    await Promise.all([
      r.set(KEYS.blogs, data.blogs || []),
      r.set(KEYS.page_hero, data.page_hero || {}),
      r.set(KEYS.page_about, data.page_about || {}),
      r.set(KEYS.page_contact, data.page_contact || {}),
      r.set(KEYS.page_social, data.page_social || {}),
      r.set(KEYS.media_gallery, data.media_gallery || [])
    ]);
  } catch (err) {
    console.error('KV save error:', err);
    throw err;
  }
}

async function getSession(token) {
  const r = getRedis();
  if (!r) return memoryStore.sessions[token] ?? null;
  try {
    const key = `${KEYS.sessions}:${token}`;
    const val = await r.get(key);
    return val ? (typeof val === 'string' ? JSON.parse(val) : val) : null;
  } catch (e) {
    return null;
  }
}

async function setSession(token, data, ttlSeconds = 7 * 24 * 60 * 60) {
  const r = getRedis();
  if (!r) {
    memoryStore.sessions[token] = data;
    return;
  }
  try {
    const key = `${KEYS.sessions}:${token}`;
    const val = typeof data === 'string' ? data : JSON.stringify(data);
    await r.setex(key, ttlSeconds, val);
  } catch (e) {
    console.error('Session set error:', e);
  }
}

async function deleteSession(token) {
  const r = getRedis();
  if (!r) {
    if (memoryStore.sessions) delete memoryStore.sessions[token];
    return;
  }
  try {
    await r.del(`${KEYS.sessions}:${token}`);
  } catch (e) {}
}

module.exports = { loadData, saveData, getSession, setSession, deleteSession };
