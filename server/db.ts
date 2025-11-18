import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { 
  InsertUser, 
  Product,
  QuizQuestion,
  InsertQuizResult,
  QuizResult,
  Configuration,
  InsertConfiguration
} from "../drizzle/schema";
import { ENV } from './_core/env';

// Try to import embedded JSON data (for Netlify Functions bundle)
let embeddedData: { shopify?: any; exported?: any[] } | null = null;
let embeddedDataPromise: Promise<void> | null = null;

async function loadEmbeddedData() {
  if (embeddedData !== null) return; // Already loaded or failed
  if (embeddedDataPromise) return embeddedDataPromise; // Already loading
  
  embeddedDataPromise = (async () => {
    try {
      // @ts-ignore - Dynamic import
      const dbData = await import("./db-data.js");
      embeddedData = {
        shopify: dbData.embeddedShopifyData,
        exported: dbData.embeddedExportedProducts,
      };
      console.log("[Data] ✅ Embedded JSON data loaded from bundle");
    } catch (error) {
      // Embedded data not available, will use file system
      embeddedData = null;
    }
  })();
  
  return embeddedDataPromise;
}

// Try to load embedded data immediately (non-blocking)
loadEmbeddedData().catch(() => {});

// ESM'de __dirname equivalent - with fallback for Netlify Functions
let __dirname: string;
if (typeof import.meta !== 'undefined' && import.meta.url) {
  try {
    const __filename = fileURLToPath(import.meta.url);
    __dirname = dirname(__filename);
  } catch (error) {
    // Fallback if fileURLToPath fails
    __dirname = process.cwd();
  }
} else {
  // Fallback for Netlify Functions where import.meta.url might be undefined
  __dirname = process.cwd();
}

// JSON data cache
let _jsonData: any = null;
let _productsCache: Product[] | null = null;
let _quizQuestionsCache: QuizQuestion[] | null = null;
let _quizResultsStorage: Map<number, QuizResult> = new Map();
let _nextQuizResultId = 1;
let _configurationsStorage: Map<number, Configuration> = new Map();
let _nextConfigurationId = 1;

