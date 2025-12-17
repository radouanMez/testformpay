import { useActionData, useLoaderData, Form, redirect } from "react-router";
import { useEffect } from 'react';

import {
    Page,
    Layout,
    Card,
    Button,
    List,
    Badge,
    Box,
    Text,
    InlineStack,
    BlockStack,
    Banner
} from "@shopify/polaris";
import { billingService } from "../../services/billingService";
import { shopifyBillingService } from "../../services/shopifyBillingService";
import { authenticate } from "../../shopify.server";

interface LoaderFunctionArgs {
    request: Request;
    params: Record<string, string>;
    context: any;
}

interface ActionFunctionArgs {
    request: Request;
    params: Record<string, string>;
    context: any;
}

export async function loader({ request }: LoaderFunctionArgs) {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    const plans = await billingService.getPlans();
    const currentSubscription = await billingService.getShopSubscription(shop);
    const isActive = await billingService.isSubscriptionActive(shop);

    return ({
        plans,
        currentSubscription,
        isActive,
        shop,
    });
}

export async function action({ request }: ActionFunctionArgs) {
    console.log('🎯 Billing action triggered');

    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const formData = await request.formData();
    const intent = formData.get("intent");

    // التحقق من وجود access token
    if (!session.accessToken) {
        console.error('❌ No access token found in session');
        return ({
            success: false,
            error: "Authentication error: No access token"
        });
    }

    if (intent === "subscribe") {
        const planId = Number(formData.get("planId"));
        console.log(`🎯 Subscribe intent for plan: ${planId}, shop: ${shop}`);

        try {
            // الحصول على الخطة
            const plan = await billingService.getPlanById(planId);

            if (!plan) {
                console.error(`❌ Plan not found: ${planId}`);
                return ({ success: false, error: "Plan not found" });
            }

            // ✅ التحقق من الاشتراك الحالي
            const currentSubscription = await billingService.getShopSubscription(shop);
            console.log(`📊 Current subscription status: ${currentSubscription?.status}, plan: ${currentSubscription?.planId}`);

            // ✅ إذا كان هناك اشتراك active ونفس الخطة - منع الاشتراك المكرر
            if (currentSubscription && currentSubscription.status === "active" && currentSubscription.planId === planId) {
                console.log(`❌ User already subscribed to same plan: ${planId}`);
                return ({
                    success: false,
                    error: "You are already subscribed to this plan."
                });
            }

            // ✅ إذا كان هناك اشتراك active وخطة مختلفة - السماح بالترقية/التغيير
            if (currentSubscription && currentSubscription.status === "active" && currentSubscription.planId !== planId) {
                console.log(`🔄 User upgrading from plan ${currentSubscription.planId} to ${planId}`);

                // تسجيل محاولة الترقية
                await billingService.logBillingAction(shop, "upgrade_attempt", {
                    fromPlanId: currentSubscription.planId,
                    toPlanId: planId,
                    fromPlanName: currentSubscription.plan.name,
                    toPlanName: plan.name
                });
            }

            // ✅ إذا كان هناك اشتراك pending، نلغيه أولاً
            if (currentSubscription && currentSubscription.status === "pending") {
                console.log(`🔄 Cancelling pending subscription before creating new one`);
                await billingService.updateSubscriptionStatus(shop, "cancelled");
                await billingService.logBillingAction(shop, "cancelled_before_new", {
                    previousPlanId: currentSubscription.planId,
                    newPlanId: planId
                });
            }

            let subscription;
            // ✅ استخدام upsertSubscription لمنع مشاكل الازدواجية
            console.log(`🔄 Upserting subscription for shop: ${shop}, plan: ${planId}`);
            subscription = await billingService.upsertSubscription({
                shop,
                planId,
                trialDays: 14,
            });

            // تسجيل نوع العملية
            const actionType = currentSubscription ?
                (currentSubscription.status === "active" && currentSubscription.planId !== planId ? "upgrade" : "renew")
                : "new";

            await billingService.logBillingAction(shop, `${actionType}_subscription`, {
                planId: planId,
                previousPlanId: currentSubscription?.planId,
                previousStatus: currentSubscription?.status
            });

            // ✅ معالجة خاصة للخطط المجانية
            if (plan.price === 0) {
                console.log('🆓 Free plan detected - activating immediately without Shopify charge');

                // تفعيل الاشتراك مباشرة بدون شحن Shopify
                await billingService.updateSubscriptionStatus(
                    shop,
                    "active",
                    undefined,
                    "free_plan" // استخدام معرف خاص للخطط المجانية
                );

                // تسجيل النشاط
                await billingService.logBillingAction(shop, "free_plan_activated", {
                    planId,
                    planName: plan.name
                });

                console.log('✅ Free plan activated successfully');

                return {
                    success: true,
                    message: "Free plan activated successfully"
                };

            } else {
                // ✅ للخطط المدفوعة - إنشاء شحن Shopify كالمعتاد
                const billingConfig = {
                    name: `Formino - ${plan.name}`,
                    price: plan.price,
                    interval: plan.interval as 'EVERY_30_DAYS' | 'ANNUAL',
                    trialDays: 14,
                };

                console.log('🚀 Creating Shopify charge for shop:', shop);
                console.log('📋 Plan details:', billingConfig);

                // استخدام الطريقة المبسطة
                const result = await shopifyBillingService.createSimpleCharge(
                    shop,
                    billingConfig,
                    session.accessToken
                );

                console.log('✅ Charge created successfully, chargeId:', result.chargeId);

                // تحديث الاشتراك بـ charge ID من Shopify
                await billingService.updateSubscriptionStatus(
                    shop,
                    "pending",
                    undefined, // subscriptionId
                    result.chargeId.toString() // chargeId
                );

                console.log('🔗 Confirmation URL:', result.confirmationUrl);

                return {
                    success: true,
                    confirmationUrl: result.confirmationUrl,
                    redirect: true
                };
            }

            // تسجيل النشاط
            await billingService.logBillingAction(shop, "created", {
                planId,
                subscriptionId: subscription.id,
                shopifyChargeId: result.chargeId,
                confirmationUrl: result.confirmationUrl,
                previousStatus: currentSubscription?.status,
                isUpgrade: currentSubscription?.status === "active" && currentSubscription.planId !== planId
            });

            console.log('🔗 Confirmation URL:', result.confirmationUrl);

            return {
                success: true,
                confirmationUrl: result.confirmationUrl,
                redirect: true
            };

        } catch (error: any) {
            console.error("❌ Billing error details:", error);
            await billingService.logBillingAction(shop, "failed", {
                planId,
                error: error.message,
                stack: error.stack
            });

            return ({
                success: false,
                error: "Failed to create subscription. Please try again or contact support."
            });
        }
    }
    if (intent === "cancel") {
        console.log('🎯 Cancel subscription intent');
        try {
            const currentSubscription = await billingService.getShopSubscription(shop);

            if (!currentSubscription) {
                throw new Error("No active subscription found");
            }

            let shopifyCancelled = false;
            let cancellationDetails = {};

            // ✅ التحقق من إمكانية الإلغاء من Shopify
            if (currentSubscription.chargeId && currentSubscription.chargeId !== "free_plan") {
                console.log(`🔄 Checking Shopify charge: ${currentSubscription.chargeId}`);

                try {
                    if (!session.accessToken) {
                        console.warn('⚠️ No access token available for Shopify cancellation');
                        cancellationDetails = { error: "No access token" };
                    } else {
                        // أولاً: التحقق من حالة الـ charge في Shopify
                        const chargeDetails = await shopifyBillingService.getChargeDetails(
                            shop,
                            currentSubscription.chargeId,
                            session.accessToken
                        );

                        if (chargeDetails) {
                            console.log(`📊 Charge status in Shopify: ${chargeDetails.status}`);

                            // إذا كان الـ charge لا يزال active، نحاول إلغاءه
                            if (chargeDetails.status === 'active' || chargeDetails.status === 'pending') {
                                console.log(`🔄 Attempting to cancel active charge in Shopify`);
                                await shopifyBillingService.cancelRecurringCharge(
                                    shop,
                                    currentSubscription.chargeId,
                                    session.accessToken
                                );
                                shopifyCancelled = true;
                                cancellationDetails = {
                                    previousStatus: chargeDetails.status,
                                    cancelled: true
                                };
                            } else {
                                console.log(`ℹ️ Charge already ${chargeDetails.status} in Shopify, no need to cancel`);
                                cancellationDetails = {
                                    previousStatus: chargeDetails.status,
                                    alreadyCancelled: true
                                };
                            }
                        } else {
                            console.log(`❌ Charge ${currentSubscription.chargeId} not found in Shopify`);
                            cancellationDetails = { error: "Charge not found in Shopify" };
                        }
                    }
                } catch (shopifyError: any) {
                    console.error('❌ Error during Shopify cancellation process:', shopifyError);
                    cancellationDetails = {
                        error: shopifyError.message,
                        stack: shopifyError.stack
                    };
                }
            } else {
                console.log('ℹ️ No Shopify charge to cancel (free plan or no chargeId)');
                cancellationDetails = { reason: "No Shopify charge ID" };
            }

            // ✅ تحديث حالة الاشتراك في قاعدة البيانات (يتم دائماً)
            await billingService.updateSubscriptionStatus(shop, "cancelled");
            await billingService.logBillingAction(shop, "cancelled", {
                previousPlanId: currentSubscription.planId,
                previousPlanName: currentSubscription.plan.name,
                shopifyChargeId: currentSubscription.chargeId,
                shopifyCancelled: shopifyCancelled,
                cancellationDetails: cancellationDetails
            });

            console.log('✅ Subscription cancelled in database');

            // رسالة مختلفة بناءً على نتيجة إلغاء Shopify
            const message = shopifyCancelled
                ? "Subscription cancelled successfully from both systems."
                : "Subscription cancelled in our system. Please check your Shopify admin for any recurring charges.";

            return ({
                success: true,
                message: message,
                shopifyCancelled: shopifyCancelled
            });
        } catch (error: any) {
            console.error('❌ Cancel subscription error:', error);
            return ({
                success: false,
                error: error.message || "Failed to cancel subscription"
            });
        }
    }

    console.warn('⚠️ Unknown intent:', intent);
    return ({ success: false });
}

