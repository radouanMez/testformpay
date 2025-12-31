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

        // 2️⃣ حساب السعر بعد الخصم
        const originalPrice = product.price || (product.variants?.[0]?.price || 0) / 100;
        let finalPrice = originalPrice * quantity;
        let discountApplied: any = null;

        if (discount) {
            discountApplied = {
                type: discount.type,
                value: discount.value,
                originalPrice: finalPrice
            };

            if (discount.type === 'PERCENTAGE') {
                const discountAmount = finalPrice * (parseFloat(discount.value) / 100);
                finalPrice = finalPrice - discountAmount;
                discountApplied = {
                    ...discountApplied,
                    discountAmount: discountAmount,
                    finalPrice: finalPrice
                };
            } else if (discount.type === 'FIXED_AMOUNT') {
                const discountAmount = parseFloat(discount.value);
                finalPrice = finalPrice - discountAmount;
                discountApplied = {
                    ...discountApplied,
                    discountAmount: discountAmount,
                    finalPrice: finalPrice
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
            price: finalPrice,
            originalPrice: originalPrice,
            quantity: parseInt(quantity) || 1,
            discountApplied: discountApplied,
            image: product.featured_image || product.images?.[0]?.src,
            addedAt: new Date().toISOString(),
            upsellId: upsellId,
            status: "pending"
        };

        // 4️⃣ تحديث الطلب الأصلي
        const currentMetadata = originalOrder.metadata as any || {};
        const currentUpsells = currentMetadata.upsells || [];
        const currentItems = originalOrder.items as any[] || [];

        const updatedOrder = await prisma.order.update({
            where: { id: originalOrderId },
            data: {
                metadata: {
                    ...currentMetadata,
                    upsells: [...currentUpsells, upsellItem],
                    lastUpsellAdded: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                items: [
                    ...currentItems,
                    {
                        id: variantId,
                        productId: product.id,
                        title: product.title,
                        price: finalPrice,
                        quantity: parseInt(quantity) || 1,
                        variantId: variantId,
                        isUpsell: true,
                        upsellId: upsellId,
                        addedAt: new Date().toISOString()
                    }
                ],
                totalAmount: (originalOrder.totalAmount || 0) + finalPrice
            }
        });

        console.log("✅ Upsell added to order:", {
            orderId: updatedOrder.id,
            upsellItem: upsellItem,
            newTotal: updatedOrder.totalAmount
        });

        // 5️⃣ إضافة المنتج إلى Shopify
        let shopifyResponse = null;
        let shopifyError = null;
        let shopifyOrderId = null;

        try {
            // الحصول على معرف طلب Shopify من الميتاداتا
            const shopifyResponseMetadata = currentMetadata.shopifyResponse as any;
            const shopifyOrderIdFromMetadata = currentMetadata.shopifyOrderId || 
                                              shopifyResponseMetadata?.order?.id ||
                                              shopifyResponseMetadata?.draft_order?.id;

            if (shopifyOrderIdFromMetadata) {
                shopifyResponse = await addProductToShopifyOrder(
                    shop,
                    accessToken,
                    shopifyOrderIdFromMetadata,
                    product,
                    variantId,
                    quantity,
                    finalPrice,
                    discountApplied,
                    originalOrder.orderNumber || "Unknown",
                    clientIP
                );

                const shopifyResult = shopifyResponse as any;
                shopifyOrderId = shopifyResult.order?.id || shopifyResult.draft_order?.id;
                
                console.log("✅ Product added to Shopify order:", shopifyOrderId);

                // تحديث حالة الـ Upsell
                const updatedUpsells = [...currentUpsells, {
                    ...upsellItem,
                    status: "added_to_shopify",
                    shopifyOrderId: shopifyOrderId,
                    shopifyResponse: shopifyResult,
                    updatedAt: new Date().toISOString()
                }];

                await prisma.order.update({
                    where: { id: originalOrderId },
                    data: {
                        metadata: {
                            ...currentMetadata,
                            upsells: updatedUpsells,
                            lastShopifyUpdate: new Date().toISOString()
                        }
                    }
                });

            } else {
                console.log("⚠️ No Shopify order ID found in metadata, creating new draft order");
                
                shopifyResponse = await createNewShopifyDraftOrder(
                    shop,
                    accessToken,
                    product,
                    variantId,
                    quantity,
                    finalPrice,
                    discountApplied,
                    originalOrder.orderNumber || "Unknown",
                    clientIP
                );

                const shopifyResult = shopifyResponse as any;
                shopifyOrderId = shopifyResult.draft_order?.id;
                
                // تحديث الميتاداتا
                await prisma.order.update({
                    where: { id: originalOrderId },
                    data: {
                        metadata: {
                            ...currentMetadata,
                            shopifyOrderId: shopifyOrderId,
                            shopifyResponse: shopifyResult,
                            upsells: [...currentUpsells, {
                                ...upsellItem,
                                status: "new_draft_created",
                                shopifyOrderId: shopifyOrderId,
                                updatedAt: new Date().toISOString()
                            }]
                        }
                    }
                });
            }

        } catch (shopifyErr: any) {
            shopifyError = {
                message: shopifyErr.message,
                type: "shopify_error"
            };
            console.error("❌ Error adding product to Shopify:", shopifyErr);
            
            // تحديث حالة الـ Upsell بالفشل
            const updatedUpsells = [...currentUpsells, {
                ...upsellItem,
                status: "shopify_failed",
                error: shopifyErr.message,
                updatedAt: new Date().toISOString()
            }];

            await prisma.order.update({
                where: { id: originalOrderId },
                data: {
                    metadata: {
                        ...currentMetadata,
                        upsells: updatedUpsells,
                        lastError: new Date().toISOString()
                    }
                }
            });
        }

        // 6️⃣ تحديث إحصائيات الـ Upsell إذا كان موجودًا في قاعدة البيانات
        if (upsellId) {
            try {
                // البحث في جدول Upsell إذا كان موجودًا
                // سنحتاج للتحقق من هيكل قاعدة البيانات أولاً
                console.log("📊 Would update statistics for upsell:", upsellId);
                // await updateUpsellStatistics(upsellId, 'accepted');
            } catch (statsError) {
                console.error("❌ Error updating upsell statistics:", statsError);
            }
        }

        // 7️⃣ إعداد الرد النهائي
        const responseBody = {
            success: true,
            message: shopifyResponse 
                ? "Upsell product added successfully" 
                : "Upsell saved but Shopify integration failed",
            
            order: {
                id: updatedOrder.id,
                orderNumber: updatedOrder.orderNumber,
                status: updatedOrder.status,
                totalAmount: updatedOrder.totalAmount,
                updatedAt: updatedOrder.updatedAt
            },
            
            upsell: {
                item: upsellItem,
                status: shopifyResponse ? "added" : "failed",
                discountApplied: discountApplied
            },
            
            shopify: {
                success: !!shopifyResponse,
                orderId: shopifyOrderId,
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
            error: "Failed to add upsell product to order",
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
 * إضافة منتج إلى طلب Shopify الحالي
 */
async function addProductToShopifyOrder(
    shop: string,
    accessToken: string,
    shopifyOrderId: string,
    product: any,
    variantId: string,
    quantity: string,
    price: number,
    discountApplied: any,
    originalOrderNumber: string,
    clientIP: string
): Promise<any> {
    try {
        // جلب الطلب الحالي
        const existingOrderResponse = await fetch(
            `https://${shop}/admin/api/2024-01/orders/${shopifyOrderId}.json`,
            {
                method: "GET",
                headers: {
                    "X-Shopify-Access-Token": accessToken,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!existingOrderResponse.ok) {
            throw new Error(`Failed to fetch Shopify order: ${existingOrderResponse.status}`);
        }

        const existingOrder = await existingOrderResponse.json();
        const order = existingOrder.order;
        
        // إضافة المنتج الجديد
        const updatedLineItems = [
            ...order.line_items,
            {
                variant_id: parseInt(variantId),
                quantity: parseInt(quantity) || 1,
                title: product.title,
                price: price,
                properties: [
                    { name: "Upsell", value: "Yes" },
                    { name: "Original Order", value: originalOrderNumber },
                    { name: "Added Via", value: "Formino Post-Purchase" }
                ]
            }
        ];

        const discountText = discountApplied ? 
            `Discount: ${discountApplied.type} ${discountApplied.value}` : 
            "No discount";
            
        const newNote = `${order.note || ''}\n\n---\n🎯 POST-PURCHASE UPSELL ADDED:\n• Product: ${product.title}\n• ${discountText}\n• Price: ${price} ${order.currency}\n• Added at: ${new Date().toLocaleString()}\n• Client IP: ${clientIP}`;

        // تحديث الطلب
        const updateResponse = await fetch(
            `https://${shop}/admin/api/2024-01/orders/${shopifyOrderId}.json`,
            {
                method: "PUT",
                headers: {
                    "X-Shopify-Access-Token": accessToken,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    order: {
                        id: parseInt(shopifyOrderId),
                        line_items: updatedLineItems,
                        note: newNote.trim(),
                        tags: order.tags ? `${order.tags}, post-purchase-upsell` : "post-purchase-upsell"
                    }
                }),
            }
        );

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(`Shopify Order Update error: ${JSON.stringify(errorData.errors || errorData.message)}`);
        }

        return await updateResponse.json();

    } catch (error) {
        console.error("❌ Error in addProductToShopifyOrder:", error);
        throw error;
    }
}

/**
 * إنشاء طلب Draft جديد للـ Upsell
 */
async function createNewShopifyDraftOrder(
    shop: string,
    accessToken: string,
    product: any,
    variantId: string,
    quantity: string,
    price: number,
    discountApplied: any,
    originalOrderNumber: string,
    clientIP: string
): Promise<any> {
    const discountText = discountApplied ? 
        `Discount: ${discountApplied.type} ${discountApplied.value}` : 
        "No discount";
    
    const draftOrderData = {
        draft_order: {
            line_items: [{
                variant_id: parseInt(variantId),
                quantity: parseInt(quantity) || 1,
                title: product.title,
                price: price,
                properties: [
                    { name: "Upsell", value: "Yes" },
                    { name: "Original Order", value: originalOrderNumber },
                    { name: "Added Via", value: "Formino Post-Purchase" },
                    { name: "Discount", value: discountText }
                ]
            }],
            note: `🎯 POST-PURCHASE UPSELL ORDER\n• Original Order: ${originalOrderNumber}\n• Product: ${product.title}\n• Price: ${price}\n• ${discountText}\n• Added at: ${new Date().toLocaleString()}\n• Client IP: ${clientIP}\n\nCreated via Formino Upsell System`,
            tags: "formino-app,upsell-order,post-purchase",
        }
    };

    console.log("📤 Creating new draft order for upsell");

    const response = await fetch(`https://${shop}/admin/api/2024-01/draft_orders.json`, {
        method: "POST",
        headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(draftOrderData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Shopify Draft Order API error: ${JSON.stringify(errorData.errors || errorData.message)}`);
    }

    return await response.json();
}

/**
 * دالة لمعالجة إحصائيات الـ Upsell (بدون خطأ)
 */
async function updateUpsellStatistics(upsellId: string, action: 'viewed' | 'accepted' | 'declined') {
    try {
        // إذا كان لديك جدول UpsellOffer في قاعدة البيانات
        console.log(`📊 Statistics update for upsell ${upsellId}: ${action}`);
        // يمكنك تفعيل هذا الكود إذا كان لديك جدول upsellOffers:
        /*
        const upsellOffer = await prisma.upsellOffer.findUnique({
            where: { id: upsellId }
        });

        if (upsellOffer) {
            const currentStats = upsellOffer.statistics as any || {};
            const updatedStats = {
                ...currentStats,
                views: (currentStats.views || 0) + (action === 'viewed' ? 1 : 0),
                clicks: (currentStats.clicks || 0) + (action === 'accepted' ? 1 : 0),
                conversions: (currentStats.conversions || 0) + (action === 'accepted' ? 1 : 0),
                lastAction: action,
                lastActionAt: new Date().toISOString()
            };

            await prisma.upsellOffer.update({
                where: { id: upsellId },
                data: {
                    statistics: updatedStats
                }
            });
        }
        */
    } catch (error) {
        console.error("❌ Error updating upsell statistics:", error);
    }
}