async function loadJsonDataAsync() {
  if (!_jsonData) {
    try {
      console.log("[Data] Starting to load JSON data...");
      
      // First, try to load embedded data (for Netlify Functions bundle)
      await loadEmbeddedData();
      
      // Check if embedded data is available
      if (embeddedData?.shopify && embeddedData?.exported) {
        console.log("[Data] Using embedded JSON data from bundle");
        _jsonData = {
          products: embeddedData.exported,
          quiz_questions: embeddedData.shopify.quiz_questions || [],
        };
        console.log(`[Data] ✅ Loaded ${embeddedData.exported.length} products from embedded data`);
        console.log(`[Data] ✅ Loaded ${_jsonData.quiz_questions.length} quiz questions from embedded data`);
        return _jsonData;
      }
      
      // Fallback: Try to load from file system
      console.log("[Data] Embedded data not available, trying file system...");
      console.log("[Data] Current working directory:", process.cwd());
      console.log("[Data] __dirname:", __dirname);
      console.log("[Data] import.meta.url:", import.meta.url);
      
      // Try multiple possible paths for Netlify Functions compatibility
      const possiblePaths = [
        __dirname, // Current file's directory (most reliable)
        join(__dirname, ".."), // One level up from current file
        join(__dirname, "../.."), // Two levels up
        join(__dirname, "../../.."), // Three levels up
        process.cwd(), // Normal server
        join(process.cwd(), ".."), // Netlify Functions (one level up)
        join(process.cwd(), "../.."), // Netlify Functions (two levels up)
        "/var/task", // AWS Lambda / Netlify Functions default
        join("/var/task", ".."), // Netlify Functions alternative
        join(process.cwd(), "netlify", "functions"), // Netlify Functions build directory
        join(__dirname, "data"), // Data folder relative to current file
        join(__dirname, "..", "data"), // Data folder one level up
        join(__dirname, "../..", "data"), // Data folder two levels up
      ];

      let shopifyFilePath: string | null = null;
      let exportedFilePath: string | null = null;

      console.log("[Data] Trying to find shopify-products.json...");
      // Find shopify-products.json
      for (const basePath of possiblePaths) {
        const testPath = join(basePath, "data", "shopify-products.json");
        try {
          readFileSync(testPath, "utf-8");
          shopifyFilePath = testPath;
          console.log(`[Data] Found shopify-products.json at: ${testPath}`);
          break;
        } catch {
          // Try alternative location
          const altPath = join(basePath, "shopify-products.json");
          try {
            readFileSync(altPath, "utf-8");
            shopifyFilePath = altPath;
            console.log(`[Data] Found shopify-products.json at: ${altPath}`);
            break;
          } catch {
            continue;
          }
        }
      }

      console.log("[Data] Trying to find exported-products.json...");
      // Find exported-products.json
      for (const basePath of possiblePaths) {
        const testPath = join(basePath, "exported-products.json");
        try {
          readFileSync(testPath, "utf-8");
          exportedFilePath = testPath;
          console.log(`[Data] Found exported-products.json at: ${testPath}`);
          break;
        } catch {
          continue;
        }
      }

      if (!shopifyFilePath || !exportedFilePath) {
        console.error(`[Data] JSON files not found.`);
        console.error(`[Data] Shopify path: ${shopifyFilePath || "NOT FOUND"}`);
        console.error(`[Data] Exported path: ${exportedFilePath || "NOT FOUND"}`);
        console.error(`[Data] Tried paths:`, possiblePaths);
        throw new Error(`JSON files not found. Shopify: ${shopifyFilePath}, Exported: ${exportedFilePath}`);
      }

      console.log("[Data] Reading JSON files...");
      const shopifyContent = readFileSync(shopifyFilePath, "utf-8");
      const shopifyData = JSON.parse(shopifyContent);
      
      const exportedContent = readFileSync(exportedFilePath, "utf-8");
      const exportedProducts = JSON.parse(exportedContent);
      
      _jsonData = {
        products: exportedProducts,
        quiz_questions: shopifyData.quiz_questions || [],
      };
      
      console.log(`[Data] ✅ Loaded ${exportedProducts.length} products from ${exportedFilePath}`);
      console.log(`[Data] ✅ Loaded ${_jsonData.quiz_questions.length} quiz questions from ${shopifyFilePath}`);
    } catch (error) {
      console.error("[Data] ❌ Failed to load JSON data:", error);
      console.error("[Data] Error details:", error instanceof Error ? error.message : String(error));
      console.error("[Data] Current working directory:", process.cwd());
      console.error("[Data] __dirname equivalent:", import.meta.url);
      _jsonData = { products: [], quiz_questions: [] };
    }
  }
  return _jsonData;
}

