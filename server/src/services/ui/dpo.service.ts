import { parseStringPromise } from "xml2js";

const DPO_COMPANY_TOKEN = process.env.DPO_COMPANY_TOKEN!;
const DPO_SERVICE_TYPE = process.env.DPO_SERVICE_TYPE!; // get this from DPO dashboard
const DPO_BASE_URL =
  process.env.DPO_TEST_MODE === "true"
    ? "https://secure.3gdirectpay.com"
    : "https://secure.3gdirectpay.com"; // same URL, test mode is controlled by company token
const DPO_REDIRECT_URL = process.env.DPO_REDIRECT_URL!; // e.g. https://yourapp.com/app/payment/dpo/return
const DPO_BACK_URL = process.env.DPO_BACK_URL!; // e.g. https://yourapp.com/pricing

export interface DpoCreateTokenResult {
  transToken: string;
  paymentUrl: string;
}

export interface DpoVerifyResult {
  status: "SUCCESSFUL" | "FAILED" | "PENDING";
  transactionRef: string;
}

export class DpoService {
  /**
   * Step 1 — Create a transaction token.
   * Returns a transToken + the URL to redirect the user to.
   */
  async createToken(
    amount: number,
    currency: string,
    companyRef: string,
    description: string,
  ): Promise<DpoCreateTokenResult> {
    const now = new Date();
    // DPO requires service date in format YYYY/MM/DD HH:MM
    const serviceDate = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${DPO_COMPANY_TOKEN}</CompanyToken>
  <Request>createToken</Request>
  <Transaction>
    <PaymentAmount>${amount.toFixed(2)}</PaymentAmount>
    <PaymentCurrency>${currency}</PaymentCurrency>
    <CompanyRef>${companyRef}</CompanyRef>
    <RedirectURL>${DPO_REDIRECT_URL}</RedirectURL>
    <BackURL>${DPO_BACK_URL}</BackURL>
    <CompanyRefUnique>1</CompanyRefUnique>
    <PTL>30</PTL>
  </Transaction>
  <Services>
    <Service>
      <ServiceType>${DPO_SERVICE_TYPE}</ServiceType>
      <ServiceDescription>${description}</ServiceDescription>
      <ServiceDate>${serviceDate}</ServiceDate>
    </Service>
  </Services>
</API3G>`;

    const response = await fetch(`${DPO_BASE_URL}/API/v6/`, {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: xml,
    });

    const rawXml = await response.text();
    const parsed = await parseStringPromise(rawXml, { explicitArray: false });
    const result = parsed?.API3G;

    if (!result) throw new Error("DPO: empty response");

    const code = result.Result ?? result.r;
    if (code !== "000") {
      throw new Error(
        `DPO createToken failed: ${code} — ${result.ResultExplanation}`,
      );
    }

    const transToken = result.TransToken;
    const paymentUrl = `${DPO_BASE_URL}/payv2.php?ID=${transToken}`;

    return { transToken, paymentUrl };
  }

  /**
   * Step 2 — Verify the transaction after the user returns from DPO.
   * Called by your backend when DPO redirects the user back.
   */
  async verifyToken(transToken: string): Promise<DpoVerifyResult> {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${DPO_COMPANY_TOKEN}</CompanyToken>
  <Request>verifyToken</Request>
  <TransactionToken>${transToken}</TransactionToken>
</API3G>`;

    const response = await fetch(`${DPO_BASE_URL}/API/v6/`, {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: xml,
    });

    const rawXml = await response.text();
    const parsed = await parseStringPromise(rawXml, { explicitArray: false });
    const result = parsed?.API3G;

    if (!result) throw new Error("DPO: empty verify response");

    const code = result.Result ?? result.r;

    // DPO result code 000 = paid
    if (code === "000") {
      return {
        status: "SUCCESSFUL",
        transactionRef: result.TransRef ?? transToken,
      };
    }

    // 901 = transaction pending/not paid yet
    if (code === "901") {
      return { status: "PENDING", transactionRef: transToken };
    }

    return { status: "FAILED", transactionRef: transToken };
  }
}
