import e, { text, type Request, type Response } from "express";
import "../types/request.js";
import { Errors } from "../models/Errors";
import { Messages } from "../models/Messages";
import sequelize from "../utils/sequelize";
import User from "../models/UsersModel";
import bcrypt from "bcrypt";
import { createHash } from "crypto";
import type { Transaction } from "sequelize";
import { sendEmail } from "../utils/emailService.js";
import { issueResetToken, issueToken } from "../utils/jwtService.js";

const getAllEmployees = async (req: Request, res: Response) => {
  const offset = parseInt(req.query.offset as string) || 0;
  const limit = parseInt(req.query.limit as string) || 15;
  const queryRole = req.query.role as string | undefined;
  const sortBy = req.query.sortBy as string | "name";
  const sortDir =
    (req.query.sortDir as string)?.toUpperCase() === "DESC" ? "DESC" : "ASC";
  const userId = req.tokenUser!.userId;
  const userRole = req.tokenUser!.role;

  if (userRole !== "Admin" && userRole !== "Manager") {
    return res.status(Errors.UNAUTHORIZED.status).json({
      error: Errors.UNAUTHORIZED.error,
      code: Errors.UNAUTHORIZED.code,
    });
  }
  let whereCondition: any = {};
  if (userRole === "Manager") {
    whereCondition = { directManagerId: userId };
  }

  if (queryRole) {
    const validRoles = ["Admin", "Employee", "Manager"]; // Define valid roles could be more in more phasses
    if (!validRoles.includes(queryRole)) {
      return res.status(Errors.BAD_REQUEST.status).json({
        error: Errors.BAD_REQUEST.error,
        code: Errors.BAD_REQUEST.code,
      });
    }
    whereCondition = { ...whereCondition, role: queryRole }; //spread operator to combine conditions
  }
  const allowedSortFields = [
    "name",
    "salary",
    "createdAt",
    "lastLogin",
    "department",
  ];
  let orderCondition: any = [["name", "ASC"]]; //default sorting

  if (allowedSortFields.includes(sortBy)) {
    //check if the sortBy is in the allowed fields
    orderCondition = [[sortBy, sortDir]];
  }

  try {
    const { count, rows } = await User.findAndCountAll({
      where: whereCondition,
      offset: offset,
      limit: limit,
      attributes: { exclude: ["password", "encryptedVerificationCode"] },
      raw: true,
      order: orderCondition,
    });
    return res.status(Messages.ASSIGNEES_FETCHED.status).json({
      employees: rows,
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: Math.floor(offset / limit) + 1,
      limit: limit,
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return res.status(Errors.INTERNAL_ERROR.status).json({
      error: Errors.INTERNAL_ERROR.error,
      code: Errors.INTERNAL_ERROR.code,
    });
  }
};

export { getAllEmployees };
