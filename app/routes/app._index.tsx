import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSubmit, useNavigation, useActionData } from "react-router";
import {
  Page,
  Card,
  Layout,
  Text,
  Box,
  Badge,
  ProgressBar,
  Link,
  List,
  InlineStack,
  Icon,
  Button,
  Banner
} from "@shopify/polaris";

import { InfoIcon } from "@shopify/polaris-icons";
import { prisma } from "../db.server";
import { useCallback, useEffect } from "react";
import { action as installFormAction } from "./_index/actions";

import { authenticate, getCurrentShop, getCurrentUser } from "../shopify.server";


export const action = installFormAction;

type DashboardData = {
  plan: {
    name: string;
    limit: number;
    used: string;
    progress: number;
    resetDate: string;
  };
  balance: number;
  notifications: {
    email: string;
  };
  recentActivity: {
    last7Days: string;
    stats: {
      newOrders: number;
      updatedShipping: number;
      updatedFormConfigs: number;
      newForms: number;
    };
  };
  themeAppEmbed: {
    status: string;
    hasActiveForm: boolean;
    activeForm: any;
    shopDomain: string | null;
  };
  shop: string | null;
  userId: string | number | null;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {

  await authenticate.admin(request);

  const shop = await getCurrentShop(request);
  let user = await getCurrentUser(request);

  if (!shop) {
    return null;
  }

  const shopDomain = shop?.replace('.myshopify.com', '');

  // حساب تاريخ آخر 7 أيام
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // 🔍 البحث عن نموذج نشط للمتجر
  const activeForm = await prisma.form.findFirst({
    where: {
      shop: shop,
      status: "ACTIVE"
    },
    include: {
      configs: {
        where: {
          isActive: true
        }
      }
    }
  });

  // 📊 فحص النشاط في آخر 7 أيام من جميع الجداول
  const recentActivities = await Promise.all([
    prisma.order.count({
      where: {
        shop: shop,
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    }),

    prisma.shippingSettings.count({
      where: {
        shop: shop,
        OR: [
          {
            createdAt: { gte: sevenDaysAgo }
          },
          {
            updatedAt: { gte: sevenDaysAgo }
          }
        ]
      }
    }),

    prisma.formConfig.count({
      where: {
        shop: shop,
        OR: [
          {
            createdAt: { gte: sevenDaysAgo }
          },
          {
            updatedAt: { gte: sevenDaysAgo }
          }
        ]
      }
    }),

    prisma.form.count({
      where: {
        shop: shop,
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    })
  ]);

  const [newOrdersCount, updatedShippingCount, updatedFormConfigsCount, newFormsCount] = recentActivities;

  // 🎯 إنشاء رسالة Last 7 days ديناميكية
  let last7DaysMessage = "No activity in the last 7 days.";

  if (newOrdersCount > 0 || updatedShippingCount > 0 || updatedFormConfigsCount > 0 || newFormsCount > 0) {
    const activities = [];

    if (newOrdersCount > 0) {
      activities.push(`${newOrdersCount} new order${newOrdersCount > 1 ? 's' : ''}`);
    }

    if (updatedShippingCount > 0) {
      activities.push(`shipping settings updated`);
    }

    if (updatedFormConfigsCount > 0) {
      activities.push(`form${updatedFormConfigsCount > 1 ? 's' : ''} modified`);
    }

    if (newFormsCount > 0) {
      activities.push(`${newFormsCount} new form${newFormsCount > 1 ? 's' : ''} created`);
    }

    last7DaysMessage = `Activity in the last 7 days: ${activities.join(', ')}.`;
  }

  const hasActiveForm = !!activeForm;
  const themeAppEmbedStatus = hasActiveForm ? "ON" : "OFF";

  // ✅ التصحيح: تحويل used إلى string
  const dashboardData = {
    plan: {
      name: "Free",
      limit: 100,
      used: newOrdersCount.toString(),
      progress: 0,
      resetDate: "first day of next month"
    },
    balance: 0,
    notifications: {
      email: "redone.mzny@gmail.com"
    },
    recentActivity: {
      last7Days: last7DaysMessage,
      stats: {
        newOrders: newOrdersCount,
        updatedShipping: updatedShippingCount,
        updatedFormConfigs: updatedFormConfigsCount,
        newForms: newFormsCount
      }
    },
    themeAppEmbed: {
      status: themeAppEmbedStatus,
      hasActiveForm: hasActiveForm,
      activeForm: activeForm,
      shopDomain: shopDomain
    },
    shop: shop,
    userId: user?.id || null
  };

  console.log("📊 Dashboard data loaded for shop:", shop, "User ID:", user?.id);

  return dashboardData;
};

export default function Dashboard() {
  const {
    plan,
    balance,
    notifications,
    recentActivity,
    themeAppEmbed,
    shop
  } = useLoaderData<DashboardData>();


  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const actionData = useActionData<typeof action>();

  useEffect(() => {
    if (actionData?.reload) {
      window.location.reload();
    }
  }, [actionData]);

  const handleInstallForm = useCallback(() => {
    submit(null, { method: "post" });
  }, [submit]);

  const usedNumber = Number(plan.used);
  const progressPercentage = (usedNumber / plan.limit) * 100;

  return (
    <Page title="Dashboard">
      <div className="dashboardPage">
        <Layout>
          {/* Theme App Embed */}
          <Layout.Section>
            <Card>
              <Box padding="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Box>
                    <Text as="h2" variant="headingMd">
                      Theme App Embed
                    </Text>
                    <Box paddingBlockStart="200">
                      <Badge
                        tone={themeAppEmbed.status === "ON" ? "success" : "critical"}
                        size="large"
                      >
                        {themeAppEmbed.status}
                      </Badge>
                    </Box>
                  </Box>

                  {themeAppEmbed.status === "ON" ? (
                    <Button
                      variant="primary"
                      url={`https://admin.shopify.com/store/${themeAppEmbed.shopDomain}/themes/current/editor?context=apps`}
                      external
                    >
                      Open Theme Editor
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={handleInstallForm}
                      loading={isSubmitting}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Installing..." : "Install Form"}
                    </Button>
                  )}
                </InlineStack>

                {themeAppEmbed.status === "OFF" && (
                  <Box paddingBlockStart="400">
                    <Banner tone="warning">
                      <Text as="p" variant="bodyMd">
                        Theme App Embed is OFF. You need to install a form to activate it.
                      </Text>
                    </Banner>
                  </Box>
                )}
              </Box>
            </Card>
          </Layout.Section>

          <div style={{ display: "flex", flexWrap: "wrap" }}>

            {/* Welcome Section*/}
            <Layout.Section>
              <Card>
                <Box padding="400">
                  <Text as="h2" variant="headingLg">
                    Welcome to COD FormPay - Order Form COD!
                  </Text>
                  <br />
                  <Text as="p" variant="bodyMd">
                    Thanks for joining COD FormPay! We’re happy to have you with us.
                  </Text>
                  <Box paddingBlockStart="400">
                    <Text as="p" variant="bodyMd">
                      <strong>
                        We’ve saved your email in our system to keep your account secure, send you important updates, and provide better support.
                      </strong>
                    </Text>
                  </Box>
                </Box>
              </Card>
            </Layout.Section>

            {/* Analytics Last 7 Days */}
            <Layout.Section>
              <Card>
                <Box padding="400">
                  <Text as="h3" variant="headingMd">Last 7 days:</Text>
                  <Box paddingBlockStart="200">
                    <Text as="p" variant="bodyMd">
                      Activity in the last 7 days:
                    </Text>

                    {recentActivity.stats.newOrders > 0 && (
                      <Box paddingBlockStart="200">
                        <InlineStack gap="400">
                          <Badge tone="success">
                            {`${recentActivity.stats.newOrders} order${recentActivity.stats.newOrders > 1 ? 's' : ''}`}
                          </Badge>
                          {recentActivity.stats.updatedShipping > 0 && (
                            <Badge tone="attention">
                              Shipping updated
                            </Badge>
                          )}
                          {recentActivity.stats.updatedFormConfigs > 0 && (
                            <Badge tone="info">
                              {`${recentActivity.stats.updatedFormConfigs} form${recentActivity.stats.updatedFormConfigs > 1 ? 's' : ''} modified`}
                            </Badge>
                          )}
                          {recentActivity.stats.newForms > 0 && (
                            <Badge tone="success">
                              {`${recentActivity.stats.newForms} new form${recentActivity.stats.newForms > 1 ? 's' : ''}`}
                            </Badge>
                          )}
                        </InlineStack>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Card>
            </Layout.Section>

          </div>

          {/* Your Plan and Your COnsomation */}
          <Layout.Section>
            <Card>
              <Box padding="400">
                <Text as="h3" variant="headingMd">Your plan:</Text>
                <Box paddingBlockStart="400">
                  <Badge tone="success">{plan.name}</Badge>
                </Box>

                <Box paddingBlockStart="400">
                  <Text as="p" variant="bodyMd">
                    Your active plan on the app is <Text as="span" variant="bodyMd" fontWeight="bold">{plan.name}</Text> with
                    <Text as="span" variant="bodyMd" fontWeight="bold"> {plan.limit}</Text> processed orders each month.
                    This is your current progress this month:
                  </Text>
                </Box>

                <Box paddingBlockStart="400">
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodyMd" fontWeight="bold">
                      {plan.used} / {plan.limit}
                    </Text>
                    <Text as="p" variant="bodyMd">
                      {Math.round(progressPercentage)}%
                    </Text>
                  </InlineStack>
                  <Box paddingBlockStart="200">
                    <ProgressBar progress={progressPercentage} size="small" />
                  </Box>
                </Box>

                <Box paddingBlockStart="400">
                  <Text as="p" variant="bodyMd">
                    When you reach your limit the app will <Text as="span" variant="bodyMd" fontWeight="bold">stop creating orders</Text>.
                  </Text>
                  <Text as="p" variant="bodyMd">
                    The order limit will be reset every {plan.resetDate}.
                  </Text>
                </Box>

                <Box paddingBlockStart="400">
                  <div className="displayFlexIcon">
                    <InlineStack align="start" gap="200">
                      <Icon source={InfoIcon} tone="base" />
                      <Text as="p" variant="bodyMd">
                        You will receive 2 automatic notifications when you reach <Text as="span" variant="bodyMd" fontWeight="bold">85%</Text> and
                        <Text as="span" variant="bodyMd" fontWeight="bold"> 100%</Text> of your limit at{" "}
                        <Link url={`mailto:${notifications.email}`}>{notifications.email}</Link>.
                      </Text>
                    </InlineStack>
                  </div>
                </Box>

                <Box paddingBlockStart="400">
                  <Button variant="primary">Contact us</Button>
                </Box>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </div>
    </Page>
  );
}