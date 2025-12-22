import type { LoaderFunction } from "react-router";
import { prisma } from "../db.server";

// دالة مساعدة لدعم CORS
const createJsonResponse = (data: any, status: number = 200) => {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
};

export const loader: LoaderFunction = async ({ request }) => {
    try {
        // دعم Preflight request
        if (request.method === "OPTIONS") {
            return createJsonResponse(null);
        }

        const url = new URL(request.url);
        const shop = url.searchParams.get("shop");

        if (!shop) {
            return createJsonResponse({ success: false, error: "Missing shop parameter" }, 400);
        }

        // جلب جميع البيانات بالتوازي لتحسين السرعة (Performance)
        const [activeForm, shipping, activeUpsells, activeDownsells] = await Promise.all([
            // 1. جلب إعدادات الفورم النشط
            prisma.formConfig.findFirst({
                where: { shop, isActive: true },
                orderBy: { updatedAt: "desc" }
            }),
            // 2. جلب إعدادات الشحن
            prisma.shippingSettings.findFirst({
                where: { shop },
                orderBy: { updatedAt: "desc" }
            }),
            // 3. جلب الـ Upsells النشطة فقط
            prisma.upsell.findMany({
                where: { shop, status: "ACTIVE" },
                orderBy: { updatedAt: "desc" }
            }),
            // 4. جلب الـ Downsells النشطة فقط
            prisma.downsell.findMany({
                where: { shop, status: "ACTIVE" },
                orderBy: { updatedAt: "desc" }
            })
        ]);

        return createJsonResponse({
            success: true,
            shop,
            config: {
                form: activeForm?.config || null,
                shipping: shipping?.rates || [],
                // دمج الـ Upsells والـ Downsells في مصفوفة العروض
                offers: {
                    upsells: activeUpsells,
                    downsells: activeDownsells
                }
            }
        });

    } catch (error) {
        console.error("❌ Error fetching public store data:", error);
        return createJsonResponse({ success: false, error: "Server error" }, 500);
    }
};