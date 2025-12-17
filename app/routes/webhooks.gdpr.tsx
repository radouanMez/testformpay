import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { topic, shop, payload } = await authenticate.webhook(request);

    console.log(`🟢 GDPR webhook received: ${topic} from ${shop}`);
    console.log(payload);

    switch (topic) {
      case "customers/data_request":
        // معالجة data_request
        break;

      case "customers/redact":
        // حذف بيانات العملاء
        break;

      case "shop/redact":
        // حذف بيانات المتجر
        break;
    }

    return new Response("OK", { status: 200 });

  } catch (error) {
    console.error("❌ Invalid HMAC:", error);
    return new Response("Unauthorized", { status: 401 });
  }
};
