# Netlify Environment Variables Kurulum Rehberi

## ⚠️ ÖNEMLİ: Doğru Yer

Environment variables'ları **Site settings** altında eklemeniz gerekir, **Team settings** altında değil!

## Adım Adım Kurulum

### 1. Site'nize Gidin

1. Netlify dashboard'da (https://app.netlify.com)
2. **"Sites"** veya **"Projects"** menüsünden site'nizi seçin
3. Site adınıza tıklayın (örn: `vitrifiye-quiz-configurator`)

### 2. Site Settings'e Gidin

1. Site sayfasında üst menüden **"Site settings"** butonuna tıklayın
   - ⚠️ "Team settings" değil, **"Site settings"** olmalı!

### 3. Environment Variables Bölümüne Gidin

1. Sol menüden **"Environment variables"** seçeneğine tıklayın
2. Burada site'nize özel environment variables'ları göreceksiniz

### 4. Yeni Değişken Ekleyin

**"Add a variable"** veya **"Add environment variable"** butonuna tıklayın

#### Değişken 1: BUILT_IN_FORGE_API_KEY

- **Key:** `BUILT_IN_FORGE_API_KEY`
- **Value:** Local `.env` dosyanızdaki API key'inizi yapıştırın
- **Scope:** 
  - ✅ **"All scopes"** seçin (Production, Deploy previews, Branch deploys)
  - VEYA sadece **"Production"** seçin
- **"Add variable"** butonuna tıklayın

#### Değişken 2: NODE_ENV

- **Key:** `NODE_ENV`
- **Value:** `production`
- **Scope:** **"All scopes"** seçin
- **"Add variable"** butonuna tıklayın

### 5. Mevcut Değişkenleri Düzenleme

Eğer zaten bir değişken eklediyseniz ve "secret" seçtiyseniz:

1. Değişkenin yanındaki **"Edit"** veya **"..."** menüsüne tıklayın
2. **"Edit variable"** seçeneğini seçin
3. **Scope** kısmını **"All scopes"** olarak değiştirin
4. **"Save"** butonuna tıklayın

### 6. Yeni Deploy Başlatın

Environment variables'lar sadece yeni deploy'larda aktif olur:

1. Site sayfasında **"Deploys"** sekmesine gidin
2. **"Trigger deploy"** > **"Deploy site"** butonuna tıklayın
3. Veya GitHub'a yeni bir commit push edin (otomatik deploy)

## Doğru vs Yanlış Yer

### ❌ Yanlış Yer (Şu an baktığınız yer):
- **Team settings** > Environment variables
- Bu premium özellik (Shared environment variables)
- Tüm team için geçerli

### ✅ Doğru Yer:
- **Site settings** > Environment variables
- Her site için ayrı
- Ücretsiz planlarda da çalışır

## Kontrol

Deploy tamamlandıktan sonra:

1. Site sayfasında **"Functions"** sekmesine gidin
2. **"trpc"** function'ını seçin
3. **"Logs"** sekmesinde environment variables'ların yüklendiğini görebilirsiniz

## Sorun Giderme

### "Secret" scope seçtim, değiştirebilir miyim?

✅ **Evet!** Değişkeni düzenleyip scope'u değiştirebilirsiniz:
1. Değişkenin yanındaki **"Edit"** butonuna tıklayın
2. **Scope** kısmını **"All scopes"** olarak değiştirin
3. **"Save"** butonuna tıklayın

### Environment variables görünmüyor

- Site settings'e gittiğinizden emin olun (team settings değil)
- Deploy'u yeniden başlatın
- Function logs'larını kontrol edin

### API key çalışmıyor

- API key'in doğru kopyalandığından emin olun (boşluk olmamalı)
- Scope'un "All scopes" veya "Production" olduğundan emin olun
- Netlify'da **"Redeploy"** yapın
- Browser console'da hataları kontrol edin
