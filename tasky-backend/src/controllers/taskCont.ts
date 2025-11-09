import e, { text, type Request, type Response } from "express";
import "../types/request.js";
import { Errors } from "../models/Errors";
import { Messages } from "../models/Messages";
import { Error, Op } from "sequelize";
import sequelize from "../utils/sequelize";
import User from "../models/UsersModel";
import Task from "../models/tasksModel.js";
import bcrypt from "bcrypt";
import { createHash } from "crypto";
import type { Transaction } from "sequelize";
import { sendEmail } from "../utils/emailService.js";
import { issueResetToken, issueToken } from "../utils/jwtService.js";
import Notifications from "../models/Notification.js";
import { scheduleTaskActivation } from "../jobs/taskProducer.js";
import {
  generateWelcomeEmail,
  generateVerificationCodeEmail,
} from "../templates/emailTemplates.js";
import { count, error } from "console";
import { link, stat } from "fs";
import { configDotenv } from "dotenv";
import Notification from "../models/Notification.js";
const CreateTaskCont = async (req: Request, res: Response) => {
  const {
    title,
    description,
    priority,
    dueDate,
    scheduledRunTime,
    assigneeId,
    isRecurring,
  } = req.body;
  const transaction = await sequelize.transaction();
  const requesterId = req.tokenUser?.userId;
  const requesterRole = req.tokenUser?.role;

  if (requesterRole !== "Manager") {
    return res.status(Errors.BAD_REQUEST.status).json({
      error: "Role must be either 'Manager'",
      code: Errors.BAD_REQUEST.code,
    });
  }
  try {
    const assignee = await User.findByPk(assigneeId, { transaction });
    {
      if (!assignee) {
        return res.status(Errors.BAD_REQUEST.status).json({
          error: Errors.BAD_REQUEST.error,
          code: Errors.BAD_REQUEST.code,
        });
      }
      const newTask = await Task.create(
        {
          title: title,
          description: description,
          priority: priority,
          dueDate: new Date(dueDate),
          scheduledRunTime: new Date(scheduledRunTime),
          assigneeId: assigneeId,
          department: assignee.department,
          isRecurring: isRecurring,
          createdBy: requesterId,
          createdAt: new Date(),
          updatedAt: new Date(),
          // status: "scheduled", by default in the model
          jobId: null,
        },
        { transaction }
      );
      // This queues the task in Redis for execution at scheduledRunTime.
      // SCHEDULE THE JOB AND GET THE ID (BullMQ Integration)
      const bullMqJobId: string = await scheduleTaskActivation(
        newTask.id,
        newTask.scheduledRunTime
      );
      // This ensures we can monitor/cancel the job later.
      await newTask.update({ jobId: bullMqJobId }, { transaction });
      await transaction.commit();
      //!user should be notified of the new task assignment when its time not when created
      // const notifyUser = await Notifications.create({
      //   recipientId: assigneeId,
      //   senderId: requesterId || null,
      //   type: "task_assigned",
      //   message: `You have been assigned a new task: ${newTask.title}`,
      //   linkTo: `/tasks/${newTask.id}`,
      // });
      res
        .status(Messages.TASK_CREATED.status)
        .json({ message: Messages.TASK_CREATED.message, task: newTask });
    }
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Error creating task:", error);
    res.status(Errors.INTERNAL_ERROR.status).json({
      error: Errors.INTERNAL_ERROR.error,
      code: Errors.INTERNAL_ERROR.code,
    });
  }
};
// const getUserTasks = async (req: Request, res: Response) => {
//   // Assert non-null as authenticateUser middleware should have run
//   const userId = req.tokenUser!.userId;
//   const userRole = req.tokenUser!.role;
//   const queryStatus = req.query.status as string | undefined;

//   // 1. DEFINE ALL STATUSES AND RESTRICTED LISTS
//   const ALL_VALID_STATUSES = [
//     "scheduled",
//     "pending",
//     "in_progress",
//     "completed",
//   ];
//   const RESTRICTED_STATUSES = ["scheduled"];

//   // 2. Determine the Final Filter based on the query and role
//   let finalStatusFilter: any;

//   if (queryStatus) {
//     // --- A. Query Status Provided ---

//     // Security Check 1: Validate input against the known ENUM list
//     if (!ALL_VALID_STATUSES.includes(queryStatus)) {
//       return res.status(Errors.BAD_REQUEST.status).json(Errors.BAD_REQUEST);
//     }

