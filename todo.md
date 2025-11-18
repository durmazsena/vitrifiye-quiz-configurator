# Vitrifiye Quiz & Konfigüratör - Proje Görevleri

## Veritabanı ve Temel Yapı
- [x] Veritabanı şeması tasarımı (products, quiz_questions, quiz_results, configurations)
- [x] Seed data hazırlama (örnek vitrifiye ürünleri ve quiz soruları)
- [x] Database helper fonksiyonları
- [x] Temel tRPC router yapısı kurulumu

## Quiz Mantığı
- [x] Quiz soru tipleri (mekan tipi, stil, renk, bütçe, boyut)
- [x] Quiz akış mantığı (koşullu dallanma)
- [x] Ürün eşleştirme algoritması (kullanıcı cevaplarına göre ürün önerisi)
- [x] Quiz sonuç sayfası ve kişiselleştirilmiş öneriler
- [x] Lead toplama (email, isim)

## Konfigüratör Arayüzü
- [x] Ürün görselleştirme arayüzü (2D Canvas)
- [x] Tıklayarak ürün yerleştirme
- [x] Kategori bazlı ürün katalogü
- [x] Anlık fiyat hesaplama
- [x] Konfigürasyon kaydetme
- [ ] Uyumlu ürün setleri AI önerisi
- [ ] 3D görselleştirme (gelecek versiyon)

## Shopify Entegrasyonu
- [x] Shopify entegrasyon dokümantasyonu (SHOPIFY_INTEGRATION.md)
- [x] Veritabanı şemasında shopify_settings tablosu
- [ ] Shopify Admin API client implementasyonu
- [ ] Shopify Product Metafields yapılandırması
- [ ] Ürün senkronizasyonu endpoint'i
- [ ] Sepete ekleme işlevi
- [ ] Webhook yapılandırması ve handler'lar

## UI/UX
- [x] Ana sayfa tasarımı
- [x] Quiz arayüzü tasarımı
- [x] Quiz sonuç sayfası tasarımı
- [x] Konfigüratör arayüzü tasarımı
- [x] Mobil uyumlu tasarım (Tailwind responsive)
- [x] Loading ve error state'leri

## Test ve Dokümantasyon
- [x] Cursor test ortamı kurulumu
- [x] Kurulum dokümantasyonu (README.md)
- [x] API dokümantasyonu (README.md)
- [x] Shopify entegrasyon dokümantasyonu
- [ ] API endpoint testleri (Vitest)
- [ ] Kullanıcı senaryoları testi (E2E)

## Kullanıcı Profil Bölümü (Yeni İstek)
- [x] Profil sayfası tasarımı
- [x] Kaydedilmiş tasarımları listeleme
- [x] Tasarım detay görüntüleme
- [x] Tasarımları düzenleme (konfigüratörde açma)
- [x] Tasarımları silme
- [x] Tasarım paylaşma ayarları (public/private toggle)
- [x] Quiz geçmişi görüntüleme
- [x] Kullanıcı istatistikleri (toplam tasarım, toplam harcama)
- [x] Ana sayfaya profil linki eklendi

## Cursor Standalone Versiyonu (Yeni İstek)
- [x] Ana ekran buton yazım hatalarını düzeltme
- [x] Shopify uyumlu JSON veri yapısı oluşturma (data/shopify-products.json)
- [x] Quiz seçeneklerine AI ile görseller ekleme (9 görsel)
- [x] Cursor kurulum dokümantasyonu oluşturma (CURSOR_SETUP.md)
- [x] Seed script'i güncelleme (görsel yolları eklendi)
