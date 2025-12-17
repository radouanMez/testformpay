import { prisma } from "../../../db.server";

export async function checkBlockingSettings(shop: string, formData: any, clientIP: string): Promise<{ blocked: boolean; message?: string }> {
    try {
        const blockingSettings = await prisma.userBlockingSettings.findUnique({
            where: { shop }
        });

        if (!blockingSettings) {
            return { blocked: false };
        }

        const email = (formData.get("email") as string) || "";
        const phone = (formData.get("phone_number") as string) || "";
        const postalCode = (formData.get("zip_code") as string) || "";
 
        // التحقق من البريد الإلكتروني المحظور
        if (blockingSettings.blockedEmails && Array.isArray(blockingSettings.blockedEmails)) {
            const normalizedEmail = email.toLowerCase().trim();
            if (blockingSettings.blockedEmails.includes(normalizedEmail)) {
                return {
                    blocked: true,
                    message: blockingSettings.blockMessage || "Your email has been blocked."
                };
            }
        }

        // التحقق من الهواتف المحظورة
        if (blockingSettings.blockedPhones && Array.isArray(blockingSettings.blockedPhones)) {
            const normalizedPhone = phone.trim().replace(/\s+/g, "");
            if (blockingSettings.blockedPhones.includes(normalizedPhone)) {
                return {
                    blocked: true,
                    message: blockingSettings.blockMessage || "Your phone number has been blocked."
                };
            }
        }

        // التحقق من IP المحظور
        if (blockingSettings.blockedIPs && Array.isArray(blockingSettings.blockedIPs)) {
            if (blockingSettings.blockedIPs.includes(clientIP)) {
                return {
                    blocked: true,
                    message: blockingSettings.blockMessage || "Your IP address has been blocked."
                };
            }
        }

        // التحقق من IP المسموح
        if (blockingSettings.allowedIPs && Array.isArray(blockingSettings.allowedIPs) && blockingSettings.allowedIPs.length > 0) {
            if (!blockingSettings.allowedIPs.includes(clientIP)) {
                return {
                    blocked: true,
                    message: "Your IP address is not allowed to place orders."
                };
            }
        }

        // التحقق من الرمز البريدي
        if (postalCode && blockingSettings.postalCodeAction) {
            const normalizedPostalCode = postalCode.trim();

            if (blockingSettings.postalCodeAction === "exclude") {
                if (blockingSettings.blockedPostalCodes && Array.isArray(blockingSettings.blockedPostalCodes)) {
                    if (blockingSettings.blockedPostalCodes.includes(normalizedPostalCode)) {
                        return {
                            blocked: true,
                            message: "Orders from your postal code are not accepted."
                        };
                    }
                }
            } else if (blockingSettings.postalCodeAction === "include") {
                if (blockingSettings.allowedPostalCodes && Array.isArray(blockingSettings.allowedPostalCodes)) {
                    if (!blockingSettings.allowedPostalCodes.includes(normalizedPostalCode)) {
                        return {
                            blocked: true,
                            message: "Orders from your postal code are not accepted."
                        };
                    }
                }
            }
        }

        // التحقق من حد الطلبات
        const orderLimitCheck = await checkOrderLimit(shop, clientIP, email, blockingSettings.orderLimitHours || 24, blockingSettings.quantityLimit || 10);
        if (orderLimitCheck.blocked) {
            return orderLimitCheck;
        }

        return { blocked: false };
    } catch (error) {
        console.error("❌ Error checking blocking settings:", error);
        return { blocked: false };
    }
}

export async function checkOrderLimit(shop: string, clientIP: string, email: string, hoursLimit: number, quantityLimit: number): Promise<{ blocked: boolean; message?: string }> {
    try {
        const timeThreshold = new Date(Date.now() - hoursLimit * 60 * 60 * 1000);
        
        const recentOrders = await prisma.order.findMany({
            where: {
                shop,
                OR: [
                    { clientIP: clientIP },
                    { customerEmail: email }
                ],
                createdAt: {
                    gte: timeThreshold
                }
            },
            select: {
                id: true
            }
        });

        if (recentOrders.length >= quantityLimit) {
            return {
                blocked: true,
                message: `Order limit exceeded. Maximum ${quantityLimit} orders allowed per ${hoursLimit} hours.`
            };
        }

        return { blocked: false };
    } catch (error) {
        console.error("❌ Error checking order limits:", error);
        return { blocked: false };
    }
}