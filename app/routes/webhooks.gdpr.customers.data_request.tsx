// app/routes/webhooks/gdpr.customers_data_request.tsx
import { authenticate } from "../shopify.server";

export const loader = () => {
  return new Response("Webhook endpoint — POST only", { status: 405 });
};

export const action = async ({ request }: any) => {
  console.log("📥 Incoming webhook:", request.url);
  await authenticate.webhook(request);
  console.log("📩 GDPR → customers/data_request");
  return new Response("OK");
};