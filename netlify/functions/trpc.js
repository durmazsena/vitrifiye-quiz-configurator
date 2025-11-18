// netlify/functions/trpc.ts
import serverless from "serverless-http";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/_core/notification.ts
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { z as z2 } from "zod";

// server/db.ts
import { readFileSync } from "fs";
import { join } from "path";
var _jsonData = null;
var _productsCache = null;
var _quizQuestionsCache = null;
var _quizResultsStorage = /* @__PURE__ */ new Map();
var _nextQuizResultId = 1;
var _configurationsStorage = /* @__PURE__ */ new Map();
var _nextConfigurationId = 1;
function loadJsonData() {
  if (!_jsonData) {
    try {
      const shopifyFilePath = join(process.cwd(), "data", "shopify-products.json");
      const shopifyContent = readFileSync(shopifyFilePath, "utf-8");
      const shopifyData = JSON.parse(shopifyContent);
      const exportedFilePath = join(process.cwd(), "exported-products.json");
      const exportedContent = readFileSync(exportedFilePath, "utf-8");
      const exportedProducts = JSON.parse(exportedContent);
      _jsonData = {
        products: exportedProducts,
        quiz_questions: shopifyData.quiz_questions || []
      };
      console.log(`[Data] Loaded ${exportedProducts.length} products from exported-products.json`);
      console.log(`[Data] Loaded ${_jsonData.quiz_questions.length} quiz questions from shopify-products.json`);
    } catch (error) {
      console.error("[Data] Failed to load JSON data:", error);
      _jsonData = { products: [], quiz_questions: [] };
    }
  }
  return _jsonData;
}
function convertExportedProductToProduct(exportedProduct) {
  const categoryMap = {
    "lavabo": "lavabo",
    "klozet": "klozet",
    "batarya": "batarya",
    "dus_seti": "dus_seti",
    "dus": "dus_seti",
    "ayna": "ayna",
    "aksesuar": "aksesuar",
    "karo": "karo",
    "dolap": "diger",
    "banyo_dolabi": "diger"
  };
  const category = categoryMap[exportedProduct.category?.toLowerCase()] || "diger";
  const styleMap = {
    "modern": "modern",
    "klasik": "klasik",
    "endustriyel": "endustriyel",
    "dogal": "rustik",
    "rustik": "rustik",
    "minimalist": "modern"
  };
  const style = exportedProduct.style ? styleMap[exportedProduct.style.toLowerCase()] || null : null;
  const price = exportedProduct.price || 0;
  let dimensionsStr = null;
  if (exportedProduct.dimensions) {
    if (typeof exportedProduct.dimensions === "string") {
      try {
        JSON.parse(exportedProduct.dimensions);
        dimensionsStr = exportedProduct.dimensions;
      } catch {
        dimensionsStr = null;
      }
    } else {
      dimensionsStr = JSON.stringify(exportedProduct.dimensions);
    }
  }
  let tagsStr = null;
  if (exportedProduct.tags) {
    if (typeof exportedProduct.tags === "string") {
      try {
        JSON.parse(exportedProduct.tags);
        tagsStr = exportedProduct.tags;
      } catch {
        tagsStr = null;
      }
    } else if (Array.isArray(exportedProduct.tags)) {
      tagsStr = JSON.stringify(exportedProduct.tags);
    }
  }
  const isActive = exportedProduct.isActive === 1 || exportedProduct.isActive === true;
  const createdAt = exportedProduct.createdAt ? new Date(exportedProduct.createdAt) : /* @__PURE__ */ new Date();
  const updatedAt = exportedProduct.updatedAt ? new Date(exportedProduct.updatedAt) : /* @__PURE__ */ new Date();
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
    updatedAt
  };
}
function convertJsonQuestionToQuizQuestion(jsonQuestion) {
  const questionTypeMap = {
    "single_choice": "single_choice",
    "multiple_choice": "multiple_choice",
    "range": "range",
    "image_select": "image_select"
  };
  const categoryByQuestionId = {
    1: "mekan_tipi",
    2: "stil",
    3: "renk",
    4: "butce",
    5: "boyut",
    6: "ozellik"
  };
  return {
    id: jsonQuestion.id,
    questionText: jsonQuestion.question_text || "",
    questionType: questionTypeMap[jsonQuestion.question_type] || "single_choice",
    category: categoryByQuestionId[jsonQuestion.id] || "ozellik",
    options: JSON.stringify(jsonQuestion.options || []),
    order: jsonQuestion.order || 0,
    isActive: true,
    createdAt: /* @__PURE__ */ new Date()
  };
}
async function getAllProducts() {
  if (!_productsCache) {
    const jsonData = loadJsonData();
    _productsCache = jsonData.products.map(
      (p) => convertExportedProductToProduct(p)
    );
  }
  return _productsCache.filter((p) => p.isActive);
}
async function getProductById(id) {
  const allProducts = await getAllProducts();
  return allProducts.find((p) => p.id === id);
}
async function getProductsByCategory(category) {
  const allProducts = await getAllProducts();
  return allProducts.filter((p) => p.category === category);
}
async function getProductsByFilters(filters) {
  let products = await getAllProducts();
  if (filters.category) {
    products = products.filter((p) => p.category === filters.category);
  }
  if (filters.style) {
    products = products.filter((p) => p.style === filters.style);
  }
  if (filters.color) {
    products = products.filter((p) => p.color === filters.color);
  }
  if (filters.minPrice !== void 0) {
    products = products.filter((p) => p.price >= filters.minPrice);
  }
  if (filters.maxPrice !== void 0) {
    products = products.filter((p) => p.price <= filters.maxPrice);
  }
  if (filters.tags && filters.tags.length > 0) {
    products = products.filter((product) => {
      if (!product.tags) return false;
      try {
        const productTags = JSON.parse(product.tags);
        return filters.tags.some((tag) => productTags.includes(tag));
      } catch {
        return false;
      }
    });
  }
  return products;
}
async function getAllQuizQuestions() {
  if (!_quizQuestionsCache) {
    const jsonData = loadJsonData();
    _quizQuestionsCache = (jsonData.quiz_questions || []).map(
      (q) => convertJsonQuestionToQuizQuestion(q)
    ).sort((a, b) => a.order - b.order);
  }
  return _quizQuestionsCache.filter((q) => q.isActive);
}
async function saveQuizResult(result) {
  const id = _nextQuizResultId++;
  const quizResult = {
    id,
    userId: result.userId || null,
    sessionId: result.sessionId,
    email: result.email || null,
    name: result.name || null,
    answers: result.answers,
    recommendedProducts: result.recommendedProducts || null,
    score: result.score || null,
    completedAt: result.completedAt || /* @__PURE__ */ new Date()
  };
  _quizResultsStorage.set(id, quizResult);
  return id;
}
async function getQuizResultById(id) {
  return _quizResultsStorage.get(id);
}
async function getQuizResultsByUserId(userId) {
  return Array.from(_quizResultsStorage.values()).filter((r) => r.userId === userId).sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
}
async function saveConfiguration(config) {
  const id = _nextConfigurationId++;
  const configuration = {
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
    createdAt: config.createdAt || /* @__PURE__ */ new Date(),
    updatedAt: config.updatedAt || /* @__PURE__ */ new Date()
  };
  _configurationsStorage.set(id, configuration);
  return id;
}
async function updateConfiguration(id, updates) {
  const existing = _configurationsStorage.get(id);
  if (!existing) {
    throw new Error("Configuration not found");
  }
  const updated = {
    ...existing,
    ...updates,
    updatedAt: /* @__PURE__ */ new Date()
  };
  _configurationsStorage.set(id, updated);
}
async function getConfigurationById(id) {
  return _configurationsStorage.get(id);
}
async function getConfigurationsByUserId(userId) {
  return Array.from(_configurationsStorage.values()).filter((c) => c.userId === userId).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}
