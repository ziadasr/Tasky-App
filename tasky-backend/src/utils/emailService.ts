import axios from "axios";

interface MailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const mailtrapApi = axios.create({
  baseURL: process.env.MAILTRAP_API_URL || "https://sandbox.smtp.mailtrap.io",
  headers: {
    Authorization: `Bearer ${process.env.MAILTRAP_API_TOKEN!}`,
    "Content-Type": "application/json",
  },
});

export const sendEmail = async ({ to, subject, text, html }: MailParams) => {
  const fromEmail = process.env.EMAIL_FROM!;

  const mailPayload = {
    from: {
      email: fromEmail.match(/<([^>]+)>/)?.[1] || "noreply@tasky.local",
      name: fromEmail.match(/^([^<]+)/)?.[1] || "Tasky Support",
    },
    to: [{ email: to }],
    subject,
    text,
    html,
  };

  try {
    const response = await mailtrapApi.post("/api/send", mailPayload);
    console.log(
      `✅ Email sent successfully. ID: ${response.data.message_ids[0]}`
    );
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("API Response Data:", error.response.data);
      throw new Error(
        `Failed to send email: ${error.response.status} - ${error.response.statusText}`
      );
    }
    throw new Error("An unknown error occurred during email sending.");
  }
};
