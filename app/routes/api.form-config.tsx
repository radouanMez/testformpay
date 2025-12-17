// app/routes/api.form-config.tsx (بديل)
import type { ActionFunction, LoaderFunction } from "react-router";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

// دالة مساعدة لإنشاء JSON response
const createJsonResponse = (data: any, status: number = 200) => {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
        },
    });
};

export const loader: LoaderFunction = async ({ request }) => {
    try {
        const { session } = await authenticate.admin(request);

        const activeConfig = await prisma.formConfig.findFirst({
            where: {
                shop: session.shop,
                isActive: true
            },
        });

        return createJsonResponse({
            success: true,
            data: activeConfig?.config || null
        });
    } catch (error) {
        console.error("❌ Error loading form config:", error);
        return createJsonResponse({
            success: false,
            error: "Failed to load form configuration"
        }, 500);
    }
};

export const action: ActionFunction = async ({ request }) => {
    try {
        const { session } = await authenticate.admin(request);
        const formData = await request.json();

        const currentUser = await prisma.user.findUnique({
            where: { shop: session.shop }
        });

        if (!currentUser) {
            return createJsonResponse({ success: false, error: "User not found" }, 404);
        }

        const processedData = convertToPrismaFormat(formData);

        // ابحث عن الفورم الحالي أو أنشئ واحدًا
        let form = await prisma.form.findFirst({
            where: { shop: session.shop },
        });

        if (!form) {
            form = await prisma.form.create({
                data: {
                    shop: session.shop,
                    name: "Default Form",
                    userId: currentUser.id,
                    status: "ACTIVE",
                    formType: processedData.formType,
                },
            });
        }

        // ابحث عن config الحالي أو أنشئ جديدًا
        const existingConfig = await prisma.formConfig.findFirst({
            where: { formId: form.id, isActive: true },
        });

        if (existingConfig) {
            await prisma.formConfig.update({
                where: { id: existingConfig.id },
                data: {
                    config: processedData.config,
                    formType: processedData.formType,
                    userId: currentUser.id,
                    shop: session.shop,
                },
            });
        } else {
            await prisma.formConfig.create({
                data: {
                    formId: form.id,
                    formType: processedData.formType,
                    config: processedData.config,
                    userId: currentUser.id,
                    shop: session.shop,
                },
            });
        }

        return createJsonResponse({
            success: true,
            message: "Form configuration saved successfully",
            shop: session.shop,
        });
    } catch (error) {
        console.error("❌ Error saving form config:", error);
        return createJsonResponse({
            success: false,
            error: "Failed to save form configuration",
        }, 500);
    }
};

// دالة مساعدة لتحويل البيانات إلى تنسيق Prisma
function convertToPrismaFormat(data: any) {
    // ببساطة نحفظ كل الإعدادات في config كـ JSON
    return {
        formType: data.formType?.toUpperCase() || 'POPUP',
        config: data, // ← كل البيانات من الواجهة تحفظ كما هي داخل config
    };
}