import * as dotenv from "dotenv";

dotenv.config();

// eslint-disable-next-line @typescript-eslint/no-require-imports
const AfricasTalking = require("africastalking");

const at = AfricasTalking({
  apiKey: process.env.AT_API_KEY!,
  username: process.env.AT_USERNAME!,
});

const sms = at.SMS;

export class SmsService {
  /**
   * Formats a phone number to international format.
   * Rwanda: 07XXXXXXXX → +2507XXXXXXXX
   */
  private formatPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.startsWith("+")) return phoneNumber;
    if (phoneNumber.startsWith("07")) return `+250${phoneNumber.slice(1)}`;
    if (phoneNumber.startsWith("250")) return `+${phoneNumber}`;
    return phoneNumber;
  }

  /**
   * Core send method. All other methods call this.
   * Logs failures without throwing — SMS is best-effort,
   * it should never crash the main quiz flow.
   */
  private async send(phoneNumber: string, message: string): Promise<void> {
    try {
      await sms.send({
        to: [this.formatPhoneNumber(phoneNumber)],
        message,
        from: process.env.AT_SENDER_ID || undefined,
      });
    } catch (error: any) {
      console.error(`SMS send failed to ${phoneNumber}:`, error.message);
    }
  }

  /**
   * Public raw send — used by auth OTP and any ad-hoc messages.
   */
  async sendRaw(phoneNumber: string, message: string): Promise<void> {
    await this.send(phoneNumber, message);
  }

  /**
   * Sent immediately after a successful purchase.
   */
  async sendPaymentConfirmation(
    phoneNumber: string,
    packLabel: string,
    subjectName: string,
    amountPaid: number,
    expiresAt: Date,
  ): Promise<void> {
    const expiryTime = expiresAt.toLocaleTimeString("en-RW", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const message =
      `Icyareta: Payment confirmed! ${amountPaid.toLocaleString()} RWF for ${packLabel} (${subjectName}). ` +
      `Access valid until ${expiryTime}. Dial again to start your quiz. Good luck!`;
    await this.send(phoneNumber, message);
  }

  /**
   * Sent after quiz completion. Includes score and weak topics.
   */
  async sendPerformanceReport(
    phoneNumber: string,
    subjectName: string,
    packLabel: string,
    score: number,
    total: number,
    percentage: number,
  ): Promise<void> {
    const emoji = percentage >= 60 ? "✅" : "❌";
    const message =
      `Icyareta Results ${emoji}: ${subjectName} (${packLabel}) — ${score}/${total} (${percentage}%). ` +
      (percentage >= 60
        ? "Well done! Keep practicing to maintain your score."
        : "Keep going! Dial again to practice your weak areas.");
    await this.send(phoneNumber, message);
  }

  /**
   * Sent 5 minutes after a low-scoring session (below 60%).
   */
  async sendUpsellMessage(
    phoneNumber: string,
    subjectName: string,
    currentPack: string,
    upgradePack: string,
    upgradePrice: number,
  ): Promise<void> {
    const message =
      `Icyareta: Your ${subjectName} score was low on ${currentPack}. ` +
      `Upgrade to ${upgradePack} for ${upgradePrice.toLocaleString()} RWF and get harder practice questions. Dial again to upgrade!`;
    await this.send(phoneNumber, message);
  }

  /**
   * Weekly digest — called on Sunday evenings for active users.
   */
  async sendWeeklyDigest(
    phoneNumber: string,
    totalSessions: number,
    bestSubject: string,
    weakSubject: string,
  ): Promise<void> {
    const message =
      `Icyareta Weekly: You completed ${totalSessions} session(s) this week. ` +
      `Strongest: ${bestSubject}. Needs work: ${weakSubject}. Keep going — exam day is coming!`;
    await this.send(phoneNumber, message);
  }
}
