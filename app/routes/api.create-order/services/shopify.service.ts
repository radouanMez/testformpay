interface OrderOptions {
    createCODOrders: boolean;
    saveAsDraft: boolean;
    saveUTM: boolean;
}

interface CustomerData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    address2: string;
    city: string;
    province: string;
    zipCode: string;
}

export async function createShopifyOrder(
    shop: string,
    accessToken: string,
    variantId: string,
    quantity: string,
    product: any,
    shipping: any,
    customerData: CustomerData,
    orderOptions: OrderOptions,
    clientIP: string
) {
    const shopifyOrderType = orderOptions.saveAsDraft ? "draft_order" : "order";
    console.log(`🛍️ Creating ${shopifyOrderType} in Shopify`);

    try {
        if (orderOptions.saveAsDraft) {
            return await createDraftOrder(shop, accessToken, variantId, quantity, product, shipping, customerData, orderOptions, clientIP);
        } else {
            return await createFullOrder(shop, accessToken, variantId, quantity, product, shipping, customerData, orderOptions, clientIP);
        }
    } catch (error: any) {
        console.error(`❌ Error creating ${shopifyOrderType}:`, error);
        throw error;
    }
}

async function createDraftOrder(shop: string, accessToken: string, variantId: string, quantity: string, product: any, shipping: any, customerData: CustomerData, orderOptions: OrderOptions, clientIP: string) {

    const customerNote = generateCustomerNote(customerData, clientIP, orderOptions);

    const draftOrderData = {
        draft_order: {
            line_items: [{
                variant_id: parseInt(variantId),
                quantity: parseInt(quantity) || 1,
                title: product?.title,
                price: product?.price,
            }],
            customer: {
                first_name: customerData.firstName,
                last_name: customerData.lastName,
                email: customerData.email,
                phone: customerData.phone,
            },
            shipping_address: {
                first_name: customerData.firstName,
                last_name: customerData.lastName,
                address1: customerData.address || "Address not provided",
                address2: customerData.address2 || "",
                city: customerData.city || "City not provided",
                province: customerData.province || "",
                zip: customerData.zipCode || "",
                country: "MA",
                phone: customerData.phone,
            },
            billing_address: {
                first_name: customerData.firstName,
                last_name: customerData.lastName,
                address1: customerData.address || "Address not provided",
                address2: customerData.address2 || "",
                city: customerData.city || "City not provided",
                province: customerData.province || "",
                zip: customerData.zipCode || "",
                country: "MA",
                phone: customerData.phone,
            },
            email: customerData.email,
            phone: customerData.phone,
            note: customerNote,
            tags: "formino-app,draft-order",
            shipping_line: shipping?.price ? {
                title: shipping.name || "Shipping",
                price: shipping.price,
                code: shipping.method_id || "standard"
            } : null,
        }
    };

    console.log("📤 Draft Order Data to Shopify:", JSON.stringify(draftOrderData, null, 2));

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
        throw new Error(`Shopify Draft Order API error: ${errorData.errors || errorData.message}`);
    }

    return await response.json();
}

