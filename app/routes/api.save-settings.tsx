import type { ActionFunction, LoaderFunction } from "react-router";
import type { Prisma } from "@prisma/client";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

const createJsonResponse = (data: any, status: number = 200) =>
    new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
    });

// ✅ تحميل الإعدادات الحالية (الآن تشمل general و visibility)
export const loader: LoaderFunction = async ({ request }) => {
    try {
        const { session } = await authenticate.admin(request);

        const activeConfig = await prisma.formConfig.findFirst({
            where: { shop: session.shop, isActive: true },
        });

        // Type guard للتحقق من أن config هو JsonObject
        const isJsonObject = (config: any): config is Prisma.JsonObject => {
            return config !== null && typeof config === 'object' && !Array.isArray(config);
        };

        const configData = activeConfig?.config;
        let general = null;
        let visibility = null;

        if (isJsonObject(configData)) {
            general = configData.general || null;
            visibility = configData.visibility || null;
        }

        return createJsonResponse({
            success: true,
            data: {
                general,
                visibility
            },
        });
    } catch (error) {
        console.error("❌ Error loading form config:", error);
        return createJsonResponse(
            { success: false, error: "Failed to load form configuration" },
            500
        );
    }
};

// ✅ حفظ إعدادات الـ General والـ Visibility
export const action: ActionFunction = async ({ request }) => {
    try {
        const { session } = await authenticate.admin(request);
        const formData = await request.json();

        const currentUser = await prisma.user.findUnique({
            where: { shop: session.shop },
        });

        if (!currentUser) {
            return createJsonResponse({ success: false, error: "User not found" }, 404);
        }

        // ✅ جلب أو إنشاء الـ form
        let form = await prisma.form.findFirst({ where: { shop: session.shop } });
        if (!form) {
            form = await prisma.form.create({
                data: {
                    shop: session.shop,
                    name: "Default Form",
                    userId: currentUser.id,
                    status: "ACTIVE",
                    formType: "POPUP",
                },
            });
        }

        // ✅ جلب config الحالي
        const existingConfig = await prisma.formConfig.findFirst({
            where: { formId: form.id, isActive: true },
        });

        // 🧩 تأكد أن config الحالي كائن حقيقي
        const currentConfig: Prisma.JsonObject =
            existingConfig?.config && typeof existingConfig.config === "object"
                ? (existingConfig.config as Prisma.JsonObject)
                : {};

        // ✅ تحديد نوع الإعدادات المرسلة (general أو visibility)
        const isGeneralSettings = formData.hasOwnProperty('orderOptions') ||
            formData.hasOwnProperty('formOptions') ||
            formData.hasOwnProperty('redirectOptions');

        const isVisibilitySettings = formData.hasOwnProperty('enableProductsFilter') ||
            formData.hasOwnProperty('enableCountriesFilter');

        // ✅ دمج الإعدادات الجديدة مع القديمة
        let mergedConfig: Prisma.JsonObject = { ...currentConfig };

        if (isGeneralSettings) {
            mergedConfig = {
                ...currentConfig,
                general: {
                    ...((currentConfig.general as Prisma.JsonObject) || {}),
                    ...formData
                }
            };
        } else if (isVisibilitySettings) {
            mergedConfig = {
                ...currentConfig,
                visibility: {
                    ...((currentConfig.visibility as Prisma.JsonObject) || {}),
                    ...formData
                }
            };
        }

        // 💾 تحديث أو إنشاء config جديد
        if (existingConfig) {
            await prisma.formConfig.update({
                where: { id: existingConfig.id },
                data: {
                    config: mergedConfig,
                    userId: currentUser.id,
                    shop: session.shop,
                },
            });
        } else {
            await prisma.formConfig.create({
                data: {
                    formId: form.id,
                    config: mergedConfig,
                    userId: currentUser.id,
                    shop: session.shop,
                },
            });
        }

        return createJsonResponse({
            success: true,
            message: "✅ Settings updated successfully",
            shop: session.shop,
        });
    } catch (error) {
        console.error("❌ Error updating settings:", error);
        return createJsonResponse(
            { success: false, error: "Failed to update settings" },
            500
        );
    }
};