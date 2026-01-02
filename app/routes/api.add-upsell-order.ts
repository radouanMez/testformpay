// 📁 مسار الملف: /app/api/add-upsell-order/route.tsx

import { type ActionFunction, type LoaderFunction } from "react-router";
import { prisma } from "../db.server";
import { getClientIP } from "./api.create-order/utils/security.utils";
import { corsHeaders } from "./api.create-order/utils/response.utils";

export const loader: LoaderFunction = async ({ request }) => {
    return new Response(null, { status: 200, headers: corsHeaders });
};

export const action: ActionFunction = async ({ request }) => {
    if (request.method === "OPTIONS") {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (request.method !== "POST") {
        return new Response(
            JSON.stringify({ success: false, error: "Method not allowed" }),
            { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
    }

    try {
        const requestData = await request.json();

        const {
            shop,
            product,
            variantId,
            quantity = 1,
            discount,
            originalOrderId,
            upsellId,
            clientIP: providedClientIP
        } = requestData;

        if (!shop) {
            return new Response(
                JSON.stringify({ success: false, error: "Shop parameter required" }),
                { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
        }

        if (!product || !variantId) {
            return new Response(
                JSON.stringify({ success: false, error: "Product data and variant ID are required" }),
                { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
        }

        if (!originalOrderId) {
            return new Response(
                JSON.stringify({ success: false, error: "Original order ID is required" }),
                { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
        }

        // الحصول على بيانات المستخدم والتوكين
        const user = await prisma.user.findUnique({
            where: { shop },
            include: {
                sessions: true,
            }
        });

        if (!user || !user.sessions[0]?.accessToken) {
            return new Response(
                JSON.stringify({ success: false, error: "No access token found" }),
                { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
        }

        const accessToken = user.sessions[0].accessToken;
        const clientIP = providedClientIP || getClientIP(request);

        // 1️⃣ البحث عن الطلب الأصلي
        const originalOrder = await prisma.order.findUnique({
            where: { id: originalOrderId }
        });

        if (!originalOrder) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Original order not found",
                    orderId: originalOrderId
                }),
                { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
        }

        // 2️⃣ حساب السعر بعد الخصم للـ Upsell
        const originalPrice = product.price || (product.variants?.[0]?.price || 0);
        let upsellFinalPrice = originalPrice;
        // let upsellFinalPrice = originalPrice * quantity;
        let discountApplied: any = null;

        if (discount) {
            discountApplied = {
                type: discount.type,
                value: discount.value,
                originalPrice: upsellFinalPrice
            };

            if (discount.type === 'PERCENTAGE') {
                const discountAmount = upsellFinalPrice * (parseFloat(discount.value) / 100);
                // upsellFinalPrice = upsellFinalPrice - discountAmount;
                discountApplied = {
                    ...discountApplied,
                    discountAmount: discountAmount,
                    finalPrice: upsellFinalPrice
                };
            } else if (discount.type === 'FIXED_AMOUNT') {
                const discountAmount = parseFloat(discount.value);
                // upsellFinalPrice = upsellFinalPrice - discountAmount;
                discountApplied = {
                    ...discountApplied,
                    discountAmount: discountAmount,
                    finalPrice: upsellFinalPrice
                };
            }
        }

        // 3️⃣ إعداد بيانات الـ Upsell
        const upsellItem = {
            id: `upsell_${Date.now()}`,
            productId: product.id,
            title: product.title,
            variantId: variantId,
            variantTitle: product.variants?.find((v: any) => v.id == variantId)?.title || "Default",
            price: upsellFinalPrice,
            originalPrice: originalPrice,
            quantity: parseInt(quantity) || 1,
            discountApplied: discountApplied,
            image: product.featured_image || product.images?.[0]?.src,
            addedAt: new Date().toISOString(),
            upsellId: upsellId,
            status: "pending"
        };

        // 4️⃣ تحديث الطلب المحلي (بدون حذفه)
        const currentMetadata = originalOrder.metadata as any || {};
        const currentUpsells = currentMetadata.upsells || [];
        const currentItems = originalOrder.items as any[] || [];
        const totalOriginalAmount = originalOrder.totalAmount || 0;
        const newTotalAmount = totalOriginalAmount + upsellFinalPrice;

        // تحديث الطلب المحلي
        const updatedOrder = await prisma.order.update({
            where: { id: originalOrderId },
            data: {
                metadata: {
                    ...currentMetadata,
                    upsells: [...currentUpsells, upsellItem],
                    isUpsellAdded: true,
                    upsellAddedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                items: [
                    ...currentItems,
                    {
                        id: variantId,
                        productId: product.id,
                        title: product.title,
                        price: upsellFinalPrice,
                        quantity: parseInt(quantity) || 1,
                        variantId: variantId,
                        isUpsell: true,
                        upsellId: upsellId,
                        addedAt: new Date().toISOString()
                    }
                ],
                totalAmount: newTotalAmount
            }
        });

        console.log("✅ Upsell added to local order:", {
            orderId: updatedOrder.id,
            upsellItem: upsellItem,
            newTotal: updatedOrder.totalAmount
        });

        // 5️⃣ التعامل مع Shopify
        let shopifyResponse = null;
        let shopifyError = null;
        let newShopifyOrderId = null;

        try {
            // الحصول على معرف طلب Shopify من الميتاداتا
            const shopifyResponseMetadata = currentMetadata.shopifyResponse as any;
            const existingShopifyOrderId = currentMetadata.shopifyOrderId ||
                shopifyResponseMetadata?.order?.id ||
                shopifyResponseMetadata?.draft_order?.id;

            if (existingShopifyOrderId) {
                console.log("🗑️ Deleting existing Shopify order:", existingShopifyOrderId);

                // حذف طلب Shopify القديم
                await deleteShopifyOrder(shop, accessToken, existingShopifyOrderId);
                console.log("✅ Shopify order deleted successfully");
            }

            // إنشاء طلب Shopify جديد بالمنتجات الأصلية + الـ Upsell
            console.log("🔄 Creating new Shopify order with upsell");
            shopifyResponse = await createCompleteShopifyOrder(
                shop,
                accessToken,
                originalOrder,
                product,
                variantId,
                quantity,
                upsellFinalPrice,
                discountApplied,
                clientIP
            );

            const shopifyResult = shopifyResponse as any;
            newShopifyOrderId = shopifyResult.order?.id || shopifyResult.draft_order?.id;

            console.log("✅ New Shopify order created:", newShopifyOrderId);

            // تحديث الميتاداتا في الطلب المحلي
            await prisma.order.update({
                where: { id: originalOrderId },
                data: {
                    metadata: {
                        ...currentMetadata,
                        shopifyOrderId: newShopifyOrderId,
                        shopifyResponse: shopifyResult,
                        originalShopifyOrderDeleted: true,
                        deletedShopifyOrderId: existingShopifyOrderId,
                        upsells: [...currentUpsells, {
                            ...upsellItem,
                            status: "added_to_shopify",
                            shopifyOrderId: newShopifyOrderId,
                            shopifyResponse: shopifyResult,
                            updatedAt: new Date().toISOString()
                        }],
                        lastShopifyUpdate: new Date().toISOString()
                    }
                }
            });

        } catch (shopifyErr: any) {
            shopifyError = {
                message: shopifyErr.message,
                type: "shopify_error"
            };
            console.error("❌ Error in Shopify operations:", shopifyErr);

            // تحديث حالة الـ Upsell بالفشل
            await prisma.order.update({
                where: { id: originalOrderId },
                data: {
                    metadata: {
                        ...currentMetadata,
                        upsells: [...currentUpsells, {
                            ...upsellItem,
                            status: "shopify_failed",
                            error: shopifyErr.message,
                            updatedAt: new Date().toISOString()
                        }],
                        lastError: new Date().toISOString()
                    }
                }
            });
        }

        // 6️⃣ إعداد الرد النهائي
        const responseBody = {
            success: true,
            message: shopifyResponse
                ? "Upsell added and new Shopify order created successfully"
                : "Upsell saved locally but Shopify integration failed",

            localOrder: {
                id: updatedOrder.id,
                orderNumber: updatedOrder.orderNumber,
                status: updatedOrder.status,
                totalAmount: updatedOrder.totalAmount,
                itemCount: (updatedOrder.items as any[]).length,
                updatedAt: updatedOrder.updatedAt
            },

            upsell: {
                item: upsellItem,
                status: shopifyResponse ? "added" : "failed",
                discountApplied: discountApplied
            },

            shopify: {
                success: !!shopifyResponse,
                newOrderId: newShopifyOrderId,
                response: shopifyResponse,
                error: shopifyError
            },

            statistics: {
                upsellId: upsellId,
                conversionType: "post_purchase",
                timestamp: new Date().toISOString(),
                clientIP: clientIP
            }
        };

        return new Response(JSON.stringify(responseBody), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
            },
        });

    } catch (error: any) {
        console.error("❌ Error in add-upsell-order API:", error);

        const errorBody = JSON.stringify({
            success: false,
            error: "Failed to add upsell to order",
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });

        return new Response(errorBody, {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
            },
        });
    }
};

/**
 * حذف طلب Shopify
 */
async function deleteShopifyOrder(
    shop: string,
    accessToken: string,
    shopifyOrderId: string
): Promise<void> {
    try {
        // محاولة حذف كـ Draft Order أولاً
        let response = await fetch(
            `https://${shop}/admin/api/2024-01/draft_orders/${shopifyOrderId}.json`,
            {
                method: "DELETE",
                headers: {
                    "X-Shopify-Access-Token": accessToken,
                    "Content-Type": "application/json",
                },
            }
        );

        if (response.ok) {
            console.log("✅ Draft order deleted successfully");
            return;
        }

        // إذا لم يكن Draft، نجرب حذف كـ Order
        response = await fetch(
            `https://${shop}/admin/api/2024-01/orders/${shopifyOrderId}/cancel.json`,
            {
                method: "POST",
                headers: {
                    "X-Shopify-Access-Token": accessToken,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    reason: "Replaced with new order containing upsell"
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to delete/cancel Shopify order: ${JSON.stringify(errorData.errors || errorData.message)}`);
        }

        console.log("✅ Order cancelled successfully");

    } catch (error) {
        console.error("❌ Error deleting Shopify order:", error);
        throw error;
    }
}

/**
 * إنشاء طلب Shopify جديد كامل (المنتجات الأصلية + الـ Upsell)
 */
async function createCompleteShopifyOrder(
    shop: string,
    accessToken: string,
    originalOrder: any,
    upsellProduct: any,
    variantId: string,
    quantity: string,
    upsellPrice: number,
    discountApplied: any,
    clientIP: string
): Promise<any> {

    const originalItems = originalOrder.items as any[] || [];
    const originalCustomer = originalOrder.customer as any || {};
    const discountText = discountApplied ?
        `Upsell Discount: ${discountApplied.type} ${discountApplied.value}` :
        "No discount";

    // تحويل المنتجات الأصلية إلى تنسيق Shopify line_items
    const originalLineItems = originalItems
        .filter((item: any) => !item.isUpsell)
        .map((item: any) => {
            const productData = item.product || item;
            const variantId = item.variantId || productData.variantId;
            const quantity = item.quantity || 1;
            const title = item.title || productData.title || "Product";

            let price = 0;
            if (item.price !== undefined && item.price !== null) {
                price = item.price;
            } else if (productData.price !== undefined && productData.price !== null) {
                price = productData.price;
            } else if (productData.variants && productData.variants[0]?.price) {
                price = productData.variants[0].price;
            }

            // تحويل السعر إلى قروش
            // if (price < 1000 && price > 0) {
            //     price = price * 100;
            // }

            return {
                variant_id: parseInt(variantId) || 0,
                quantity: quantity,
                title: title,
                price: price,
                properties: [
                    { name: "From Original Order", value: originalOrder.orderNumber || "Unknown" },
                    { name: "Order Source", value: "Formino App" }
                ]
            };
        });

    // إضافة الـ Upsell product
    const upsellLineItem = {
        variant_id: parseInt(variantId),
        quantity: parseInt(quantity) || 1,
        title: upsellProduct.title,
        price: upsellPrice * 100, // تحويل درهم إلى قروش
        properties: [
            { name: "Upsell", value: "Yes" },
            { name: "Original Order", value: originalOrder.orderNumber || "Unknown" },
            { name: "Added Via", value: "Formino Post-Purchase" },
            { name: "Discount", value: discountText }
        ]
    };

    const allLineItems = [
        ...originalLineItems,
        upsellLineItem
    ];

    // استخدام إعدادات الطلب الأصلية
    const orderOptions = (originalOrder.metadata as any)?.orderOptions || {
        saveAsDraft: false,
        createCODOrders: false
    };

    // إعداد عنوان الشحن
    const shippingAddress = {
        first_name: originalCustomer.first_name || "",
        last_name: originalCustomer.last_name || "",
        address1: originalCustomer.address || "",
        address2: originalCustomer.address_2 || "",
        city: originalCustomer.city || "",
        province: originalCustomer.province || "",
        zip: originalCustomer.zip_code || "",
        country: "MA",
        phone: originalCustomer.phone || ""
    };

    // 1️⃣ البحث عن العميل الموجود في Shopify (نفس منطق shopify.service.ts)
    let existingCustomer = null;
    let customerEmail = originalCustomer.email || "";
    let customerPhone = originalCustomer.phone || "";

    try {
        console.log("🔍 Searching for existing customer in Shopify...");

        // البحث بالبريد الإلكتروني أولاً (نفس وظيفة findCustomerByEmail)
        if (customerEmail && customerEmail.trim() !== '') {
            const searchResponse = await fetch(
                `https://${shop}/admin/api/2024-01/customers/search.json?query=email:${encodeURIComponent(customerEmail)}`,
                {
                    method: "GET",
                    headers: {
                        "X-Shopify-Access-Token": accessToken,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (searchResponse.ok) {
                const data = await searchResponse.json();
                if (data.customers && data.customers.length > 0) {
                    existingCustomer = data.customers[0];
                    console.log("✅ Found existing customer by email:", existingCustomer.id);
                }
            }
        }

        // إذا لم نجده بالبريد، نبحث برقم الهاتف (نفس وظيفة findCustomerByPhone)
        if (!existingCustomer && customerPhone && customerPhone.trim() !== '') {
            const searchResponse = await fetch(
                `https://${shop}/admin/api/2024-01/customers/search.json?query=phone:${encodeURIComponent(customerPhone)}`,
                {
                    method: "GET",
                    headers: {
                        "X-Shopify-Access-Token": accessToken,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (searchResponse.ok) {
                const data = await searchResponse.json();
                if (data.customers && data.customers.length > 0) {
                    existingCustomer = data.customers[0];
                    console.log("✅ Found existing customer by phone:", existingCustomer.id);
                }
            }
        }

        if (!existingCustomer) {
            console.log("⚠️ No existing customer found, will create new one");
        }
    } catch (searchError) {
        console.error("❌ Error searching for customer:", searchError);
        // نستمر في العملية حتى لو فشل البحث
    }

    // 2️⃣ إعداد بيانات الطلب مع مراعاة العميل الموجود
    const orderBaseData: any = {
        line_items: allLineItems,
        note: `🔄 ORDER UPDATED WITH UPSELL\n• Replaced Order: ${originalOrder.orderNumber}\n• Customer: ${originalCustomer.first_name} ${originalCustomer.last_name}\n• Email: ${customerEmail}\n• Phone: ${customerPhone}\n\n---\n🎯 UPSELL PRODUCT ADDED:\n• Product: ${upsellProduct.title}\n• ${discountText}\n• Price: ${upsellPrice*100} MAD\n• Added at: ${new Date().toLocaleString()}\n• Client IP: ${clientIP}\n\nCreated via Formino Upsell System`,
        tags: "formino-app,upsell-order,post-purchase,updated-order",
        shipping_address: shippingAddress,
        use_customer_default_address: true
    };

    // تحديد بيانات العميل بناءً على ما إذا كان موجوداً
    if (existingCustomer) {
        // ✅ استخدام العميل الموجود
        orderBaseData.customer = {
            id: existingCustomer.id,
            first_name: existingCustomer.first_name || originalCustomer.first_name || "Customer",
            last_name: existingCustomer.last_name || originalCustomer.last_name || "",
            email: existingCustomer.email || customerEmail,
            phone: existingCustomer.phone || customerPhone,
        };
        console.log("👤 Using existing customer ID:", existingCustomer.id);
    } else {
        // 🔄 إنشاء عميل جديد (بعد إصلاح مشكلة رقم الهاتف)
        const customerData = {
            first_name: originalCustomer.first_name || "Customer",
            last_name: originalCustomer.last_name || "",
            email: customerEmail || "",
            phone: customerPhone || "",
        };

        // إذا كان رقم الهاتف فارغاً، لا نرسله
        if (!customerData.phone || customerData.phone.trim() === '') {
            delete customerData.phone;
        }

        orderBaseData.customer = customerData;
        console.log("👤 Creating new customer:", customerData);
    }

    // 3️⃣ إعداد بيانات الطلب النهائية
    const draftOrderData = {
        draft_order: orderBaseData
    };

    console.log("📤 Creating new Shopify order with", allLineItems.length, "items");

    const endpoint = orderOptions.saveAsDraft ? "draft_orders" : "orders";
    const url = `https://${shop}/admin/api/2024-01/${endpoint}.json`;

    const requestBody = orderOptions.saveAsDraft ?
        draftOrderData :
        {
            order: {
                ...orderBaseData,
                financial_status: orderOptions.createCODOrders ? "pending" : "paid",
                send_receipt: true,
                send_fulfillment_receipt: false
            }
        };

    console.log("🚀 Sending to Shopify:", {
        endpoint: endpoint,
        url: url,
        customerId: existingCustomer?.id || "new",
        customerEmail: customerEmail
    });

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Shopify API error response:", errorText);

        // إذا كان الخطأ متعلقاً بالعميل، نحاول مرة أخرى بدون بيانات العميل
        if (errorText.includes("customer") || errorText.includes("phone_number")) {
            console.log("⚠️ Customer data issue, retrying without customer...");

            // إعادة المحاولة بدون بيانات العميل
            delete orderBaseData.customer;
            orderBaseData.note += "\n\n⚠️ Created without customer data due to validation issues";

            const retryResponse = await fetch(url, {
                method: "POST",
                headers: {
                    "X-Shopify-Access-Token": accessToken,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(orderOptions.saveAsDraft ?
                    { draft_order: orderBaseData } :
                    { order: { ...orderBaseData, financial_status: "paid" } }
                ),
            });

            if (retryResponse.ok) {
                console.log("✅ Retry successful without customer data");
                return await retryResponse.json();
            }
        }

        throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ Shopify order created successfully:", result);
    return result;
}
/**
 * دالة لمعالجة إحصائيات الـ Upsell
 */
async function updateUpsellStatistics(upsellId: string, action: 'viewed' | 'accepted' | 'declined') {
    try {
        console.log(`📊 Statistics update for upsell ${upsellId}: ${action}`);
        // Implementation here
    } catch (error) {
        console.error("❌ Error updating upsell statistics:", error);
    }
}