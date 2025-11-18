import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

// Veritabanı bağlantısı
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Örnek ürünler
const sampleProducts = [
  // Lavabolar
  {
    title: "Modern Dikdörtgen Lavabo - Beyaz",
    description: "Minimalist tasarımlı, kolay temizlenen beyaz porselen lavabo. 60cm genişlik.",
    category: "lavabo",
    style: "modern",
    color: "beyaz",
    material: "porselen",
    price: 125000, // 1250 TL
    imageUrl: "/images/products/lavabo-modern-white.jpg",
    dimensions: JSON.stringify({ width: 60, height: 15, depth: 45 }),
    tags: JSON.stringify(["kolay_temizlik", "modern"]),
    isActive: true
  },
  {
    title: "Klasik Oval Lavabo - Krem",
    description: "Zarif oval formlu klasik lavabo. Vintage banyolar için ideal.",
    category: "lavabo",
    style: "klasik",
    color: "krem",
    material: "porselen",
    price: 145000, // 1450 TL
    imageUrl: "/images/products/lavabo-classic-cream.jpg",
    dimensions: JSON.stringify({ width: 55, height: 18, depth: 42 }),
    tags: JSON.stringify(["klasik", "zarif"]),
    isActive: true
  },
  {
    title: "Minimalist Tezgah Üstü Lavabo",
    description: "İnce kenarlı, modern tezgah üstü lavabo. Mat siyah finish.",
    category: "lavabo",
    style: "minimalist",
    color: "siyah",
    material: "seramik",
    price: 185000, // 1850 TL
    imageUrl: "/images/products/lavabo-minimal-black.jpg",
    dimensions: JSON.stringify({ width: 50, height: 12, depth: 40 }),
    tags: JSON.stringify(["minimalist", "premium"]),
    isActive: true
  },
  
  // Klozetler
  {
    title: "Akıllı Klozet - Beyaz",
    description: "Otomatik kapak, ısıtmalı oturma, bide fonksiyonu. Su tasarruflu.",
    category: "klozet",
    style: "modern",
    color: "beyaz",
    material: "porselen",
    price: 485000, // 4850 TL
    imageUrl: "/images/products/klozet-smart-white.jpg",
    dimensions: JSON.stringify({ width: 38, height: 45, depth: 65 }),
    tags: JSON.stringify(["su_tasarruflu", "akilli", "premium"]),
    isActive: true
  },
  {
    title: "Asma Klozet - Beyaz",
    description: "Duvara monte, kolay temizlik. Gizli rezervuar sistemi.",
    category: "klozet",
    style: "modern",
    color: "beyaz",
    material: "porselen",
    price: 225000, // 2250 TL
    imageUrl: "/images/products/klozet-wall-white.jpg",
    dimensions: JSON.stringify({ width: 36, height: 35, depth: 52 }),
    tags: JSON.stringify(["su_tasarruflu", "kolay_temizlik"]),
    isActive: true
  },
  {
    title: "Geleneksel Klozet - Krem",
    description: "Klasik tasarım, yüksek rezervuar seçeneği. Vintage banyolar için.",
    category: "klozet",
    style: "klasik",
    color: "krem",
    material: "porselen",
    price: 195000, // 1950 TL
    imageUrl: "/images/products/klozet-classic-cream.jpg",
    dimensions: JSON.stringify({ width: 38, height: 78, depth: 65 }),
    tags: JSON.stringify(["klasik", "vintage"]),
    isActive: true
  },
  
  // Bataryalar
  {
    title: "Şelale Batarya - Krom",
    description: "Şelale akışlı modern lavabo bataryası. LED ışıklı.",
    category: "batarya",
    style: "modern",
    color: "krom",
    material: "pirinç",
    price: 165000, // 1650 TL
    imageUrl: "/images/products/batarya-waterfall-chrome.jpg",
    dimensions: JSON.stringify({ width: 15, height: 25, depth: 15 }),
    tags: JSON.stringify(["modern", "led", "premium"]),
    isActive: true
  },
  {
    title: "Minimalist Batarya - Mat Siyah",
    description: "Tek kollu, yüksek gövdeli lavabo bataryası. Mat siyah kaplama.",
    category: "batarya",
    style: "minimalist",
    color: "siyah",
    material: "paslanmaz_celik",
    price: 195000, // 1950 TL
    imageUrl: "/images/products/batarya-minimal-black.jpg",
    dimensions: JSON.stringify({ width: 12, height: 32, depth: 12 }),
    tags: JSON.stringify(["minimalist", "premium"]),
    isActive: true
  },
  {
    title: "Klasik Batarya - Bronz",
    description: "Çift kollu, vintage tasarım. Antik bronz finish.",
    category: "batarya",
    style: "klasik",
    color: "bronz",
    material: "pirinç",
    price: 175000, // 1750 TL
    imageUrl: "/images/products/batarya-classic-bronze.jpg",
    dimensions: JSON.stringify({ width: 18, height: 22, depth: 15 }),
    tags: JSON.stringify(["klasik", "vintage"]),
    isActive: true
  },
  
  // Duş Setleri
  {
    title: "Yağmur Duş Sistemi - Krom",
    description: "Tavan tipi yağmur duş başlığı, el duşu ve termostatik karışıcı.",
    category: "dus_seti",
    style: "modern",
    color: "krom",
    material: "paslanmaz_celik",
    price: 385000, // 3850 TL
    imageUrl: "/images/products/shower-rain-chrome.jpg",
    dimensions: JSON.stringify({ width: 30, height: 120, depth: 30 }),
    tags: JSON.stringify(["termostatik", "premium", "yagmur_dus"]),
    isActive: true
  },
  {
    title: "Kompakt Duş Seti - Mat Siyah",
    description: "Minimalist duş kolonu, el duşu ve yağmur başlığı.",
    category: "dus_seti",
    style: "minimalist",
    color: "siyah",
    material: "paslanmaz_celik",
    price: 295000, // 2950 TL
    imageUrl: "/images/products/shower-compact-black.jpg",
    dimensions: JSON.stringify({ width: 25, height: 110, depth: 25 }),
    tags: JSON.stringify(["minimalist", "kompakt"]),
    isActive: true
  },
  
  // Aynalar
  {
    title: "LED Aydınlatmalı Ayna - 80cm",
    description: "Dokunmatik sensör, anti-sis, ayarlanabilir LED ışık.",
    category: "ayna",
    style: "modern",
    color: "beyaz",
    material: "cam",
    price: 145000, // 1450 TL
    imageUrl: "/images/products/mirror-led-80.jpg",
    dimensions: JSON.stringify({ width: 80, height: 60, depth: 3 }),
    tags: JSON.stringify(["led", "anti_sis", "modern"]),
    isActive: true
  },
  {
    title: "Çerçeveli Klasik Ayna - Altın",
    description: "Dekoratif altın çerçeve, 70cm yuvarlak ayna.",
    category: "ayna",
    style: "klasik",
    color: "altin",
    material: "cam",
    price: 125000, // 1250 TL
    imageUrl: "/images/products/mirror-classic-gold.jpg",
    dimensions: JSON.stringify({ width: 70, height: 70, depth: 5 }),
    tags: JSON.stringify(["klasik", "dekoratif"]),
    isActive: true
  },
  
  // Aksesuarlar
  {
    title: "Havluluk Seti - Mat Siyah",
    description: "3 parça: havluluk, tuvalet kağıtlığı, fırçalık.",
    category: "aksesuar",
    style: "minimalist",
    color: "siyah",
    material: "paslanmaz_celik",
    price: 85000, // 850 TL
    imageUrl: "/images/products/accessory-set-black.jpg",
    dimensions: JSON.stringify({ width: 60, height: 10, depth: 10 }),
    tags: JSON.stringify(["set", "minimalist"]),
    isActive: true
  },
  {
    title: "Havluluk Seti - Krom",
    description: "5 parça: havluluk, tuvalet kağıtlığı, fırçalık, sabunluk, kancalar.",
    category: "aksesuar",
    style: "modern",
    color: "krom",
    material: "pirinç",
    price: 115000, // 1150 TL
    imageUrl: "/images/products/accessory-set-chrome.jpg",
    dimensions: JSON.stringify({ width: 60, height: 10, depth: 10 }),
    tags: JSON.stringify(["set", "modern", "kapsamli"]),
    isActive: true
  }
];

