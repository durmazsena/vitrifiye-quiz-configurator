# 🚀 Hızlı Başlangıç Rehberi - JSON Modu (Shopify'sız)

Bu rehber, projeyi **Shopify mağazası olmadan**, sadece JSON veri dosyası kullanarak kendi bilgisayarınızda çalıştırmanız için hazırlanmıştır.

## ⚡ 5 Dakikada Başlat

### 1. Gerekli Yazılımları Kurun

```bash
# Node.js 18+ kurulu olmalı
node --version  # v18.0.0 veya üzeri

# pnpm kurulumu (önerilen)
npm install -g pnpm

# Alternatif: npm veya yarn da kullanabilirsiniz
```

### 2. Projeyi Açın

```bash
# Proje klasörüne gidin
cd vitrifiye_quiz_configurator

# Bağımlılıkları yükleyin
pnpm install
```

### 3. Ortam Değişkenlerini Ayarlayın

`.env.local` dosyası oluşturun (`.env.local.example` dosyasını kopyalayın):

```bash
# Linux/Mac
cp .env.local.example .env.local

# Windows (PowerShell)
copy .env.local.example .env.local
```

`.env.local` dosyasını açın ve **sadece şu satırları** düzenleyin:

```env
# JWT Secret - Rastgele bir string oluşturun
JWT_SECRET="bu-kismi-degistirin-rastgele-32-karakter-veya-daha-uzun"

# Veri kaynağı - JSON modunda kalın
DATA_SOURCE="json"
JSON_DATA_PATH="./data/shopify-products.json"

# Database - JSON modunda gerekli DEĞİL (boş bırakabilirsiniz)
DATABASE_URL=""
```

> **Not:** JWT_SECRET için güvenli bir string oluşturmak isterseniz:
> ```bash
> # Linux/Mac
> openssl rand -base64 32
> 
> # Windows (PowerShell)
> [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
> ```

### 4. Uygulamayı Başlatın

```bash
pnpm dev
```

Tarayıcınızda `http://localhost:3000` adresini açın. 🎉

## 📁 JSON Veri Dosyası

Tüm ürün ve quiz verileri `data/shopify-products.json` dosyasında bulunur. Bu dosya:

- ✅ Shopify ürün yapısıyla %100 uyumlu
- ✅ 10 örnek vitrifiye ürünü içerir
- ✅ 6 quiz sorusu ve görselleri
- ✅ Metafield tanımları (Shopify entegrasyonu için hazır)

### Ürün Ekleme/Düzenleme

`data/shopify-products.json` dosyasını herhangi bir text editör ile açın:

```json
{
  "products": [
    {
      "id": "gid://shopify/Product/1",
      "title": "Modern Beyaz Lavabo",
      "price": "1500.00",
      "metafields": {
        "custom": {
          "room_type": "banyo",
          "style": "modern",
          "color": "beyaz"
        }
      }
    }
  ]
}
```

Değişiklikten sonra tarayıcıyı yenileyin (F5).

## 🎨 Quiz Görselleri

Quiz görselleri `client/public/quiz-images/` klasöründe:

- `banyo-modern.jpg` - Modern stil
- `banyo-klasik.jpg` - Klasik stil
- `banyo-endustriyel.jpg` - Endüstriyel stil
- `banyo-dogal.jpg` - Doğal stil
- `renk-beyaz.jpg`, `renk-gri.jpg`, `renk-bej.jpg`, `renk-siyah.jpg`, `renk-renkli.jpg`

Kendi görsellerinizi eklemek için bu klasöre yeni dosyalar ekleyin ve `data/shopify-products.json` dosyasındaki `imageUrl` alanlarını güncelleyin.

## 🔄 Shopify'a Geçiş (Gelecekte)

Shopify mağazanız hazır olduğunda:

### 1. Shopify App Oluşturun

1. Shopify Admin Panel → **Apps** → **Develop apps**
2. **Create an app** butonuna tıklayın
3. App adı: "Vitrifiye Quiz Configurator"
4. **Configure Admin API scopes** bölümünden gerekli izinleri verin:
   - `read_products`
   - `write_products`
   - `read_product_listings`
   - `read_orders`
5. **Install app** butonuna tıklayın
6. **Admin API access token**'ı kopyalayın

### 2. .env.local Dosyasını Güncelleyin