export default function BillingPage() {
    const { plans, currentSubscription, isActive, shop } = useLoaderData<typeof loader>();

    const actionData = useActionData<{ confirmationUrl?: string; success?: boolean; error?: string }>();

    useEffect(() => {
        if (actionData?.confirmationUrl) {
            console.log('🔗 Opening confirmation URL in new tab');
            // فتح صفحة الدفع في نافذة جديدة أو تبويب جديد
            window.open(actionData.confirmationUrl, '_blank', 'noopener,noreferrer');
        }

        if (actionData?.success && (!actionData.confirmationUrl || actionData.message)) {
            console.log('🔄 Reloading page after free plan activation or cancellation');
            // إعادة تحميل الصفحة بعد تفعيل الخطة المجانية أو إلغاء الاشتراك
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }, [actionData]);

    const getStatusInfo = (status: string, isActive: boolean) => {
        switch (status) {
            case "active":
                return { text: "Active", tone: "success" as const };
            case "pending":
                return { text: "Pending Confirmation", tone: "warning" as const };
            case "cancelled":
                return { text: "Cancelled", tone: "critical" as const };
            case "expired":
                return { text: "Expired", tone: "critical" as const };
            case "declined":
                return { text: "Declined", tone: "critical" as const };
            default:
                return { text: status, tone: "default" as const };
        }
    };

    const statusInfo = currentSubscription ? getStatusInfo(currentSubscription.status, isActive) : null;

    return (
        <Page
            title="Pricing Plans"
            subtitle="Choose the right plan for your store"
        >
            <Layout>

                {currentSubscription && (
                    <Layout.Section>
                        <Box>
                            <Card padding="400">
                                <BlockStack gap="400">
                                    <Text as="h3" variant="headingMd">
                                        Current Subscription
                                    </Text>

                                    <BlockStack gap="200">
                                        <InlineStack align="space-between" blockAlign="center">
                                            <Text as="span" variant="bodyMd" fontWeight="medium">
                                                Plan:
                                            </Text>
                                            <Text as="span" variant="bodyMd">
                                                {currentSubscription.plan.name}
                                            </Text>
                                        </InlineStack>

                                        <InlineStack align="space-between" blockAlign="center">
                                            <Text as="span" variant="bodyMd" fontWeight="medium">
                                                Status:
                                            </Text>
                                            {statusInfo && (
                                                <Badge tone={statusInfo.tone}>
                                                    {statusInfo.text}
                                                </Badge>
                                            )}
                                        </InlineStack>

                                        <InlineStack align="space-between" blockAlign="center">
                                            <Text as="span" variant="bodyMd" fontWeight="medium">
                                                Price:
                                            </Text>
                                            <Text as="span" variant="bodyMd">
                                                ${typeof currentSubscription.plan.price === 'number' ? currentSubscription.plan.price.toFixed(2) : currentSubscription.plan.price}
                                            </Text>
                                        </InlineStack>

                                        {currentSubscription.trialEndsAt && (
                                            <InlineStack align="space-between" blockAlign="center">
                                                <Text as="span" variant="bodyMd" fontWeight="medium">
                                                    Trial ends:
                                                </Text>
                                                <Text as="span" variant="bodyMd">
                                                    {new Date(currentSubscription.trialEndsAt).toLocaleDateString('en-US')}
                                                </Text>
                                            </InlineStack>
                                        )}
                                    </BlockStack>

                                    {/* ✅ زر الإلغاء يظهر فقط عندما يكون الاشتراك active */}
                                    {currentSubscription.status === "active" && (
                                        <Form method="post">
                                            <input type="hidden" name="intent" value="cancel" />
                                            <Button variant="primary" tone="critical" submit>
                                                Cancel Subscription
                                            </Button>
                                        </Form>
                                    )}

                                    {/* ✅ إظهار رسالة عندما يكون الاشتراك معلقاً */}
                                    {currentSubscription.status === "pending" && (
                                        <Banner tone="warning">
                                            <p>Your subscription is pending confirmation. Please complete the payment process.</p>
                                        </Banner>
                                    )}

                                    {/* ✅ إظهار رسالة عندما يكون الاشتراك ملغياً */}
                                    {currentSubscription.status === "cancelled" && (
                                        <Banner tone="critical">
                                            <p>Your subscription has been cancelled. You can subscribe again to continue using our services.</p>
                                        </Banner>
                                    )}

                                    {/* ✅ إظهار رسالة عندما يكون الاشتراك منتهياً */}
                                    {currentSubscription.status === "expired" && (
                                        <Banner tone="warning">
                                            <p>Your subscription has expired. Please subscribe again to continue using our services.</p>
                                        </Banner>
                                    )}
                                </BlockStack>
                            </Card>
                        </Box>
                    </Layout.Section>
                )}

                <Layout.Section>
                    {/* ✅ عرض رسائل الخطأ من الـ action */}
                    {actionData?.error && (
                        <Banner tone="critical">
                            <p>{actionData.error}</p>
                        </Banner>
                    )}

                    {/* {actionData?.success && actionData?.error && (
                        <Banner tone="success">
                            <p>{actionData.error}</p>
                        </Banner>
                    )} */}

                    {currentSubscription?.status === "pending" && (
                        <Banner tone="warning">
                            <p>Your subscription is pending confirmation. Please complete the payment process to activate your plan.</p>
                        </Banner>
                    )}

                    <Box>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                            gap: "20px"
                        }}>
                            {plans.map((plan) => (
                                <Card key={plan.id} padding="400">
                                    <BlockStack gap="400">
                                        <Text as="h2" variant="headingMd" alignment="center">
                                            {plan.name}
                                        </Text>

                                        <Box paddingInlineStart="400" paddingInlineEnd="400">
                                            <Text as="p" variant="headingLg" alignment="center" fontWeight="bold">
                                                ${typeof plan.price === 'number' ? plan.price.toFixed(2) : plan.price}
                                                <Text as="span" variant="bodySm" tone="subdued">
                                                    /{plan.interval === "EVERY_30_DAYS" ? "month" : "year"}
                                                </Text>
                                            </Text>
                                        </Box>

                                        <Box minHeight="120px">
                                            <List type="bullet">
                                                {(plan.features as string[]).map((feature, index) => (
                                                    <List.Item key={index}>
                                                        <Text as="span" variant="bodyMd">
                                                            {feature}
                                                        </Text>
                                                    </List.Item>
                                                ))}
                                            </List>
                                        </Box>

                                        <Form method="post">
                                            <input type="hidden" name="intent" value="subscribe" />
                                            <input type="hidden" name="planId" value={plan.id} />
                                            <Button
                                                variant="primary"
                                                fullWidth
                                                submit
                                                // ✅ الزر معطل فقط إذا كان الاشتراك active ونفس الخطة
                                                disabled={currentSubscription?.status === "active" && currentSubscription.planId === plan.id}
                                            >
                                                {currentSubscription?.planId === plan.id ? (
                                                    currentSubscription.status === "active" ? "Current Plan" :
                                                        currentSubscription.status === "pending" ? "Pending Confirmation" :
                                                            "Select Plan"
                                                ) : (
                                                    // ✅ إظهار "Upgrade" إذا كان هناك اشتراك active وخطة مختلفة
                                                    currentSubscription?.status === "active" ? "Upgrade to this Plan" : "Select Plan"
                                                )}
                                            </Button>
                                        </Form>
                                    </BlockStack>
                                </Card>
                            ))}
                        </div>
                    </Box>
                </Layout.Section>
            </Layout>
        </Page>
    );
}