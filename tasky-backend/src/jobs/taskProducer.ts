import { Queue } from "bullmq";
import { calculateDelay } from "../utils/dateUtils.js";
//the func to calc delay in ms
//this file is responsible for producing/scheduling jobs to the redis queue
// Define the connection options using environment variables
/**
1. Manager creates task: scheduledRunTime = "Dec 12, 3:00 PM"
   ↓
2. Producer adds job to Redis queue with 24-hour delay
   ↓
3. Redis waits 24 hours silently
   ↓
4. At 3:00 PM Dec 12, Redis triggers the job
   ↓
5. Worker picks up job and calls activateTaskInDB(taskId)
   ↓
6. Task status changes: "scheduled" → "pending"
   ↓
7. Employee sees the task on their dashboard and can start working
 */

const connection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
};

// Define the Queue instance (Name must be the same in the Worker)
export const taskQueue = new Queue("taskActivationQueue", { connection });

interface TaskActivationJob {
  taskId: number; //that should match the primapry key type of the task model
}
/**
 * Schedules a task activation job in the Redis queue.
 * @returns The unique BullMQ Job ID string.
 */
export const scheduleTaskActivation = async (
  taskId: number, //which task to activate
  scheduledRunTime: Date //when to activate
): Promise<string> => {
  const delayMs = calculateDelay(scheduledRunTime); //Example: If scheduled for 3 hours from now → 10,800,000 ms
  const jobData: TaskActivationJob = { taskId }; //create the job data object to pass to the worker

  const job = await taskQueue.add(
    "activateTask", // Type of job
    jobData,
    {
      delay: delayMs,
      removeOnComplete: true, //remove job from redis once completed
      attempts: 3, //retry up to 3 times if it fails
    }
  );

  console.log(
    `⏱️ Task ${taskId} successfully queued on Redis. Job ID: ${job.id}`
  );
  return job.id!;
};
