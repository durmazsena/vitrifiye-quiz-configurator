/**
 * AI Helper Functions
 * 
 * Bu dosya, LLM (Large Language Model) kullanarak akıllı ürün önerileri
 * ve doğal dil işleme özellikleri sağlar.
 */

import { invokeLLM } from "./_core/llm";
import type { Product } from "../drizzle/schema";

/**
 * Quiz cevaplarından detaylı kullanıcı profili çıkarır
 */
export async function generateUserStyleProfile(answers: Record<string, any>): Promise<{
  profile: string;
  keywords: string[];
  recommendations: string;
}> {
  try {
    const prompt = `Bir vitrifiye mağazası için quiz cevaplarını analiz et ve kullanıcının stil profilini çıkar.

Quiz Cevapları:
${JSON.stringify(answers, null, 2)}

Lütfen şunları yap:
1. Kullanıcının stil profilini 2-3 cümle ile açıkla
2. Anahtar kelimeler listesi çıkar (5-7 kelime)
3. Genel ürün önerisi stratejisi belirt

JSON formatında yanıt ver:
{
  "profile": "Kullanıcı profili açıklaması",
  "keywords": ["anahtar", "kelime", "listesi"],
  "recommendations": "Öneri stratejisi"
}`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Sen bir iç mekan tasarım uzmanısın. Kullanıcı tercihlerini analiz edip stil profili çıkarıyorsun." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "style_profile",
          strict: true,
          schema: {
            type: "object",
            properties: {
              profile: { type: "string", description: "Kullanıcının stil profili açıklaması" },
              keywords: { 
                type: "array", 
                items: { type: "string" },
                description: "Anahtar kelimeler"
              },
              recommendations: { type: "string", description: "Genel öneri stratejisi" }
            },
            required: ["profile", "keywords", "recommendations"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    if (typeof content !== 'string') {
      throw new Error('Invalid response format');
    }
    return JSON.parse(content);
  } catch (error) {
    console.error("AI style profile generation failed:", error);
    // Fallback: Basit profil döndür
    return {
      profile: "Kullanıcı tercihleri analiz edildi.",
      keywords: Object.values(answers).filter(v => typeof v === 'string').slice(0, 5) as string[],
      recommendations: "Filtrelere uygun ürünler önerilecek."
    };
  }
}

/**
 * Ürünler için AI ile akıllı filtreleme ve sıralama yapar
 * Bu fonksiyon, kullanıcı profilini kullanarak ürünleri filtreler ve sıralar
 */
export async function smartFilterAndSortProducts(
  products: Product[],
  userProfile: string,
  userAnswers: Record<string, any>,
  maxProducts: number = 12
): Promise<Product[]> {
  try {
    // Eğer çok fazla ürün varsa, önce basit filtreleme yap (performans için)
    let productsToProcess = products;
    if (products.length > 50) {
      // İlk 50 ürünü AI'a gönder
      productsToProcess = products.slice(0, 50);
    }

    const productSummaries = productsToProcess.map(p => ({
      id: p.id,
      title: p.title,
      style: p.style,
      color: p.color,
      price: p.price,
      category: p.category,
      material: p.material
    }));

    const prompt = `Kullanıcı profili: ${userProfile}

Quiz Cevapları: ${JSON.stringify(userAnswers)}

Kullanıcı belirli ürün kategorilerine ihtiyaç duyuyor. Aşağıdaki ürünleri kullanıcının ihtiyaçlarına, stil tercihlerine ve bütçesine göre BENZERLİK ve UYUMLULUK açısından değerlendir.

Kriterler:
- Stil uyumu (modern, klasik, endüstriyel, rustik)
- Renk uyumu
- Bütçe uygunluğu
- Genel estetik uyumluluk
- Kullanıcı profilindeki tercihlerle benzerlik

Aşağıdaki ürünleri kullanıcıya en uygun olandan en az uygun olana doğru sırala ve en iyi ${maxProducts} ürünü seç:
${JSON.stringify(productSummaries, null, 2)}

Sadece ürün ID'lerini sıralı bir dizi olarak döndür (en uygun ${maxProducts} ürün).

JSON formatında yanıt ver:
{
  "sortedIds": [id1, id2, id3, ...]
}`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Sen bir vitrifiye ürün uzmanısın. Kullanıcının ihtiyaçlarına, stil tercihlerine ve bütçesine göre ürünleri BENZERLİK ve UYUMLULUK açısından değerlendirip en uygun olanları seçiyorsun. Stil, renk, bütçe ve genel estetik uyumluluğu dikkate al." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "product_sorting",
          strict: true,
          schema: {
            type: "object",
            properties: {
              sortedIds: { 
                type: "array", 
                items: { type: "integer" },
                description: "Sıralı ürün ID listesi"
              }
            },
            required: ["sortedIds"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    if (typeof content !== 'string') {
      throw new Error('Invalid response format');
    }
    const { sortedIds } = JSON.parse(content);

    // Ürünleri AI'ın önerdiği sıraya göre düzenle
    const sortedProducts: Product[] = [];
    for (const id of sortedIds) {
      const product = productsToProcess.find(p => p.id === id);
      if (product) sortedProducts.push(product);
    }

    // AI'ın sıralamadığı ürünleri sona ekle (fallback)
    for (const product of productsToProcess) {
      if (!sortedProducts.find(p => p.id === product.id) && sortedProducts.length < maxProducts) {
        sortedProducts.push(product);
      }
    }

    return sortedProducts.slice(0, maxProducts);
  } catch (error) {
    console.error("AI smart filtering failed:", error);
    // Fallback: Orijinal sıralamayı koru ve ilk maxProducts ürünü al
    return products.slice(0, maxProducts);
  }
}

/**
 * Quiz cevaplarına göre AI ile gelişmiş ürün önerileri oluşturur
 * Bu fonksiyon, önce stil profili oluşturur, sonra ürünleri filtreler ve sıralar
 */
export async function generateAIRecommendations(
  answers: Record<string, any>,
  allProducts: Product[]
): Promise<{
  recommendedProducts: number[];
  reasoning: string;
  styleProfile: string;
}> {
  try {
    // Önce stil profili oluştur
    const profile = await generateUserStyleProfile(answers);

    // Ürünleri AI ile filtrele ve sırala
    const sortedProducts = await smartFilterAndSortProducts(allProducts, profile.profile, answers, 12);

    return {
      recommendedProducts: sortedProducts.map(p => p.id),
      reasoning: profile.recommendations,
      styleProfile: profile.profile
    };
  } catch (error) {
    console.error("AI recommendations failed:", error);
    // Fallback: İlk 12 ürünü döndür
    return {
      recommendedProducts: allProducts.slice(0, 12).map(p => p.id),
      reasoning: "Filtrelere göre ürünler seçildi.",
      styleProfile: "Kullanıcı tercihleri analiz edildi."
    };
  }
}

