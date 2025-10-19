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
import { generateWelcomeEmail } from "../templates/emailTemplates.js";

const registrationContbyAdmin = async (req: Request, res: Response) => {
  //the pass is constant and set by user at the first login so not includded in the req
  //first login is false bydefault untill the user logins for the first time
  //lastlogin is handeled by the db
  const {
    name,
    email,
    dateOfBirth,
    phoneNumber,
    city,
    department,
    role,
    directManagerId,
  } = req.body;
  console.log("Request Body:", req.body);
  console.log("Direct Manager ID:", directManagerId);

  // Set default password that user must change on first login
  const defaultPassword = "TempPassword";

  let transaction: Transaction | undefined;
  //check if the user already exists
  try {
    transaction = await sequelize.transaction();

    // Verify that directManagerId refers to an existing admin
    const manager = await User.findByPk(directManagerId, { transaction });
    console.log("Manager found:", manager);
    console.log("Manager role:", manager?.role);
    console.log("Manager role type:", typeof manager?.role);

    if (!manager) {
      return res.status(Errors.UNAUTHORIZED.status).json({
        error: "Manager not found",
        code: Errors.UNAUTHORIZED.code,
      });
    }

    if (manager.role !== "admin") {
      console.log(
        "Manager role check failed. Expected 'admin', got:",
        manager.role
      );
      return res.status(Errors.UNAUTHORIZED.status).json({
        error: Errors.UNAUTHORIZED.error,
        code: Errors.UNAUTHORIZED.code,
      });
    }
    const existingUser = await User.findOne({
      where: { email: email.toLowerCase() },
      transaction: transaction,
    });
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

    await User.create(
      {
        name: name,
        email: email.toLowerCase(),
        password: hashedPassword,
        dateOfBirth: dateOfBirth,
        phoneNumber: phoneNumber,
        department: department,
        encryptedVerificationCode: encryptedVerificationCode,
        city: city,
        role: role,
        directManagerId: directManagerId,
        firstLogin: true, // User hasn't logged in yet
        lastLogin: null, // No login yet
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
      dateOfBirth,
      phoneNumber,
      managerName: manager.name, // Include manager name from the verified manager
    });

    // Send email to newly created employee
    const employeeEmail = email;

    try {
      if (employeeEmail) {
        await sendEmail({
          to: employeeEmail,
          subject: emailTemplate.subject,
          text: emailTemplate.text,
          html: emailTemplate.html,
        });
      }
    } catch (emailError) {
      console.warn(
        "Warning: Failed to send welcome email to employee:",
        emailError
      );
      // Continue with registration even if email fails
    }

    await transaction.commit();

    return res.status(200).json({
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

// // Verification Controller
// const verifyCont = async (req: Request, res: Response) => {
//   try {
//     const { email, code } = req.body; // code is SHA256 hashed from frontend

//     const user = await User.findOne({
//       where: { email: email.toLowerCase() },
//     });

//     const verification_token = user?.EncryptedVerificationCode;

//     if (!verification_token) {
//       return res.status(Errors.INVALID_EMAIL.status).json({
//         error: Errors.INVALID_EMAIL.message,
//         code: Errors.INVALID_EMAIL.code,
//       });
//     }

//     const codeSha = code;
//     const ismatch = await bcrypt.compare(codeSha, verification_token);

//     if (ismatch) {
//       await User.update(
//         { isVerified: true },
//         { where: { email: email.toLowerCase() } }
//       );
//       return res.status(200).json({
//         message: Messages.EMAIL_VERIFIED.message,
//         code: Messages.EMAIL_VERIFIED.code,
//       });
//     } else {
//       console.error(
//         "Verification failed: Code does not match.",
//         code,
//         verification_token
//       );
//       return res.status(Errors.VERIFICATION_FAILED.status).json({
//         error: Errors.VERIFICATION_FAILED.message,
//         code: Errors.VERIFICATION_FAILED.code,
//       });
//     }
//   } catch (err) {
//     console.error("Verification error:", err);
//     return res.status(Errors.INTERNAL_ERROR.status).json({
//       error: Errors.INTERNAL_ERROR.message,
//       code: Errors.INTERNAL_ERROR.code,
//     });
//   }
// };

// // Login Controller
// const loginCont = async (req: Request, res: Response) => {
//   try {
//     const { email, password } = req.body; // password is SHA256 hashed from frontend

//     const user = await User.findOne({
//       where: { email: email.toLowerCase() },
//     });

//     const passwordFromDB = user?.password;

//     // if user not found
//     if (!passwordFromDB) {
//       return res.status(Errors.EMAIL_NOT_REGISTERED.status).json({
//         error: Errors.EMAIL_NOT_REGISTERED.message,
//         code: Errors.EMAIL_NOT_REGISTERED.code,
//       });
//     }

//     // Compare SHA256-hashed password with bcrypt hash in DB
//     const isMatch = await bcrypt.compare(password, passwordFromDB);

//     // user exists and account is verified
//     if (isMatch && user?.isVerified) {
//       const token = jwtController.issueToken({
//         userId: user.id,
//         role: "customer",
//       });
//       console.log("Generated JWT:", token);

//       res.cookie("token", token, {
//         httpOnly: true, // JS can't read this cookie
//         //secure: process.env.NODE_ENV === "production", // only HTTPS in prod
//         secure: false, // for development over HTTP
//         sameSite: "strict", // CSRF protection
//         maxAge: 2 * 60 * 60 * 1000, // 2 hours
//       });

//       return res.status(200).json({ message: Messages.LOGIN_SUCCESS.message });
//     }

//     // user exists but not verified
//     else if (isMatch && !user?.isVerified) {
//       const verificationCode = Math.floor(
//         100000 + Math.random() * 900000
//       ).toString();
//       const verificationCodeSha = require("crypto")
//         .createHash("sha256")
//         .update(verificationCode)
//         .digest("hex");
//       const encryptedVerificationCode = bcrypt.hashSync(
//         verificationCodeSha,
//         10
//       );
//       await User.update(
//         { EncryptedVerificationCode: encryptedVerificationCode },
//         { where: { email: email.toLowerCase() } }
//       );
//       await sendEmail(
//         email,
//         "TechShop Account Verification",
//         `Hello ${user.name},\nYour new verification code is: ${verificationCode}\nPlease use this code to verify your account.\n\nBest regards,\nThe TechShop Team`
//       );

//       return res.status(Errors.EMAIL_NOT_VERIFIED.status).json({
//         error: Errors.EMAIL_NOT_VERIFIED.message,
//         code: Errors.EMAIL_NOT_VERIFIED.code,
//       });
//     } else {
//       return res.status(Errors.WRONG_PASSWORD.status).json({
//         error: Errors.WRONG_PASSWORD.message,
//         code: Errors.WRONG_PASSWORD.code,
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
  //   verifyCont,
  //   loginCont,
  //   forgotPasswordCont,
  //   changePasswordCont,
  //   getUserInfo,
  //   getUserAddresses,
  //   addaddressCont,
  //   authStatus,
};