//     // Security Check 2: Block standard users from requesting 'scheduled' status
//     if (
//       RESTRICTED_STATUSES.includes(queryStatus) &&
//       userRole !== "Manager" &&
//       userRole !== "admin"
//     ) {
//       return res.status(Errors.UNAUTHORIZED.status).json({
//         error: Errors.UNAUTHORIZED.error,
//         code: Errors.UNAUTHORIZED.code,
//       });
//     }

//     finalStatusFilter = queryStatus;
//   } else {
//     // --- B. Default Filter (No status provided in query) ---
//     if (userRole === "Manager" || userRole === "admin") {
//       // Managers see ALL statuses by default
//       finalStatusFilter = { [Op.in]: ALL_VALID_STATUSES };
//     } else {
//       // Standard users see everything EXCEPT 'scheduled' by default
//       finalStatusFilter = { [Op.notIn]: ["scheduled"] };
//     }
//   }

//   // 3. Define the Ownership and Counting Conditions
//   let countWhereCondition: any; // Used for the aggregate counting query
//   let whereCondition: any; // Used for the main task list query

//   if (userRole === "Manager" || userRole === "admin") {
//     // Managers: Count ALL tasks and fetch ALL tasks based on the applied status filter
//     countWhereCondition = {};
//     whereCondition = { status: finalStatusFilter };
//   } else {
//     // Standard Users:
//     // Count only tasks assigned to them, EXCLUDING restricted statuses
//     countWhereCondition = {
//       assigneeId: userId,
//       status: { [Op.notIn]: RESTRICTED_STATUSES },
//     };
//     // Fetch the subset of those tasks based on the specific status filter
//     whereCondition = {
//       [Op.and]: [{ assigneeId: userId }, { status: finalStatusFilter }],
//     };
//   }

//   try {
//     // 4. AGGREGATION QUERY: Get total counts by status
//     const statusCountsArray = await Task.findAll({
//       attributes: [
//         "status",
//         [sequelize.fn("COUNT", sequelize.col("id")), "count"],
//       ],
//       where: countWhereCondition, // Uses the restricted/unrestricted condition
//       group: ["status"],
//       raw: true,
//     });

//     // Convert the array into a clean object map: { 'pending': 12, 'completed': 50, ... }
//     const counts = statusCountsArray.reduce(
//       (acc: Record<string, number>, item: any) => {
//         acc[item.status] = parseInt(item.count, 10);
//         return acc;
//       },
//       {}
//     );

//     // 5. FETCH MAIN TASK LIST
//     const tasks = await Task.findAll({
//       where: whereCondition, // Uses the specific status filter
//       order: [["dueDate", "ASC"]],
//       include: [
//         { model: User, as: "Assignee", attributes: ["id", "name", "email"] },
//         { model: User, as: "Creator", attributes: ["id", "name", "email"] },
//       ],
//     });

