import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { OtpService } from "../services/ui/otp.service";
import { JwtService } from "../services/ui/jwt.service";
import { EmailService } from "../services/ui/email.service";

const userService = new UserService();
const otpService = new OtpService();
const jwtService = new JwtService();
const emailService = new EmailService();

/**
 * POST /api/auth/request-otp
 * Body: { email }
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
    // Don't fail the request — OTP still works, user just may not get email
  }

  res.json({ success: true });
};

/**
 * POST /api/auth/verify-otp
 * Body: { email, code, childName? }
 * childName is captured here on first signup and stored on the user record.
 */
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  const { email, code, childName } = req.body;

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
    undefined,
    childName,
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
      childName: user.childName,
      hasUsedFreeTrial: user.hasUsedFreeTrial,
    },
  });
};
