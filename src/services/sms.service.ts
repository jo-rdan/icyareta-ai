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
   * Sent immediately after a successful purchase.
   * Confirms the payment and tells the user to dial again.
   *
   * Triggered by: payment confirmation step in navigation service
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
      `Icyareta: Payment confirmed! ` +
      `${packLabel} - ${subjectName} (${amountPaid.toLocaleString()} RWF). ` +
      `Dial *same code# to start your quiz. ` +
      `Valid until ${expiryTime} today.`;

    await this.send(phoneNumber, message);
  }

  /**
   * Sent after every completed quiz session.
   * Includes score and a simple encouraging message.
   *
   * Triggered by: showScore() in navigation service
   */
  async sendPerformanceReport(
    phoneNumber: string,
    subjectName: string,
    packLabel: string,
    score: number,
    total: number,
    percentage: number,
  ): Promise<void> {
    const performance =
      percentage >= 80
        ? "Excellent work!"
        : percentage >= 60
          ? "Good job! Keep practicing."
          : "Keep going! Practice makes perfect.";

    const message =
      `Icyareta Results: ${subjectName} (${packLabel})\n` +
      `Score: ${score}/${total} (${percentage}%)\n` +
      `${performance} Dial again to keep practicing.`;

    await this.send(phoneNumber, message);
  }

  /**
   * Sent 5 minutes after session completion if score is below 60%.
   * Encourages the student to try again with a higher pack.
   *
   * Triggered by: a setTimeout in the navigation service after showScore()
   */
  async sendUpsellMessage(
    phoneNumber: string,
    subjectName: string,
    currentPackLabel: string,
    nextPackLabel: string,
    nextPackPrice: number,
  ): Promise<void> {
    const message =
      `Icyareta: Your child needs more practice in ${subjectName}. ` +
      `Upgrade to ${nextPackLabel} (${nextPackPrice.toLocaleString()} RWF) ` +
      `for more questions and a full mock session. ` +
      `Dial again to continue.`;

    await this.send(phoneNumber, message);
  }

  /**
   * Weekly digest — scaffolded for future use.
   * Summarises the week's activity for a parent.
   * Not active at launch.
   */
  async sendWeeklyDigest(
    phoneNumber: string,
    childSessions: number,
    averageScore: number,
  ): Promise<void> {
    const message =
      `Icyareta Weekly Report: ` +
      `${childSessions} session(s) completed this week. ` +
      `Average score: ${averageScore}%. ` +
      `Keep up the great work! Dial to practice more.`;

    await this.send(phoneNumber, message);
  }
}
