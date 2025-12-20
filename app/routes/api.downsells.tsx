// api.downsells.tsx
import type { ActionFunction, LoaderFunction } from "react-router";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

// GET - جلب جميع الـ downsells الخاصة بالمتجر
export const loader: LoaderFunction = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const { shop } = session;

    try {
        const downsells = await prisma.downsell.findMany({
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
            JSON.stringify({ success: true, data: downsells }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        console.error("Error fetching downsells:", error);
        return new Response(
            JSON.stringify({ success: false, error: "Failed to fetch downsells" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};

// POST - إنشاء downsell جديد
export const action: ActionFunction = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const { shop } = session;

    if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }

    try {
        const formData = await request.json();

        // جلب المستخدم المرتبط بالمتجر
        const user = await prisma.user.findFirst({ where: { shop } });
        if (!user) {
            return new Response(
                JSON.stringify({ success: false, error: "User not found" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        const downsell = await prisma.downsell.create({
            data: {
                shop,
                userId: user.id,
                name: formData.name,
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
            JSON.stringify({ success: true, data: downsell }),
            { status: 201, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error creating downsell:", error);
        return new Response(
            JSON.stringify({ success: false, error: "Failed to create downsell" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};