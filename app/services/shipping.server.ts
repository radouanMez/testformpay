import type { ShippingSettings, ShippingRate } from "../types/shipping";
import { prisma } from "../db.server";

// 🧠 جلب إعدادات الشحن
export async function getShippingSettings(
  shop: string,
  userId: string
): Promise<ShippingSettings | null> {
  const settings = await prisma.shippingSettings.findUnique({
    where: { userId },
  });

  if (!settings) return null; 

  return {
    ...settings,
    // ✅ نحول من JSON إلى ShippingRate[]
    rates: (settings.rates as unknown as ShippingRate[]) ?? [],
  };
}

// 🧩 تحديث أو إنشاء إعدادات الشحن
export async function updateShippingSettings(
  userId: string,
  data: ShippingRate[]
): Promise<ShippingSettings> {
  const settings = await prisma.shippingSettings.upsert({
    where: { userId },
    update: {
      // ✅ نحول المصفوفة إلى JSON قبل الحفظ
      rates: data as unknown as object,
    },
    create: {
      shop: "demo-shop",
      userId,
      rates: data as unknown as object, // ✅ التحويل هنا أيضًا
    },
  });

  return {
    ...settings,
    rates: (settings.rates as unknown as ShippingRate[]) ?? [],
  };
}