//     // 6. RETURN FINAL RESPONSE with counts
//     return res.status(Messages.TASKS_FETCHED.status).json({
//       message: Messages.TASKS_FETCHED.message,
//       tasks: tasks,
//       count: tasks.length,
//       statusCounts: counts, // The efficient aggregate counts
//     });
//   } catch (error) {
//     console.error("Error fetching user tasks:", error);
//     return res.status(Errors.INTERNAL_ERROR.status).json({
//       error: Errors.INTERNAL_ERROR.error,
//       code: Errors.INTERNAL_ERROR.code,
//     });
//   }
// }; // backend/src/controllers/userController.ts
const getUserTasks = async (req: Request, res: Response) => {
  // Assert non-null as authenticateUser middleware should have run
  const userId = req.tokenUser!.userId;
  const userRole = req.tokenUser!.role;
  const queryStatus = req.query.status as string | undefined;
  const scopeFilter = req.query.scope as string | undefined; // e.g., 'assignedToMe' or 'assignedByMe'

  // 1. DEFINE ALL STATUSES AND RESTRICTED LISTS
  const ALL_VALID_STATUSES = [
    "scheduled",
    "pending",
    "in_progress",
    "completed",
  ];
  const RESTRICTED_STATUSES = ["scheduled"];

  // 2. Determine the Final Filter based on the query and role
  let finalStatusFilter: any;

  if (queryStatus) {
    // --- A. Query Status Provided ---
    if (!ALL_VALID_STATUSES.includes(queryStatus)) {
      return res.status(Errors.BAD_REQUEST.status).json(Errors.BAD_REQUEST);
    }

    if (
      RESTRICTED_STATUSES.includes(queryStatus) &&
      userRole !== "Manager" &&
      userRole !== "admin"
    ) {
      return res.status(Errors.UNAUTHORIZED.status).json(Errors.UNAUTHORIZED);
    }
    finalStatusFilter = queryStatus;
  } else {
    // --- B. Default Filter (No status provided in query) ---
    if (userRole === "Manager" || userRole === "admin") {
      finalStatusFilter = { [Op.in]: ALL_VALID_STATUSES };
    } else {
      finalStatusFilter = { [Op.notIn]: ["scheduled"] };
    }
  }

  // --- Start Transaction for all database operations ---
  const t = await sequelize.transaction();

  //  Determine Manager's Scope ---
  let subordinateIds: number[] = [];
  if (userRole === "Manager") {
    try {
      const subordinateUsers = await User.findAll({
        where: { directManagerId: userId },
        attributes: ["id"],
        raw: true, // Fetch plain objects js
        transaction: t, // Transaction applied
      });
      subordinateIds = subordinateUsers.map((u) => u.id);
    } catch (error) {
      // Rollback if the subordinate lookup fails
      await t.rollback();
      console.error("Error fetching subordinate users:", error);
      return res
        .status(Errors.INTERNAL_ERROR.status)
        .json(Errors.INTERNAL_ERROR);
    }
  }
  // The scope includes the manager and their team members
  const managerScopeIds = [userId, ...subordinateIds]; // With spread operator to flatten array --> merge the userid wwith the subordinate ids array
  //[1,5,8,12]
  // 3. Define the Ownership and Counting Conditions
  let countWhereCondition: any;
  let whereCondition: any;

  if (userRole === "admin") {
    // Admins see EVERYTHING
    countWhereCondition = {};
    whereCondition = { status: finalStatusFilter };
  } else if (userRole === "Manager") {
    // Managers: Filter based on team/creator, with optional scope narrowing

    // --- 1. Initialize Default/Comprehensive Scope ---
    let scopeCondition: any = {
      [Op.or]: [
        { assigneeId: { [Op.in]: managerScopeIds } }, // Assigned to team or manager
        { createdBy: userId }, // Assigned by manager
      ],
    };

    // --- 2. Apply Optional Scope Filter (Only if provided) ---
    if (scopeFilter === "assignedToMe") {
      scopeCondition = { assigneeId: userId };
    } else if (scopeFilter === "assignedByMe") {
      scopeCondition = { createdBy: userId };
    } else if (scopeFilter === "assignedToTeam") {
      // Exclude the manager from the team view
      const teamOnlyIds = subordinateIds.length > 0 ? subordinateIds : [null];
      scopeCondition = { assigneeId: { [Op.in]: teamOnlyIds } };
    }

    // --- 3. Finalize Conditions using the determined scopeCondition ---
    countWhereCondition = {
      [Op.and]: [
        scopeCondition,
        { status: { [Op.notIn]: RESTRICTED_STATUSES } },
      ],
    };

    whereCondition = {
      [Op.and]: [scopeCondition, { status: finalStatusFilter }],
    };
  } else {
    // Standard Users: (Logic remains unchanged)
    countWhereCondition = {
      assigneeId: userId,
      status: { [Op.notIn]: RESTRICTED_STATUSES },
    };
    whereCondition = {
      [Op.and]: [{ assigneeId: userId }, { status: finalStatusFilter }],
    };
  }

  try {
    // 4. AGGREGATION QUERY: Get total counts by status
    const statusCountsArray = await Task.findAll({
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where: countWhereCondition,
      group: ["status"],
      raw: true,
      transaction: t, // Transaction applied
    });

    // Convert the array into a clean object map
    const counts = statusCountsArray.reduce(
      (acc: Record<string, number>, item: any) => {
        acc[item.status] = parseInt(item.count, 10);
        return acc;
      },
      {}
    );

    // 5. FETCH MAIN TASK LIST
    const tasks = await Task.findAll({
      where: whereCondition,
      order: [["dueDate", "ASC"]],
      include: [
        { model: User, as: "Assignee", attributes: ["id", "name", "email"] },
        { model: User, as: "Creator", attributes: ["id", "name", "email"] },
      ],
      transaction: t, // Transaction applied
    });

    // 6. Commit the transaction
    await t.commit();

    // 7. RETURN FINAL RESPONSE with counts
    return res.status(Messages.TASKS_FETCHED.status).json({
      message: Messages.TASKS_FETCHED.message,
      tasks: tasks,
      count: tasks.length,
      statusCounts: counts,
    });
  } catch (error) {
    console.error("Error fetching user tasks:", error);
    // Ensure rollback if an error occurred in the try block
    await t.rollback();
    return res.status(Errors.INTERNAL_ERROR.status).json(Errors.INTERNAL_ERROR);
  }
};

