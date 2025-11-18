import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Vitrifiye ürünleri tablosu
 * Shopify'dan senkronize edilen veya manuel eklenen ürünler
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  shopifyId: varchar("shopifyId", { length: 128 }).unique(),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["lavabo", "klozet", "batarya", "dus_seti", "ayna", "aksesuar", "karo", "diger"]).notNull(),
  style: mysqlEnum("style", ["modern", "klasik", "minimalist", "rustik", "endustriyel"]),
  color: varchar("color", { length: 64 }),
  material: varchar("material", { length: 128 }),
  price: int("price").notNull(), // Kuruş cinsinden (örn: 150000 = 1500.00 TL)
  imageUrl: text("imageUrl"),
  dimensions: text("dimensions"), // JSON: {width, height, depth}
  tags: text("tags"), // JSON array: ["su_tasarruflu", "engelli_uyumlu"]
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Quiz soruları tablosu
 * Admin tarafından oluşturulan veya AI tarafından önerilen sorular
 */
export const quizQuestions = mysqlTable("quiz_questions", {
  id: int("id").autoincrement().primaryKey(),
  questionText: text("questionText").notNull(),
  questionType: mysqlEnum("questionType", ["single_choice", "multiple_choice", "range", "image_select"]).notNull(),
  category: mysqlEnum("category", ["mekan_tipi", "stil", "renk", "butce", "boyut", "ozellik"]).notNull(),
  options: text("options").notNull(), // JSON array: [{value, label, imageUrl?}]
  order: int("order").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = typeof quizQuestions.$inferInsert;

/**
 * Quiz sonuçları tablosu
 * Kullanıcıların quiz cevapları ve önerilen ürünler
 */
export const quizResults = mysqlTable("quiz_results", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  sessionId: varchar("sessionId", { length: 128 }).notNull(), // Anonim kullanıcılar için
  email: varchar("email", { length: 320 }),
  name: varchar("name", { length: 256 }),
  answers: text("answers").notNull(), // JSON: {questionId: answer}
  recommendedProducts: text("recommendedProducts"), // JSON array: [productId1, productId2, ...]
  score: int("score"), // Eşleşme skoru
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export type QuizResult = typeof quizResults.$inferSelect;
export type InsertQuizResult = typeof quizResults.$inferInsert;

/**
 * Konfigürasyonlar tablosu
 * Kullanıcıların oluşturduğu mekan tasarımları
 */
export const configurations = mysqlTable("configurations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  sessionId: varchar("sessionId", { length: 128 }), // Anonim kullanıcılar için
  quizResultId: int("quizResultId"), // İlişkili quiz sonucu
  title: varchar("title", { length: 256 }).notNull(),
  roomType: mysqlEnum("roomType", ["banyo", "mutfak", "tuvalet", "lavabo"]).notNull(),
  selectedProducts: text("selectedProducts").notNull(), // JSON: [{productId, position: {x,y}, rotation}]
  totalPrice: int("totalPrice").notNull(), // Kuruş cinsinden
  previewImageUrl: text("previewImageUrl"),
  isPublic: boolean("isPublic").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Configuration = typeof configurations.$inferSelect;
export type InsertConfiguration = typeof configurations.$inferInsert;

/**
 * Shopify entegrasyon ayarları
 * Mağaza sahiplerinin Shopify bağlantı bilgileri
 */
export const shopifySettings = mysqlTable("shopify_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  shopDomain: varchar("shopDomain", { length: 256 }).notNull(),
  accessToken: text("accessToken").notNull(), // Şifrelenmiş
  webhookSecret: varchar("webhookSecret", { length: 256 }),
  lastSyncAt: timestamp("lastSyncAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShopifySettings = typeof shopifySettings.$inferSelect;
export type InsertShopifySettings = typeof shopifySettings.$inferInsert;
