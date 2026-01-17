import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { authenticate } from "../../shopify.server";
import { prisma } from "../../db.server";
import { createDefaultFormConfig, getLanguageByCountry } from "../../utils/defaultFormConfig";
import type { FormConfig } from "../../types/formTypes";

export const action = async ({ request }: ActionFunctionArgs) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    try {
        const formData = await request.formData();
        const language = formData.get('language') as string || 'en';
        const shopFromForm = formData.get('shop') as string || shop;

        console.log("📝 Installing form with language:", language, "for shop:", shopFromForm);

        let user = await prisma.user.findUnique({
            where: { shop: shopFromForm }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: `${shopFromForm}@example.com`,
                    shop: shopFromForm,
                    name: shopFromForm.replace('.myshopify.com', '')
                }
            });
        }

        // الحصول على التكوين الافتراضي بناءً على اللغة المختارة
        const defaultFormConfig = createDefaultFormConfig(language, shopFromForm);

        const form = await prisma.form.create({
            data: {
                userId: user.id,
                shop: shopFromForm,
                name: "Default Form",
                formType: "POPUP",
                status: "ACTIVE",
                configs: {
                    create: {
                        userId: user.id,
                        shop: shopFromForm,
                        formType: "POPUP",
                        status: "ACTIVE",
                        config: defaultFormConfig as any,
                        isActive: true
                    }
                }
            }
        });

        console.log("✅ Form installed successfully for shop:", shopFromForm, "language:", language);

        return ({ success: true, reload: true });

    } catch (error) {
        console.error("❌ Error creating form:", error);
        throw new Response("Error installing form", { status: 500 });
    }
};