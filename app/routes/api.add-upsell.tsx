// api/add-upsell.tsx
import type { ActionFunction, LoaderFunction } from "react-router";
import { prisma } from "../db.server";
import { createShopifyOrder } from "./api.create-order/services/shopify.service";
import { corsHeaders, generateRedirectURL } from "./api.create-order/utils/response.utils";
import { getClientIP, cleanValue } from "./api.create-order/utils/security.utils";

// 🔧 إضافة Loader فارغ
export const loader: LoaderFunction = async ({ request }) => {
    // معالجة CORS للـ GET/OPTIONS requests
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 200,
            headers: corsHeaders
        });
    }

    // رد بسيط للـ GET requests
    return new Response(
        JSON.stringify({
            message: "Upsell API endpoint",
            usage: "POST JSON data to add upsell products",
            allowedMethods: ["POST", "OPTIONS"]
        }),
        {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                ...corsHeaders
            }
        }
    );
};

// دالة مساعدة للتعامل مع metadata بأمان
function safeMetadataMerge(current: any, updates: any): any {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
        return updates;
    }
    return {
        ...current,
        ...updates
    };
}

// دالة لإضافة منتج لـ Draft Order
async function addLineItemToDraftOrder(shop: string, accessToken: string, orderId: string, variantId: string, productData?: any) {
    try {
        // تحويل orderId إلى string لتجنب مشاكل parseInt
        const orderIdStr = String(orderId);

        console.log(`📤 Fetching draft order ${orderIdStr} from Shopify...`);

        // أولاً: الحصول على الطلب الحالي
        const getResponse = await fetch(`https://${shop}/admin/api/2024-01/draft_orders/${orderIdStr}.json`, {
            method: 'GET',
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json',
            },
        });

        if (!getResponse.ok) {
            const errorText = await getResponse.text();
            throw new Error(`Failed to fetch draft order: ${getResponse.status} - ${errorText}`);
        }

        const existingOrder = await getResponse.json();
        const existingLineItems = existingOrder.draft_order?.line_items || [];

        console.log(`📦 Found ${existingLineItems.length} existing line items`);

        // إضافة المنتج الجديد
        const line_items = [
            ...existingLineItems,
            {
                variant_id: parseInt(variantId),
                quantity: 1,
                title: productData?.title || "Upsell Product",
                price: productData?.price || "0.00",
                ...(productData?.properties && { properties: productData.properties })
            }
        ];

        console.log(`📤 Adding new line item with variant ${variantId}...`);

        // تحديث الطلب
        const updateResponse = await fetch(`https://${shop}/admin/api/2024-01/draft_orders/${orderIdStr}.json`, {
            method: 'PUT',
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                draft_order: {
                    line_items: line_items,
                    note: (existingOrder.draft_order?.note || "") + "\n\n➕ Added upsell product via Formino App"
                }
            })
        });

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(`Shopify API error: ${JSON.stringify(errorData.errors || errorData.message)}`);
        }

        const result = await updateResponse.json();
        console.log("✅ Draft order updated successfully");
        return result;
    } catch (error: any) {
        console.error("❌ Error adding line item to draft order:", error);
        throw error;
    }
}

