import { prisma } from "../db.server";

export interface BillingPlanInput {
    name: string;
    price: number;
    interval?: string;
    features: any;
}

export interface CreateSubscriptionInput {
    shop: string;
    planId: number;
    trialDays?: number;
}

export class BillingService {
    // إنشاء خطة جديدة
    async createPlan(data: BillingPlanInput) {
        return await prisma.billingPlan.create({
            data: {
                name: data.name,
                price: data.price,
                interval: data.interval || "EVERY_30_DAYS",
                features: data.features,
            },
        });
    } 

    // الحصول على جميع الخطط
    async getPlans() {
        return await prisma.billingPlan.findMany({
            orderBy: { price: "asc" },
        });
    }

    // إنشاء اشتراك جديد
    async createSubscription(input: CreateSubscriptionInput) {
        const trialEndsAt = input.trialDays
            ? new Date(Date.now() + input.trialDays * 24 * 60 * 60 * 1000)
            : null;

        return await prisma.shopSubscription.create({
            data: {
                shop: input.shop,
                planId: input.planId,
                trialEndsAt,
                status: "pending",
            },
            include: {
                plan: true,
            },
        });
    }

    // تحديث حالة الاشتراك
    async updateSubscriptionStatus(
        shop: string,
        status: string,
        subscriptionId?: string,
        chargeId?: string
    ) {
        const updateData: any = { status };

        if (subscriptionId) updateData.subscriptionId = subscriptionId;
        if (chargeId) updateData.chargeId = chargeId;

        return await prisma.shopSubscription.update({
            where: { shop },
            data: updateData,
            include: {
                plan: true,
            },
        });
    }

    // الحصول على اشتراك المتجر
    async getShopSubscription(shop: string) {
        return await prisma.shopSubscription.findUnique({
            where: { shop },
            include: {
                plan: true,
            },
        });
    }

    // تسجيل نشاط الفواتير
    async logBillingAction(shop: string, action: string, details?: any) {
        return await prisma.billingLog.create({
            data: {
                shop,
                action,
                details,
            },
        });
    }

    async getPlanById(planId: number) {
        return await prisma.billingPlan.findUnique({
            where: { id: planId }
        });
    }

    async isSubscriptionActive(shop: string, accessToken?: string): Promise<boolean> {
        const subscription = await this.getShopSubscription(shop);

        if (!subscription) return false;

        // ✅ إذا كان الاشتراك active في قاعدة البيانات، نتحقق من Shopify
        if (subscription.status === "active") {

            // ✅ التحقق من انتهاء الفترة التجريبية
            if (subscription.trialEndsAt && subscription.trialEndsAt < new Date()) {
                console.log(`⏰ Trial expired for shop: ${shop}`);
                await this.updateSubscriptionStatus(shop, "expired");
                return false;
            }

            // ✅ إذا كان لدينا access token، نتحقق من Shopify مباشرة
            if (accessToken && subscription.chargeId) {
                try {
                    const shopifyBillingService = new ShopifyBillingService();
                    const currentCharge = await shopifyBillingService.getCurrentCharge(shop, accessToken);

                    // ✅ إذا لم نجد charge نشط في Shopify، نحدث الحالة
                    if (!currentCharge || currentCharge.id.toString() !== subscription.chargeId) {
                        console.log(`🔄 Charge not found in Shopify, marking as expired. DB chargeId: ${subscription.chargeId}`);
                        await this.updateSubscriptionStatus(shop, "expired");
                        return false;
                    }

                    // ✅ إذا كان charge في Shopify ملغى، نحدث الحالة
                    if (currentCharge.status === 'cancelled' || currentCharge.status === 'expired') {
                        console.log(`🔄 Shopify charge is ${currentCharge.status}, updating DB`);
                        await this.updateSubscriptionStatus(shop, currentCharge.status);
                        return false;
                    }

                } catch (error) {
                    console.error('Error checking Shopify charge:', error);
                    // في حالة الخطأ، نعتمد على البيانات المحلية
                }
            }

            return true;
        }

        return false;
    }

    async updateSubscriptionPlan(shop: string, newPlanId: number) {
        return await prisma.shopSubscription.update({
            where: { shop },
            data: {
                planId: newPlanId,
                status: "pending", 
                chargeId: null, 
                subscriptionId: null,
                trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // تجربة جديدة 14 يوم
            },
            include: {
                plan: true,
            },
        });
    }

    async upsertSubscription(input: CreateSubscriptionInput) {
        const trialEndsAt = input.trialDays
            ? new Date(Date.now() + input.trialDays * 24 * 60 * 60 * 1000)
            : null;

        return await prisma.shopSubscription.upsert({
            where: {
                shop: input.shop
            },
            update: {
                planId: input.planId,
                trialEndsAt,
                status: "pending",
                chargeId: null, // إعادة تعيين لأننا ننشئ شحناً جديداً
                subscriptionId: null, // إعادة تعيين
                updatedAt: new Date(),
            },
            create: {
                shop: input.shop,
                planId: input.planId,
                trialEndsAt,
                status: "pending",
            },
            include: {
                plan: true,
            },
        });
    }

}



export const billingService = new BillingService();