async function getPublicConfigurations(limit = 20) {
  return Array.from(_configurationsStorage.values()).filter((c) => c.isPublic).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
}
async function deleteConfiguration(id) {
  _configurationsStorage.delete(id);
}
async function upsertUser(user) {
  console.warn("[Database] upsertUser called but not implemented (using JSON storage)");
}
async function getUserByOpenId(openId) {
  console.warn("[Database] getUserByOpenId called but not implemented (using JSON storage)");
  return void 0;
}

// server/routers.ts
import { v4 as uuidv4 } from "uuid";

// server/_core/llm.ts
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const payload = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  payload.max_tokens = 32768;
  payload.thinking = {
    "budget_tokens": 128
  };
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}

// server/ai-helper.ts
async function generateUserStyleProfile(answers) {
  try {
    const prompt = `Bir vitrifiye ma\u011Fazas\u0131 i\xE7in quiz cevaplar\u0131n\u0131 analiz et ve kullan\u0131c\u0131n\u0131n stil profilini \xE7\u0131kar.

Quiz Cevaplar\u0131:
${JSON.stringify(answers, null, 2)}

L\xFCtfen \u015Funlar\u0131 yap:
1. Kullan\u0131c\u0131n\u0131n stil profilini 2-3 c\xFCmle ile a\xE7\u0131kla
2. Anahtar kelimeler listesi \xE7\u0131kar (5-7 kelime)
3. Genel \xFCr\xFCn \xF6nerisi stratejisi belirt

JSON format\u0131nda yan\u0131t ver:
{
  "profile": "Kullan\u0131c\u0131 profili a\xE7\u0131klamas\u0131",
  "keywords": ["anahtar", "kelime", "listesi"],
  "recommendations": "\xD6neri stratejisi"
}`;
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Sen bir i\xE7 mekan tasar\u0131m uzman\u0131s\u0131n. Kullan\u0131c\u0131 tercihlerini analiz edip stil profili \xE7\u0131kar\u0131yorsun." },
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
              profile: { type: "string", description: "Kullan\u0131c\u0131n\u0131n stil profili a\xE7\u0131klamas\u0131" },
              keywords: {
                type: "array",
                items: { type: "string" },
                description: "Anahtar kelimeler"
              },
              recommendations: { type: "string", description: "Genel \xF6neri stratejisi" }
            },
            required: ["profile", "keywords", "recommendations"],
            additionalProperties: false
          }
        }
      }
    });
    const content = response.choices[0].message.content;
    if (typeof content !== "string") {
      throw new Error("Invalid response format");
    }
    return JSON.parse(content);
  } catch (error) {
    console.error("AI style profile generation failed:", error);
    return {
      profile: "Kullan\u0131c\u0131 tercihleri analiz edildi.",
      keywords: Object.values(answers).filter((v) => typeof v === "string").slice(0, 5),
      recommendations: "Filtrelere uygun \xFCr\xFCnler \xF6nerilecek."
    };
  }
}
async function smartFilterAndSortProducts(products, userProfile, userAnswers, maxProducts = 12) {
  try {
    let productsToProcess = products;
    if (products.length > 50) {
      productsToProcess = products.slice(0, 50);
    }
    const productSummaries = productsToProcess.map((p) => ({
      id: p.id,
      title: p.title,
      style: p.style,
      color: p.color,
      price: p.price,
      category: p.category,
      material: p.material
    }));
    const prompt = `Kullan\u0131c\u0131 profili: ${userProfile}

Quiz Cevaplar\u0131: ${JSON.stringify(userAnswers)}

Kullan\u0131c\u0131 belirli \xFCr\xFCn kategorilerine ihtiya\xE7 duyuyor. A\u015Fa\u011F\u0131daki \xFCr\xFCnleri kullan\u0131c\u0131n\u0131n ihtiya\xE7lar\u0131na, stil tercihlerine ve b\xFCt\xE7esine g\xF6re BENZERL\u0130K ve UYUMLULUK a\xE7\u0131s\u0131ndan de\u011Ferlendir.

Kriterler:
- Stil uyumu (modern, klasik, end\xFCstriyel, rustik)
- Renk uyumu
- B\xFCt\xE7e uygunlu\u011Fu
- Genel estetik uyumluluk
- Kullan\u0131c\u0131 profilindeki tercihlerle benzerlik

A\u015Fa\u011F\u0131daki \xFCr\xFCnleri kullan\u0131c\u0131ya en uygun olandan en az uygun olana do\u011Fru s\u0131rala ve en iyi ${maxProducts} \xFCr\xFCn\xFC se\xE7:
${JSON.stringify(productSummaries, null, 2)}

Sadece \xFCr\xFCn ID'lerini s\u0131ral\u0131 bir dizi olarak d\xF6nd\xFCr (en uygun ${maxProducts} \xFCr\xFCn).

JSON format\u0131nda yan\u0131t ver:
{
  "sortedIds": [id1, id2, id3, ...]
}`;
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Sen bir vitrifiye \xFCr\xFCn uzman\u0131s\u0131n. Kullan\u0131c\u0131n\u0131n ihtiya\xE7lar\u0131na, stil tercihlerine ve b\xFCt\xE7esine g\xF6re \xFCr\xFCnleri BENZERL\u0130K ve UYUMLULUK a\xE7\u0131s\u0131ndan de\u011Ferlendirip en uygun olanlar\u0131 se\xE7iyorsun. Stil, renk, b\xFCt\xE7e ve genel estetik uyumlulu\u011Fu dikkate al." },
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
                description: "S\u0131ral\u0131 \xFCr\xFCn ID listesi"
              }
            },
            required: ["sortedIds"],
            additionalProperties: false
          }
        }
      }
    });
    const content = response.choices[0].message.content;
    if (typeof content !== "string") {
      throw new Error("Invalid response format");
    }
    const { sortedIds } = JSON.parse(content);
    const sortedProducts = [];
    for (const id of sortedIds) {
      const product = productsToProcess.find((p) => p.id === id);
      if (product) sortedProducts.push(product);
    }
    for (const product of productsToProcess) {
      if (!sortedProducts.find((p) => p.id === product.id) && sortedProducts.length < maxProducts) {
        sortedProducts.push(product);
      }
    }
    return sortedProducts.slice(0, maxProducts);
  } catch (error) {
    console.error("AI smart filtering failed:", error);
    return products.slice(0, maxProducts);
  }
}

