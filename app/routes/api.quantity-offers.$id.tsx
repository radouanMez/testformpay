// routes/api.quantity-offers.$id.tsx
import type { ActionFunction, LoaderFunction } from "react-router";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

export const loader: LoaderFunction = async ({ request, params }) => {
    const { session } = await authenticate.admin(request);
    const { shop } = session;
    const { id } = params;

    try {
        const offer = await prisma.quantityOffer.findFirst({
            where: { id, shop },
            include: {
                user: { select: { email: true } },
                orders: { orderBy: { createdAt: "desc" }, take: 10 },
            },
        });

        if (!offer) {
            return new Response(JSON.stringify({ success: false, error: "Offer not found" }), { status: 404 });
        }

        return new Response(JSON.stringify({ success: true, data: offer }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: "Error fetching offer" }), { status: 500 });
    }
};

export const action: ActionFunction = async ({ request, params }) => {
    const { session } = await authenticate.admin(request);
    const { shop } = session;
    const { id } = params;

    // DELETE - حذف العرض
    if (request.method === "DELETE") {
        try {
            await prisma.quantityOffer.deleteMany({ where: { id, shop } });
            return new Response(JSON.stringify({ success: true }), { status: 200 });
        } catch (error) {
            return new Response(JSON.stringify({ success: false, error: "Failed to delete" }), { status: 500 });
        }
    }

    // PUT - تحديث العرض
    if (request.method === "PUT") {
        try {
            const formData = await request.json();
            const updatedOffer = await prisma.quantityOffer.update({
                where: { id },
                data: {
                    name: formData.name,
                    status: formData.status,
                    rules: formData.rules,
                    tiers: formData.tiers,
                    productSettings: formData.productSettings,
                    designSettings: formData.designSettings,
                    statistics: formData.statistics,
                },
            });

            return new Response(JSON.stringify({ success: true, data: updatedOffer }), { status: 200 });
        } catch (error) {
            return new Response(JSON.stringify({ success: false, error: "Failed to update" }), { status: 500 });
        }
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
};