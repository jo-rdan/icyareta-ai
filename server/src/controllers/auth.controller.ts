import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { OtpService } from "../services/ui/otp.service";
import { JwtService } from "../services/ui/jwt.service";
import { EmailService } from "../services/ui/email.service";

const userService = new UserService();
const otpService = new OtpService();
const jwtService = new JwtService();
const emailService = new EmailService();
// const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/v1/auth/request-otp
 * Body: { email: string }
 * Sends a 4-digit OTP to the provided email address.
 */
export const requestOtp = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email } = req.body;

  if (!email || typeof email !== "string" || !email.includes("@")) {
    res.status(400).json({ error: "A valid email address is required" });
    return;
  }

  const normalized = email.trim().toLowerCase();
  const code = otpService.generate(normalized);

  try {
    await emailService.sendOtp(normalized, code);
  } catch (err) {
    console.error("Email OTP send failed:", err);
  }

  res.json({ success: true, message: "OTP sent to your email" });
};

/**
 * POST /api/v1/auth/verify-otp
 * Body: { email: string, code: string, phoneNumber?: string }
 * Verifies OTP and returns JWT + user.
 * phoneNumber is optional — stored for MoMo payments.
 */
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  const { email, code, phoneNumber } = req.body;

  if (!email || !code) {
    res.status(400).json({ error: "email and code are required" });
    return;
  }

  const normalized = email.trim().toLowerCase();
  const valid = otpService.verify(normalized, code);

  if (!valid) {
    res.status(401).json({ error: "Invalid or expired code" });
    return;
  }

  const user = await userService.findOrCreateUserByEmail(
    normalized,
    phoneNumber,
  );
  const token = jwtService.sign({
    userId: user.id,
    phoneNumber: user.phoneNumber ?? "",
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      hasUsedFreeTrial: user.hasUsedFreeTrial,
    },
  });
};
