// webhooks.billing.tsx - النسخة المبسطة جداً
import type { ActionFunctionArgs } from "react-router";
import { billingService } from "../services/billingService";
import { authenticate } from "../shopify.server";

export async function action({ request }: ActionFunctionArgs) {
  try {
    const clonedRequest = request.clone();
    const { shop, topic } = await authenticate.webhook(request);
    
    const payload = await clonedRequest.json();
    const subscription = payload.app_subscription;

    if (!subscription) {
      return new Response('No subscription', { status: 400 });
    }

    // ✅ تحديث الاشتراك فقط (بدون logging فيه undefined)
    await billingService.updateSubscriptionStatus(
      shop,
      subscription.status.toLowerCase(),
      subscription.id
    );

    // ✅ تسجيل بسيط بدون تفاصيل معقدة
    await billingService.logBillingAction(shop, topic, {
      status: subscription.status
    });

    console.log(`✅ ${subscription.status} for ${shop}`);
    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Error', { status: 500 });
  }
}