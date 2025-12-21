import type { LoaderFunction } from "react-router";
import { prisma } from "../db.server";

// 🔹 دالة مساعدة لإنشاء JSON Response مع دعم CORS
const createJsonResponse = (data: any, status: number = 200) => {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    });
};
// ✅ API عام لجلب إعدادات الفورم وأيضًا إعدادات الشحن
export const loader: LoaderFunction = async ({ request }) => {
    try {
        // دعم preflight request (OPTIONS)
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                },
            });
        }

        const url = new URL(request.url);
        const shop = url.searchParams.get("shop");

        if (!shop) {
            return createJsonResponse(
                { success: false, error: "Missing shop parameter" },
                400
            );
        }

        // 🧱 البحث عن الفورم النشط لهذا المتجر
        const activeConfig = await prisma.formConfig.findFirst({
            where: { shop, isActive: true },
            orderBy: { updatedAt: "desc" },
        });

        // 🧱 جلب إعدادات الشحن الخاصة بنفس المتجر
        const shippingConfig = await prisma.shippingSettings.findFirst({
            where: { shop },
            orderBy: { updatedAt: "desc" },
        });

        if (!activeConfig) {
            return createJsonResponse(
                { success: false, error: "No active form configuration found" },
                404
            );
        }

        // ✅ دمج إعدادات الفورم مع إعدادات الشحن في استجابة واحدة
        return createJsonResponse({
            success: true,
            shop,
            form: activeConfig.config,
            shipping: shippingConfig?.rates || [], // إذا لم تكن موجودة ترجع مصفوفة فارغة
        });
    } catch (error) {
        console.error("❌ Error loading public form + shipping config:", error);
        return createJsonResponse(
            { success: false, error: "Failed to load configuration" },
            500
        );
    }
};
