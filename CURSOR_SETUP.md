# Vitrifiye Quiz & Konfigüratör - Cursor Standalone Kurulum Rehberi

Bu rehber, projeyi kendi bilgisayarınızda Cursor IDE ile çalıştırmanız için gerekli adımları içerir.

## 📋 Gereksinimler

- **Node.js** 18+ ve **pnpm** (veya npm/yarn)
- **MySQL** veya **TiDB** veritabanı
- **Cursor IDE** veya herhangi bir kod editörü

## 🚀 Hızlı Başlangıç

### 1. Projeyi İndirin

Manus platformundan projeyi indirin veya git clone yapın:

```bash
git clone <repository-url>
cd vitrifiye_quiz_configurator
```

### 2. Bağımlılıkları Yükleyin

```bash
pnpm install
```

### 3. Veritabanını Kurun

#### MySQL Kurulumu (Yerel)

```bash
# MySQL'i başlatın
mysql -u root -p

# Veritabanı oluşturun
CREATE DATABASE vitrifiye_quiz CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Kullanıcı oluşturun (opsiyonel)
CREATE USER 'vitrifiye_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON vitrifiye_quiz.* TO 'vitrifiye_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Ortam Değişkenlerini Ayarlayın

`.env` dosyası oluşturun:

```env
# Veritabanı Bağlantısı
DATABASE_URL="mysql://vitrifiye_user:your_password@localhost:3306/vitrifiye_quiz"

# JWT Secret (rastgele bir string oluşturun)
JWT_SECRET="super-secret-jwt-key-change-this-in-production"

# Uygulama Ayarları
VITE_APP_TITLE="Vitrifiye Quiz & Konfigüratör"
VITE_APP_LOGO="/logo.svg"
NODE_ENV="development"
PORT=3000

# OAuth (Manus platformu - standalone için opsiyonel)
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://portal.manus.im"
VITE_APP_ID="standalone-mode"
OWNER_OPEN_ID="local-admin"
OWNER_NAME="Admin"

# Forge API (Manus servisleri - standalone için opsiyonel)
BUILT_IN_FORGE_API_URL="https://forge.manus.im"
BUILT_IN_FORGE_API_KEY=""
VITE_FRONTEND_FORGE_API_KEY=""
VITE_FRONTEND_FORGE_API_URL="https://forge.manus.im"

# Shopify Entegrasyonu (opsiyonel)
SHOPIFY_STORE_URL=""
SHOPIFY_ACCESS_TOKEN=""
SHOPIFY_API_VERSION="2024-01"

# Veri Kaynağı Modu
DATA_SOURCE="json"
JSON_DATA_PATH="./data/shopify-products.json"
```

### 5. Veritabanı Şemasını Oluşturun

```bash
pnpm db:push
```

### 6. Örnek Verileri Yükleyin

```bash
node scripts/seed.mjs
```

### 7. Uygulamayı Başlatın

```bash
pnpm dev
```

Tarayıcınızda `http://localhost:3000` adresini açın.

## 📦 Veri Kaynağı Modları

### JSON Modu (Standalone - Önerilen)

Shopify'a bağlanmadan çalışmak için JSON dosyasını kullanın:

```env
DATA_SOURCE="json"
JSON_DATA_PATH="./data/shopify-products.json"
```

JSON dosyası (`data/shopify-products.json`) Shopify ürün yapısıyla uyumludur ve kolayca düzenlenebilir.

### Database Modu

MySQL veritabanını kullanmak için:

```env
DATA_SOURCE="database"
```

### Shopify Entegrasyonu (Production)

Gerçek Shopify mağazanıza bağlanmak için:

1. Shopify Admin Panel → Apps → Develop apps
2. Yeni bir app oluşturun
3. Admin API access token alın
4. `.env` dosyasına ekleyin:

```env
SHOPIFY_STORE_URL="your-store.myshopify.com"
SHOPIFY_ACCESS_TOKEN="shpat_xxxxxxxxxxxxx"
SHOPIFY_API_VERSION="2024-01"
DATA_SOURCE="shopify"
```

Detaylı entegrasyon adımları için `SHOPIFY_INTEGRATION.md` dosyasına bakın.

## 🎨 Quiz Görsellerini Özelleştirme

