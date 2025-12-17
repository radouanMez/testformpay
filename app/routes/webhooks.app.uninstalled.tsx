// app/routes/webhooks/app.uninstalled.tsx
import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = () => {
  return new Response("Webhook endpoint — POST only", { status: 405 });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log("➡️ Incoming webhook URL:", request.url);

  for (const [k, v] of request.headers.entries()) {
    console.log(`Header: ${k}: ${v}`);
  }

  try {
    const cloned = request.clone();
    const raw = await cloned.text();
    console.log("Raw body:", raw);
  } catch (e) {
    console.error("Could not read raw body:", e);
  }

  try {
    const { shop, topic, session } = await authenticate.webhook(request);

    console.log(`🟧 Webhook received: ${topic} for ${shop}`);

    if (session) {
      const { deleteShopData } = await import("../db.server");
      await deleteShopData(shop);
      console.log(`🗑️ Deleted all data for shop: ${shop}`);
    }

    return new Response("OK", { status: 200 });
  } catch (err: any) {
    console.error("❌ Webhook handler error:", err);
    return new Response("Webhook processing error", { status: 400 });
  }
};
