// api.downsells.$id.tsx
import type { ActionFunction, LoaderFunction } from "react-router";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

// GET - جلب downsell محدد بواسطة ID
export const loader: LoaderFunction = async ({ request, params }) => {
    const { session } = await authenticate.admin(request);
    const { shop } = session;
    const { id } = params;

    try {
        const downsell = await prisma.downsell.findFirst({
            where: { id, shop },
            include: {
                user: { select: { email: true } },
                orders: { orderBy: { createdAt: "desc" }, take: 10 },
            },
        });

        if (!downsell) {
            return new Response(JSON.stringify({ success: false, error: "Downsell not found" }), { status: 404 });
        }

        return new Response(JSON.stringify({ success: true, data: downsell }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: "Error fetching downsell" }), { status: 500 });
    }
};

export const action: ActionFunction = async ({ request, params }) => {
    const { session } = await authenticate.admin(request);
    const { shop } = session;
    const { id } = params;

    // DELETE - حذف الـ downsell
    if (request.method === "DELETE") {
        try {
            await prisma.downsell.deleteMany({ where: { id, shop } });
            return new Response(JSON.stringify({ success: true }), { status: 200 });
        } catch (error) {
            return new Response(JSON.stringify({ success: false, error: "Failed to delete" }), { status: 500 });
        }
    }

    // PUT - تحديث الـ downsell
    if (request.method === "PUT") {
        try {
            const formData = await request.json();
            const updatedDownsell = await prisma.downsell.updateMany({
                where: { id, shop },
                data: {
                    name: formData.name,
                    status: formData.status,
                    basicSettings: formData.basicSettings,
                    displayRules: formData.displayRules,
                    productSettings: formData.productSettings,
                    designSettings: formData.designSettings,
                    statistics: formData.statistics,
                },
            });

            return new Response(JSON.stringify({ success: true, data: updatedDownsell }), { status: 200 });
        } catch (error) {
            return new Response(JSON.stringify({ success: false, error: "Failed to update" }), { status: 500 });
        }
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
};