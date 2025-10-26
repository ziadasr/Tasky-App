//this file contains email templates used in the application
//this interface defines the data needed to generate the welcome email
interface WelcomeEmailData {
  name: string;
  email: string;
  tempPassword: string;
  department: string;
  role: string;
  managerName?: string;
}

export const generateWelcomeEmail = ({
  name,
  email,
  tempPassword,
  department,
  role,
  managerName,
}: WelcomeEmailData) => {
  return {
    subject: "Welcome to Tasky! 🚀 Your Account is Ready",
    text: `Hello ${name},

Welcome to Tasky! We're excited to have you on board.

Your account has been successfully created and is ready to use. Here's what you need to do to get started:

GETTING STARTED STEPS:
1. Log in to Tasky with your credentials (see below)
2. On your first login, you'll be prompted to set a new password for security
3. Complete your profile and start managing tasks
4. Connect with your team and begin collaborating

YOUR ACCOUNT DETAILS:
Name: ${name}
Email: ${email}
Department: ${department}
Role: ${role}
${managerName ? `Your Manager: ${managerName}` : ""}

YOUR LOGIN CREDENTIALS:
Email: ${email}
Temporary Password: ${tempPassword}

IMPORTANT SECURITY NOTE:
⚠️ You MUST change your password on your first login. This temporary password is for initial access only.

If you have any questions or need assistance, please don't hesitate to contact your manager or the support team.

Welcome to the team!

Best regards,
The Tasky Team`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Tasky</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #374151; 
            margin: 0; 
            padding: 0; 
            background-color: #f3f4f6; 
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            padding: 40px; 
            border-radius: 12px; 
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); 
          }
          .logo { 
            text-align: center; 
            margin-bottom: 30px; 
          }
          .logo h1 { 
            font-size: 48px; 
            font-weight: 800; 
            color: #4f46e5; 
            letter-spacing: -0.05em; 
            margin: 0; 
            font-family: inherit; 
          }
          .welcome-header { 
            text-align: center;
            font-size: 24px; 
            font-weight: 600; 
            color: #1f2937; 
            margin: 20px 0 10px 0; 
          }
          .welcome-subheader { 
            text-align: center;
            font-size: 16px; 
            color: #6b7280; 
            margin-bottom: 30px;
          }
          .content { 
            font-size: 16px; 
            line-height: 1.7; 
            margin-bottom: 25px; 
            color: #374151;
          }
          .section-title { 
            font-size: 18px; 
            font-weight: 700; 
            color: #1f2937; 
            margin: 25px 0 15px 0; 
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 10px;
          }
          .steps { 
            background-color: #f9fafb; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #4f46e5; 
            margin: 20px 0;
          }
          .step { 
            margin: 12px 0; 
            display: flex;
            align-items: flex-start;
          }
          .step-number { 
            background-color: #4f46e5; 
            color: white; 
            width: 28px; 
            height: 28px; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-weight: 700; 
            margin-right: 12px; 
            flex-shrink: 0;
          }
          .step-text { 
            color: #374151;
          }
          .user-details { 
            background-color: #eef2ff; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #4f46e5; 
            margin: 20px 0;
          }
          .detail-row { 
            margin: 10px 0; 
            display: flex;
            justify-content: space-between;
          }
          .detail-label { 
            font-weight: 600; 
            color: #1f2937; 
          }
          .detail-value { 
            color: #4f46e5; 
          }
          .credentials-box { 
            background-color: #fef3c7; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #f59e0b; 
            margin: 20px 0;
          }
          .credentials-title { 
            font-size: 16px;
            font-weight: 700; 
            color: #92400e; 
            margin-bottom: 15px;
          }
          .credential-item { 
            margin: 10px 0; 
          }
          .credential-label { 
            font-weight: 600; 
            color: #92400e; 
          }
          .credential-value { 
            color: #92400e; 
            font-family: 'Monaco', 'Consolas', monospace; 
            background-color: #fffbeb; 
            padding: 6px 10px; 
            border-radius: 4px; 
            display: inline-block;
            word-break: break-all;
          }
          .warning { 
            background-color: #fee2e2; 
            color: #7f1d1d; 
            padding: 15px; 
            border-radius: 8px; 
            border-left: 4px solid #dc2626; 
            margin: 20px 0; 
            font-weight: 500; 
          }
          .warning-icon {
            font-weight: 700;
            margin-right: 8px;
          }
          .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb; 
            color: #6b7280; 
            font-size: 14px; 
            text-align: center; 
          }
          .cta-section {
            text-align: center;
            margin: 30px 0;
          }
          .cta-button {
            background-color: #4f46e5;
            color: white;
            padding: 12px 30px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            display: inline-block;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h1>Tasky.</h1>
          </div>
          
          <h2 class="welcome-header">Welcome to Tasky, ${name}! 🚀</h2>
          <p class="welcome-subheader">Your account is ready to use</p>
          
          <p class="content">
            We're excited to have you join the Tasky team! Your account has been successfully created and you're ready to start working efficiently and collaborating with your team.
          </p>
          
          <div class="section-title">🎯 Getting Started - Quick Steps</div>
          <div class="steps">
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-text"><strong>Log in</strong> to Tasky using your credentials below</div>
            </div>
            <div class="step">
              <div class="step-number">2</div>
              <div class="step-text"><strong>Set your password</strong> - On first login, you'll be asked to create a secure password</div>
            </div>
            <div class="step">
              <div class="step-number">3</div>
              <div class="step-text"><strong>Complete your profile</strong> - Make sure your information is up to date</div>
            </div>
            <div class="step">
              <div class="step-number">4</div>
              <div class="step-text"><strong>Start collaborating</strong> - Begin managing tasks and working with your team</div>
            </div>
          </div>

          <div class="section-title">👤 Your Account Information</div>
          <div class="user-details">
            <div class="detail-row">
              <span class="detail-label">Name:</span>
              <span class="detail-value">${name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email:</span>
              <span class="detail-value">${email}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Department:</span>
              <span class="detail-value">${department}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Role:</span>
              <span class="detail-value">${role}</span>
            </div>
            ${
              managerName
                ? `
            <div class="detail-row">
              <span class="detail-label">Your Manager:</span>
              <span class="detail-value">${managerName}</span>
            </div>
            `
                : ""
            }
          </div>

          <div class="section-title">🔐 Login Credentials</div>
          <div class="credentials-box">
            <div class="credentials-title">Use these credentials to log in:</div>
            <div class="credential-item">
              <span class="credential-label">Email:</span><br>
              <span class="credential-value">${email}</span>
            </div>
            <div class="credential-item">
              <span class="credential-label">Temporary Password:</span><br>
              <span class="credential-value">${tempPassword}</span>
            </div>
          </div>
          
          <div class="warning">
            <span class="warning-icon">⚠️</span>
            <strong>IMPORTANT:</strong> You MUST change your password immediately on your first login. This temporary password is for initial access only and for security purposes.
          </div>
          
          <p class="content">
            If you have any questions or need assistance getting started, please don't hesitate to reach out to your manager or the support team. We're here to help!
          </p>
          
          <div class="footer">
            Best regards,<br>
            <strong>The Tasky Team</strong><br>
            <br>
            <small>This is an automated message. Please do not reply to this email.</small>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

// Interface for verification code email
interface VerificationCodeEmailData {
  name: string;
  verificationCode: string;
}

export const generateVerificationCodeEmail = ({
  name,
  verificationCode,
}: VerificationCodeEmailData) => {
  return {
    subject: "Your Tasky Verification Code 🔐",
    text: `Hello ${name},

Your verification code is: ${verificationCode}

This code is valid for 10 minutes. Please use this code to complete your action.

If you didn't request this code, please ignore this email.

Best regards,
The Tasky Team`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tasky - Verification Code</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #374151; 
            margin: 0; 
            padding: 0; 
            background-color: #f3f4f6; 
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            padding: 40px; 
            border-radius: 12px; 
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); 
          }
          .logo { 
            text-align: center; 
            margin-bottom: 30px; 
          }
          .logo h1 { 
            font-size: 48px; 
            font-weight: 800; 
            color: #4f46e5; 
            letter-spacing: -0.05em; 
            margin: 0; 
            font-family: inherit; 
          }
          .greeting { 
            font-size: 20px; 
            font-weight: 600; 
            color: #1f2937; 
            margin: 20px 0 10px 0; 
          }
          .content { 
            font-size: 16px; 
            line-height: 1.7; 
            margin: 20px 0; 
            color: #374151;
          }
          .verification-section { 
            text-align: center;
            margin: 40px 0; 
          }
          .verification-label { 
            font-size: 14px; 
            font-weight: 600; 
            color: #6b7280; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
            margin-bottom: 15px;
          }
          .verification-code { 
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white; 
            font-size: 40px; 
            font-weight: 800; 
            letter-spacing: 8px; 
            padding: 30px 20px; 
            border-radius: 12px; 
            font-family: 'Monaco', 'Courier New', monospace; 
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
          }
          .code-expiry { 
            background-color: #fef3c7; 
            color: #92400e; 
            padding: 15px; 
            border-radius: 8px; 
            border-left: 4px solid #f59e0b; 
            margin: 20px 0; 
            font-weight: 500; 
            font-size: 14px;
          }
          .security-notice { 
            background-color: #fee2e2; 
            color: #7f1d1d; 
            padding: 15px; 
            border-radius: 8px; 
            border-left: 4px solid #dc2626; 
            margin: 20px 0; 
            font-size: 14px;
          }
          .security-notice strong {
            display: block;
            margin-bottom: 5px;
          }
          .divider { 
            height: 1px; 
            background-color: #e5e7eb; 
            margin: 30px 0; 
          }
          .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb; 
            color: #6b7280; 
            font-size: 13px; 
            text-align: center; 
          }
          .footer-text {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h1>Tasky.</h1>
          </div>
          
          <p class="greeting">Hello ${name},</p>
          
          <p class="content">
            We've received a request to verify your identity. Please use the verification code below to complete this action.
          </p>
          
          <div class="verification-section">
            <div class="verification-label">🔐 Your Verification Code</div>
            <div class="verification-code">${verificationCode}</div>
          </div>

          <div class="security-notice">
            <strong>⚠️ Security Notice:</strong>
            Never share this code with anyone. Tasky support will never ask you for your verification code.
          </div>

          <p class="content">
            If you didn't request this verification code, you can safely ignore this email. Your account remains secure.
          </p>

          <div class="divider"></div>

          <p class="content" style="font-size: 14px; color: #6b7280;">
            Need help? Contact our support team if you have any questions.
          </p>
          
          <div class="footer">
            <div class="footer-text">Best regards,</div>
            <div class="footer-text"><strong>The Tasky Team</strong></div>
            <br>
            <div class="footer-text"><small>This is an automated message. Please do not reply to this email.</small></div>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};
