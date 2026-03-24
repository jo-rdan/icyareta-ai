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

  /**
   * Initiates a payment request to a customer's phone.
   * Returns the referenceId used to track the payment status.
   */
  async requestToPay(
    phoneNumber: string,
    amount: number,
    externalId: string,
    note: string,
  ): Promise<string> {
    const referenceId = uuidv4();
    const accessToken = await this.getAccessToken();

    // Strip the + prefix if present — MoMo expects numbers without it
    const sanitizedPhone = phoneNumber.replace(/^\+/, "");

    const response = await fetch(
      `${MOMO_BASE_URL}/collection/v1_0/requesttopay`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Reference-Id": referenceId,
          "X-Target-Environment": MOMO_ENVIRONMENT,
          "X-Callback-Url": MOMO_CALLBACK_URL,
          "Ocp-Apim-Subscription-Key": MOMO_SUBSCRIPTION_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount.toString(),
          currency: "RWF",
          externalId,
          payer: {
            partyIdType: "MSISDN",
            partyId: sanitizedPhone,
          },
          payerMessage: note,
          payeeNote: note,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `MoMo requestToPay failed: ${response.status} ${errorText}`,
      );
    }

    return referenceId;
  }

  /**
   * Checks the status of a payment by referenceId.
   */
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
