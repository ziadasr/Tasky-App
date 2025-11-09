import { Redis } from "ioredis";
import "dotenv/config";

// Get connection details from environment variables
const host = process.env.REDIS_HOST || "localhost";
const port = parseInt(process.env.REDIS_PORT || "6379", 10);

// Create the Redis client instance
const redisClient = new Redis({
  host: host,
  port: port,
  maxRetriesPerRequest: null, // Critical for robust connection in Node.js
  enableReadyCheck: false,
});

/**
 * Tests the connection to the Redis server and logs the status.
 */
export const testRedisConnection = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 1. Connection Success Event
    redisClient.on("connect", () => {
      console.log(`✅ Redis client connected successfully to ${host}:${port}.`);
      resolve();
    });

    // 2. Connection Error Event
    redisClient.on("error", (err) => {
      console.error(
        `❌ Redis connection error on ${host}:${port}:`,
        err.message
      );
      // Ensure the error event doesn't cause the process to crash
      reject(new Error(`Failed to connect to Redis: ${err.message}`));
    });

    // Timeout check (just to be safe, though ioredis handles errors quickly)
    setTimeout(() => {
      if (redisClient.status !== "ready") {
        reject(new Error("Redis connection timed out or is not ready."));
      }
    }, 5000); // 5 second timeout
  });
};

export default redisClient;
