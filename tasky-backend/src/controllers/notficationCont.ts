import { Errors } from "../models/Errors";
import { Messages } from "../models/Messages";
import sequelize from "../utils/sequelize";
import User from "../models/UsersModel";
import Task from "../models/tasksModel.js";
import e, { text, type Request, type Response } from "express";
import "../types/request.js";
import Notification from "../models/Notification";
import { Model, where } from "sequelize";

const getNotifications = async (req: Request, res: Response) => {
  const recipientId = req.tokenUser!.userId;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = parseInt(req.query.offset as string) || 0;
  try {
    const notifications = await Notification.findAll({
      where: { recipientId: recipientId },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Task,
          as: "Task",
          include: [
            { model: User, as: "Assignee", attributes: ["id", "name"] },
            { model: User, as: "Creator", attributes: ["id", "name"] },
          ],
        },
      ],
      limit: limit,
      offset: offset,
    });
    return res.status(200).json({ notifications: notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(Errors.INTERNAL_ERROR.status).json({
      error: Errors.INTERNAL_ERROR.error,
      code: Errors.INTERNAL_ERROR.code,
    });
  }
};

const getNotificationCount = async (req: Request, res: Response) => {
  const recipientId = req.tokenUser!.userId;
  try {
    const count = await Notification.count({
      where: {
        recipientId: recipientId,
        isRead: false,
      },
    });
    return res.status(200).json({ unreadsCount: count });
  } catch (error) {
    console.error("Error fetching notification count:", error);
    return res.status(Errors.INTERNAL_ERROR.status).json({
      error: Errors.INTERNAL_ERROR.error,
      code: Errors.INTERNAL_ERROR.code,
    });
  }
};

const markAllAsReadController = async (req: Request, res: Response) => {
  //destructuring assignment snot optional
  const recipientId = req.tokenUser!.userId;
  try {
    // Find and update all notifications where the user is the recipient AND isRead is false
    const [affectedRows] = await Notification.update(
      { isRead: true },
      {
        where: {
          recipientId: recipientId,
          isRead: false, // ONLY target unread ones
        },
      }
    );
    // This response doesn't need to return data, just confirmation of the action
    return res.status(Messages.NOTIFICATIONS_MARKED_AS_READ.status).json({
      message: Messages.NOTIFICATIONS_MARKED_AS_READ.message,
      code: Messages.NOTIFICATIONS_MARKED_AS_READ.code,
      rowsMarked: affectedRows,
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return res.status(Errors.INTERNAL_ERROR.status).json({
      error: Errors.INTERNAL_ERROR.error,
      code: Errors.INTERNAL_ERROR.code,
    });
  }
};

export { getNotifications, getNotificationCount, markAllAsReadController };
