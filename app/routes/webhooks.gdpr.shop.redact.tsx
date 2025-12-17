// routes/webhooks/gdpr.shop_redact.tsx
import { authenticate } from "../shopify.server";

export const loader = () => {
  return new Response("Webhook endpoint — POST only", { status: 405 });
};

export const action = async ({ request }: any) => {
  console.log("📥 Incoming webhook:", request.url);

  await authenticate.webhook(request);
  console.log("🗑️ GDPR → shop/redact");
  return new Response("OK");
};