```env
# Veri kaynağını değiştirin
DATA_SOURCE="shopify"

# Shopify bilgilerinizi ekleyin
SHOPIFY_STORE_URL="your-store.myshopify.com"
SHOPIFY_ACCESS_TOKEN="shpat_xxxxxxxxxxxxxxxxxxxxx"
SHOPIFY_API_VERSION="2024-01"
```

### 3. Uygulamayı Yeniden Başlatın

```bash
# Ctrl+C ile durdurun
# Tekrar başlatın
pnpm dev
```

Artık gerçek Shopify ürünleriniz kullanılacak!

## 🛠️ Geliştirme Komutları

```bash
# Development server (hot reload)
pnpm dev

# TypeScript type checking
pnpm type-check

# Production build
pnpm build

# Production preview
pnpm preview

# Database studio (sadece database modunda)
pnpm db:studio

# Database schema push (sadece database modunda)
pnpm db:push
```

## 📂 Proje Yapısı

```
vitrifiye_quiz_configurator/
├── client/                    # Frontend (React + Vite)
│   ├── public/
│   │   └── quiz-images/      # Quiz görselleri (AI ile oluşturuldu)
│   └── src/
│       ├── pages/            # Quiz, Configurator, Profile, Home
│       ├── components/       # UI bileşenleri (shadcn/ui)
│       └── lib/trpc.ts       # tRPC client
├── server/                   # Backend (Express + tRPC)
│   ├── routers.ts            # API endpoint'leri
│   ├── db.ts                 # Database işlemleri
│   └── _core/                # Framework altyapısı
├── data/                     # JSON veri dosyaları
│   └── shopify-products.json # Ürünler ve quiz soruları
├── drizzle/                  # Database schema (opsiyonel)
│   └── schema.ts
└── scripts/                  # Yardımcı scriptler
    └── seed.mjs              # Database seed (opsiyonel)
```

## 🎯 Özellikler

### ✅ Çalışan Özellikler (JSON Modu)

- ✅ Quiz sistemi (6 soru, görselli seçenekler)
- ✅ Ürün önerileri (kullanıcı cevaplarına göre)
- ✅ 2D Konfigüratör (canvas tabanlı)
- ✅ Kullanıcı profili (tasarımları kaydetme/düzenleme)
- ✅ Lead toplama (email, isim)
- ✅ Responsive tasarım (mobil uyumlu)

### 🔜 Gelecek Özellikler (Shopify Entegrasyonu Sonrası)

- 🔜 Gerçek zamanlı ürün senkronizasyonu
- 🔜 Sepete ekleme (Shopify Cart API)
- 🔜 Webhook'lar (ürün güncellemeleri)
- 🔜 Sipariş takibi
- 🔜 Stok yönetimi

## 🐛 Sorun Giderme

### Port 3000 zaten kullanımda

```bash
# Farklı port kullanın
PORT=3001 pnpm dev
```

### "Cannot find module" hatası

```bash
# node_modules'u temizleyin
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Görseller yüklenmiyor

- `client/public/quiz-images/` klasöründe görsellerin olduğundan emin olun
- Tarayıcı console'unda (F12) hata var mı kontrol edin
- Tarayıcı cache'ini temizleyin (Ctrl+Shift+R)

### JSON değişiklikleri yansımıyor

- Tarayıcıyı yenileyin (F5)
- Server'ı yeniden başlatın (Ctrl+C, sonra `pnpm dev`)

## 📚 Ek Dokümantasyon

- **CURSOR_SETUP.md** - Detaylı kurulum rehberi
- **SHOPIFY_INTEGRATION.md** - Shopify entegrasyon adımları
- **README.md** - Genel proje dokümantasyonu

## 💡 İpuçları

1. **Geliştirme sırasında** JSON dosyasını düzenleyin, veritabanı kurmaya gerek yok
2. **Shopify entegrasyonu** için önce test mağazası oluşturun (ücretsiz)
3. **Görselleri** kendi ürünlerinizle değiştirin (client/public/ klasörüne)
4. **Quiz sorularını** ihtiyacınıza göre özelleştirin (data/shopify-products.json)

## 🤝 Destek

Sorun yaşarsanız:
- `CURSOR_SETUP.md` dosyasındaki detaylı rehbere bakın
- GitHub Issues'da sorun bildirin
- Dokümantasyonu kontrol edin

## 📝 Lisans

MIT License - Detaylar için `LICENSE` dosyasına bakın.

---

**Başarılar! 🎉** Sorularınız için dokümantasyona bakın veya destek alın.