// دالة لإضافة منتج لـ Order عادي
async function addLineItemToOrder(
    shop: string,
    accessToken: string,
    orderId: string,
    variantId: string,
    productData?: any
) {
    const orderIdStr = String(orderId);

    const response = await fetch(
        `https://${shop}/admin/api/2024-01/orders/${orderIdStr}/line_items.json`,
        {
            method: 'POST',
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                line_item: {
                    variant_id: Number(variantId),
                    quantity: 1,
                    properties: productData?.properties || [],
                }
            })
        }
    );

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Shopify error ${response.status}: ${text}`);
    }

    // ✅ لا تحاول parse JSON إذا كان الرد فارغ
    const text = await response.text();

    if (!text) {
        return {
            success: true,
            message: 'Line item added (empty response from Shopify)',
            orderId: orderIdStr,
            variantId
        };
    }

    try {
        return JSON.parse(text);
    } catch {
        return {
            success: true,
            message: 'Line item added (non-JSON response)',
            raw: text
        };
    }
}


export const action: ActionFunction = async ({ request }) => {
    // التحقق من أن الطريقة هي POST
    if (request.method !== "POST") {
        return new Response(
            JSON.stringify({ success: false, error: "Method not allowed" }),
            {
                status: 405,
                headers: {
                    "Content-Type": "application/json",
                    ...corsHeaders
                }
            }
        );
    }

    try {
        const contentType = request.headers.get("content-type") || "";
        let payload: any;

        console.log("📥 Received POST request with content-type:", contentType);

        // التحقق من نوع البيانات
        if (contentType.includes("application/json")) {
            payload = await request.json();
        } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
            const formData = await request.formData();
            payload = Object.fromEntries(formData);

            // محاولة parse الحقول التي قد تكون JSON strings
            if (payload.config && typeof payload.config === 'string') {
                try {
                    payload.config = JSON.parse(payload.config);
                } catch (e) {
                    console.warn("⚠️ Could not parse config string");
                }
            }
            if (payload.product && typeof payload.product === 'string') {
                try {
                    payload.product = JSON.parse(payload.product);
                } catch (e) {
                    console.warn("⚠️ Could not parse product string");
                }
            }
        } else {
            throw new Error("Unsupported content type. Please use application/json");
        }

        console.log("📦 Parsed payload:", JSON.stringify(payload, null, 2));

        const {
            shop,
            orderId,
            variantId,
            product,
            shipping,
            fields,
            config,
            customerData,
            originalOrderId,
            actionType = "upsell",
            quantity = "1",
            orderType = "order",
            upsellProductId, // هذا قد يكون Product ID وليس Variant ID
        } = payload;

        if (!shop) {
            throw new Error("Shop parameter required");
        }

        // 🔍 البحث عن المستخدم
        const user = await prisma.user.findUnique({
            where: { shop },
            include: {
                sessions: true,
                googleSheetsIntegration: true,
            }
        });

        if (!user || !user.sessions[0]?.accessToken) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "No access token found for this shop"
                }),
                {
                    status: 401,
                    headers: {
                        "Content-Type": "application/json",
                        ...corsHeaders
                    }
                }
            );
        }

        const accessToken = user.sessions[0].accessToken;

        // 🎯 معالجة Upsell (إضافة منتج لطلب موجود)
        if (actionType === "upsell" && orderId) {
            console.log("➕ Processing Upsell for Shopify Order:", orderId);
            console.log("➕ Order Type:", orderType);

            // الحصول على variantId الصحيح
            const targetVariantId = variantId || upsellProductId;

            if (!targetVariantId) {
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: "Variant ID or Product ID is required for upsell"
                    }),
                    {
                        status: 400,
                        headers: {
                            "Content-Type": "application/json",
                            ...corsHeaders
                        }
                    }
                );
            }

            console.log("➕ Target Variant/Product ID:", targetVariantId);

            let productData: any = {};
            if (product) {
                productData = product;
            } else {
                // استخدام بيانات افتراضية إذا لم تكن موجودة
                productData = {
                    title: "Upsell Product",
                    price: "0.00"
                };
            }

            let shopifyResponse = null;
            let errorMessage = null;

            try {
                // إضافة المنتج إلى Shopify بناءً على نوع الطلب
                if (orderType === "draft_order") {
                    console.log("📤 Adding to draft order");
                    shopifyResponse = await addLineItemToDraftOrder(shop, accessToken, orderId, targetVariantId, productData);
                } else {
                    console.log("📤 Adding to regular order");
                    shopifyResponse = await addLineItemToOrder(shop, accessToken, orderId, targetVariantId, productData);
                }
                console.log("✅ Shopify response received");
            } catch (shopifyError: any) {
                errorMessage = shopifyError.message;
                console.error("❌ Shopify error:", shopifyError);
            }

            // 📊 تحديث قاعدة البيانات المحلية
            let localUpdateSuccess = false;
            if (originalOrderId) {
                try {
                    const localOrder = await prisma.order.findUnique({
                        where: { id: originalOrderId }
                    });

                    if (localOrder) {
                        // تحديث metadata
                        const currentMetadata = localOrder.metadata as Record<string, any> || {};
                        const updatedMetadata = safeMetadataMerge(currentMetadata, {
                            upsellAdded: true,
                            upsellProductId: targetVariantId,
                            upsellAddedAt: new Date().toISOString(),
                            shopifyUpsellResponse: shopifyResponse,
                            shopifyError: errorMessage,
                            lastUpdated: new Date().toISOString()
                        });

                        // تحديث items
                        const currentItems = Array.isArray(localOrder.items) ? localOrder.items : [];
                        const updatedItems = [
                            ...currentItems,
                            {
                                product: productData,
                                variantId: targetVariantId,
                                quantity: parseInt(quantity) || 1,
                                isUpsell: true,
                                addedAt: new Date().toISOString()
                            }
                        ];

                        await prisma.order.update({
                            where: { id: originalOrderId },
                            data: {
                                items: updatedItems,
                                metadata: updatedMetadata
                            }
                        });

                        localUpdateSuccess = true;
                        console.log("✅ Local database updated successfully");
                    }
                } catch (dbError: any) {
                    console.error("❌ Database update error:", dbError);
                }
            }

            // 📤 إعداد الرد
            const responseBody = {
                success: !errorMessage,
                message: errorMessage ? "Failed to add upsell to Shopify" : "Upsell product added successfully",
                shopifyResponse: shopifyResponse,
                shopifyError: errorMessage,
                localOrderUpdated: localUpdateSuccess,
                originalOrderId: originalOrderId,
                shopifyOrderId: orderId,
                variantId: targetVariantId
            };

            return new Response(JSON.stringify(responseBody), {
                status: errorMessage ? 400 : 200,
                headers: {
                    "Content-Type": "application/json",
                    ...corsHeaders
                }
            });
        }

        // 🛒 الحالة الثانية: إنشاء طلب جديد كامل (إذا لم يكن upsell)
        console.log("🛒 Creating new order (not upsell)");

        // ❌ هذه هي المشكلة! أنت تحاول إنشاء طلب جديد بدون variantId
        if (!variantId) {
            throw new Error("Variant ID is required to create a new order");
        }

        const clientIP = getClientIP(request);

        // استخدام customerData إذا كانت موجودة، وإلا استخدام fields
        const customerInfo = customerData || fields || {};

        // تنظيف ومعالجة بيانات العميل
        const cleanedCustomerData = {
            firstName: cleanValue(customerInfo.firstName || customerInfo.first_name || customerInfo.name?.split(' ')[0] || ""),
            lastName: cleanValue(customerInfo.lastName || customerInfo.last_name || customerInfo.name?.split(' ').slice(1).join(' ') || ""),
            email: cleanValue(customerInfo.email || ""),
            phone: cleanValue(customerInfo.phone || ""),
            address: cleanValue(
                typeof customerInfo.address === 'string' ? customerInfo.address :
                    (customerInfo.address?.address1 || customerInfo.address || "")
            ),
            address2: cleanValue(
                typeof customerInfo.address === 'string' ? "" :
                    (customerInfo.address?.address2 || customerInfo.address2 || "")
            ),
            city: cleanValue(customerInfo.city || ""),
            province: cleanValue(customerInfo.province || ""),
            zipCode: cleanValue(customerInfo.zipCode || customerInfo.zip_code || "")
        };

        console.log("👤 Cleaned customer data:", cleanedCustomerData);

        // تحليل التهيئة
        const parsedConfig = config || {};
        const orderOptions = {
            createCODOrders: parsedConfig.createCODOrders !== undefined ? parsedConfig.createCODOrders : true,
            saveAsDraft: parsedConfig.saveAsDraft !== undefined ? parsedConfig.saveAsDraft : false,
            saveUTM: parsedConfig.saveUTM !== undefined ? parsedConfig.saveUTM : false
        };

        console.log("⚙️ Order options:", orderOptions);

        // تحليل بيانات المنتج
        let productData: any = {};
        if (product) {
            productData = product;
        } else {
            // استخدام بيانات افتراضية إذا لم تكن موجودة
            productData = {
                title: "Product",
                price: "0.00"
            };
        }

        // إصلاح: التأكد من أن productData يحتوي على title
        if (!productData.title || productData.title.trim() === "") {
            productData.title = "Product";
        }

        console.log("📦 Product data:", productData);

        // تحليل بيانات الشحن
        let shippingData: any = null;
        if (shipping) {
            shippingData = shipping;
        }

        console.log("🚚 Shipping data:", shippingData);

        // إنشاء الطلب في Shopify
        console.log(`🛍️ Creating Shopify order with variant ${variantId}...`);

        const shopifyResponse = await createShopifyOrder(
            shop,
            accessToken,
            variantId,
            quantity,
            productData,
            shippingData,
            cleanedCustomerData,
            orderOptions,
            clientIP
        );

        console.log("✅ Shopify order created:", shopifyResponse);

        const finalOrderId = shopifyResponse?.draft_order?.id || shopifyResponse?.order?.id;
        const finalOrderType = shopifyResponse?.draft_order ? "draft_order" : "order";

        return new Response(JSON.stringify({
            success: true,
            orderId: finalOrderId,
            orderType: finalOrderType,
            redirectURL: generateRedirectURL(
                parsedConfig.redirectOptions,
                shopifyResponse,
                shop
            ),
            shopifyResponse: shopifyResponse
        }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                ...corsHeaders
            }
        });

    } catch (error: any) {
        console.error("❌ Action Error:", error);

        return new Response(JSON.stringify({
            success: false,
            error: error.message || "Internal server error",
            details: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                stack: error.stack
            } : undefined
        }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                ...corsHeaders
            }
        });
    }
};