/**
 * Tarayıcıda medya listesi için slug zenginleştirme (api/media-slug.js ile uyumlu).
 */
(function (global) {
  function stripExtension(filename) {
    if (!filename) return '';
    return String(filename).replace(/\.(jpe?g|png|gif|webp|bmp|svg)$/i, '');
  }

  var TR = {
    ı: 'i', İ: 'i', ğ: 'g', Ğ: 'g', ü: 'u', Ü: 'u',
    ş: 's', Ş: 's', ö: 'o', Ö: 'o', ç: 'c', Ç: 'c'
  };

  function slugify(str) {
    var s = String(str || '').trim().toLowerCase();
    if (!s) return '';
    for (var k in TR) {
      if (Object.prototype.hasOwnProperty.call(TR, k)) {
        s = s.split(k).join(TR[k]);
      }
    }
    s = s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    s = s.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return s.slice(0, 80);
  }

  function baseFromMedia(item) {
    var desc = item.description != null ? String(item.description).trim() : '';
    if (desc) {
      var sd = slugify(desc);
      if (sd) return sd;
    }
    var fromName = slugify(stripExtension(item.name));
    return fromName || 'gorsel';
  }

  function ensureUniqueSlug(base, id, taken) {
    var slug = base || 'gorsel';
    if (!taken.has(slug)) {
      taken.add(slug);
      return slug;
    }
    var idPart = id ? String(id).replace(/[^a-z0-9]/gi, '').slice(-8) : '';
    if (idPart) {
      var withId = slug + '-' + idPart;
      if (!taken.has(withId)) {
        taken.add(withId);
        return withId;
      }
    }
    var n = 2;
    var candidate;
    do {
      candidate = slug + '-' + n;
      n += 1;
    } while (taken.has(candidate));
    taken.add(candidate);
    return candidate;
  }

  function enrichMediaGalleryWithSlugs(list) {
    var arr = Array.isArray(list) ? list : [];
    var taken = new Set();
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      var m = arr[i];
      var slug = '';
      if (m.slug != null && String(m.slug).trim()) {
        slug = slugify(String(m.slug).trim());
      }
      if (slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && !taken.has(slug)) {
        taken.add(slug);
      } else {
        var b = baseFromMedia(m) || 'gorsel';
        slug = ensureUniqueSlug(b, m.id, taken);
      }
      out.push(Object.assign({}, m, { slug: slug }));
    }
    return out;
  }

  global.GallerySlug = {
    slugify: slugify,
    enrichMediaGalleryWithSlugs: enrichMediaGalleryWithSlugs,
    stripExtension: stripExtension
  };
})(typeof window !== 'undefined' ? window : this);
