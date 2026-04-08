const otpStore = new Map<string, { code: string; expiresAt: number }>();

export class OtpService {
  generate(identifier: string): string {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore.set(identifier, { code, expiresAt: Date.now() + 5 * 60 * 1000 });

    // Always log to stdout — useful for local dev when email is not configured
    console.log(`\n  🔑 OTP for ${identifier}: ${code}\n`);

    return code;
  }

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
