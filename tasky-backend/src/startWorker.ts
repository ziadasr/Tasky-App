import { Worker } from "bullmq";
import "dotenv/config";
import { activateTaskInDB } from "./services/taskService.js";

const connection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
};

// Create the Worker and define the job execution logic
const worker = new Worker(
  "taskActivationQueue",
  async (job) => {
    if (job.name === "activateTask") {
      const { taskId } = job.data;
      console.log(
        `[JOB: ${job.id}] ⚙️ Worker processing activation for Task ${taskId}`
      );

      // Execute the actual business logic
      await activateTaskInDB(taskId);
    }
  },
  { connection }
);

worker.on("failed", (job, err) => {
  console.error(`[JOB: ${job?.id}] ❌ FAILED! Retrying job... Error:`, err);
});

console.log("👷 BullMQ Worker service initialized and listening...");
