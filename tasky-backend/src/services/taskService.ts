import Notification from "../models/Notification";
import Task from "../models/tasksModel";
import sequelize from "../utils/sequelize";

/**
 * Executes the activation logic for a scheduled task.
 * Called by the BullMQ Worker.
 */

export const activateTaskInDB = async (taskId: number): Promise<void> => {
  // Acquire a transaction outside the try/catch for proper error handling
  const t = await sequelize.transaction();

  try {
    // 1. Fetch the task within the transaction for exclusive lock
    const task = await Task.findByPk(taskId, { transaction: t });

    if (!task) {
      console.error(
        `Task ${taskId} not found during activation. Rolling back.`
      );
      await t.rollback();
      return;
    }

    // 2. Business Logic: Check conditions and change state
    if (task.status === "scheduled") {
      // Change state from scheduled to pending (or 'due' if you prefer)
      await task.update(
        {
          status: "pending",
          // You might also want to set a timestamp here if needed:
          // activatedAt: new Date(),
        },
        { transaction: t }
      );
      console.log(`[Task ${taskId}] Status changed to PENDING in PostgreSQL.`),
        console.log(
          `[Task ${taskId}] Status changed to PENDING in PostgreSQL.`
        );

      // 3. CRITICAL: Create Notification for the Assignee (Recipient)
      // Only create notification if assignee exists
      if (task.assigneeId) {
        try {
          await Notification.create(
            {
              recipientId: task.assigneeId, // The user who must perform the task
              senderId: null, // System-generated notification
              taskId: task.id, // Link notification to the task
              message: `Task: ${
                task.title
              } is now active and ready to be started! Due date: ${new Date(
                task.dueDate
              ).toLocaleDateString()}.`,
              type: "task_assigned",
              linkTo: `/tasks/${task.id}`,
              isRead: false,
            },
            { transaction: t }
          );

          console.log(
            `[Task ${taskId}] Notification created for assignee ID: ${task.assigneeId}.`
          );
        } catch (error) {
          console.log(
            `[Task ${taskId}] Warning: Failed to create notification, but task was activated.`,
            error
          );
          // Don't throw - notification failure shouldn't block task activation
        }
      } else {
        console.warn(
          `[Task ${taskId}] No assignee found. Skipping notification creation.`
        );
      }

      // 4. Commit the transaction
      await t.commit();
    } else {
      // If the status is already updated (e.g., manually), just rollback and log
      console.warn(
        `[Task ${taskId}] Status was ${task.status}. No update needed.`
      );
      await t.rollback();
    }
  } catch (error) {
    // 5. Handle error and rollback
    console.error(
      `[Task ${taskId}] Error activating task or creating notification. Rolling back.`,
      error
    );
    if (t) {
      await t.rollback();
    }
    // In a real application, you might requeue the BullMQ job here or log to an external service.
  }
};
