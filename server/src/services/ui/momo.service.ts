import { v4 as uuidv4 } from "uuid";

const MOMO_BASE_URL =
  process.env.MOMO_BASE_URL || "https://sandbox.momodeveloper.mtn.com";
const MOMO_SUBSCRIPTION_KEY = process.env.MOMO_SUBSCRIPTION_KEY!;
const MOMO_API_USER = process.env.MOMO_API_USER!;
const MOMO_API_KEY = process.env.MOMO_API_KEY!;
const MOMO_ENVIRONMENT = process.env.MOMO_ENVIRONMENT || "sandbox";
const MOMO_CALLBACK_URL = process.env.MOMO_CALLBACK_URL!;

export interface MomoRequestToPayResult {
  referenceId: string;
  status: "PENDING" | "SUCCESSFUL" | "FAILED";
}

export class MomoService {
  // Mechanical necessity: Determine env once to keep methods clean
  private readonly isSandbox = MOMO_ENVIRONMENT.toLowerCase() === "sandbox";

  private async getAccessToken(): Promise<string> {
    const credentials = Buffer.from(
      `${MOMO_API_USER}:${MOMO_API_KEY}`,
    ).toString("base64");

    const response = await fetch(`${MOMO_BASE_URL}/collection/token/`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Ocp-Apim-Subscription-Key": MOMO_SUBSCRIPTION_KEY,
        "X-Target-Environment": MOMO_ENVIRONMENT,
      },
    });

    if (!response.ok) {
      throw new Error(`MoMo token error: ${response.status}`);
    }

    const data = (await response.json()) as { access_token: string };
    return data.access_token;
  }

  async requestToPay(
    phoneNumber: string,
    amount: number,
    externalId: string,
    note: string,
  ): Promise<string> {
    const referenceId = uuidv4();
    const accessToken = await this.getAccessToken();

    // 1. Clean MSISDN (Strictly digits)
    const sanitizedPhone = phoneNumber.replace(/\D/g, "");

    if (amount <= 0) throw new Error("Amount must be greater than 0");

    // Dynamic configuration based on environment
    const currency = this.isSandbox ? "EUR" : "RWF";
    const targetPartyId = this.isSandbox ? "46733123453" : sanitizedPhone;

    const payload = {
      amount: amount.toString(),
      currency: currency,
      externalId: externalId.replace(/\D/g, "").substring(0, 10),
      payer: {
        partyIdType: "MSISDN",
        partyId: targetPartyId,
      },
      payerMessage: note.substring(0, 40),
      payeeNote: note.substring(0, 40),
    };

    const response = await fetch(
      `${MOMO_BASE_URL}/collection/v1_0/requesttopay`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Reference-Id": referenceId,
          "X-Target-Environment": MOMO_ENVIRONMENT,
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": MOMO_SUBSCRIPTION_KEY,
          ...(MOMO_CALLBACK_URL && !MOMO_CALLBACK_URL.includes("localhost")
            ? { "X-Callback-Url": MOMO_CALLBACK_URL }
            : {}),
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const rawText = await response.text();
      throw new Error(
        `MoMo Error: ${response.status} - ${rawText || "Empty response"}`,
      );
    }

    return referenceId;
  }

  async getPaymentStatus(referenceId: string): Promise<MomoRequestToPayResult> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `${MOMO_BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Target-Environment": MOMO_ENVIRONMENT,
          "Ocp-Apim-Subscription-Key": MOMO_SUBSCRIPTION_KEY,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`MoMo status check failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      status: "PENDING" | "SUCCESSFUL" | "FAILED";
    };
    return { referenceId, status: data.status };
  }
}
