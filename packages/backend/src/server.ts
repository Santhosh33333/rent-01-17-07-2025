import "dotenv/config";
import { createApp } from "./app";
import { env } from "./config/env";
import { prisma, testConnection, disconnect } from "./config/database";

async function main(): Promise<void> {
  try {
    await testConnection();
    console.log("Database connection established.");

    const app = createApp();
    const server = app.listen(env.PORT, () => {
      console.log(`RentBuddy API server listening on port ${env.PORT} [${env.NODE_ENV}]`);
    });

    const shutdown = async (signal: string): Promise<void> => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log("HTTP server closed.");
      });
      try {
        await disconnect();
        console.log("Database disconnected.");
      } catch (err) {
        console.error("Error during shutdown:", err);
      }
      process.exit(0);
    };

    process.on("SIGINT", () => void shutdown("SIGINT"));
    process.on("SIGTERM", () => void shutdown("SIGTERM"));
  } catch (err) {
    console.error("Failed to start server:", err);
    await disconnect().catch(() => undefined);
    process.exit(1);
  }
}

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});

void main();
