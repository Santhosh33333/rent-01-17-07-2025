import "dotenv/config";
import { createApp } from "./app";
import { env } from "./config/env";
import { prisma, testConnection, disconnect } from "./config/database";

async function main(): Promise<void> {
  let dbAvailable = false
  try {
    await testConnection()
    dbAvailable = true
    console.log("Database connection established.")
  } catch (err) {
    console.warn("Database connection failed. Starting server without DB. API routes will return 503.", err)
  }

  const app = createApp()
  const server = app.listen(env.PORT, () => {
    console.log(`RentBuddy API server listening on port ${env.PORT} [${env.NODE_ENV}]${dbAvailable ? "" : " (no DB)"}`)
  })

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`)
    server.close(() => {
      console.log("HTTP server closed.")
    })
    try {
      await disconnect()
      console.log("Database disconnected.")
    } catch (err) {
      console.error("Error during shutdown:", err)
    }
    process.exit(0)
  }

  process.on("SIGINT", () => void shutdown("SIGINT"))
  process.on("SIGTERM", () => void shutdown("SIGTERM"))
}

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});

void main();
