export const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function generateRedirectURL(redirectOptions: any, shopifyResponse: any, shop: string): string {
    if (!redirectOptions) return "";

    const { redirectType, customURL, whatsAppNumber, whatsAppMessage } = redirectOptions;

    switch (redirectType) {
        case "custom":
            return customURL || "";

        case "whatsapp":
            if (whatsAppNumber) {
                const orderNumber = shopifyResponse?.draft_order?.name || shopifyResponse?.order?.order_number;
                const message = whatsAppMessage
                    ? encodeURIComponent(whatsAppMessage.replace('{orderNumber}', orderNumber || ''))
                    : encodeURIComponent(`Hello! I want to inquire about order ${orderNumber || ''}`);
                return `https://wa.me/${whatsAppNumber}?text=${message}`;
            }
            return "";

        case "default":
        default:
            if (shopifyResponse?.draft_order?.order_status_url) {
                return shopifyResponse.draft_order.order_status_url;
            } else if (shopifyResponse?.order?.order_status_url) {
                return shopifyResponse.order.order_status_url;
            } else {
                const orderId = shopifyResponse?.draft_order?.id || shopifyResponse?.order?.id;
                if (orderId) {
                    return `https://${shop}/pages/thank-you`;
                }
                return `https://${shop}/pages/thank-you`;
            }
    }
}