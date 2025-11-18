import type { Handler } from "@netlify/functions";
import serverless from "serverless-http";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../../server/routers";
import { createContext } from "../../server/_core/context";

// Express app oluştur
const app = express();

// Body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// tRPC middleware - /api/trpc path'i ile
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Serverless handler
const serverlessHandler = serverless(app);

// Netlify Functions handler
export const handler: Handler = async (event, context) => {
  console.log("[Netlify Function] Request received:", {
    path: event.path,
    rawPath: event.rawPath,
    queryString: event.queryStringParameters,
    httpMethod: event.httpMethod,
  });
  
  // Netlify redirect'inden gelen path'i düzelt
  // /.netlify/functions/trpc/quiz.getQuestions -> /api/trpc/quiz.getQuestions
  let path = event.path;
  
  if (path.startsWith("/.netlify/functions/trpc")) {
    // Path'i /api/trpc ile değiştir
    const remainingPath = path.replace("/.netlify/functions/trpc", "");
    path = `/api/trpc${remainingPath}`;
    console.log("[Netlify Function] Path converted:", path);
  }
  
  // Event'i güncelle - serverless-http için gerekli format
  const modifiedEvent = {
    ...event,
    path: path,
    rawPath: path,
    requestContext: {
      ...event.requestContext,
      path: path,
      http: {
        ...event.requestContext?.http,
        path: path,
      },
    },
  };
  
  try {
    // Netlify Functions event'ini Express formatına çevir
    const result = await serverlessHandler(modifiedEvent as any, context as any);
    
    console.log("[Netlify Function] Response:", {
      statusCode: result.statusCode,
      headers: Object.keys(result.headers || {}),
    });
    
    return {
      statusCode: result.statusCode || 200,
      headers: result.headers || {},
      body: result.body || "",
    };
  } catch (error) {
    console.error("[Netlify Function] Error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Internal server error", message: error instanceof Error ? error.message : String(error) }),
    };
  }
};
