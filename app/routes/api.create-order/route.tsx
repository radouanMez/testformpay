import type { ActionFunction } from "react-router";
import { prisma } from "../../db.server";
import { convertToBoolean, getClientIP, cleanValue } from "./utils/security.utils";
import { checkBlockingSettings } from "./services/blocking.service";
import { createShopifyOrder } from "./services/shopify.service";
import { sendToGoogleSheets } from "./services/google-sheets.service";
import { corsHeaders, generateRedirectURL } from "./utils/response.utils";

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
        const formData = await request.formData();
        const shop = formData.get("shop") as string;

        if (!shop) {
            return new Response(
                JSON.stringify({ success: false, error: "Shop parameter required" }),
                { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
        }

        const clientIP = getClientIP(request);
        console.log("🔍 Client IP:", clientIP);

        // التحقق من الحظر
        const blockingCheck = await checkBlockingSettings(shop, formData, clientIP);
        if (blockingCheck.blocked) {
            return new Response(
                JSON.stringify({ success: true, error: "order_blocked", message: blockingCheck.message }),
                { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
        }

        const user = await prisma.user.findUnique({
            where: { shop },
            include: {
                sessions: true,
                googleSheetsIntegration: true,
            }
        });

        if (!user || !user.sessions[0]?.accessToken) {
            return new Response(
                JSON.stringify({ success: false, error: "No access token found" }),
                { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
        }

        const accessToken = user.sessions[0].accessToken;

        // 🔥 استخراج جميع البيانات من الفورم
        const first_name = (formData.get("first_name") as string) || "";
        const last_name = (formData.get("last_name") as string) || "";
        const address = (formData.get("address") as string) || "";
        const address_2 = (formData.get("address_2") as string) || "";
        const province = (formData.get("province") as string) || "";
        const city = (formData.get("city") as string) || "";
        const zip_code = (formData.get("zip_code") as string) || "";
        const phone_number = (formData.get("phone_number") as string) || "";
        const email = (formData.get("email") as string) || "";
        const shipping_method = (formData.get("shipping_method") as string) || "";
        const variantId = (formData.get("variantId") as string) || "";
        const quantity = (formData.get("quantity") as string) || "1";

        // 🔥 تنظيف جميع القيم
        const cleanFirstName = cleanValue(first_name);
        const cleanLastName = cleanValue(last_name);
        const cleanAddress = cleanValue(address);
        const cleanAddress2 = cleanValue(address_2);
        const cleanProvince = cleanValue(province);
        const cleanCity = cleanValue(city);
        const cleanZipCode = cleanValue(zip_code);
        const cleanPhone = cleanValue(phone_number);
        const cleanEmail = cleanValue(email);

        console.log("🧹 Cleaned Form Data:", {
            firstName: cleanFirstName,
            lastName: cleanLastName,
            address: cleanAddress,
            address2: cleanAddress2,
            province: cleanProvince,
            city: cleanCity,
            zipCode: cleanZipCode,
            phone: cleanPhone,
            email: cleanEmail
        });

        // 🔥 استخراج config والتحقق من القيم
        const configData = formData.get("config") as string;
        let config = null;
        let orderOptions = {
            createCODOrders: false,
            saveAsDraft: false,
            saveUTM: false
        };

        try {
            if (configData) {
                config = JSON.parse(configData);
                console.log("🔍 Full Config Structure:", config);

                if (config.form?.general?.orderOptions) {
                    const opts = config.form.general.orderOptions;
                    orderOptions = {
                        createCODOrders: convertToBoolean(opts.createCODOrders),
                        saveAsDraft: convertToBoolean(opts.saveAsDraft),
                        saveUTM: convertToBoolean(opts.saveUTM)
                    };
                    console.log("✅ Order Options found in config.form.general.orderOptions:", orderOptions);
                }
                else if (config.general?.orderOptions) {
                    const opts = config.general.orderOptions;
                    orderOptions = {
                        createCODOrders: convertToBoolean(opts.createCODOrders),
                        saveAsDraft: convertToBoolean(opts.saveAsDraft),
                        saveUTM: convertToBoolean(opts.saveUTM)
                    };
                    console.log("✅ Order Options found in config.general.orderOptions:", orderOptions);
                } else {
                    console.log("⚠️ orderOptions not found in expected locations");
                }
            }
        } catch (e) {
            console.error("❌ Error parsing config:", e);
        }

        console.log("⚙️ Final Order Options:", orderOptions);

        let product = null;
        let shipping = null;
        let totals = null;

        try {
            const productData = formData.get("product") as string;
            if (productData) product = JSON.parse(productData);
        } catch (e) {
            console.error("❌ Error parsing product:", e);
        }

        try {
            const shippingData = formData.get("shipping") as string;
            if (shippingData) shipping = JSON.parse(shippingData);
        } catch (e) {
            console.error("❌ Error parsing shipping:", e);
        }

        try {
            const totalsData = formData.get("totals") as string;
            if (totalsData) totals = JSON.parse(totalsData);
        } catch (e) {
            console.error("❌ Error parsing totals:", e);
        }

        // 🔥 معالجة اسم العميل بشكل محسن
        let customerFirstName = cleanFirstName;
        let customerLastName = cleanLastName;

        if (!customerFirstName && !customerLastName) {
            customerFirstName = " ";
            customerLastName = `#${Date.now()}`;
        }
        else if (customerFirstName && !customerLastName && customerFirstName.includes(' ')) {
            const names = customerFirstName.split(' ');
            customerFirstName = names[0] || " ";
            customerLastName = names.slice(1).join(' ') || " ";
        }
        else if (!customerFirstName && customerLastName && customerLastName.includes(' ')) {
            const names = customerLastName.split(' ');
            customerFirstName = names[0] || " ";
            customerLastName = names.slice(1).join(' ') || " ";
        }
        else if (!customerFirstName && customerLastName) {
            customerFirstName = " ";
        }
        else if (customerFirstName && !customerLastName) {
            customerLastName = " ";
        }

        console.log("👤 Processed Customer Name:", {
            firstName: customerFirstName,
            lastName: customerLastName
        });

        // 📝 1. حفظ الطلب في قاعدة البيانات المحلية
        const localOrder = await prisma.order.create({
            data: {
                userId: user.id,
                shop: user.shop,
                status: "pending",
                orderNumber: `ORD-${Date.now()}`,

                customer: {
                    first_name: customerFirstName,
                    last_name: customerLastName,
                    address: cleanAddress,
                    address_2: cleanAddress2,
                    province: cleanProvince,
                    city: cleanCity,
                    zip_code: cleanZipCode,
                    phone: cleanPhone,
                    email: cleanEmail
                },
                shipping: shipping,
                items: [{ product, variantId, quantity: parseInt(quantity) || 1 }],
                totals: totals,

                customerEmail: cleanEmail,
                customerPhone: cleanPhone,
                totalAmount: totals?.total,
                clientIP: clientIP,

                metadata: {
                    submittedAt: new Date().toISOString(),
                    source: "formino-app",
                    step: "saved_locally",
                    orderOptions: orderOptions,
                    config: config,
                    originalNames: {
                        first_name: cleanFirstName,
                        last_name: cleanLastName
                    },
                    cleanedData: {
                        address: cleanAddress,
                        city: cleanCity,
                        province: cleanProvince,
                        zip_code: cleanZipCode
                    }
                }
            },
        });

        console.log("✅ Order saved to local database, ID:", localOrder.id);

        let shopifyResponse = null;
        let shopifyError = null;
        let shopifyOrderType = "none";

        // 🚀 2. إنشاء الطلب في Shopify
        try {
            const customerData = {
                firstName: customerFirstName,
                lastName: customerLastName,
                email: cleanEmail,
                phone: cleanPhone,
                address: cleanAddress,
                address2: cleanAddress2,
                city: cleanCity,
                province: cleanProvince,
                zipCode: cleanZipCode
            };

            shopifyResponse = await createShopifyOrder(
                shop,
                accessToken,
                variantId,
                quantity,
                product,
                shipping,
                customerData,
                orderOptions,
                clientIP // 🔥 إضافة الـ IP هنا
            );

            shopifyOrderType = orderOptions.saveAsDraft ? "draft_order" : "order";
            console.log(`✅ ${shopifyOrderType} created in Shopify:`,
                shopifyResponse.draft_order?.id || shopifyResponse.order?.id);


        } catch (shopifyErr: any) {
            shopifyError = {
                status: 500,
                message: shopifyErr.message,
                type: "shopify_error"
            };
            console.error("❌ Error creating Shopify order:", shopifyErr);
        }

        // 🔄 3. تحديث الطلب المحلي بنتيجة Shopify
        if (shopifyResponse) {
            const updateData: any = {
                metadata: {
                    submittedAt: new Date().toISOString(),
                    source: "formino-app",
                    orderOptions: orderOptions,
                    clientIP: clientIP,
                    config: config,
                    step: `sent_to_shopify_${shopifyOrderType}`,
                    shopifyResponse: shopifyResponse,
                    processedNames: {
                        first_name: customerFirstName,
                        last_name: customerLastName
                    },
                    cleanedData: {
                        address: cleanAddress,
                        city: cleanCity,
                        province: cleanProvince,
                        zip_code: cleanZipCode
                    }
                }
            };

            if (shopifyOrderType === "draft_order" && shopifyResponse.draft_order) {
                updateData.metadata.shopifyDraftOrderId = shopifyResponse.draft_order.id;
                updateData.metadata.shopifyDraftOrderNumber = shopifyResponse.draft_order.name;
            } else if (shopifyOrderType === "order" && shopifyResponse.order) {
                updateData.metadata.shopifyOrderId = shopifyResponse.order.id;
                updateData.metadata.shopifyOrderNumber = shopifyResponse.order.order_number;
            }

            await prisma.order.update({
                where: { id: localOrder.id },
                data: updateData
            });
        }

        // 📊 4. الإرسال إلى Google Sheets إذا كان التكامل مفعل
        let googleSheetsResponse = null;
        let googleSheetsError = null;

        if (user.googleSheetsIntegration?.enabled && user.googleSheetsIntegration?.accessToken) {
            console.log("📊 Google Sheets integration enabled, sending data...");

            try {
                if (!user.googleSheetsIntegration.spreadsheetId) {
                    console.log("⚠️ Google Sheets integration enabled but no spreadsheet ID configured");
                    googleSheetsError = {
                        message: "No spreadsheet ID configured",
                        type: "configuration_error"
                    };
                } else {
                    googleSheetsResponse = await sendToGoogleSheets({
                        formData: {
                            first_name: customerFirstName,
                            last_name: customerLastName,
                            email: cleanEmail,
                            phone: cleanPhone,
                            address: cleanAddress,
                            address_2: cleanAddress2,
                            city: cleanCity,
                            province: cleanProvince,
                            zip_code: cleanZipCode,

                            order_number: localOrder.orderNumber,
                            product_title: product?.title,
                            variant_id: variantId,
                            quantity: parseInt(quantity) || 1,
                            total: totals?.total,

                            shipping_method: shipping_method,
                            shopify_order_id: shopifyResponse?.draft_order?.id || shopifyResponse?.order?.id,
                            shopify_order_number: shopifyResponse?.draft_order?.name || shopifyResponse?.order?.order_number,
                            order_type: shopifyOrderType,
                            created_at: new Date().toISOString()
                        },
                        integration: user.googleSheetsIntegration,
                        config: config
                    });

                    console.log("✅ Data sent to Google Sheets successfully");
                }
            } catch (sheetsError: any) {
                googleSheetsError = {
                    message: sheetsError.message,
                    type: "google_sheets_error"
                };
                console.error("❌ Error sending data to Google Sheets:", sheetsError);
            }
        } else {
            console.log("📊 Google Sheets integration not enabled or not configured");
        }

        // 📤 5. إعداد الرد النهائي
        const responseBody = {
            success: true,
            message: shopifyResponse ?
                `Order created successfully in Shopify as ${shopifyOrderType}` :
                "Order saved locally (Shopify integration failed)",

            localOrder: {
                id: localOrder.id,
                orderNumber: localOrder.orderNumber,
                status: localOrder.status,
                createdAt: localOrder.createdAt
            },

            shopify: {
                success: !!shopifyResponse,
                orderType: shopifyOrderType,
                orderId: shopifyResponse?.draft_order?.id || shopifyResponse?.order?.id,
                orderNumber: shopifyResponse?.draft_order?.name || shopifyResponse?.order?.order_number,
                financialStatus: shopifyResponse?.order?.financial_status,
                isCOD: orderOptions.createCODOrders,
                isDraft: orderOptions.saveAsDraft,
                response: shopifyResponse,
                error: shopifyError
            },

            googleSheets: {
                success: !!googleSheetsResponse,
                enabled: user.googleSheetsIntegration?.enabled || false,
                response: googleSheetsResponse,
                error: googleSheetsError
            },

            configuration: {
                saveAsDraft: orderOptions.saveAsDraft,
                createCODOrders: orderOptions.createCODOrders,
                saveUTM: orderOptions.saveUTM
            },

            customer: {
                name: `${customerFirstName} ${customerLastName}`.trim(),
                firstName: customerFirstName,
                lastName: customerLastName,
                email: cleanEmail,
                phone: cleanPhone,
                address: {
                    address1: cleanAddress,
                    address2: cleanAddress2,
                    city: cleanCity,
                    province: cleanProvince,
                    zipCode: cleanZipCode,
                    country: "Morocco"
                }
            },

            orderSummary: {
                itemsCount: 1,
                total: totals?.total,
                shipping: shipping?.price,
                subtotal: totals?.subtotal
            },

            shop: user.shop,

            redirect: {
                type: config?.form?.general?.redirectOptions?.redirectType || "default",
                customURL: config?.form?.general?.redirectOptions?.customURL || "",
                whatsAppNumber: config?.form?.general?.redirectOptions?.whatsAppNumber || "",
                whatsAppMessage: config?.form?.general?.redirectOptions?.whatsAppMessage || "",
                thankYouMessage: config?.form?.general?.redirectOptions?.thankYouMessage || "Thank you for your purchase! 🎉\nWe will contact you soon to confirm your order. ✅",

                redirectURL: generateRedirectURL(
                    config?.form?.general?.redirectOptions,
                    shopifyResponse,
                    user.shop
                ),

                orderStatusUrl: shopifyResponse?.draft_order?.order_status_url || shopifyResponse?.order?.order_status_url
            }
        };

        console.log("📤 Sending final response");

        return new Response(JSON.stringify(responseBody), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
            },
        });

    } catch (error: any) {
        console.error("❌ Error in create-order API:", error);

        const errorBody = JSON.stringify({
            success: false,
            error: "Failed to create order",
            details: error.message
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