// Synchronous wrapper for compatibility
function loadJsonData() {
  if (!_jsonData) {
    // First, try embedded data (for Netlify Functions bundle)
    // Note: This will work if embeddedData was loaded, otherwise will fall back to file system
    if (embeddedData?.shopify && embeddedData?.exported) {
      console.log("[Data] Using embedded JSON data from bundle");
      _jsonData = {
        products: embeddedData.exported,
        quiz_questions: embeddedData.shopify.quiz_questions || [],
      };
      console.log(`[Data] ✅ Loaded ${embeddedData.exported.length} products from embedded data`);
      console.log(`[Data] ✅ Loaded ${_jsonData.quiz_questions.length} quiz questions from embedded data`);
      return _jsonData;
    }
    
    // Try to load embedded data if not already loaded (non-blocking)
    loadEmbeddedData().then(() => {
      if (embeddedData?.shopify && embeddedData?.exported && !_jsonData) {
        console.log("[Data] Embedded data loaded, updating cache");
        _jsonData = {
          products: embeddedData.exported,
          quiz_questions: embeddedData.shopify.quiz_questions || [],
        };
      }
    }).catch(() => {});
    
    // Fallback: Try to load from file system
    try {
      const possiblePaths = [
        __dirname,
        join(__dirname, ".."),
        join(__dirname, "../.."),
        join(__dirname, "../../.."),
        process.cwd(),
        join(process.cwd(), ".."),
        "/var/task",
        join("/var/task", ".."),
      ];
      
      let shopifyFilePath: string | null = null;
      let exportedFilePath: string | null = null;
      
      for (const basePath of possiblePaths) {
        const testPath = join(basePath, "data", "shopify-products.json");
        try {
          readFileSync(testPath, "utf-8");
          shopifyFilePath = testPath;
          break;
        } catch {
          const altPath = join(basePath, "shopify-products.json");
          try {
            readFileSync(altPath, "utf-8");
            shopifyFilePath = altPath;
            break;
          } catch {
            continue;
          }
        }
      }
      
      for (const basePath of possiblePaths) {
        const testPath = join(basePath, "exported-products.json");
        try {
          readFileSync(testPath, "utf-8");
          exportedFilePath = testPath;
          break;
        } catch {
          continue;
        }
      }
      
      if (shopifyFilePath && exportedFilePath) {
        const shopifyData = JSON.parse(readFileSync(shopifyFilePath, "utf-8"));
        const exportedProducts = JSON.parse(readFileSync(exportedFilePath, "utf-8"));
        _jsonData = {
          products: exportedProducts,
          quiz_questions: shopifyData.quiz_questions || [],
        };
        console.log(`[Data] ✅ Loaded ${exportedProducts.length} products from ${exportedFilePath}`);
        console.log(`[Data] ✅ Loaded ${_jsonData.quiz_questions.length} quiz questions from ${shopifyFilePath}`);
        return _jsonData;
      }
    } catch (error) {
      console.error("[Data] Synchronous load failed:", error);
    }
    
    // If synchronous load failed, return empty (async will load later)
    return { products: [], quiz_questions: [] };
  }
  
  return _jsonData;
}

// Convert exported product format to our Product type
function convertExportedProductToProduct(exportedProduct: any): Product {
  // Category mapping - ensure it matches our enum
  const categoryMap: Record<string, Product["category"]> = {
    "lavabo": "lavabo",
    "klozet": "klozet",
    "batarya": "batarya",
    "dus_seti": "dus_seti",
    "dus": "dus_seti",
    "ayna": "ayna",
    "aksesuar": "aksesuar",
    "karo": "karo",
    "dolap": "diger",
    "banyo_dolabi": "diger",
  };
  
  const category = categoryMap[exportedProduct.category?.toLowerCase()] || "diger";
  
  // Style mapping
  const styleMap: Record<string, Product["style"]> = {
    "modern": "modern",
    "klasik": "klasik",
    "endustriyel": "endustriyel",
    "dogal": "rustik",
    "rustik": "rustik",
    "minimalist": "modern",
  };
  
  const style = exportedProduct.style ? styleMap[exportedProduct.style.toLowerCase()] || null : null;
  
  // Price is already in kuruş (150000 = 1500.00 TL)
  const price = exportedProduct.price || 0;
  
  // Parse dimensions if it's a JSON string, then stringify again for storage
  let dimensionsStr = null;
  if (exportedProduct.dimensions) {
    if (typeof exportedProduct.dimensions === 'string') {
      try {
        // Already a JSON string, validate and use as is
        JSON.parse(exportedProduct.dimensions);
        dimensionsStr = exportedProduct.dimensions;
      } catch {
        dimensionsStr = null;
      }
    } else {
      // It's an object, stringify it
      dimensionsStr = JSON.stringify(exportedProduct.dimensions);
    }
  }
  
  // Parse tags if it's a JSON string, then stringify again for storage
  let tagsStr = null;
  if (exportedProduct.tags) {
    if (typeof exportedProduct.tags === 'string') {
      try {
        // Already a JSON string, validate and use as is
        JSON.parse(exportedProduct.tags);
        tagsStr = exportedProduct.tags;
      } catch {
        tagsStr = null;
      }
    } else if (Array.isArray(exportedProduct.tags)) {
      // It's an array, stringify it
      tagsStr = JSON.stringify(exportedProduct.tags);
    }
  }
  
  // Convert isActive from number to boolean
  const isActive = exportedProduct.isActive === 1 || exportedProduct.isActive === true;
  
  // Parse dates
  const createdAt = exportedProduct.createdAt ? new Date(exportedProduct.createdAt) : new Date();
  const updatedAt = exportedProduct.updatedAt ? new Date(exportedProduct.updatedAt) : new Date();
  
  return {
    id: exportedProduct.id,
    shopifyId: exportedProduct.shopifyId || null,
    title: exportedProduct.title || "",
    description: exportedProduct.description || null,
    category,
    style,
    color: exportedProduct.color || null,
    material: exportedProduct.material || null,
    price,
    imageUrl: exportedProduct.imageUrl || null,
    dimensions: dimensionsStr,
    tags: tagsStr,
    isActive,
    createdAt,
    updatedAt,
  };
}