// Quiz soruları
const sampleQuestions = [
  {
    questionText: "Hangi mekan için ürün arıyorsunuz?",
    questionType: "single_choice",
    category: "mekan_tipi",
    options: JSON.stringify([
      { value: "banyo", label: "Banyo", imageUrl: "/quiz-images/banyo-modern.jpg" },
      { value: "mutfak", label: "Mutfak" },
      { value: "tuvalet", label: "Tuvalet" },
      { value: "lavabo", label: "Lavabo" }
    ]),
    order: 1,
    isActive: true
  },
  {
    questionText: "Mekanınızın boyutu nasıl?",
    questionType: "single_choice",
    category: "boyut",
    options: JSON.stringify([
      { value: "kucuk", label: "Küçük (< 4m²)", imageUrl: "/images/quiz/size-small.jpg" },
      { value: "orta", label: "Orta (4-8m²)", imageUrl: "/images/quiz/size-medium.jpg" },
      { value: "buyuk", label: "Büyük (> 8m²)", imageUrl: "/images/quiz/size-large.jpg" }
    ]),
    order: 2,
    isActive: true
  },
  {
    questionText: "Hangi tarzı tercih ediyorsunuz?",
    questionType: "image_select",
    category: "stil",
    options: JSON.stringify([
      { value: "modern", label: "Modern & Minimalist", imageUrl: "/quiz-images/banyo-modern.jpg" },
      { value: "klasik", label: "Klasik & Şık", imageUrl: "/quiz-images/banyo-klasik.jpg" },
      { value: "endustriyel", label: "Endüstriyel & Çağdaş", imageUrl: "/quiz-images/banyo-endustriyel.jpg" },
      { value: "dogal", label: "Doğal & Organik", imageUrl: "/quiz-images/banyo-dogal.jpg" }
    ]),
    order: 3,
    isActive: true
  },
  {
    questionText: "Renk tercihiniz nedir?",
    questionType: "single_choice",
    category: "renk",
    options: JSON.stringify([
      { value: "beyaz", label: "Beyaz & Açık Tonlar", imageUrl: "/quiz-images/renk-beyaz.jpg" },
      { value: "gri", label: "Gri & Nötr Tonlar", imageUrl: "/quiz-images/renk-gri.jpg" },
      { value: "bej", label: "Bej & Toprak Tonları", imageUrl: "/quiz-images/renk-bej.jpg" },
      { value: "siyah", label: "Siyah & Koyu Tonlar", imageUrl: "/quiz-images/renk-siyah.jpg" },
      { value: "renkli", label: "Renkli & Canlı", imageUrl: "/quiz-images/renk-renkli.jpg" }
    ]),
    order: 4,
    isActive: true
  },
  {
    questionText: "Bütçe aralığınız nedir?",
    questionType: "range",
    category: "butce",
    options: JSON.stringify([
      { value: "ekonomik", label: "Ekonomik (< 5.000 TL)", min: 0, max: 500000 },
      { value: "orta", label: "Orta (5.000 - 15.000 TL)", min: 500000, max: 1500000 },
      { value: "premium", label: "Premium (15.000 - 30.000 TL)", min: 1500000, max: 3000000 },
      { value: "luks", label: "Lüks (> 30.000 TL)", min: 3000000, max: 10000000 }
    ]),
    order: 5,
    isActive: true
  },
  {
    questionText: "Özel gereksinimleriniz var mı?",
    questionType: "multiple_choice",
    category: "ozellik",
    options: JSON.stringify([
      { value: "su_tasarruflu", label: "Su Tasarruflu" },
      { value: "engelli_uyumlu", label: "Engelli Uyumlu" },
      { value: "cocuk_guvenli", label: "Çocuk Güvenliği" },
      { value: "kolay_temizlik", label: "Kolay Temizlik" },
      { value: "akilli", label: "Akıllı Özellikler" }
    ]),
    order: 6,
    isActive: true
  }
];

async function seed() {
  try {
    console.log('🌱 Seed data ekleniyor...');
    
    // Ürünleri ekle
    console.log('📦 Ürünler ekleniyor...');
    for (const product of sampleProducts) {
      await connection.execute(
        `INSERT INTO products (title, description, category, style, color, material, price, imageUrl, dimensions, tags, isActive, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          product.title,
          product.description,
          product.category,
          product.style,
          product.color,
          product.material,
          product.price,
          product.imageUrl,
          product.dimensions,
          product.tags,
          product.isActive
        ]
      );
    }
    console.log(`✅ ${sampleProducts.length} ürün eklendi.`);
    
    // Quiz sorularını ekle
    console.log('❓ Quiz soruları ekleniyor...');
    for (const question of sampleQuestions) {
      await connection.execute(
        `INSERT INTO quiz_questions (questionText, questionType, category, options, \`order\`, isActive, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          question.questionText,
          question.questionType,
          question.category,
          question.options,
          question.order,
          question.isActive
        ]
      );
    }
    console.log(`✅ ${sampleQuestions.length} quiz sorusu eklendi.`);
    
    console.log('🎉 Seed data başarıyla eklendi!');
  } catch (error) {
    console.error('❌ Seed data eklenirken hata:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

seed();
