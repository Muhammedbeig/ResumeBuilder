import { NextResponse } from "next/server";
import { resolveAppOrigin } from "@/lib/public-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveTargetUrl(appOrigin: string, rawReturnUrl: string | null): URL {
  if (rawReturnUrl) {
    try {
      if (rawReturnUrl.startsWith("/")) {
        return new URL(rawReturnUrl, appOrigin);
      }
      const absolute = new URL(rawReturnUrl);
      if (absolute.origin === appOrigin) {
        return absolute;
      }
    } catch {
      // ignore invalid user-provided URL
    }
  }

  return new URL("/pricing", appOrigin);
}

async function confirmStripePayment(
  appOrigin: string,
  paymentTransactionId: string | null,
  sessionId: string | null,
) {
  if (!paymentTransactionId && !sessionId) return;

  const body: Record<string, string> = {};
  if (paymentTransactionId) body.paymentTransactionId = paymentTransactionId;
  if (sessionId) body.sessionId = sessionId;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await fetch(`${appOrigin}/api/stripe/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify(body),
      });

      if (res.ok || (res.status >= 400 && res.status < 500)) {
        return;
      }
    } catch {
      // retry on network/infra issues
    }

    await new Promise((resolve) => setTimeout(resolve, 750));
  }
}

export async function GET(request: Request) {
  const appOrigin = resolveAppOrigin(request);
  if (!appOrigin) {
    return NextResponse.json(
      {
        error:
          "Unable to determine public app URL. Configure NEXT_PUBLIC_APP_URL or NEXTAUTH_URL.",
      },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const stripeStatus =
    url.searchParams.get("stripe") === "cancel" ? "cancel" : "success";
  const paymentTransactionId = url.searchParams.get("payment_transaction_id");
  const sessionId = url.searchParams.get("session_id");
  const returnUrl = url.searchParams.get("return_url");

  const target = resolveTargetUrl(appOrigin, returnUrl);

  if (stripeStatus === "success") {
    await confirmStripePayment(appOrigin, paymentTransactionId, sessionId);
  }

  target.searchParams.set("stripe", stripeStatus);
  if (paymentTransactionId) {
    target.searchParams.set("payment_transaction_id", paymentTransactionId);
  }
  if (sessionId) {
    target.searchParams.set("session_id", sessionId);
  }

  return NextResponse.redirect(target);
}
