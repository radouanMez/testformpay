// app/services/googleIntegration.server.ts
import { prisma } from "../db.server";

export async function saveGoogleTokens(shop: string, tokens: any) {
    try {
        // ابحث عن المستخدم المرتبط بالمتجر
        const user = await prisma.user.findUnique({
            where: { shop },
        });

        if (!user) {
            console.error("❌ No user found for shop:", shop);
            throw new Error("User not found for this shop");
        }

        // احسب تاريخ انتهاء صلاحية التوكن
        const expiresAt = tokens.expires_in
            ? new Date(Date.now() + tokens.expires_in * 1000)
            : null;

        // تحقق هل يوجد تكامل سابق
        const existingIntegration = await prisma.googleSheetsIntegration.findUnique({
            where: { shop },
        });

        if (existingIntegration) {
            // ✅ تحديث التوكنات الحالية
            await prisma.googleSheetsIntegration.update({
                where: { shop },
                data: {
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token ?? existingIntegration.refreshToken,
                    expiresAt,
                    updatedAt: new Date(),
                    enabled: true,
                },
            });

            console.log("🔄 Updated Google tokens for shop:", shop);
        } else {
            // ✅ إنشاء تكامل جديد
            await prisma.googleSheetsIntegration.create({
                data: {
                    shop,
                    userId: user.id,
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token ?? null,
                    expiresAt,
                    enabled: true,
                },
            });

            console.log("✅ Created new Google integration for shop:", shop);
        }

        return true;
    } catch (err) {
        console.error("❌ Error saving Google tokens:", err);
        return false;
    }
}