// Convert JSON quiz question to our QuizQuestion type
function convertJsonQuestionToQuizQuestion(jsonQuestion: any): QuizQuestion {
  const questionTypeMap: Record<string, QuizQuestion["questionType"]> = {
    "single_choice": "single_choice",
    "multiple_choice": "multiple_choice",
    "range": "range",
    "image_select": "image_select",
  };
  
  // Map question ID to category based on question content
  const categoryByQuestionId: Record<number, QuizQuestion["category"]> = {
    1: "mekan_tipi",
    2: "stil",
    3: "renk",
    4: "butce",
    5: "boyut",
    6: "ozellik",
  };
  
  return {
    id: jsonQuestion.id,
    questionText: jsonQuestion.question_text || "",
    questionType: questionTypeMap[jsonQuestion.question_type] || "single_choice",
    category: categoryByQuestionId[jsonQuestion.id] || "ozellik",
    options: JSON.stringify(jsonQuestion.options || []),
    order: jsonQuestion.order || 0,
    isActive: true,
    createdAt: new Date(),
  };
}

// ============ PRODUCT QUERIES ============

export async function getAllProducts(): Promise<Product[]> {
  if (!_productsCache) {
    const jsonData = loadJsonData();
    // exported-products.json is already an array of products
    _productsCache = jsonData.products.map((p: any) => 
      convertExportedProductToProduct(p)
    );
  }
  return _productsCache.filter(p => p.isActive);
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const allProducts = await getAllProducts();
  return allProducts.find(p => p.id === id);
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const allProducts = await getAllProducts();
  return allProducts.filter(p => p.category === category);
}

export async function getProductsByFilters(filters: {
  category?: string;
  style?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
}): Promise<Product[]> {
  let products = await getAllProducts();
  
  if (filters.category) {
    products = products.filter(p => p.category === filters.category);
  }
  
  if (filters.style) {
    products = products.filter(p => p.style === filters.style);
  }
  
  if (filters.color) {
    products = products.filter(p => p.color === filters.color);
  }
  
  if (filters.minPrice !== undefined) {
    products = products.filter(p => p.price >= filters.minPrice);
  }
  
  if (filters.maxPrice !== undefined) {
    products = products.filter(p => p.price <= filters.maxPrice);
  }
  
  if (filters.tags && filters.tags.length > 0) {
    products = products.filter(product => {
      if (!product.tags) return false;
      try {
        const productTags = JSON.parse(product.tags);
        return filters.tags!.some(tag => productTags.includes(tag));
      } catch {
        return false;
      }
    });
  }
  
  return products;
}

// ============ QUIZ QUESTIONS QUERIES ============

