import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

export const loader = () => {
  return new Response("Webhook endpoint — POST only", { status: 405 });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log("📥 Incoming webhook:", request.url);

  const { payload, shop, topic } = await authenticate.webhook(request);

  console.log(`🟦 Webhook: ${topic} for ${shop}`);

  const currentScopes = Array.isArray(payload.current)
    ? payload.current.join(",")
    : "";

  await prisma.session.updateMany({
    where: { shop },
    data: { scope: currentScopes },
  });

  return new Response("OK", { status: 200 });
};
