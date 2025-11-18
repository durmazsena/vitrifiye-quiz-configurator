# Vitrifiye Quiz & Konfigüratör

Vitrifiye ürünleri satan mağazalar için yapay zeka destekli ürün öneri quiz'i ve mekan konfigüratörü.

## Özellikler

### 🎯 Quiz Sistemi
- Kullanıcı ihtiyaçlarını belirleyen akıllı sorular
- Mekan tipi, stil, renk, bütçe ve özel gereksinimler
- AI destekli ürün eşleştirme algoritması
- Kişiselleştirilmiş ürün önerileri
- Lead toplama (email, isim)

### 🎨 Konfigüratör
- 2D Canvas tabanlı görselleştirme
- Kategori bazlı ürün kataloğu
- Tıklayarak ürün yerleştirme
- Ürün döndürme ve kaldırma
- Anlık fiyat hesaplama
- Tasarım kaydetme ve paylaşma

### 🛍️ Shopify Entegrasyonu
- Ürün senkronizasyonu
- Metafield desteği
- Webhook entegrasyonu
- Sepete ekleme
- Checkout yönlendirme

## Teknoloji Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS 4
- **Backend:** Node.js, Express, tRPC 11
- **Database:** MySQL/TiDB (Drizzle ORM)
- **Auth:** Manus OAuth
- **UI Components:** shadcn/ui

## Kurulum

### Gereksinimler

- Node.js 22+
- pnpm 10+
- MySQL veya TiDB database

### Adımlar

1. **Repository'yi klonlayın**
```bash
git clone <repository-url>
cd vitrifiye_quiz_configurator
```

2. **Bağımlılıkları yükleyin**
```bash
pnpm install
```

3. **Ortam değişkenlerini yapılandırın**

`.env` dosyası otomatik olarak Manus platformu tarafından yönetilir. Local test için `.env.local` oluşturun:

```env
DATABASE_URL=mysql://user:password@localhost:3306/vitrifiye_quiz
```

4. **Veritabanını hazırlayın**
```bash
pnpm db:push
```

5. **Seed data ekleyin**
```bash
node scripts/seed.mjs
```

6. **Development server'ı başlatın**
```bash
pnpm dev
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

## Cursor'da Test Etme

### 1. Projeyi Cursor'da Açın

```bash
cursor .
```

### 2. Terminal'de Geliştirme Sunucusunu Başlatın

```bash
pnpm dev
```

### 3. Test Senaryoları

#### Quiz Testi
1. `http://localhost:3000/quiz` adresine gidin
2. Soruları yanıtlayın
3. Email ve isim girin
4. Sonuç sayfasında önerilen ürünleri görün

#### Konfigüratör Testi
1. `http://localhost:3000/configurator` adresine gidin
2. Sağ panelden bir ürün seçin
3. Canvas'a tıklayarak ürünü yerleştirin
4. Birden fazla ürün ekleyin
5. Toplam fiyatı kontrol edin
6. "Tasarımı Kaydet" butonuna tıklayın

### 4. API Testleri

tRPC endpoint'lerini test etmek için:

```bash
# Terminal'de
pnpm test
```

Veya Cursor'ın REST Client extension'ını kullanarak:

```http
### Get all products
GET http://localhost:3000/api/trpc/products.getAll

### Get quiz questions
GET http://localhost:3000/api/trpc/quiz.getQuestions

### Submit quiz answers
POST http://localhost:3000/api/trpc/quiz.submitAnswers
Content-Type: application/json

{
  "answers": {
    "1": "banyo",
    "3": "modern",
    "4": ["beyaz"],
    "5": "orta"
  },
  "email": "test@example.com",
  "name": "Test User"
}
```

## Proje Yapısı

```
vitrifiye_quiz_configurator/
├── client/                 # Frontend (React)
│   ├── src/
│   │   ├── pages/         # Sayfa bileşenleri
│   │   │   ├── Home.tsx
│   │   │   ├── Quiz.tsx
│   │   │   ├── QuizResult.tsx
│   │   │   └── Configurator.tsx
│   │   ├── components/    # UI bileşenleri
│   │   ├── lib/          # Utilities
│   │   └── App.tsx       # Ana uygulama
│   └── public/           # Statik dosyalar
├── server/               # Backend (Node.js)
│   ├── routers.ts       # tRPC endpoint'leri
│   ├── db.ts            # Database helper'ları
│   └── _core/           # Framework core
├── drizzle/             # Database schema
│   └── schema.ts
├── scripts/             # Utility script'leri
│   └── seed.mjs        # Seed data
├── shared/              # Paylaşılan tipler
└── package.json
```

## Veritabanı Şeması

### Tables

