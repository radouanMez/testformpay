// api.upsells.$id.tsx
import type { ActionFunction, LoaderFunction } from "react-router";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

// GET - جلب upsell محدد
export const loader: LoaderFunction = async ({ request, params }) => {
    const { session } = await authenticate.admin(request);
    const { shop } = session;
    const { id } = params;

    try {
        const upsell = await prisma.upsell.findFirst({
            where: { id, shop },
            include: {
                user: {
                    select: {
                        email: true,
                    },
                },
                orders: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
            },
        });

        if (!upsell) {
            return new Response(
                JSON.stringify({ success: false, error: "Upsell not found" }),
                {
                    status: 404,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        return new Response(
            JSON.stringify({ success: true, data: upsell }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    } catch (error) {
        console.error("Error fetching upsell:", error);

        return new Response(
            JSON.stringify({
                success: false,
                error: "Failed to fetch upsell"
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

// POST/PUT/DELETE في action واحد
export const action: ActionFunction = async ({ request, params }) => {
    const { session } = await authenticate.admin(request);
    const { shop } = session;
    const { id } = params;

    // التحقق من method
    const method = request.method;

    // DELETE
    if (method === "DELETE") {
        try {
            // التحقق من ملكية المتجر للـ upsell
            const existingUpsell = await prisma.upsell.findFirst({
                where: { id, shop },
            });

            if (!existingUpsell) {
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: "Upsell not found or access denied"
                    }),
                    {
                        status: 404,
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );
            }

            await prisma.upsell.delete({
                where: { id },
            });

            return new Response(
                JSON.stringify({
                    success: true,
                    message: "Upsell deleted successfully"
                }),
                {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
        } catch (error) {
            console.error("Error deleting upsell:", error);

            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Failed to delete upsell"
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
        }
    }

    // PUT (التحديث)
    if (method === "PUT") {
        try {
            const formData = await request.json();

            // التحقق من ملكية المتجر للـ upsell
            const existingUpsell = await prisma.upsell.findFirst({
                where: { id, shop },
            });

            if (!existingUpsell) {
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: "Upsell not found or access denied"
                    }),
                    {
                        status: 404,
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );
            }

            const upsell = await prisma.upsell.update({
                where: { id },
                data: {
                    name: formData.name,
                    type: formData.type,
                    status: formData.status,
                    basicSettings: formData.basicSettings,
                    displayRules: formData.displayRules,
                    productSettings: formData.productSettings,
                    designSettings: formData.designSettings,
                    statistics: formData.statistics,
                },
            });

            return new Response(
                JSON.stringify({ success: true, data: upsell }),
                {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
        } catch (error) {
            console.error("Error updating upsell:", error);

            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Failed to update upsell"
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
        }
    }

    // إذا لم يكن PUT أو DELETE
    return new Response(
        JSON.stringify({
            success: false,
            error: "Method not allowed"
        }),
        {
            status: 405,
            headers: {
                "Content-Type": "application/json",
                "Allow": "PUT, DELETE"
            },
        }
    );
};