Quiz seçenekleri için görseller `client/public/quiz-images/` klasöründe bulunur:

- `banyo-modern.jpg` - Modern stil görseli
- `banyo-klasik.jpg` - Klasik stil görseli
- `banyo-endustriyel.jpg` - Endüstriyel stil görseli
- `banyo-dogal.jpg` - Doğal stil görseli
- `renk-beyaz.jpg` - Beyaz renk görseli
- `renk-gri.jpg` - Gri renk görseli
- `renk-bej.jpg` - Bej renk görseli
- `renk-siyah.jpg` - Siyah renk görseli
- `renk-renkli.jpg` - Renkli görseli

Kendi görsellerinizi eklemek için bu klasöre yeni dosyalar ekleyin ve `data/shopify-products.json` dosyasındaki `imageUrl` alanlarını güncelleyin.

## 🛠️ Geliştirme Komutları

```bash
# Development server
pnpm dev

# TypeScript type checking
pnpm type-check

# Database schema push
pnpm db:push

# Database studio (görsel veritabanı yönetimi)
pnpm db:studio

# Production build
pnpm build

# Production preview
pnpm preview
```

## 📁 Proje Yapısı

```
vitrifiye_quiz_configurator/
├── client/                 # Frontend (React + Vite)
│   ├── public/
│   │   └── quiz-images/   # Quiz görselleri
│   └── src/
│       ├── pages/         # Sayfa bileşenleri
│       ├── components/    # UI bileşenleri
│       └── lib/           # tRPC client
├── server/                # Backend (Express + tRPC)
│   ├── routers.ts         # API endpoint'leri
│   ├── db.ts              # Veritabanı işlemleri
│   └── _core/             # Framework altyapısı
├── drizzle/               # Veritabanı şeması
│   └── schema.ts
├── data/                  # JSON veri dosyaları
│   └── shopify-products.json
├── scripts/               # Yardımcı scriptler
│   └── seed.mjs          # Seed data script
└── shared/                # Paylaşılan tipler
```

## 🔧 Özelleştirme

### Ürün Ekleme/Düzenleme

#### JSON Modunda:

`data/shopify-products.json` dosyasını düzenleyin:

```json
{
  "id": "gid://shopify/Product/11",
  "title": "Yeni Ürün",
  "handle": "yeni-urun",
  "description": "Ürün açıklaması",
  "price": "1000.00",
  "metafields": {
    "custom": {
      "room_type": "banyo",
      "style": "modern",
      "color": "beyaz"
    }
  }
}
```

#### Database Modunda:

Veritabanına direkt ekleyin veya `scripts/seed.mjs` dosyasını düzenleyin.

### Quiz Sorularını Değiştirme

`data/shopify-products.json` dosyasındaki `quiz_questions` bölümünü düzenleyin veya veritabanındaki `quiz_questions` tablosunu güncelleyin.

### Stil Değişiklikleri

- Renkler: `client/src/index.css`
- Tailwind yapılandırması: `tailwind.config.js`
- Logo: `client/public/logo.svg`

## 🐛 Sorun Giderme

### Veritabanı Bağlantı Hatası

```bash
# MySQL servisinin çalıştığından emin olun
sudo systemctl status mysql

# Bağlantı bilgilerini kontrol edin
mysql -u vitrifiye_user -p vitrifiye_quiz
```

### Port Zaten Kullanımda

```bash
# 3000 portunu kullanan işlemi bulun
lsof -i :3000

# İşlemi sonlandırın veya farklı port kullanın
PORT=3001 pnpm dev
```

### TypeScript Hataları

```bash
# node_modules'u temizleyin ve yeniden yükleyin
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 📚 Ek Kaynaklar

- [Shopify Admin API Dokümantasyonu](https://shopify.dev/docs/api/admin)
- [tRPC Dokümantasyonu](https://trpc.io/)
- [Drizzle ORM Dokümantasyonu](https://orm.drizzle.team/)
- [Tailwind CSS Dokümantasyonu](https://tailwindcss.com/)

## 🤝 Destek

Sorularınız için:
- GitHub Issues
- E-posta: support@example.com
- Dokümantasyon: `README.md`, `SHOPIFY_INTEGRATION.md`

## 📝 Lisans

MIT License - Detaylar için `LICENSE` dosyasına bakın.