- **users** - Kullanıcı bilgileri
- **products** - Vitrifiye ürünleri
- **quiz_questions** - Quiz soruları
- **quiz_results** - Quiz sonuçları ve öneriler
- **configurations** - Kullanıcı tasarımları
- **shopify_settings** - Shopify entegrasyon ayarları

Detaylı şema için `drizzle/schema.ts` dosyasına bakın.

## API Dokümantasyonu

### Products

- `products.getAll()` - Tüm ürünleri listele
- `products.getById(id)` - ID'ye göre ürün getir
- `products.getByCategory(category)` - Kategoriye göre filtrele
- `products.getByFilters(filters)` - Gelişmiş filtreleme

### Quiz

- `quiz.getQuestions()` - Quiz sorularını getir
- `quiz.submitAnswers(answers, email, name)` - Cevapları gönder ve öneri al
- `quiz.getResult(resultId)` - Quiz sonucunu getir
- `quiz.getUserResults()` - Kullanıcının tüm quiz sonuçları

### Configurations

- `configurations.create(config)` - Yeni tasarım oluştur
- `configurations.update(id, updates)` - Tasarımı güncelle
- `configurations.getById(id)` - Tasarımı getir
- `configurations.getUserConfigurations()` - Kullanıcının tasarımları
- `configurations.getPublic(limit)` - Paylaşılan tasarımlar
- `configurations.delete(id)` - Tasarımı sil

## Shopify Entegrasyonu

Detaylı entegrasyon rehberi için `SHOPIFY_INTEGRATION.md` dosyasına bakın.

### Hızlı Başlangıç

1. Shopify Development Store oluşturun
2. Custom App oluşturun ve API credentials alın
3. `.env` dosyasına credentials ekleyin
4. Ürün metafield'larını yapılandırın
5. Sync endpoint'ini çağırarak ürünleri senkronize edin

## Deployment

### Netlify Deployment

Bu proje Netlify'da deploy edilebilir. İki seçenek var:

#### Seçenek 1: Netlify + Backend için Ayrı Servis (Önerilen)

1. **Frontend'i Netlify'da deploy edin:**
   - GitHub repository'nizi Netlify'a bağlayın
   - Build command: `pnpm build`
   - Publish directory: `dist/public`
   - Environment variables ekleyin (Netlify dashboard'dan):
     - `BUILT_IN_FORGE_API_KEY` (AI özellikleri için)
     - Diğer gerekli değişkenler

2. **Backend'i ayrı bir serviste deploy edin:**
   - Railway, Render, Fly.io veya benzeri bir servis kullanın
   - Backend URL'ini frontend'e environment variable olarak ekleyin

#### Seçenek 2: Netlify Functions (Gelişmiş)

Express server'ı Netlify Functions'a dönüştürmek için `@netlify/express` adapter'ı kullanabilirsiniz. Bu daha karmaşık bir yapılandırma gerektirir.

### GitHub'a Push

1. **Git repository başlatın:**
```bash
git init
git add .
git commit -m "Initial commit"
```

2. **GitHub'da yeni bir repository oluşturun**

3. **Remote ekleyin ve push edin:**
```bash
git remote add origin https://github.com/kullaniciadi/repo-adi.git
git branch -M main
git push -u origin main
```

4. **Netlify'da yeni site oluşturun:**
   - Netlify dashboard'a gidin
   - "Add new site" > "Import an existing project"
   - GitHub repository'nizi seçin
   - Build settings:
     - Build command: `pnpm build`
     - Publish directory: `dist/public`
   - Environment variables ekleyin:
     - `BUILT_IN_FORGE_API_KEY`
     - `NODE_ENV=production`

### Environment Variables (Netlify)

Netlify dashboard'da şu environment variables'ları ekleyin:

```env
BUILT_IN_FORGE_API_KEY=your_api_key_here
NODE_ENV=production
```

### Manuel Deployment

```bash
# Build
pnpm build

# Start production server
pnpm start
```

## Geliştirme

### Yeni Özellik Ekleme

1. `todo.md` dosyasına görevi ekleyin
2. Gerekli database değişikliklerini `drizzle/schema.ts` dosyasında yapın
3. `pnpm db:push` ile migration'ı uygulayın
4. `server/db.ts` dosyasına helper fonksiyonları ekleyin
5. `server/routers.ts` dosyasına tRPC endpoint'leri ekleyin
6. Frontend'de ilgili bileşenleri oluşturun
7. Test edin ve `todo.md` dosyasını güncelleyin

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Tailwind CSS utilities
- shadcn/ui components

## Lisans

MIT

## Destek

Sorularınız için:
- GitHub Issues
- Email: support@example.com