export async function getAllQuizQuestions(): Promise<QuizQuestion[]> {
  console.log("[Quiz] getAllQuizQuestions called");
  if (!_quizQuestionsCache) {
    console.log("[Quiz] Loading quiz questions from JSON...");
    const jsonData = loadJsonData();
    console.log(`[Quiz] Found ${jsonData.quiz_questions?.length || 0} questions in JSON`);
    _quizQuestionsCache = (jsonData.quiz_questions || []).map((q: any) => 
      convertJsonQuestionToQuizQuestion(q)
    ).sort((a: QuizQuestion, b: QuizQuestion) => a.order - b.order);
    console.log(`[Quiz] Converted ${_quizQuestionsCache.length} quiz questions`);
  }
  const activeQuestions = _quizQuestionsCache.filter(q => q.isActive);
  console.log(`[Quiz] Returning ${activeQuestions.length} active quiz questions`);
  return activeQuestions;
}

export async function getQuizQuestionsByCategory(category: string): Promise<QuizQuestion[]> {
  const allQuestions = await getAllQuizQuestions();
  return allQuestions.filter(q => q.category === category);
}

// ============ QUIZ RESULTS QUERIES (Memory Storage) ============

export async function saveQuizResult(result: InsertQuizResult): Promise<number> {
  const id = _nextQuizResultId++;
  const quizResult: QuizResult = {
    id,
    userId: result.userId || null,
    sessionId: result.sessionId,
    email: result.email || null,
    name: result.name || null,
    answers: result.answers,
    recommendedProducts: result.recommendedProducts || null,
    score: result.score || null,
    completedAt: result.completedAt || new Date(),
  };
  _quizResultsStorage.set(id, quizResult);
  return id;
}

export async function getQuizResultById(id: number): Promise<QuizResult | undefined> {
  return _quizResultsStorage.get(id);
}

export async function getQuizResultsByUserId(userId: number): Promise<QuizResult[]> {
  return Array.from(_quizResultsStorage.values())
    .filter(r => r.userId === userId)
    .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
}

export async function getQuizResultsBySessionId(sessionId: string): Promise<QuizResult[]> {
  return Array.from(_quizResultsStorage.values())
    .filter(r => r.sessionId === sessionId)
    .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
}

// ============ CONFIGURATION QUERIES (Memory Storage) ============

export async function saveConfiguration(config: InsertConfiguration): Promise<number> {
  const id = _nextConfigurationId++;
  const configuration: Configuration = {
    id,
    userId: config.userId || null,
    sessionId: config.sessionId || null,
    quizResultId: config.quizResultId || null,
    title: config.title,
    roomType: config.roomType,
    selectedProducts: config.selectedProducts,
    totalPrice: config.totalPrice,
    previewImageUrl: config.previewImageUrl || null,
    isPublic: config.isPublic || false,
    createdAt: config.createdAt || new Date(),
    updatedAt: config.updatedAt || new Date(),
  };
  _configurationsStorage.set(id, configuration);
  return id;
}

export async function updateConfiguration(id: number, updates: Partial<Configuration>): Promise<void> {
  const existing = _configurationsStorage.get(id);
  if (!existing) {
    throw new Error("Configuration not found");
  }
  const updated: Configuration = {
    ...existing,
    ...updates,
    updatedAt: new Date(),
  };
  _configurationsStorage.set(id, updated);
}

export async function getConfigurationById(id: number): Promise<Configuration | undefined> {
  return _configurationsStorage.get(id);
}

export async function getConfigurationsByUserId(userId: number): Promise<Configuration[]> {
  return Array.from(_configurationsStorage.values())
    .filter(c => c.userId === userId)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function getPublicConfigurations(limit: number = 20): Promise<Configuration[]> {
  return Array.from(_configurationsStorage.values())
    .filter(c => c.isPublic)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

export async function deleteConfiguration(id: number): Promise<void> {
  _configurationsStorage.delete(id);
}

// ============ USER QUERIES (Stub - not needed for quiz functionality) ============

export async function upsertUser(user: InsertUser): Promise<void> {
  // Stub implementation - not needed for quiz functionality
  console.warn("[Database] upsertUser called but not implemented (using JSON storage)");
}

export async function getUserByOpenId(openId: string) {
  // Stub implementation - not needed for quiz functionality
  console.warn("[Database] getUserByOpenId called but not implemented (using JSON storage)");
  return undefined;
}
