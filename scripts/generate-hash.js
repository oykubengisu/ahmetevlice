/**
 * Admin şifresi için bcrypt hash üretir.
 * Kullanım: node scripts/generate-hash.js "SeninSifren"
 * veya: node scripts/generate-hash.js
 * (şifre sormaz, örnek "admin123" ile çalıştırır)
 *
 * Çıkan hash'i Render Dashboard → Environment → ADMIN_PASSWORD_HASH olarak yapıştır.
 * ADMIN_USERNAME'i de (örn. admin) Render'da ayarla.
 */

const bcrypt = require('bcryptjs');
const password = process.argv[2] || 'admin123';

bcrypt.hash(password, 10).then((hash) => {
  console.log('\nŞifre:', password);
  console.log('Hash (bunu Render\'da ADMIN_PASSWORD_HASH yapın):\n');
  console.log(hash);
  console.log('');
});
