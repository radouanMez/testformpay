import type { ActionFunction } from "react-router";
import { prisma } from "../db.server";


export const action: ActionFunction = async ({ request }) => {
    if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { shop, orderData } = await request.json();

    const user = await prisma.user.findUnique({
        where: { shop },
        include: { sessions: true }
    });

    if (!user?.sessions[0]?.accessToken) {
        return new Response(JSON.stringify({ error: "No access token found" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    const accessToken = user.sessions[0].accessToken;

    try {
        // إنشاء order كامل في Shopify
        const response = await fetch(`https://${shop}/admin/api/2024-01/orders.json`, {
            method: "POST",
            headers: {
                "X-Shopify-Access-Token": accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                order: {
                    line_items: orderData.items.map((item: any) => ({
                        variant_id: parseInt(item.variantId),
                        quantity: item.quantity,
                        title: item.product?.title,
                        price: item.price || item.product?.price,
                    })),
                    customer: orderData.customerId ? { id: orderData.customerId } : {
                        first_name: orderData.customer.first_name,
                        last_name: orderData.customer.last_name,
                        email: orderData.customer.email,
                    },
                    shipping_address: {
                        first_name: orderData.shipping.first_name,
                        last_name: orderData.shipping.last_name,
                        address1: orderData.shipping.address,
                        city: orderData.shipping.city,
                        phone: orderData.shipping.phone,
                        country: orderData.shipping.country || "Morocco",
                    },
                    billing_address: {
                        first_name: orderData.billing?.first_name || orderData.shipping.first_name,
                        last_name: orderData.billing?.last_name || orderData.shipping.last_name,
                        address1: orderData.billing?.address || orderData.shipping.address,
                        city: orderData.billing?.city || orderData.shipping.city,
                        phone: orderData.billing?.phone || orderData.shipping.phone,
                        country: orderData.billing?.country || orderData.shipping.country || "Morocco",
                    },
                    email: orderData.customer.email,
                    phone: orderData.customer.phone,
                    financial_status: orderData.financial_status || "pending", // pending, authorized, paid, etc.
                    send_receipt: orderData.send_receipt || true,
                    send_fulfillment_receipt: orderData.send_fulfillment_receipt || false,
                    note: orderData.note || "Created via Formino App",
                    tags: orderData.tags || "formino-app",
                    // إضافة الشحن والضرائب
                    shipping_lines: orderData.shipping_cost ? [{
                        title: orderData.shipping_method?.name || "Shipping",
                        price: orderData.shipping_cost,
                        code: orderData.shipping_method?.code || "standard"
                    }] : [],
                }
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Shopify API error: ${JSON.stringify(error)}`);
        }

        const order = await response.json();
        return new Response(JSON.stringify(order), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};