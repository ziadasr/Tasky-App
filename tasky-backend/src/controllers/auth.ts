import { text, type Request, type Response } from "express";
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
import {
  generateWelcomeEmail,
  generateVerificationCodeEmail,
} from "../templates/emailTemplates.js";

import { error } from "console";
import Notification from "../models/Notification.js";
//in the bottom of the file u will find the expected req of each middleware

//*last edit user logs in has to complete some fields (city- phone-number-dateofbirth)
const registrationContbyAdmin = async (req: Request, res: Response) => {
  //the pass is constant and set by user at the first login so not includded in the req
  //first login is false bydefault untill the user logins for the first time
  //lastlogin is handeled by the db
  const { name, email, department, role, directManagerId, salary } = req.body;
  console.log("Request Body:", req.body);
  console.log("Direct Manager ID:", directManagerId);

  // Validate role is either Manager or Employee
  if (!role || (role !== "Manager" && role !== "Employee")) {
    return res.status(Errors.BAD_REQUEST.status).json({
      error: "Role must be either 'Manager' or 'Employee'",
      code: Errors.BAD_REQUEST.code,
    });
  }

  // Set default password that user must change on first login
  const defaultPassword = "TempPassword";

  let transaction: Transaction | undefined;
  //check if the user already exists
  try {
    transaction = await sequelize.transaction();

    // Verify that directManagerId refers to an existing admin
    const manager = await User.findByPk(directManagerId, { transaction });
    if (!manager) {
      //incase the manager id is invalid
      return res.status(Errors.UNAUTHORIZED.status).json({
        error: "Manager not found",
        code: Errors.UNAUTHORIZED.code,
      });
    }

    //incase that the id doesnt points to a manager or admin
    if (manager.role !== "Manager") {
      console.log(
        "Manager role check failed. Expected 'Manager', got:",
        manager.role
      );
      return res.status(Errors.UNAUTHORIZED.status).json({
        error: Errors.UNAUTHORIZED.error,
        code: Errors.UNAUTHORIZED.code,
      });
    }
    //check if that email already exists
    const existingUser = await User.findOne({
      where: { email: email.toLowerCase() },
      transaction: transaction,
    });
    //if the email exists return error
    if (existingUser) {
      return res.status(Errors.EMAIL_EXISTS.status).json({
        error: Errors.EMAIL_EXISTS.error,
        code: Errors.EMAIL_EXISTS.code,
      });
    }

    // Hash the default password with bcrypt before storing
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Generate verification code and hash it with bcrypt
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Hash the code with SHA256 (to match frontend), then bcrypt
    const verificationCodeSha = createHash("sha256")
      .update(verificationCode)
      .digest("hex");
    const encryptedVerificationCode = bcrypt.hashSync(verificationCodeSha, 10);

    // add the new user to the database
    const newUser = await User.create(
      {
        name: name,
        email: email.toLowerCase(),
        password: hashedPassword,
        department: department,
        encryptedVerificationCode: encryptedVerificationCode,
        role: role,
        directManagerId: directManagerId,
        tempPassword: true, // User hasn't logged in yet
        lastLogin: null, // No login yet
        salary: salary,
        dateOfBirth: null,
        city: null,
        phoneNumber: null,
      },
      { transaction: transaction }
    );

    // Generate and send welcome email to employee
    const emailTemplate = generateWelcomeEmail({
      name,
      email,
      tempPassword: defaultPassword,
      department,
      role,
      managerName: manager.name, // Include manager name from the verified manager
    });

    // Send email to newly created employee
    const employeeEmail = email;

    // Send welcome email
    //! issue email sending commented for testing purposes
    // try {
    //   if (employeeEmail) {
    //     await sendEmail({
    //       to: employeeEmail,
    //       subject: emailTemplate.subject,
    //       text: emailTemplate.text,
    //       html: emailTemplate.html,
    //     });
    //   }
    // } catch (emailError) {
    //   console.warn(
    //     "Warning: Failed to send welcome email to employee:",
    //     emailError
    //   );
    //   // Continue with registration even if email fails
    // }
    //!not tested yet
    const notificationForNewUser = await Notification.create(
      {
        recipientId: newUser.id,
        senderId: null,
        type: "welcome_message",
        message: `Welcome to the team, ${newUser.name}!`,
      },
      { transaction: transaction }
    );
    await transaction.commit();

    return res.status(Messages.USER_REGISTERED.status).json({
      message: Messages.USER_REGISTERED.message,
      code: Messages.USER_REGISTERED.code,
      note: "User registered with default password 'TempPassword' - must be changed on first login",
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (transaction) {
      await transaction.rollback();
    }
    return res.status(Errors.INTERNAL_ERROR.status).json({
      error: Errors.INTERNAL_ERROR.error,
      code: Errors.INTERNAL_ERROR.code,
    });
  }
};

// Login Controller

const loginCont = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const now = new Date();
  const tokenExpirationMs = 2 * 60 * 60 * 1000; // 2 hours
  //check the user existance
  try {
    const user = await User.findOne({
      where: { email: email.toLowerCase() },
    });
    console.log("🔍 User found:", {
      email: user?.email,
      role: user?.role,
      tempPassword: user?.tempPassword,
    });
    const passwordFromDB = user?.password;
    // Compare SHA256-hashed password with bcrypt hash in DB
    const isMatch = passwordFromDB
      ? await bcrypt.compare(password, passwordFromDB)
      : false;

    // if user not found or wrong password
    if (!user || !isMatch) {
      return res.status(Errors.INVALID_CREDS.status).json({
        error: Errors.INVALID_CREDS.error,
        code: Errors.INVALID_CREDS.code,
      });
    }

    // if user is registered and not the first login
    // no need for  (user?.firstLogin) because user existence already checked
    if (isMatch && user.tempPassword === false) {
      await User.update({ lastLogin: now }, { where: { id: user.id } });
      res.clearCookie("token");
      const token = issueToken({
        userId: user.id,
        role: user.role,
        directManagerId: user.directManagerId,
      });
      res.cookie("token", token, {
        httpOnly: true, // JS can't read this cookie
        //secure: process.env.NODE_ENV === "production", // only HTTPS in prod
        secure: false, // for development over HTTP
        sameSite: "strict", // CSRF protection
        maxAge: tokenExpirationMs, // 2 hours
      });

      return res.status(Messages.LOGIN_SUCCESS.status).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          // Include all profile data needed by the frontend User type
          dateOfBirth: user.dateOfBirth,
          department: user.department,
          city: user.city,
          salary: user.salary,
          phoneNumber: user.phoneNumber,
          directManagerId: user.directManagerId,
          tempPassword: user.tempPassword, // Indicates password change required
        },
        message: Messages.LOGIN_SUCCESS.message,
        role: user.role,
      });
    }

    // user exists and first login changing password is required
    else if (isMatch && user.tempPassword === true) {
      //generate th vf code and send it to the user email
      const verificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      const SALT_ROUNDS = 10;

      // Hash the code with SHA256 first, then bcrypt (to match registration)
      const verificationCodeSha = createHash("sha256")
        .update(verificationCode)
        .digest("hex");
      const encryptedVerificationCode = await bcrypt.hash(
        verificationCodeSha,
        SALT_ROUNDS
      );

      await User.update(
        { encryptedVerificationCode: encryptedVerificationCode },
        { where: { email: email.toLowerCase() } }
      );
      const emailTemplate = generateVerificationCodeEmail({
        name: user.name,
        verificationCode: verificationCode,
      });
      //!issue email sending commented for testing purposes
      // await sendEmail({
      //   to: email,
      //   subject: emailTemplate.subject,
      //   text: emailTemplate.text,
      //   html: emailTemplate.html,
      // });
      console.log("Verification code sent to email:", verificationCode);
      return res.status(Messages.ACTION_REQUIRED.status).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          // Include all profile data needed by the frontend User type
          dateOfBirth: user.dateOfBirth,
          department: user.department,
          city: user.city,
          salary: user.salary,
          phoneNumber: user.phoneNumber,
          directManagerId: user.directManagerId,
          // tempPassword: user.tempPassword, // Indicates password change required
        },
        message: Messages.ACTION_REQUIRED.message,
        code: Messages.ACTION_REQUIRED.code,
        nextStep: Messages.ACTION_REQUIRED.nextStep,
      });
    } else {
      return res.status(Errors.INVALID_CREDS.status).json({
        error: Errors.INVALID_CREDS.error,
        code: Errors.INVALID_CREDS.code,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(Errors.INTERNAL_ERROR.status).json({
      error: Errors.INTERNAL_ERROR.error,
      code: Errors.INTERNAL_ERROR.code,
    });
  }
};

/// Verification Controller
export const verifyCont = async (req: Request, res: Response) => {
  const { email, code } = req.body;
  const tokenExpirationMs = 2 * 60 * 60 * 1000; // 2 hours
  try {
    const user = await User.findOne({
      where: { email: email.toLowerCase() },

      attributes: ["id", "encryptedVerificationCode", "tempPassword"], // Fetch only required fields
    });

    //Check if user exists or is already verified (Generic Security Response)
    if (!user || user.tempPassword === false) {
      return res.status(Errors.VERIFICATION_FAILED.status).json({
        error: Errors.VERIFICATION_FAILED.error,
        code: Errors.VERIFICATION_FAILED.code,
      });
    }

    const verificationHash = user.encryptedVerificationCode;

    // Check if a code hash is actually present (it might have expired or been cleared)
    if (!verificationHash) {
      return res.status(Errors.VERIFICATION_FAILED.status).json({
        error: Errors.VERIFICATION_FAILED.error,
        code: Errors.VERIFICATION_FAILED.code,
      });
    }

    // SECURE HASH COMPARISON
    // Hash the incoming code with SHA256 first (to match how it was stored)
    const incomingCodeSha = createHash("sha256").update(code).digest("hex");
    const isMatch = await bcrypt.compare(incomingCodeSha, verificationHash);

    if (isMatch) {
      await user.update({
        encryptedVerificationCode: null, // CLEAR HASH for security
      });
      const token = issueResetToken({
        userId: user.id,
        email: email.toLowerCase(),
      });
      res.cookie("reset_auth_token", token, {
        httpOnly: true, // JS can't read this cookie
        //secure: process.env.NODE_ENV === "production", // only HTTPS in prod
        secure: false, // for development over HTTP
        sameSite: "strict", // CSRF protection
        maxAge: tokenExpirationMs, //  hours
      });

      return res.status(Messages.VERIFICATION_SUCCESS.status).json({
        message: Messages.VERIFICATION_SUCCESS.message,
        code: Messages.VERIFICATION_SUCCESS.code,
        nextStep: Messages.VERIFICATION_SUCCESS.nextStep,
      });
    } else {
      // FAILURE: Log and return specific error
      console.warn(`Verification failed for ${email}: Code mismatch.`);
      return res.status(Errors.VERIFICATION_FAILED.status).json({
        error: Errors.VERIFICATION_FAILED.error,
        code: Errors.VERIFICATION_FAILED.code,
      });
    }
  } catch (err) {
    console.error("Verification error:", err);
    return res.status(Errors.INTERNAL_ERROR.status).json({
      error: Errors.INTERNAL_ERROR.error,
      code: Errors.INTERNAL_ERROR.code,
    });
  }
};

// Change Password Controller
const completeProfileCont = async (req: Request, res: Response) => {
  const {
    email,
    newPassword,
    confirmPassword,
    city,
    phoneNumber,
    dateOfBirth,
  } = req.body;
  const tokenExpirationMs = 2 * 60 * 60 * 1000; // 2 hours

  if (newPassword !== confirmPassword) {
    return res.status(Errors.PASSWORD_MISMATCH.status).json({
      error: Errors.PASSWORD_MISMATCH.error,
      code: Errors.PASSWORD_MISMATCH.code,
    });
  }
  try {
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(Errors.EMAIL_NOT_REGISTERED.status).json({
        error: Errors.EMAIL_NOT_REGISTERED.error,
        code: Errors.EMAIL_NOT_REGISTERED.code,
      });
    } else {
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await User.update(
        {
          password: hashedNewPassword,
          tempPassword: false,
          city: city,
          phoneNumber: phoneNumber,
          dateOfBirth: dateOfBirth,
        },
        { where: { id: user.id } }
      );

      // Clear the reset_auth_token and issue a normal token
      res.clearCookie("reset_auth_token");
      const token = issueToken({
        userId: user.id,
        role: user.role,
        directManagerId: user.directManagerId,
      });
      res.cookie("token", token, {
        httpOnly: true,
        secure: false, // for development over HTTP
        sameSite: "strict",
        maxAge: tokenExpirationMs,
      });
      //! the response used was PASSWORD_CHANGED - now it is PROFILE_UPDATED
      return res.status(Messages.PROFILE_UPDATED.status).json({
        message: Messages.PROFILE_UPDATED.message,
        code: Messages.PROFILE_UPDATED.code,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(Errors.INTERNAL_ERROR.status).json({
      error: Errors.INTERNAL_ERROR.error,
      code: Errors.INTERNAL_ERROR.code,
    });
  }
};

// // Forgot Password Controller
// const forgotPasswordCont = async (req: Request, res: Response) => {
//   console.log("hitting the forgot password controller");
//   const { email } = req.body;
//   try {
//     const user = await User.findOne({ where: { email: email.toLowerCase() } });
//     if (!user) {
//       console.log("Email not registered:", email);
//       return res.status(Errors.EMAIL_NOT_REGISTERED.status).json({
//         error: Errors.EMAIL_NOT_REGISTERED.message,
//         code: Errors.EMAIL_NOT_REGISTERED.code,
//       });
//     } else {
//       const verificationCode = Math.floor(
//         100000 + Math.random() * 900000
//       ).toString();
//       const resetCodeSha = require("crypto")
//         .createHash("sha256")
//         .update(verificationCode)
//         .digest("hex");
//       const encryptedVerificationCode = bcrypt.hashSync(resetCodeSha, 10);
//       await User.update(
//         { EncryptedVerificationCode: encryptedVerificationCode },
//         { where: { email: email.toLowerCase() } }
//       );
//       await sendEmail(
//         email,
//         "TechShop Account Password Reset",
//         `Hello ${user.name},\nYour new reset code is: ${verificationCode}\nPlease use this code to reset your password.\n\nBest regards,\nThe TechShop Team`
//       );
//     }
//     return res.status(Messages.PASSWORD_RESET_CODE_SENT.status).json({
//       message: Messages.PASSWORD_RESET_CODE_SENT.message,
//       code: Messages.PASSWORD_RESET_CODE_SENT.code,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(Errors.INTERNAL_ERROR.status).json({
//       error: Errors.INTERNAL_ERROR.message,
//       code: Errors.INTERNAL_ERROR.code,
//     });
//   }
// };
// // Change Password Controller
// const changePasswordCont = async (req: Request, res: Response) => {
//   const { email, newPassword } = req.body;
//   try {
//     const user = await User.findOne({ where: { email: email.toLowerCase() } });
//     if (!user) {
//       return res.status(Errors.EMAIL_NOT_REGISTERED.status).json({
//         error: Errors.EMAIL_NOT_REGISTERED.message,
//         code: Errors.EMAIL_NOT_REGISTERED.code,
//       });
//     } else {
//       const hashedNewPassword = await bcrypt.hash(newPassword, 10);
//       await User.update(
//         { password: hashedNewPassword },
//         { where: { email: email.toLowerCase() } }
//       );
//       return res.status(Messages.PASSWORD_CHANGED_SUCCESSFULLY.status).json({
//         message: Messages.PASSWORD_CHANGED_SUCCESSFULLY.message,
//         code: Messages.PASSWORD_CHANGED_SUCCESSFULLY.code,
//       });
//     }
//   } catch (err) {
//     console.error(err);
//     res.status(Errors.INTERNAL_ERROR.status).json({
//       error: Errors.INTERNAL_ERROR.message,
//       code: Errors.INTERNAL_ERROR.code,
//     });
//   }
// };
// export const getUserInfo = async (req: Request, res: Response) => {
//   const userId = (req as any).user?.userId;
//   try {
//     const user = await User.findByPk(userId, {
//       attributes: ["name", "phoneNumber", "email"],
//     });
//     if (!user) {
//       return res.status(Errors.USER_NOT_FOUND.status).json({
//         error: Errors.USER_NOT_FOUND.message,
//         code: Errors.USER_NOT_FOUND.code,
//       });
//     }
//     return res.status(Messages.USER_FOUND.status).json({
//       name: user.name,
//       phoneNumber: user.phoneNumber,
//       email: user.email,
//       code: Messages.USER_FOUND.code,
//       message: Messages.USER_FOUND.message,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(Errors.INTERNAL_ERROR.status).json({
//       error: Errors.INTERNAL_ERROR.message,
//       code: Errors.INTERNAL_ERROR.code,
//     });
//   }
// };

// export const getUserAddresses = async (req: Request, res: Response) => {
//   const userId = (req as any).user?.userId;
//   try {
//     const addresses = await Address.findAll({
//       where: { userId },
//       attributes: [
//         "id",
//         "userId",
//         "street",
//         "city",
//         "state",
//         "postalCode",
//         "country",
//         "isDefault",
//       ],
//     });
//     return res.status(Messages.ADDRESSES_FETCHED.status).json({
//       addresses,
//       code: Messages.ADDRESSES_FETCHED.code,
//       message: Messages.ADDRESSES_FETCHED.message,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(Errors.INTERNAL_ERROR.status).json({
//       error: Errors.INTERNAL_ERROR.message,
//       code: Errors.INTERNAL_ERROR.code,
//     });
//   }
// };

// export const addaddressCont = async (req: Request, res: Response) => {
//   const userId = (req as any).user?.userId;
//   const {
//     street,
//     city,
//     state,
//     postalCode,
//     country,
//     isDefault,
//     building,
//     floor,
//     apartment,
//   } = req.body;

//   if (
//     !street ||
//     !city ||
//     !state ||
//     !postalCode ||
//     !country ||
//     !building ||
//     !floor
//   ) {
//     return res.status(Errors.INVALID_ADDRESS_DATA.status).json({
//       error: Errors.INVALID_ADDRESS_DATA.message,
//       code: Errors.INVALID_ADDRESS_DATA.code,
//     });
//   }

//   if (!userId) {
//     return res.status(Errors.USER_NOT_FOUND.status).json({
//       error: Errors.USER_NOT_FOUND.message,
//       code: Errors.USER_NOT_FOUND.code,
//     });
//   }

//   try {
//     const newAddress = await Address.create({
//       building,
//       floor,
//       apartment,
//       userId,
//       street,
//       city,
//       state,
//       postalCode,
//       country,
//       isDefault,
//     });
//     return res.status(Messages.ADDRESS_ADDED.status).json({
//       message: Messages.ADDRESS_ADDED.message,
//       code: Messages.ADDRESS_ADDED.code,
//       data: newAddress,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(Errors.INTERNAL_ERROR.status).json({
//       error: Errors.INTERNAL_ERROR.message,
//       code: Errors.INTERNAL_ERROR.code,
//     });
//   }
// };

// export const authStatus = async (req: Request, res: Response) => {
//   try {
//     if ((req as any).user?.userId) {
//       return res.status(200).json({ isLoggedIn: true });
//     } else {
//       return res.status(200).json({ isLoggedIn: false });
//     }
//   } catch (err) {
//     return res.status(200).json({ isLoggedIn: false });
//   }
// };

export default {
  registrationContbyAdmin,
  loginCont,
  verifyCont,
  completeProfileCont,

  //   forgotPasswordCont,
  //   getUserInfo,
  //   getUserAddresses,
  //   addaddressCont,
  //   authStatus,
};

/**
 * Expected Request Body for registrationContbyAdmin:

    {
    "name": "Alex Johnson",
    "email": "alex.johnson@taskyapp.com",
    "dateOfBirth": "1995-08-15",         
    "phoneNumber": "01001234567",         
    "city": "Cairo",
    "department": "Development",
    "role": "manager",
    "directManagerId": 1  
    }

 */
