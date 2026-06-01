/**
 * Medya galerisi için SEO uyumlu URL parçası (slug) üretimi
 */

function stripExtension(filename) {
  if (!filename) return '';
  return String(filename).replace(/\.(jpe?g|png|gif|webp|bmp|svg)$/i, '');
}

const TR = {
  ı: 'i', İ: 'i', ğ: 'g', Ğ: 'g', ü: 'u', Ü: 'u',
  ş: 's', Ş: 's', ö: 'o', Ö: 'o', ç: 'c', Ç: 'c'
};

function slugify(str) {
  let s = String(str || '').trim().toLowerCase();
  if (!s) return '';
  for (const [k, v] of Object.entries(TR)) {
    s = s.split(k).join(v);
  }
  s = s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  s = s.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return s.slice(0, 80);
}

function baseFromMedia(item) {
  const desc = item.description != null ? String(item.description).trim() : '';
  if (desc) {
    const s = slugify(desc);
    if (s) return s;
  }
  const fromName = slugify(stripExtension(item.name));
  return fromName || 'gorsel';
}

function ensureUniqueSlug(base, id, taken) {
  let slug = base || 'gorsel';
  if (!taken.has(slug)) {
    taken.add(slug);
    return slug;
  }
  const idPart = id ? String(id).replace(/[^a-z0-9]/gi, '').slice(-8) : '';
  if (idPart) {
    const withId = `${slug}-${idPart}`;
    if (!taken.has(withId)) {
      taken.add(withId);
      return withId;
    }
  }
  let n = 2;
  let candidate;
  do {
    candidate = `${slug}-${n}`;
    n += 1;
  } while (taken.has(candidate));
  taken.add(candidate);
  return candidate;
}

/**
 * Liste için her öğeye benzersiz slug atar (kayıtlı geçerli slug varsa korunur).
 */
function enrichMediaGalleryWithSlugs(list) {
  const arr = Array.isArray(list) ? list : [];
  const taken = new Set();
  const out = [];
  for (const m of arr) {
    let slug = '';
    if (m.slug != null && String(m.slug).trim()) {
      slug = slugify(String(m.slug).trim());
    }
    if (slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && !taken.has(slug)) {
      taken.add(slug);
    } else {
      const base = baseFromMedia(m) || 'gorsel';
      slug = ensureUniqueSlug(base, m.id, taken);
    }
    out.push({ ...m, slug });
  }
  return out;
}

function nextSlugForNewItem(item, id, existingList) {
  const taken = new Set();
  for (const x of existingList || []) {
    if (x && x.slug) taken.add(String(x.slug).trim());
  }
  const base = baseFromMedia(item) || 'gorsel';
  return ensureUniqueSlug(base, id, taken);
}

function slugAfterDescriptionUpdate(item, id, allList) {
  const taken = new Set();
  for (const x of allList || []) {
    if (x && x.id !== id && x.slug) taken.add(String(x.slug).trim());
  }
  const base = baseFromMedia(item) || 'gorsel';
  return ensureUniqueSlug(base, id, taken);
}

module.exports = {
  stripExtension,
  slugify,
  baseFromMedia,
  ensureUniqueSlug,
  enrichMediaGalleryWithSlugs,
  nextSlugForNewItem,
  slugAfterDescriptionUpdate
};
