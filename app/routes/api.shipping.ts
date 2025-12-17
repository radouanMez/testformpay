// app/routes/api.shipping.ts
import type { ActionFunction, LoaderFunction } from "react-router";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

// 🧩 دالة مساعدة لإرجاع JSON بشكل منسق
const createJsonResponse = (data: any, status: number = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
};

/**
 * 📦 loader — جلب إعدادات الشحن الخاصة بالمستخدم (من Shopify session)
 */
export const loader: LoaderFunction = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);

    // 🔍 الحصول على المستخدم حسب المتجر
    const user = await prisma.user.findUnique({
      where: { shop: session.shop },
      include: { shippingSettings: true },
    });

    if (!user) {
      return createJsonResponse(
        { success: false, error: "User not found" },
        404
      );
    }

    // 🧾 إرجاع الـ rates (أو مصفوفة فارغة إن لم توجد)
    const rates = user.shippingSettings?.rates || [];
    return createJsonResponse({ success: true, rates });
  } catch (error) {
    console.error("❌ Error loading shipping settings:", error);
    return createJsonResponse(
      { success: false, error: "Failed to load shipping settings" },
      500
    );
  }
};

/**
 * 💾 action — إنشاء أو تحديث إعدادات الشحن
 */
export const action: ActionFunction = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    const body = await request.json();
    const { rates } = body;

    // ✅ التحقق من المستخدم
    const currentUser = await prisma.user.findUnique({
      where: { shop: session.shop },
    });

    if (!currentUser) {
      return createJsonResponse(
        { success: false, error: "User not found" },
        404
      );
    }

    // ✅ ابحث عن إعدادات الشحن الحالية أو أنشئ جديدة
    const existing = await prisma.shippingSettings.findFirst({
      where: { userId: currentUser.id },
    });

    if (existing) {
      await prisma.shippingSettings.update({
        where: { id: existing.id },
        data: { rates, shop: session.shop, userId: currentUser.id, isActive: true },
      });
    } else {
      await prisma.shippingSettings.create({
        data: { shop: session.shop, userId: currentUser.id, rates, isActive: true },
      });
    }

    return createJsonResponse({
      success: true,
      message: "Shipping settings saved successfully",
    });
  } catch (error) {
    console.error("❌ Error saving shipping settings:", error);
    return createJsonResponse(
      { success: false, error: "Failed to save shipping settings" },
      500
    );
  }
}; 
