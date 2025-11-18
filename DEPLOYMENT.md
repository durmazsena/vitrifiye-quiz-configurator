# Deployment Rehberi

Bu proje Netlify'da deploy edilebilir. Bu rehber adım adım deployment sürecini açıklar.

## Ön Hazırlık

### 1. GitHub Repository Oluşturma

1. GitHub'da yeni bir repository oluşturun
2. Repository'yi klonlayın veya mevcut projeyi bağlayın

### 2. Git Repository Başlatma

```bash
# Proje dizininde
git init
git add .
git commit -m "Initial commit: Vitrifiye Quiz & Konfigüratör"

# GitHub repository'nizi remote olarak ekleyin
git remote add origin https://github.com/kullaniciadi/repo-adi.git
git branch -M main
git push -u origin main
```

### 3. Environment Variables Hazırlama

Netlify'da kullanacağınız environment variables'ları hazırlayın:

- `BUILT_IN_FORGE_API_KEY`: AI özellikleri için gerekli API key
- `NODE_ENV`: `production` olarak ayarlayın

## Netlify Deployment

### Adım 1: Netlify'da Yeni Site Oluşturma

1. [Netlify Dashboard](https://app.netlify.com)'a gidin
2. "Add new site" > "Import an existing project" seçin
3. GitHub'ı seçin ve repository'nizi bağlayın

### Adım 2: Build Settings

Netlify otomatik olarak `netlify.toml` dosyasını okuyacaktır. Eğer manuel ayar yapmak isterseniz:

- **Build command:** `pnpm build`
- **Publish directory:** `dist/public`
- **Node version:** `20`
- **PNPM version:** `10.4.1`

### Adım 3: Environment Variables Ekleme

Netlify dashboard'da:
1. Site settings > Environment variables
2. Şu değişkenleri ekleyin:

```
BUILT_IN_FORGE_API_KEY=your_api_key_here
NODE_ENV=production
```

### Adım 4: Deploy

1. "Deploy site" butonuna tıklayın
2. Netlify otomatik olarak build'i başlatacak
3. Build tamamlandıktan sonra site canlıya alınacak

## Önemli Notlar

### Backend API Endpoints

Bu proje Express server kullanıyor. Netlify'da static hosting yapıyorsanız, backend API'lerini ayrı bir serviste deploy etmeniz gerekebilir:

- **Railway:** https://railway.app
- **Render:** https://render.com
- **Fly.io:** https://fly.io

Backend'i ayrı deploy ederseniz, frontend'deki API URL'lerini güncellemeniz gerekir.

### Netlify Functions (Alternatif)

Eğer tüm uygulamayı Netlify'da çalıştırmak istiyorsanız, Express server'ı Netlify Functions'a dönüştürmeniz gerekir. Bu daha karmaşık bir yapılandırma gerektirir.

## Troubleshooting

### Build Hatası

- `pnpm` komutunun bulunamadığı hatası: Netlify'da `PNPM_VERSION` environment variable'ını kontrol edin
- Node version hatası: `NODE_VERSION` environment variable'ını kontrol edin

### API Hatası

- Backend API'leri çalışmıyorsa, backend'in ayrı bir serviste deploy edildiğinden emin olun
- CORS hatası alıyorsanız, backend'de CORS ayarlarını kontrol edin

### Environment Variables

- Environment variables'ların doğru eklendiğinden emin olun
- Production build'de environment variables'ların kullanılabilir olduğunu kontrol edin

## Güncelleme

Kod değişikliklerini GitHub'a push ettiğinizde, Netlify otomatik olarak yeni bir deploy başlatacaktır.

```bash
git add .
git commit -m "Update: description"
git push
```

## Domain Ayarlama

1. Netlify dashboard'da Site settings > Domain management
2. Custom domain ekleyin
3. DNS ayarlarını yapın (Netlify size talimat verecek)

## Destek

Sorun yaşarsanız:
- Netlify dokümantasyonu: https://docs.netlify.com
- GitHub Issues: Repository'nizde issue açın

