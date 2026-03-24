// In-memory OTP store — sufficient for launch scale
// Key: identifier (email or phoneNumber), Value: { code, expiresAt }
const otpStore = new Map<string, { code: string; expiresAt: number }>();

export class OtpService {
  /**
   * Generates a 4-digit OTP and stores it for 5 minutes.
   */
  generate(identifier: string): string {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore.set(identifier, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });
    return code;
  }

  /**
   * Verifies an OTP. Deletes it on success to prevent reuse.
   */
  verify(identifier: string, code: string): boolean {
    const entry = otpStore.get(identifier);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      otpStore.delete(identifier);
      return false;
    }
    if (entry.code !== code) return false;
    otpStore.delete(identifier);
    return true;
  }
}
