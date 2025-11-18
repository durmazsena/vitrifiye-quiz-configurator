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

// tRPC middleware - tüm path'leri yakala
app.use(
  "/*",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Serverless handler
const serverlessHandler = serverless(app);

// Netlify Functions handler
export const handler: Handler = async (event, context) => {
  // Netlify Functions event'ini Express formatına çevir
  const result = await serverlessHandler(event as any, context as any);
  
  return {
    statusCode: result.statusCode || 200,
    headers: result.headers || {},
    body: result.body || "",
  };
};
