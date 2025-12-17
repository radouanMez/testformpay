import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

// ========================================================
// 📥 GET Integration Settings
// ========================================================
export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  try {
    const integration = await prisma.googleSheetsIntegration.findUnique({
      where: { shop: session.shop },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            shop: true,
          },
        },
      },
    });

    return { success: true, integration };
  } catch (error: any) {
    console.error("Error fetching integration:", error);
    return ({ success: false, error: error.message });
  }
}

// ========================================================
// 📤 POST - Save or Update Integration Settings
// ========================================================
export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);

  try {
    const body = await request.json();
    const {
      enabled,
      spreadsheetId,
      sheetName,
      abandonedSheetName,
      importAbandoned,
      importMultipleLines,
      includeAddressDetails,
      config,
    } = body;

    // 🧠 جلب المستخدم الحالي
    const user = await prisma.user.findUnique({
      where: { shop: session.shop },
    });

    if (!user) {
      return ({ success: false, error: "User not found" });
    }

    // تحقق إن كانت هناك إعدادات موجودة مسبقًا
    const existing = await prisma.googleSheetsIntegration.findUnique({
      where: { shop: session.shop },
    });

    let integration;

    if (existing) {
      // 🧾 تحديث
      integration = await prisma.googleSheetsIntegration.update({
        where: { shop: session.shop },
        data: {
          enabled,
          spreadsheetId,
          sheetName,
          abandonedSheetName,
          config,
          refreshToken: existing.refreshToken,
          accessToken: existing.accessToken,
          expiresAt: existing.expiresAt,
          userId: user.id,
          updatedAt: new Date(),
        },
      });
    } else {
      // 🆕 إنشاء جديد
      integration = await prisma.googleSheetsIntegration.create({
        data: {
          shop: session.shop,
          enabled: Boolean(enabled),
          spreadsheetId: spreadsheetId || null,
          sheetName: sheetName || null,
          abandonedSheetName: abandonedSheetName || null,
          config: config ? JSON.parse(JSON.stringify(config)) : {},
          accessToken: "", // ← يمكنك ملؤها لاحقًا بعد Google OAuth
          refreshToken: null,
          expiresAt: null,
          user: {
            connect: { id: user.id }, // ✅ هكذا تربطه مع المستخدم الصحيح
          },
        },
      });

    }

    return ({ success: true, integration });
  } catch (error: any) {
    console.error("Error saving integration:", error);
    return ({ success: false, error: error.message });
  }
}
