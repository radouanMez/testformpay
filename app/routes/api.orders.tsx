import type { LoaderFunction } from "react-router";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

// دالة مساعدة لتحويل البيانات من Prisma Json إلى object
const parsePrismaJson = (data: any) => {
    if (!data) return null;
    if (typeof data === 'string') {
        try {
            return JSON.parse(data);
        } catch {
            return data;
        }
    }
    return data;
};

// GET - جلب جميع الطلبات أو طلب معين
export const loader: LoaderFunction = async ({ request, params }) => {
    const { session } = await authenticate.admin(request);
    const { shop } = session;

    try {
        const url = new URL(request.url);
        const orderId = params.id || url.searchParams.get("id");

        // إذا كان هناك ID محدد، جلب طلب واحد
        if (orderId) {
            const order = await prisma.order.findFirst({
                where: {
                    id: orderId,
                    shop // للتأكد من أن الطلب ينتمي للمتجر
                },
                include: {
                    appliedUpsells: true,
                    appliedDownsells: true,
                    appliedQuantityOffers: true,
                    user: {
                        select: {
                            email: true,
                            name: true
                        }
                    }
                }
            });

            if (!order) {
                return new Response(
                    JSON.stringify({ success: false, error: "Order not found" }),
                    { status: 404, headers: { "Content-Type": "application/json" } }
                );
            }

            // تحويل بيانات JSON المخزنة باستخدام الدالة المساعدة
            const formattedOrder = {
                ...order,
                customer: parsePrismaJson(order.customer),
                shipping: parsePrismaJson(order.shipping),
                items: parsePrismaJson(order.items) || [],
                totals: parsePrismaJson(order.totals) || {},
                discounts: parsePrismaJson(order.discounts) || [],
                coupons: parsePrismaJson(order.coupons) || [],
                upsells: parsePrismaJson(order.upsells) || [],
                metadata: parsePrismaJson(order.metadata) || {}
            };

            return new Response(
                JSON.stringify({ success: true, data: formattedOrder }),
                {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        // إذا لم يكن هناك ID، جلب جميع الطلبات مع الفلاتر
        const searchParams = url.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const status = searchParams.get("status");
        const search = searchParams.get("search");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const skip = (page - 1) * limit;

        // بناء الفلاتر
        const where: any = { shop }; // فقط طلبات هذا المتجر

        if (status && status !== "all") {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { orderNumber: { contains: search, mode: "insensitive" } },
                { customerEmail: { contains: search, mode: "insensitive" } },
                { customerPhone: { contains: search, mode: "insensitive" } },
                { id: { contains: search, mode: "insensitive" } }
            ];
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }

        // جلب الطلبات مع العد
        const [orders, totalCount] = await Promise.all([
            prisma.order.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    appliedUpsells: true,
                    appliedDownsells: true,
                    appliedQuantityOffers: true,
                    user: {
                        select: {
                            email: true,
                            name: true
                        }
                    }
                }
            }),
            prisma.order.count({ where })
        ]);

        // تحويل بيانات JSON لكل طلب باستخدام الدالة المساعدة
        const formattedOrders = orders.map(order => ({
            ...order,
            customer: parsePrismaJson(order.customer),
            shipping: parsePrismaJson(order.shipping),
            items: parsePrismaJson(order.items) || [],
            totals: parsePrismaJson(order.totals) || {},
            discounts: parsePrismaJson(order.discounts) || [],
            coupons: parsePrismaJson(order.coupons) || [],
            upsells: parsePrismaJson(order.upsells) || [],
            metadata: parsePrismaJson(order.metadata) || {}
        }));

        return new Response(
            JSON.stringify({
                success: true,
                data: formattedOrders,
                pagination: {
                    page,
                    limit,
                    total: totalCount,
                    pages: Math.ceil(totalCount / limit)
                }
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );

    } catch (error) {
        console.error("Error fetching orders:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : "Failed to fetch orders"
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};