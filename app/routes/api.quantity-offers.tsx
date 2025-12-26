// routes/api.quantity-offers.tsx
import { ActionFunction, LoaderFunction } from "react-router";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

export const loader: LoaderFunction = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const { shop } = session;
    return new Response(JSON.stringify({ 
        success: true, 
        data: await prisma.quantityOffer.findMany({ where: { shop }, orderBy: { createdAt: "desc" } }) 
    }));
};

export const action: ActionFunction = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const { shop } = session;
    const user = await prisma.user.findFirst({ where: { shop } });
    if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

    const formData = await request.json();
    
    // إنشاء Offer جديد
    const offer = await prisma.quantityOffer.create({
        data: {
            shop,
            userId: user.id,
            name: formData.name,
            status: formData.status || "DRAFT",
            rules: formData.rules || {},
            tiers: formData.tiers || [],
            productSettings: formData.productSettings || {},
            designSettings: formData.designSettings || {},
            statistics: { views: 0, clicks: 0, revenue: 0 }
        }
    });
    return new Response(JSON.stringify({ success: true, data: offer }));
};