const getDirectEmployeesCont = async (req: Request, res: Response) => {
  const managerId = req.tokenUser!.userId;
  const userRole = req.tokenUser!.role;
  if (userRole !== "Manager") {
    return res.status(Errors.UNAUTHORIZED.status).json({
      error: Errors.UNAUTHORIZED.error,
      code: Errors.UNAUTHORIZED.code,
    });
  }

  try {
    const assignees = await User.findAll({
      where: { directManagerId: managerId },
      attributes: ["id", "name", "email"], // Fetch only necessary fields
      order: [["name", "ASC"]],
    });

    // Return a clean, lightweight list
    return res.status(Messages.ASSIGNEES_FETCHED.status).json({
      message: Messages.ASSIGNEES_FETCHED.message,
      employees: assignees,
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return res.status(Errors.INTERNAL_ERROR.status).json({
      error: Errors.INTERNAL_ERROR.error,
      code: Errors.INTERNAL_ERROR.code,
    });
  }
};

const updateTaskCont = async (req: Request, res: Response) => {
  /**
   * the possible edits for the tasks are
   * title
   * description
   * priority
   * dueDate
   * scheduledRunTime
   * assigneeId
   * isRecurring
   */
  const taskId = req.params.id;
  const userId = req.tokenUser!.userId;
  const userRole = req.tokenUser!.role;
  //the optional updates possible
  const userUpdates = req.body;
  const VALID_UPDATE_FIELDS = [
    "title",
    "description",
    "priority",
    "dueDate",
    "scheduledRunTime",
    "assigneeId",
    "isRecurring",
  ];
  if (
    !taskId ||
    !userId ||
    (userRole !== "Manager" && userRole !== "admin") ||
    !Object.keys(userUpdates).length
  ) {
    return res.status(Errors.BAD_REQUEST.status).json({
      error: Errors.BAD_REQUEST.error,
      code: Errors.BAD_REQUEST.code,
    });
  }
  const updatePayload: any = {};
  for (const field of VALID_UPDATE_FIELDS) {
    if (userUpdates[field] !== undefined) {
      updatePayload[field] = userUpdates[field];
    }
  }
  const t = await sequelize.transaction();
  try {
    const task = await Task.findByPk(taskId, { transaction: t });
    if (!task) {
      await t.rollback();
      return res.status(Errors.NOT_FOUND.status).json({
        error: Errors.NOT_FOUND.error,
        code: Errors.NOT_FOUND.code,
      });
    }
    if (task.status === "completed") {
      await t.rollback();
      return res.status(Errors.COMPLETED_TASKS_NON_EDITABLE.status).json({
        error: Errors.COMPLETED_TASKS_NON_EDITABLE.error,
        code: Errors.COMPLETED_TASKS_NON_EDITABLE.code,
      });
    }
    const [affectedRows] = await Task.update(updatePayload, {
      where: { id: taskId },
      transaction: t,
    });
    if (affectedRows === 0) {
      await t.rollback();
      return res.status(Errors.NOT_FOUND.status).json({
        error: Errors.NOT_FOUND.error,
        code: Errors.NOT_FOUND.code,
      });
    }
    const notification = await Notification.create(
      {
        recipientId: task.assigneeId,
        senderId: userId || null,
        type: "task_updated",
        message: `Task: ${task.title} has been updated. Please check recheck the details.`,
        taskId: task.id,
        linkTo: `/tasks/${task.id}`,
      },
      { transaction: t }
    );
    await t.commit();
    return res.status(Messages.TASK_UPDATED.status).json({
      message: Messages.TASK_UPDATED.message,
      code: Messages.TASK_UPDATED.code,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    await t.rollback();
    return res.status(Errors.INTERNAL_ERROR.status).json({
      error: Errors.INTERNAL_ERROR.error,
      code: Errors.INTERNAL_ERROR.code,
    });
  }
};

const startTask = async (req: Request, res: Response) => {
  const taskId = req.params.id;
  const userId = req.tokenUser!.userId;
  if (!taskId || !userId) {
    return res.status(Errors.BAD_REQUEST.status).json({
      error: Errors.BAD_REQUEST.error,
      code: Errors.BAD_REQUEST.code,
    });
  }
  const t = await sequelize.transaction();
  try {
    const task = await Task.findByPk(taskId, { transaction: t });
    if (!task || task.assigneeId !== userId) {
      await t.rollback();
      return res.status(Errors.BAD_REQUEST.status).json({
        error: Errors.BAD_REQUEST.error,
        code: Errors.BAD_REQUEST.code,
      });
    }
    if (task.status !== "pending") {
      await t.rollback();
      return res.status(Errors.TASK_NOT_RERADY_TO_START.status).json({
        error: Errors.TASK_NOT_RERADY_TO_START.error,
        code: Errors.TASK_NOT_RERADY_TO_START.code,
      });
    }
    task.status = "in_progress";
    task.startedAt = new Date();
    await task.save({ transaction: t });
    const notificationForDirectManager = await Notification.create(
      {
        recipientId: task.createdBy,
        senderId: null,
        type: "task_started",
        message: `Task: ${task.title} has been started, by its assigend user.`,
        taskId: task.id,
        linkTo: `/tasks/${task.id}`,
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(Messages.TASK_STARTED.status).json({
      message: Messages.TASK_STARTED.message,
      code: Messages.TASK_STARTED.code,
    });
  } catch (error) {
    console.error("Error starting task:", error);
    return res.status(Errors.INTERNAL_ERROR.status).json({
      error: Errors.INTERNAL_ERROR.error,
      code: Errors.INTERNAL_ERROR.code,
    });
  }
};

const completeTask = async (req: Request, res: Response) => {
  const taskId = req.params.id;
  const userId = req.tokenUser!.userId;
  if (!taskId || !userId) {
    return res.status(Errors.BAD_REQUEST.status).json({
      error: Errors.BAD_REQUEST.error,
      code: Errors.BAD_REQUEST.code,
    });
  }
  const t = await sequelize.transaction();
  try {
    const task = await Task.findByPk(taskId, { transaction: t });
    if (!task || task.assigneeId !== userId) {
      await t.rollback();
      return res.status(Errors.BAD_REQUEST.status).json({
        error: Errors.BAD_REQUEST.error,
        code: Errors.BAD_REQUEST.code,
      });
    }
    if (task.status !== "in_progress") {
      await t.rollback();
      return res.status(Errors.TASK_NOT_STARTED_YET.status).json({
        error: Errors.TASK_NOT_STARTED_YET.error,
        code: Errors.TASK_NOT_STARTED_YET.code,
      });
    }
    task.status = "completed";
    task.completedAt = new Date();
    await task.save({ transaction: t });
    const notificationForDirectManager = await Notification.create(
      {
        recipientId: task.createdBy,
        senderId: null,
        type: "task_completed",
        message: `Task: ${task.title} has been completed, by its assigned user.`,
        taskId: task.id,
        linkTo: `/tasks/${task.id}`,
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(Messages.TASK_COMPLETED.status).json({
      message: Messages.TASK_COMPLETED.message,
      code: Messages.TASK_COMPLETED.code,
    });
  } catch (error) {
    console.error("Error starting task:", error);
    return res.status(Errors.INTERNAL_ERROR.status).json({
      error: Errors.INTERNAL_ERROR.error,
      code: Errors.INTERNAL_ERROR.code,
    });
  }
};
const reportTaskCont = async (req: Request, res: Response) => {
  const taskId = req.params.id;
  const userId = req.tokenUser!.userId;
  const reportMessage = req.body.message;
  if (
    !taskId ||
    !userId ||
    !reportMessage ||
    reportMessage.trim().length === 0
  ) {
    return res.status(Errors.BAD_REQUEST.status).json(Errors.BAD_REQUEST);
  }
  const t = await sequelize.transaction();
  try {
    const task = await Task.findByPk(taskId);
    if (!task || task.assigneeId !== userId) {
      return res.status(Errors.BAD_REQUEST.status).json({
        error: Errors.BAD_REQUEST.error,
        code: Errors.BAD_REQUEST.code,
      });
    }
    const notficationReport = await Notification.create(
      {
        recipientId: task.createdBy,
        senderId: userId || null,
        type: "report_created",
        message: reportMessage,
        taskId: task.id,
        linkTo: `/tasks/${task.id}`,
      },
      { transaction: t }
    );
    await t.commit();
    return res.status(Messages.TASK_REPORTED.status).json({
      message: Messages.TASK_REPORTED.message,
      code: Messages.TASK_REPORTED.code,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error reporting task:", error);
    return res.status(Errors.INTERNAL_ERROR.status).json({
      error: Errors.INTERNAL_ERROR.error,
      code: Errors.INTERNAL_ERROR.code,
    });
  }
};

export default {
  CreateTaskCont,
  getUserTasks,
  getDirectEmployeesCont,
  startTask,
  completeTask,
  updateTaskCont,
  reportTaskCont,
};
