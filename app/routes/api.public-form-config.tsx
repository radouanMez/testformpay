import type { LoaderFunction } from "react-router";
import { prisma } from "../db.server";

const createJsonResponse = (data: any, status: number = 200) => {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
};

export const loader: LoaderFunction = async ({ request }) => {
    try {
        // Preflight request
        if (request.method === "OPTIONS") {
            return createJsonResponse(null);
        }

        const url = new URL(request.url);
        const shop = url.searchParams.get("shop");

        if (!shop) {
            return createJsonResponse({ success: false, error: "Missing shop parameter" }, 400);
        }

        const [activeForm, shipping, activeUpsells, activeDownsells, activeQuantityOffers] = await Promise.all([
           
            prisma.formConfig.findFirst({
                where: { shop, isActive: true },
                orderBy: { updatedAt: "desc" }
            }),

            prisma.shippingSettings.findFirst({
                where: { shop },
                orderBy: { updatedAt: "desc" }
            }),
       
            prisma.upsell.findMany({
                where: { shop, status: "ACTIVE" },
                orderBy: { updatedAt: "desc" }
            }),
         
            prisma.downsell.findMany({
                where: { shop, status: "ACTIVE" },
                orderBy: { updatedAt: "desc" }
            }),
    
            prisma.quantityOffer.findMany({
                where: { shop, status: "ACTIVE" },
                orderBy: { updatedAt: "desc" }
            })
        ]);

        return createJsonResponse({
            success: true,
            shop,
            config: {
                form: activeForm?.config || null,
                shipping: shipping?.rates || [],
                offers: {
                    upsells: activeUpsells,
                    downsells: activeDownsells,
                    quantityOffers: activeQuantityOffers
                }
            }
        });

    } catch (error) {
        console.error("❌ Error fetching public store data:", error);
        return new Response(JSON.stringify({ success: false, error: "Server error" }), { status: 500 });
    }
};