async function createFullOrder(shop: string, accessToken: string, variantId: string, quantity: string, product: any, shipping: any, customerData: CustomerData, orderOptions: OrderOptions, clientIP: string) {
    try {
        // 🔥 البحث عن العميل الحالي بواسطة البريد الإلكتروني أو الهاتف
        let existingCustomer = null;

        if (customerData.email && customerData.email.trim() !== '') {
            existingCustomer = await findCustomerByEmail(shop, accessToken, customerData.email);
        }

        if (!existingCustomer && customerData.phone && customerData.phone.trim() !== '') {
            existingCustomer = await findCustomerByPhone(shop, accessToken, customerData.phone);
        }

        // 🔥 إنشاء note
        const customerNote = generateCustomerNote(customerData, clientIP, orderOptions);

        console.log("*******************************************************************************")
        console.log(shipping)

        const orderData: any = {
            order: {
                line_items: [{
                    variant_id: parseInt(variantId),
                    quantity: parseInt(quantity) || 1,
                    title: product?.title,
                    price: product?.price,
                }],
                // 🔥 استخدام العميل الحالي إذا وجد، وإلا إنشاء جديد
                customer: existingCustomer ? {
                    id: existingCustomer.id,
                    first_name: existingCustomer.first_name || customerData.firstName,
                    last_name: existingCustomer.last_name || customerData.lastName,
                    email: existingCustomer.email || customerData.email,
                    phone: existingCustomer.phone || customerData.phone,
                } : {
                    first_name: customerData.firstName,
                    last_name: customerData.lastName,
                    email: customerData.email || "",
                    phone: customerData.phone || "",
                },
                shipping_address: {
                    first_name: customerData.firstName,
                    last_name: customerData.lastName,
                    address1: customerData.address || "Address not provided",
                    address2: customerData.address2 || "",
                    city: customerData.city || "City not provided",
                    province: customerData.province || "",
                    zip: customerData.zipCode || "",
                    country: "MA",
                    phone: customerData.phone || "",
                },
                billing_address: {
                    first_name: customerData.firstName,
                    last_name: customerData.lastName,
                    address1: customerData.address || "Address not provided",
                    address2: customerData.address2 || "",
                    city: customerData.city || "City not provided",
                    province: customerData.province || "",
                    zip: customerData.zipCode || "",
                    country: "MA",
                    phone: customerData.phone || "",
                },
                email: customerData.email || "", // يمكن أن يكون فارغاً
                phone: customerData.phone || "", // يمكن أن يكون فارغاً
                financial_status: orderOptions.createCODOrders ? "pending" : "pending",
                send_receipt: false, 
                send_fulfillment_receipt: false,
                note: customerNote,
                tags: "formpay-app" + (orderOptions.createCODOrders ? ",cod" : ""),
                shipping_lines: shipping ? [
                    {
                        title: shipping.name || "Standard Shipping",
                        price: String(shipping.price),
                        code: shipping.id || "standard"
                    }
                ] : [],
            }
        };

        if (orderOptions.createCODOrders) {
            orderData.order.tags += ",cash-on-delivery";
        }

        console.log("📤 Full Order Data to Shopify:", JSON.stringify(orderData, null, 2));

        const response = await fetch(`https://${shop}/admin/api/2024-01/orders.json`, {
            method: "POST",
            headers: {
                "X-Shopify-Access-Token": accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(orderData),
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error("❌ Shopify API Error Details:", responseData);

            // 🔥 محاولة بديلة: إنشاء الطلب بدون بيانات العميل
            if (responseData.errors && hasCustomerErrors(responseData.errors)) {
                console.log("🔄 Trying without customer data...");
                return await createOrderWithoutCustomer(shop, accessToken, variantId, quantity, product, customerNote, orderOptions);
            }

            throw new Error(`Shopify Order API error: ${JSON.stringify(responseData.errors || responseData.message)}`);
        }

        return responseData;

    } catch (error) {
        console.error("❌ Detailed error in createFullOrder:", error);
        throw error;
    }
}

async function findCustomerByEmail(shop: string, accessToken: string, email: string) {
    try {
        const response = await fetch(`https://${shop}/admin/api/2024-01/customers/search.json?query=email:${encodeURIComponent(email)}`, {
            method: "GET",
            headers: {
                "X-Shopify-Access-Token": accessToken,
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            const data = await response.json();
            return data.customers && data.customers.length > 0 ? data.customers[0] : null;
        }
        return null;
    } catch (error) {
        console.error("❌ Error searching customer by email:", error);
        return null;
    }
}

async function findCustomerByPhone(shop: string, accessToken: string, phone: string) {
    try {
        const response = await fetch(`https://${shop}/admin/api/2024-01/customers/search.json?query=phone:${encodeURIComponent(phone)}`, {
            method: "GET",
            headers: {
                "X-Shopify-Access-Token": accessToken,
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            const data = await response.json();
            return data.customers && data.customers.length > 0 ? data.customers[0] : null;
        }
        return null;
    } catch (error) {
        console.error("❌ Error searching customer by phone:", error);
        return null;
    }
}

function hasCustomerErrors(errors: any): boolean {
    const customerErrorKeys = ['customer', 'email', 'phone', 'first_name', 'last_name'];
    return Object.keys(errors).some(key =>
        customerErrorKeys.some(customerKey => key.toLowerCase().includes(customerKey))
    );
}

async function createOrderWithoutCustomer(shop: string, accessToken: string, variantId: string, quantity: string, product: any, note: string, orderOptions: OrderOptions) {
    const orderData: any = {
        order: {
            line_items: [{
                variant_id: parseInt(variantId),
                quantity: parseInt(quantity) || 1,
                title: product?.title,
                price: product?.price,
            }],
            // 🔥 لا نرسل بيانات العميل نهائياً
            shipping_address: {
                first_name: "Customer",
                last_name: "Formino",
                address1: "Address not provided",
                city: "City not provided",
                country: "MA",
            },
            billing_address: {
                first_name: "Customer",
                last_name: "Formino",
                address1: "Address not provided",
                city: "City not provided",
                country: "MA",
            },
            financial_status: orderOptions.createCODOrders ? "pending" : "pending",
            send_receipt: false,
            send_fulfillment_receipt: false,
            note: note + "\n\n⚠️ Created without customer data due to validation issues",
            tags: "formino-app" + (orderOptions.createCODOrders ? ",cod" : ""),
            shipping_lines: [],
        }
    };

    if (orderOptions.createCODOrders) {
        orderData.order.tags += ",cash-on-delivery";
    }

    console.log("📤 Order Data Without Customer:", JSON.stringify(orderData, null, 2));

    const response = await fetch(`https://${shop}/admin/api/2024-01/orders.json`, {
        method: "POST",
        headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Shopify Order API error (without customer): ${JSON.stringify(errorData.errors || errorData.message)}`);
    }

    return await response.json();
}

function generateCustomerNote(customerData: CustomerData, clientIP: string, orderOptions: OrderOptions): string {
    const noteLines = [
        "=== FORMINO APP ORDER ===",
        `📅 Created: ${new Date().toLocaleString()}`,
        `🌐 Source: Formino App`,
        `🖥️ Client IP: ${clientIP}`,
        "",
        "👤 CUSTOMER INFORMATION:"
    ];

    // إضافة معلومات العميل فقط إذا كانت تحتوي على قيمة
    if (customerData.firstName || customerData.lastName) {
        noteLines.push(`• Name: ${customerData.firstName} ${customerData.lastName}`.trim());
    }
    if (customerData.email) {
        noteLines.push(`• Email: ${customerData.email}`);
    }
    if (customerData.phone) {
        noteLines.push(`• Phone: ${customerData.phone}`);
    }

    noteLines.push("");

    // إضافة العنوان فقط إذا كانت هناك معلومات عنوان
    const hasAddressInfo = customerData.address || customerData.city || customerData.province || customerData.zipCode;
    if (hasAddressInfo) {
        noteLines.push("📍 SHIPPING ADDRESS:");
        if (customerData.address) {
            noteLines.push(`• Address: ${customerData.address}`);
        }
        if (customerData.address2) {
            noteLines.push(`• Address 2: ${customerData.address2}`);
        }
        if (customerData.city) {
            noteLines.push(`• City: ${customerData.city}`);
        }
        if (customerData.province) {
            noteLines.push(`• Province: ${customerData.province}`);
        }
        if (customerData.zipCode) {
            noteLines.push(`• ZIP Code: ${customerData.zipCode}`);
        }
        noteLines.push(`• Country: Morocco`);
        noteLines.push("");
    }

    noteLines.push(
        "⚙️ ORDER SETTINGS:",
        `• COD Orders: ${orderOptions.createCODOrders ? 'Yes' : 'No'}`,
        `• Save as Draft: ${orderOptions.saveAsDraft ? 'Yes' : 'No'}`,
        `• Save UTM: ${orderOptions.saveUTM ? 'Yes' : 'No'}`,
        "",
        "---",
        "Created via Formino App"
    );

    // تصفية الأسطر الفارغة ودمجها
    return noteLines.filter(line => line !== null && line !== "").join('\n');
}

function generateCustomerNoteShort(customerData: CustomerData, clientIP: string, orderOptions: OrderOptions): string {
    const lines = [
        "📋 Formino App Order"
    ];

    // إضافة معلومات العميل فقط إذا كانت تحتوي على قيمة
    if (customerData.firstName || customerData.lastName) {
        lines.push(`👤 ${customerData.firstName} ${customerData.lastName}`.trim());
    }
    if (customerData.email) {
        lines.push(`📧 ${customerData.email}`);
    }
    if (customerData.phone) {
        lines.push(`📞 ${customerData.phone}`);
    }

    // إضافة العنوان فقط إذا كانت هناك معلومات عنوان
    const hasAddressInfo = customerData.address || customerData.city || customerData.province || customerData.zipCode;
    if (hasAddressInfo) {
        const addressParts = [];
        if (customerData.address) addressParts.push(customerData.address);
        if (customerData.address2) addressParts.push(customerData.address2);
        if (customerData.city) addressParts.push(customerData.city);
        if (customerData.province) addressParts.push(customerData.province);
        if (customerData.zipCode) addressParts.push(customerData.zipCode);

        if (addressParts.length > 0) {
            lines.push(`📍 ${addressParts.join(', ')}`);
        }
        lines.push(`🌍 Morocco`);
    }

    lines.push(
        `🖥️ IP: ${clientIP}`,
        `💰 ${orderOptions.createCODOrders ? 'Cash on Delivery' : 'Standard Payment'}`,
        `📝 ${orderOptions.saveAsDraft ? 'Draft Order' : 'Regular Order'}`,
        `⏰ ${new Date().toLocaleString()}`
    );

    return lines.join('\n');
}

function generateCustomerNoteTable(customerData: CustomerData, clientIP: string, orderOptions: OrderOptions): string {

    const lines = [
        "FORMINO APP ORDER DETAILS",
        "========================"
    ];

    if (customerData.firstName || customerData.lastName) {
        lines.push(`Customer:    ${customerData.firstName} ${customerData.lastName}`.trim());
    }
    if (customerData.email) {
        lines.push(`Email:       ${customerData.email}`);
    }
    if (customerData.phone) {
        lines.push(`Phone:       ${customerData.phone}`);
    }

    const hasAddressInfo = customerData.address || customerData.city || customerData.province || customerData.zipCode;
    if (hasAddressInfo) {
        lines.push("---");
        if (customerData.address) {
            lines.push(`Address:     ${customerData.address}`);
        }
        if (customerData.address2) {
            lines.push(`Address 2:   ${customerData.address2}`);
        }
        if (customerData.city) {
            lines.push(`City:        ${customerData.city}`);
        }
        if (customerData.province) {
            lines.push(`Province:    ${customerData.province}`);
        }
        if (customerData.zipCode) {
            lines.push(`ZIP:         ${customerData.zipCode}`);
        }
        lines.push(`Country:     Morocco`);
    }

    lines.push(
        "---",
        `IP Address:  ${clientIP}`,
        `COD:         ${orderOptions.createCODOrders ? 'Yes' : 'No'}`,
        `Draft:       ${orderOptions.saveAsDraft ? 'Yes' : 'No'}`,
        `Created:     ${new Date().toLocaleString()}`,
        "",
        "Created via Formino App"
    );

    return lines.join('\n');
}

function hasValue(value: string | undefined | null): boolean {
    return value !== undefined && value !== null && value.trim() !== '';
}

function generateSmartCustomerNote(customerData: CustomerData, clientIP: string, orderOptions: OrderOptions): string {

    const filledFields = [
        customerData.firstName,
        customerData.lastName,
        customerData.email,
        customerData.phone,
        customerData.address,
        customerData.address2,
        customerData.city,
        customerData.province,
        customerData.zipCode
    ].filter(field => hasValue(field)).length;

    if (filledFields <= 3) {
        return generateCustomerNoteShort(customerData, clientIP, orderOptions);
    }

    else {
        return generateCustomerNote(customerData, clientIP, orderOptions);
    }
}