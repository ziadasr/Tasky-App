// backend/test/redisTest.ts

import { testRedisConnection } from "../src/utils/redisClient.js";
import "dotenv/config";

/**
 * Executes a dedicated test to verify the Redis connection integrity.
 * This script will run and exit successfully only if Redis is reachable.
 */
async function runRedisTest() {
  console.log("--- Starting Redis Connection Test ---");

  // 1. Check environment variables
  if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
    console.error(
      "❌ ERROR: REDIS_HOST or REDIS_PORT is not set in the .env file."
    );
    process.exit(1);
  }

  try {
    // 2. Execute the connection check utility
    await testRedisConnection();

    console.log("--- Redis Test Successful! ---");
    // Exit process cleanly on success
    process.exit(0);
  } catch (error) {
    // 3. Handle connection failure
    console.error("\n🚨 FATAL TEST FAILURE: Could not connect to Redis.");

    // Log the environment being used for troubleshooting
    console.error(
      `Attempted connection to: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
    );

    // Exit with an error code
    process.exit(1);
  }
}

runRedisTest();
