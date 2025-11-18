# Shopify Entegrasyon Rehberi

## Genel Bakış

Bu uygulama, Shopify mağazanızla entegre olarak çalışacak şekilde tasarlanmıştır. Ürünler Shopify'dan senkronize edilebilir ve kullanıcılar quiz sonuçlarına göre önerilen ürünleri doğrudan Shopify sepetine ekleyebilir.

## Entegrasyon Adımları

### 1. Shopify App Oluşturma

1. [Shopify Partners](https://partners.shopify.com/) hesabınıza giriş yapın
2. "Apps" > "Create app" seçeneğine tıklayın
3. "Custom app" seçeneğini seçin
4. Uygulama adını girin: "Vitrifiye Quiz & Konfigüratör"
5. App URL'ini girin: `https://your-domain.com`
6. Redirect URL'ini girin: `https://your-domain.com/api/shopify/callback`

### 2. API Erişim İzinleri

Aşağıdaki izinleri etkinleştirin:

**Read Access:**
- `read_products` - Ürün bilgilerini okuma
- `read_product_listings` - Ürün listelerini okuma
- `read_inventory` - Stok bilgilerini okuma

**Write Access:**
- `write_products` - Ürün metafield'larını güncelleme
- `write_draft_orders` - Taslak siparişler oluşturma

### 3. Webhook Yapılandırması

Ürün senkronizasyonu için aşağıdaki webhook'ları yapılandırın:

- `products/create` - Yeni ürün oluşturulduğunda
- `products/update` - Ürün güncellendiğinde
- `products/delete` - Ürün silindiğinde

Webhook URL: `https://your-domain.com/api/shopify/webhooks`

### 4. Metafield Yapılandırması

Ürünler için aşağıdaki metafield'ları oluşturun:

```json
{
  "namespace": "vitrifiye_quiz",
  "key": "style",
  "type": "single_line_text_field",
  "description": "Ürün stili (modern, klasik, minimalist, rustik)"
}
```

```json
{
  "namespace": "vitrifiye_quiz",
  "key": "room_type",
  "type": "list.single_line_text_field",
  "description": "Uygun mekan tipleri (banyo, mutfak, tuvalet)"
}
```

```json
{
  "namespace": "vitrifiye_quiz",
  "key": "features",
  "type": "list.single_line_text_field",
  "description": "Özel özellikler (su_tasarruflu, engelli_uyumlu, vb.)"
}
```

### 5. Ortam Değişkenleri

`.env` dosyanıza aşağıdaki değişkenleri ekleyin:

```env
SHOPIFY_SHOP_DOMAIN=your-shop.myshopify.com
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_ACCESS_TOKEN=your_access_token
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
```

## API Endpoint'leri

### Ürün Senkronizasyonu

**POST** `/api/shopify/sync-products`

Shopify'daki tüm ürünleri veritabanına senkronize eder.

```bash
curl -X POST https://your-domain.com/api/shopify/sync-products \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Sepete Ekleme

**POST** `/api/shopify/add-to-cart`

Önerilen ürünleri Shopify sepetine ekler.

```json
{
  "productIds": [123456, 789012],
  "shopDomain": "your-shop.myshopify.com"
}
```

### Webhook İşleme

**POST** `/api/shopify/webhooks`

Shopify webhook'larını işler (otomatik ürün senkronizasyonu).

## Kullanım Senaryoları

### Senaryo 1: Ürün Senkronizasyonu

1. Shopify mağazanıza ürünleri ekleyin
2. Her ürün için metafield'ları doldurun (stil, mekan tipi, özellikler)
3. Sync endpoint'ini çağırarak ürünleri veritabanına aktarın
4. Quiz sistemi artık Shopify ürünlerini kullanacak

### Senaryo 2: Quiz Sonrası Satın Alma

1. Kullanıcı quiz'i tamamlar
2. Sistem Shopify ürünlerinden öneriler sunar
3. Kullanıcı "Sepete Ekle" butonuna tıklar
4. Ürünler Shopify sepetine eklenir
5. Kullanıcı Shopify checkout sayfasına yönlendirilir

### Senaryo 3: Konfigüratör ile Tasarım

1. Kullanıcı konfigüratörde tasarım oluşturur
2. Tasarım kaydedilir ve paylaşılabilir link oluşturulur
3. Kullanıcı tasarımı Shopify'a gönderir
4. Tüm ürünler sepete eklenir ve checkout'a yönlendirilir

## Test Ortamı (Cursor)

Cursor'da test etmek için:

1. Shopify Development Store oluşturun
2. Test ürünleri ekleyin
3. Metafield'ları yapılandırın
4. `.env.local` dosyasına test store bilgilerini ekleyin
5. `pnpm dev` ile uygulamayı başlatın
6. Ngrok veya benzeri bir tunnel servisi ile local sunucuyu expose edin
7. Shopify webhook'larını tunnel URL'ine yönlendirin

## Güvenlik Notları

- API anahtarlarını asla commit etmeyin
- Webhook'ları HMAC ile doğrulayın
- Rate limiting uygulayın
- HTTPS kullanın
- Access token'ları şifreli saklayın

## Sınırlamalar

- Shopify API rate limit: 2 requests/second (REST), 1000 points/second (GraphQL)
- Metafield limiti: 250 per resource
- Webhook timeout: 5 saniye
- Maksimum ürün sayısı: Sınırsız (pagination ile)

## Destek

Entegrasyon ile ilgili sorularınız için:
- Shopify API Dokümantasyonu: https://shopify.dev/docs
- Shopify Community: https://community.shopify.com
- Proje GitHub Issues: [link]

## Gelecek Geliştirmeler

- [ ] GraphQL API desteği
- [ ] Bulk operations
- [ ] Multi-store desteği
- [ ] Otomatik stok senkronizasyonu
- [ ] Fiyat güncelleme webhook'ları
- [ ] Customer data entegrasyonu
