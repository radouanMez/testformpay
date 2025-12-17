import type { ActionFunction, LoaderFunction } from "react-router";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

// GET - جلب جميع upsells المتجر
export const loader: LoaderFunction = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const { shop } = session;

    try {
        const upsells = await prisma.upsell.findMany({
            where: { shop },
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        email: true,
                    },
                },
            },
        });

        return new Response(
            JSON.stringify({ success: true, data: upsells }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    } catch (error) {
        console.error("Error fetching upsells:", error);

        return new Response(
            JSON.stringify({
                success: false,
                error: "Failed to fetch upsells"
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    }
};

// POST - إنشاء upsell جديد
export const action: ActionFunction = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const { shop } = session;

    try {
        const formData = await request.json();

        // البحث عن أو إنشاء المستخدم
        let user = await prisma.user.findFirst({
            where: { shop },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    shop,
                    email: session.onlineAccessInfo?.associated_user?.email || "admin@shopify.com",
                },
            });
        }

        // إنشاء الـ upsell
        const upsell = await prisma.upsell.create({
            data: {
                shop,
                userId: user.id,
                name: formData.name,
                type: formData.type,
                status: formData.status || "DRAFT",
                basicSettings: formData.basicSettings || {},
                displayRules: formData.displayRules || {},
                productSettings: formData.productSettings || {},
                designSettings: formData.designSettings || {},
                statistics: formData.statistics || {
                    views: 0,
                    clicks: 0,
                    conversions: 0,
                    revenue: 0,
                },
            },
        });

        return new Response(
            JSON.stringify({ success: true, data: upsell }),
            {
                status: 201,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    } catch (error) {
        console.error("Error creating upsell:", error);

        return new Response(
            JSON.stringify({
                success: false,
                error: "Failed to create upsell"
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    }
};