// server/routers.ts
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  // Product endpoints
  products: router({
    getAll: publicProcedure.query(async () => {
      return await getAllProducts();
    }),
    getById: publicProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return await getProductById(input.id);
    }),
    getByCategory: publicProcedure.input(z2.object({ category: z2.string() })).query(async ({ input }) => {
      return await getProductsByCategory(input.category);
    }),
    getByFilters: publicProcedure.input(z2.object({
      category: z2.string().optional(),
      style: z2.string().optional(),
      color: z2.string().optional(),
      minPrice: z2.number().optional(),
      maxPrice: z2.number().optional(),
      tags: z2.array(z2.string()).optional()
    })).query(async ({ input }) => {
      return await getProductsByFilters(input);
    })
  }),
  // Quiz endpoints
  quiz: router({
    getQuestions: publicProcedure.query(async () => {
      return await getAllQuizQuestions();
    }),
    submitAnswers: publicProcedure.input(z2.object({
      answers: z2.record(z2.string(), z2.any()),
      email: z2.string().email().optional(),
      name: z2.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const sessionId = uuidv4();
      const recommendedProducts = await calculateRecommendations(input.answers);
      const score = calculateMatchScore(input.answers, recommendedProducts);
      const resultId = await saveQuizResult({
        userId: ctx.user?.id,
        sessionId,
        email: input.email,
        name: input.name,
        answers: JSON.stringify(input.answers),
        recommendedProducts: JSON.stringify(recommendedProducts),
        score,
        completedAt: /* @__PURE__ */ new Date()
      });
      return {
        resultId,
        sessionId,
        recommendedProducts,
        score
      };
    }),
    getResult: publicProcedure.input(z2.object({ resultId: z2.number() })).query(async ({ input }) => {
      const result = await getQuizResultById(input.resultId);
      if (!result) return null;
      const answers = JSON.parse(result.answers);
      const recommendedProductIds = result.recommendedProducts ? JSON.parse(result.recommendedProducts) : [];
      const products = await Promise.all(
        recommendedProductIds.map((id) => getProductById(id))
      );
      return {
        ...result,
        answers,
        products: products.filter((p) => p !== void 0)
      };
    }),
    getUserResults: protectedProcedure.query(async ({ ctx }) => {
      return await getQuizResultsByUserId(ctx.user.id);
    })
  }),
  // Configuration endpoints
  configurations: router({
    create: publicProcedure.input(z2.object({
      title: z2.string(),
      roomType: z2.enum(["banyo", "mutfak", "tuvalet", "lavabo"]),
      selectedProducts: z2.array(z2.object({
        productId: z2.number(),
        position: z2.object({ x: z2.number(), y: z2.number() }),
        rotation: z2.number().optional()
      })),
      quizResultId: z2.number().optional(),
      isPublic: z2.boolean().optional()
    })).mutation(async ({ input, ctx }) => {
      const sessionId = uuidv4();
      const productIds = input.selectedProducts.map((p) => p.productId);
      const products = await Promise.all(
        productIds.map((id) => getProductById(id))
      );
      const totalPrice = products.reduce((sum, p) => sum + (p?.price || 0), 0);
      const configId = await saveConfiguration({
        userId: ctx.user?.id,
        sessionId: ctx.user ? void 0 : sessionId,
        quizResultId: input.quizResultId,
        title: input.title,
        roomType: input.roomType,
        selectedProducts: JSON.stringify(input.selectedProducts),
        totalPrice,
        isPublic: input.isPublic || false,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      });
      return { configId, totalPrice };
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      title: z2.string().optional(),
      selectedProducts: z2.array(z2.object({
        productId: z2.number(),
        position: z2.object({ x: z2.number(), y: z2.number() }),
        rotation: z2.number().optional()
      })).optional(),
      isPublic: z2.boolean().optional()
    })).mutation(async ({ input, ctx }) => {
      const config = await getConfigurationById(input.id);
      if (!config || config.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }
      const updates = {};
      if (input.title) updates.title = input.title;
      if (input.isPublic !== void 0) updates.isPublic = input.isPublic;
      if (input.selectedProducts) {
        updates.selectedProducts = JSON.stringify(input.selectedProducts);
        const productIds = input.selectedProducts.map((p) => p.productId);
        const products = await Promise.all(
          productIds.map((id) => getProductById(id))
        );
        updates.totalPrice = products.reduce((sum, p) => sum + (p?.price || 0), 0);
      }
      await updateConfiguration(input.id, updates);
      return { success: true };
    }),
    getById: publicProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      const config = await getConfigurationById(input.id);
      if (!config) return null;
      const selectedProducts = JSON.parse(config.selectedProducts);
      const productIds = selectedProducts.map((p) => p.productId);
      const products = await Promise.all(
        productIds.map((id) => getProductById(id))
      );
      return {
        ...config,
        selectedProducts,
        products: products.filter((p) => p !== void 0)
      };
    }),
    getUserConfigurations: protectedProcedure.query(async ({ ctx }) => {
      return await getConfigurationsByUserId(ctx.user.id);
    }),
    getPublic: publicProcedure.input(z2.object({ limit: z2.number().optional() })).query(async ({ input }) => {
      return await getPublicConfigurations(input.limit);
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input, ctx }) => {
      const config = await getConfigurationById(input.id);
      if (!config || config.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }
      await deleteConfiguration(input.id);
      return { success: true };
    })
  })
});
async function calculateRecommendations(answers) {
  const filters = {};
  if (answers["2"]) {
    const styleMap = {
      "modern": "modern",
      "klasik": "klasik",
      "endustriyel": "endustriyel",
      "dogal": "rustik"
      // Map dogal to rustik
    };
    filters.style = styleMap[answers["2"]] || answers["2"];
  }
  if (answers["3"]) {
    filters.color = answers["3"];
  }
  if (answers["4"]) {
    const budgetMap = {
      "ekonomik": { min: 0, max: 5e5 },
      // 0 - 5.000 TL
      "orta": { min: 5e5, max: 15e5 },
      // 5.000 - 15.000 TL
      "premium": { min: 15e5, max: 3e6 },
      // 15.000 - 30.000 TL
      "lux": { min: 3e6, max: 1e7 }
      // 30.000+ TL
    };
    const budget = budgetMap[answers["4"]];
    if (budget) {
      filters.minPrice = budget.min;
      filters.maxPrice = budget.max;
    }
  }
  const neededCategories = [];
  if (answers["6"]) {
    const categoryMap = {
      "lavabo": "lavabo",
      "klozet": "klozet",
      "batarya": "batarya",
      "dus": "dus_seti",
      "karo": "karo",
      "dolap": "diger",
      // Banyo dolabı "diger" category'sinde
      "aksesuar": "aksesuar"
    };
    const selected = Array.isArray(answers["6"]) ? answers["6"] : [answers["6"]];
    selected.forEach((val) => {
      const mapped = categoryMap[val];
      if (mapped && !neededCategories.includes(mapped)) {
        neededCategories.push(mapped);
      }
    });
  }
  let allProducts = await getProductsByFilters(filters);
  let products = neededCategories.length > 0 ? allProducts.filter((p) => neededCategories.includes(p.category)) : allProducts;
  if (products.length === 0) {
    console.log("[Quiz] No products found with strict filters, trying relaxed filters");
    const relaxedFilters = {};
    if (filters.style) relaxedFilters.style = filters.style;
    if (filters.color) relaxedFilters.color = filters.color;
    allProducts = await getProductsByFilters(relaxedFilters);
    products = neededCategories.length > 0 ? allProducts.filter((p) => neededCategories.includes(p.category)) : allProducts;
  }
  if (products.length === 0 && neededCategories.length > 0) {
    console.log("[Quiz] No products found, getting all products from needed categories");
    const allProductsFromCategories = await Promise.all(
      neededCategories.map((cat) => getProductsByCategory(cat))
    );
    products = allProductsFromCategories.flat();
  }
  if (products.length === 0) {
    console.log("[Quiz] No products found, getting all products");
    products = await getAllProducts();
  }
  const categoriesToRecommend = neededCategories.length > 0 ? neededCategories : ["lavabo", "klozet", "batarya", "dus_seti", "karo", "aksesuar"];
  const useAI = neededCategories.length > 0 || products.length >= 3;
  if (useAI) {
    try {
      console.log(
        "[Quiz] Using AI for filtering and sorting",
        products.length,
        "products",
        neededCategories.length > 0 ? `(selected categories: ${neededCategories.join(", ")})` : ""
      );
      const styleProfile = await generateUserStyleProfile(answers);
      const recommendations2 = [];
      for (const category of categoriesToRecommend) {
        const categoryProducts = products.filter((p) => p.category === category);
        if (categoryProducts.length > 0) {
          const maxPerCategory = categoryProducts.length >= 2 ? 2 : 1;
          const aiSorted = await smartFilterAndSortProducts(
            categoryProducts,
            styleProfile.profile,
            answers,
            maxPerCategory
          );
          aiSorted.forEach((p) => {
            if (!recommendations2.includes(p.id)) {
              recommendations2.push(p.id);
            }
          });
        }
      }
      console.log("[Quiz] AI Recommendations:", recommendations2.length, "products");
      return recommendations2;
    } catch (error) {
      console.error("[Quiz] AI filtering failed, falling back to rule-based:", error);
    }
  }
  const recommendations = [];
  for (const category of categoriesToRecommend) {
    const categoryProducts = products.filter((p) => p.category === category);
    if (categoryProducts.length > 0) {
      let sorted = categoryProducts;
      if (filters.minPrice !== void 0 && filters.maxPrice !== void 0) {
        const midPrice = (filters.minPrice + filters.maxPrice) / 2;
        sorted = categoryProducts.sort((a, b) => {
          const aDiff = Math.abs(a.price - midPrice);
          const bDiff = Math.abs(b.price - midPrice);
          return aDiff - bDiff;
        });
      } else {
        sorted = categoryProducts.sort((a, b) => a.price - b.price);
      }
      recommendations.push(sorted[0].id);
      if (sorted.length > 1 && categoryProducts.length >= 2) {
        recommendations.push(sorted[1].id);
      }
    }
  }
  console.log("[Quiz] Rule-based Recommendations:", recommendations.length, "products");
  return recommendations;
}
function calculateMatchScore(answers, productIds) {
  const answeredCount = Object.keys(answers).length;
  const baseScore = answeredCount / 6 * 70;
  const recommendationScore = productIds.length / 12 * 30;
  return Math.round(baseScore + recommendationScore);
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString2 = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString2(openId) || !isNonEmptyString2(appId) || !isNonEmptyString2(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// netlify/functions/trpc.ts
var app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(
  "/*",
  createExpressMiddleware({
    router: appRouter,
    createContext
  })
);
var serverlessHandler = serverless(app);
var handler = async (event, context) => {
  const result = await serverlessHandler(event, context);
  return {
    statusCode: result.statusCode || 200,
    headers: result.headers || {},
    body: result.body || ""
  };
};
export {
  handler
};
