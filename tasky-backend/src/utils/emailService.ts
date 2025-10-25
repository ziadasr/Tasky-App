import nodemailer from "nodemailer";

interface MailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// ========== MAILTRAP CONFIGURATION (COMMENTED OUT - REACHED FREE LIMIT) ==========
// import axios from "axios";
// const mailtrapApi = axios.create({
//   baseURL: process.env.MAILTRAP_API_URL || "https://sandbox.smtp.mailtrap.io",
//   headers: {
//     Authorization: `Bearer ${process.env.MAILTRAP_API_TOKEN!}`,
//     "Content-Type": "application/json",
//   },
// });

// ========== CUSTOM EMAIL CONFIGURATION USING NODEMAILER ==========
// Create transporter with your own email credentials
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_PORT === "465", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendEmail = async ({ to, subject, text, html }: MailParams) => {
  const fromEmail = process.env.EMAIL_FROM!;

  try {
    // Send email using nodemailer
    const info = await transporter.sendMail({
      from: fromEmail,
      to,
      subject,
      text,
      html,
    });

    console.log(`✅ Email sent successfully. ID: ${info.messageId}`);
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    throw new Error(
      `Failed to send email: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
