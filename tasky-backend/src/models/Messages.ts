export const Messages = {
  USER_REGISTERED: {
    code: "USER_REGISTERED",
    status: 200,
    message: "User registered successfully, please verify your email",
  },
  ACTION_REQUIRED: {
    status: 202,
    message:
      "Login successful. Password change required. Verification code sent.",
    code: "PASSWORD_CHANGE_REQUIRED",
    nextStep:
      "A temporary code has been sent to your email to verify identity for the forced password change.",
  },
  LOGIN_SUCCESS: {
    code: "LOGIN_SUCCESS",
    status: 200,
    message: "Login successful",
  },
  PASSWORD_CHANGED: {
    code: "PASSWORD_CHANGED",
    status: 200,
    message: "Password changed successfully",
  },
  VERIFICATION_SUCCESS: {
    code: "VERIFICATION_SUCCESS",
    status: 200,
    message: "Verification code accepted successfully",
    nextStep: "CHANGE_PASSWORD",
  },
};
