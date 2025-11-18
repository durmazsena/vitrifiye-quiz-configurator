import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { v4 as uuidv4 } from "uuid";
import { generateAIRecommendations, smartFilterAndSortProducts, generateUserStyleProfile } from "./ai-helper";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Product endpoints
  products: router({
    getAll: publicProcedure.query(async () => {
      return await db.getAllProducts();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getProductById(input.id);
      }),
    
    getByCategory: publicProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => {
        return await db.getProductsByCategory(input.category);
      }),
    
    getByFilters: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        style: z.string().optional(),
        color: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .query(async ({ input }) => {
        return await db.getProductsByFilters(input);
      }),
  }),

  // Quiz endpoints
  quiz: router({
    getQuestions: publicProcedure.query(async () => {
      return await db.getAllQuizQuestions();
    }),
    
    submitAnswers: publicProcedure
      .input(z.object({
        answers: z.record(z.string(), z.any()),
        email: z.string().email().optional(),
        name: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Generate session ID for anonymous users
        const sessionId = uuidv4();
        
        // Calculate recommended products based on answers
        const recommendedProducts = await calculateRecommendations(input.answers);
        
        // Calculate matching score
        const score = calculateMatchScore(input.answers, recommendedProducts);
        
        // Save quiz result
        const resultId = await db.saveQuizResult({
          userId: ctx.user?.id,
          sessionId,
          email: input.email,
          name: input.name,
          answers: JSON.stringify(input.answers),
          recommendedProducts: JSON.stringify(recommendedProducts),
          score,
          completedAt: new Date(),
        });
        
        return {
          resultId,
          sessionId,
          recommendedProducts,
          score,
        };
      }),
    
    getResult: publicProcedure
      .input(z.object({ resultId: z.number() }))
      .query(async ({ input }) => {
        const result = await db.getQuizResultById(input.resultId);
        if (!result) return null;
        
        // Parse JSON fields
        const answers = JSON.parse(result.answers);
        const recommendedProductIds = result.recommendedProducts 
          ? JSON.parse(result.recommendedProducts) 
          : [];
        
        // Fetch product details
        const products = await Promise.all(
          recommendedProductIds.map((id: number) => db.getProductById(id))
        );
        
        return {
          ...result,
          answers,
          products: products.filter(p => p !== undefined),
        };
      }),
    
    getUserResults: protectedProcedure.query(async ({ ctx }) => {
      return await db.getQuizResultsByUserId(ctx.user.id);
    }),
  }),

  // Configuration endpoints
  configurations: router({
    create: publicProcedure
      .input(z.object({
        title: z.string(),
        roomType: z.enum(["banyo", "mutfak", "tuvalet", "lavabo"]),
        selectedProducts: z.array(z.object({
          productId: z.number(),
          position: z.object({ x: z.number(), y: z.number() }),
          rotation: z.number().optional(),
        })),
        quizResultId: z.number().optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const sessionId = uuidv4();
        
        // Calculate total price
        const productIds = input.selectedProducts.map(p => p.productId);
        const products = await Promise.all(
          productIds.map(id => db.getProductById(id))
        );
        const totalPrice = products.reduce((sum, p) => sum + (p?.price || 0), 0);
        
        const configId = await db.saveConfiguration({
          userId: ctx.user?.id,
          sessionId: ctx.user ? undefined : sessionId,
          quizResultId: input.quizResultId,
          title: input.title,
          roomType: input.roomType,
          selectedProducts: JSON.stringify(input.selectedProducts),
          totalPrice,
          isPublic: input.isPublic || false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        return { configId, totalPrice };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        selectedProducts: z.array(z.object({
          productId: z.number(),
          position: z.object({ x: z.number(), y: z.number() }),
          rotation: z.number().optional(),
        })).optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const config = await db.getConfigurationById(input.id);
        if (!config || (config.userId !== ctx.user.id && ctx.user.role !== 'admin')) {
          throw new Error("Unauthorized");
        }
        
        const updates: any = {};
        if (input.title) updates.title = input.title;
        if (input.isPublic !== undefined) updates.isPublic = input.isPublic;
        
        if (input.selectedProducts) {
          updates.selectedProducts = JSON.stringify(input.selectedProducts);
          
          // Recalculate total price
          const productIds = input.selectedProducts.map(p => p.productId);
          const products = await Promise.all(
            productIds.map(id => db.getProductById(id))
          );
          updates.totalPrice = products.reduce((sum, p) => sum + (p?.price || 0), 0);
        }
        
        await db.updateConfiguration(input.id, updates);
        return { success: true };
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const config = await db.getConfigurationById(input.id);
        if (!config) return null;
        
        const selectedProducts = JSON.parse(config.selectedProducts);
        const productIds = selectedProducts.map((p: any) => p.productId);
        const products = await Promise.all(
          productIds.map((id: number) => db.getProductById(id))
        );
        
        return {
          ...config,
          selectedProducts,
          products: products.filter(p => p !== undefined),
        };
      }),
    
    getUserConfigurations: protectedProcedure.query(async ({ ctx }) => {
      return await db.getConfigurationsByUserId(ctx.user.id);
    }),
    
    getPublic: publicProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getPublicConfigurations(input.limit);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const config = await db.getConfigurationById(input.id);
        if (!config || (config.userId !== ctx.user.id && ctx.user.role !== 'admin')) {
          throw new Error("Unauthorized");
        }
        
        await db.deleteConfiguration(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;

// ============ HELPER FUNCTIONS ============

/**
 * Calculate product recommendations based on quiz answers
 */
async function calculateRecommendations(answers: Record<string, any>): Promise<number[]> {
  const filters: any = {};
  
  // Question 1: Mekan tipi (banyo, mutfak, tuvalet, lavabo)
  // This doesn't directly filter products, but can be used for future context-based recommendations
  
  // Question 2: Stil (modern, klasik, endustriyel, dogal)
  if (answers['2']) {
    const styleMap: Record<string, string> = {
      'modern': 'modern',
      'klasik': 'klasik',
      'endustriyel': 'endustriyel',
      'dogal': 'rustik', // Map dogal to rustik
    };
    filters.style = styleMap[answers['2']] || answers['2'];
  }
  
  // Question 3: Renk (beyaz, gri, bej, siyah, renkli)
  if (answers['3']) {
    filters.color = answers['3'];
  }
  
  // Question 4: Bütçe (ekonomik, orta, premium, lux)
  if (answers['4']) {
    const budgetMap: Record<string, { min: number; max: number }> = {
      'ekonomik': { min: 0, max: 500000 },        // 0 - 5.000 TL
      'orta': { min: 500000, max: 1500000 },      // 5.000 - 15.000 TL
      'premium': { min: 1500000, max: 3000000 },  // 15.000 - 30.000 TL
      'lux': { min: 3000000, max: 10000000 },     // 30.000+ TL
    };
    const budget = budgetMap[answers['4']];
    if (budget) {
      filters.minPrice = budget.min;
      filters.maxPrice = budget.max;
    }
  }
  
  // Question 5: Boyut (kucuk, orta, buyuk)
  // Size doesn't directly filter, but can influence selection
  // Future: Can filter by product dimensions based on room size
  
  // Question 6: Ürünlere ihtiyaç (lavabo, klozet, batarya, dus, karo, dolap, aksesuar)
  // Map to product categories
  const neededCategories: string[] = [];
  if (answers['6']) {
    const categoryMap: Record<string, string> = {
      'lavabo': 'lavabo',
      'klozet': 'klozet',
      'batarya': 'batarya',
      'dus': 'dus_seti',
      'karo': 'karo',
      'dolap': 'diger', // Banyo dolabı "diger" category'sinde
      'aksesuar': 'aksesuar',
    };
    
    const selected = Array.isArray(answers['6']) ? answers['6'] : [answers['6']];
    selected.forEach((val: string) => {
      const mapped = categoryMap[val];
      if (mapped && !neededCategories.includes(mapped)) {
        neededCategories.push(mapped);
      }
    });
  }
  
  // Get filtered products
  let allProducts = await db.getProductsByFilters(filters);
  
  // If specific categories are needed, filter by them
  let products = neededCategories.length > 0
    ? allProducts.filter(p => neededCategories.includes(p.category))
    : allProducts;
  
  // If no products found with filters, try with relaxed filters (fallback)
  if (products.length === 0) {
    console.log("[Quiz] No products found with strict filters, trying relaxed filters");
    const relaxedFilters: any = {};
    if (filters.style) relaxedFilters.style = filters.style;
    if (filters.color) relaxedFilters.color = filters.color;
    // Remove price filter for fallback
    allProducts = await db.getProductsByFilters(relaxedFilters);
    products = neededCategories.length > 0
      ? allProducts.filter(p => neededCategories.includes(p.category))
      : allProducts;
  }
  
  // If still no products, get all products from needed categories
  if (products.length === 0 && neededCategories.length > 0) {
    console.log("[Quiz] No products found, getting all products from needed categories");
    const allProductsFromCategories = await Promise.all(
      neededCategories.map(cat => db.getProductsByCategory(cat))
    );
    products = allProductsFromCategories.flat();
  }
  
  // If still no products, get all products
  if (products.length === 0) {
    console.log("[Quiz] No products found, getting all products");
    products = await db.getAllProducts();
  }
  
  // Group by category and select best matches
  const categoriesToRecommend = neededCategories.length > 0 
    ? neededCategories 
    : ['lavabo', 'klozet', 'batarya', 'dus_seti', 'karo', 'aksesuar'];
  
  // AI filtreleme: Seçilen kategoriler varsa veya 3+ ürün varsa AI kullan
  // Kullanıcı belirli ürünler seçtiyse, AI benzerlik araması yapsın
  const useAI = neededCategories.length > 0 || products.length >= 3;
  
  if (useAI) {
    try {
      console.log("[Quiz] Using AI for filtering and sorting", products.length, "products", 
        neededCategories.length > 0 ? `(selected categories: ${neededCategories.join(', ')})` : '');
      
      // Kullanıcı stil profilini oluştur
      const styleProfile = await generateUserStyleProfile(answers);
      
      // AI ile filtrele ve sırala (her kategoriden en iyi ürünleri seç)
      const recommendations: number[] = [];
      
      for (const category of categoriesToRecommend) {
        const categoryProducts = products.filter(p => p.category === category);
        if (categoryProducts.length > 0) {
          // Her kategoriden en fazla 2 ürün seç (AI benzerlik araması yapacak)
          const maxPerCategory = categoryProducts.length >= 2 ? 2 : 1;
          
          // AI ile benzerlik araması yap
          const aiSorted = await smartFilterAndSortProducts(
            categoryProducts,
            styleProfile.profile,
            answers,
            maxPerCategory
          );
          
          aiSorted.forEach(p => {
            if (!recommendations.includes(p.id)) {
              recommendations.push(p.id);
            }
          });
        }
      }
      
      console.log("[Quiz] AI Recommendations:", recommendations.length, "products");
      return recommendations;
    } catch (error) {
      console.error("[Quiz] AI filtering failed, falling back to rule-based:", error);
      // Fallback to rule-based approach
    }
  }
  
  // Rule-based approach (original logic)
  const recommendations: number[] = [];
  
  for (const category of categoriesToRecommend) {
    const categoryProducts = products.filter(p => p.category === category);
    if (categoryProducts.length > 0) {
      // Sort by price (prefer mid-range if budget is set) and take top 1-2
      let sorted = categoryProducts;
      
      if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
        const midPrice = (filters.minPrice + filters.maxPrice) / 2;
        sorted = categoryProducts.sort((a, b) => {
          const aDiff = Math.abs(a.price - midPrice);
          const bDiff = Math.abs(b.price - midPrice);
          return aDiff - bDiff;
        });
      } else {
        // Sort by price ascending if no budget filter
        sorted = categoryProducts.sort((a, b) => a.price - b.price);
      }
      
      // Take top product
      recommendations.push(sorted[0].id);
      
      // Take second product if available and we have multiple options
      if (sorted.length > 1 && categoryProducts.length >= 2) {
        recommendations.push(sorted[1].id);
      }
    }
  }
  
  console.log("[Quiz] Rule-based Recommendations:", recommendations.length, "products");
  return recommendations;
}

/**
 * Calculate matching score based on answers and recommended products
 */
function calculateMatchScore(answers: Record<string, any>, productIds: number[]): number {
  // Simple scoring: more answered questions = higher base score
  const answeredCount = Object.keys(answers).length;
  const baseScore = (answeredCount / 6) * 70; // 70% from completeness
  
  // 30% from number of recommendations
  const recommendationScore = (productIds.length / 12) * 30;
  
  return Math.round(baseScore + recommendationScore);
}
