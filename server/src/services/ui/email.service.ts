import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
});

export class EmailService {
  /**
   * Sends an OTP verification email.
   * Uses a clean branded template.
   */
  async sendOtp(email: string, code: string): Promise<void> {
    const emailOptions = {
      from: "Icyareta <onboarding@resend.dev>",
      to: email,
      subject: `Your Icyareta verification code: ${code}`,
      text: `Your Icyareta verification code is: ${code}\n\nThis code expires in 5 minutes.\n\nIf you did not request this, you can ignore this email.`,
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f5f3ee;">
          <div style="background: linear-gradient(160deg, #072a16, #1a6b3c); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
            <h1 style="font-family: Arial, sans-serif; color: white; font-size: 28px; font-weight: 800; letter-spacing: -1px; margin: 0 0 8px 0;">
              Icyareta
            </h1>
            <p style="color: rgba(255,255,255,0.7); font-size: 14px; margin: 0;">
              P6 Exam Preparation — Rwanda
            </p>
          </div>
          <div style="background: white; border-radius: 16px; padding: 32px; text-align: center;">
            <p style="color: #374151; font-size: 15px; margin: 0 0 24px 0;">
              Your verification code is:
            </p>
            <div style="background: #f5f3ee; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <span style="font-family: Arial, sans-serif; font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #1a6b3c;">
                ${code}
              </span>
            </div>
            <p style="color: #9ca3af; font-size: 13px; margin: 0;">
              This code expires in <strong>5 minutes</strong>.<br/>
              If you did not request this, you can safely ignore this email.
            </p>
          </div>
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
            © 2026 Icyareta · Kigali, Rwanda
          </p>
        </div>
      `,
    };
    await transporter.sendMail(emailOptions);
  }
}

// const resend = new Resend(process.env.RESEND_API_KEY);

// export const sendEmail = async (email: string) => {
//   const { data, error } = await resend.emails.send({
//     from: "Acme <onboarding@resend.dev>",
//     to: [email],
//     subject: "Hello World",
//     html: "<strong>It works!</strong>",
//   });

//   if (error) {
//     return error;
//   }
//   console.log("tk", data, error);
//   return data;
// };
