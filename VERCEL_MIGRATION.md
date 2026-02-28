# Render'dan Vercel'e Geçiş

## 1. Vercel'de Upstash Redis Ekleme

1. Vercel Dashboard → Projeniz → **Storage** sekmesi
2. **Create Database** → **Upstash** → **Upstash Redis** seçin
3. Oluşturduktan sonra **Connect to Project** ile projenize bağlayın
4. `KV_REST_API_URL` ve `KV_REST_API_TOKEN` otomatik enjekte edilir

## 2. Ortam Değişkenleri

Vercel → Settings → Environment Variables:

| Değişken | Açıklama |
|----------|----------|
| `ADMIN_USERNAME` | Admin kullanıcı adı (örn: admin) |
| `ADMIN_PASSWORD_HASH` | Şifre hash'i (aşağıdaki komutla üretin) |

Şifre hash üretmek için:
```bash
node -e "require('bcryptjs').hash('Sifreniz', 10).then(h=>console.log(h))"
```

## 3. Mevcut Verileri Taşıma

Render'da blog/sayfa verileriniz varsa:

1. Eski sitede (Render) admin panele girin
2. **Ayarlar** → **Verileri Dışa Aktar** ile JSON indirin
3. Yeni sitede (Vercel) admin panele girin
4. **Ayarlar** → **Verileri İçe Aktar** ile JSON dosyasını yükleyin

## 4. Deploy

Git push yaptığınızda Vercel otomatik deploy eder. Render servisini durdurabilirsiniz.
