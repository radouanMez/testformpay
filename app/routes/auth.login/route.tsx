// app/routes/auth.tsx 
import { 
  AppProvider, 
  Page, 
  Card, 
  Text, 
  TextField, 
  Button, 
  Box,
  BlockStack,
  InlineStack
} from "@shopify/polaris";
import { useState, useEffect } from "react";
import enTranslations from "@shopify/polaris/locales/en.json";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData, redirect } from "react-router";

import { login, authenticate, getCurrentShop } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";
import shopify from "../../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    await authenticate.admin(request);
    const shop = await getCurrentShop(request);

    if (shop) {
      const url = new URL(request.url);
      url.pathname = `${url.pathname.replace(/\/$/, "")}/app`;
    }
  } catch (error) {
    console.log("🔄 User not authenticated, showing login form");
  }
  const errors = loginErrorMessage(await login(request));
  return { errors };
};

type AuthData = {
  errors?: {
    shop?: string;
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const shop = formData.get("shop") as string;

  const url = new URL(request.url);
  url.searchParams.set("shop", shop);

  return shopify.login(new Request(url.toString(), { method: "GET" }));
};

export default function Auth() {
  const loaderData = useLoaderData<AuthData>();
  const actionData = useActionData<AuthData>();
  const [shop, setShop] = useState("");

  const errors = actionData?.errors || loaderData?.errors || {};

  return (
    <AppProvider i18n={enTranslations}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--p-color-bg-app) 0%, var(--p-color-bg-surface-secondary) 100%)',
        padding: '20px'
      }}>
        <Page narrowWidth>
          <Card>
            <Box padding="600">
              <BlockStack gap="200">
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--p-color-bg-fill-brand)',
                    marginBottom: '16px',
                    overflow: 'hidden'
                  }}>
                    <img 
                      src="/favicon.png" 
                      alt="FormPay Logo" 
                      style={{
                        width: '32px',
                        height: '32px',
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                  <Text variant="headingXl" as="h1" alignment="center" fontWeight="bold">
                    Login to COD FormPay
                  </Text>
                  <Text as="p" tone="subdued" alignment="center">
                    Connect your Shopify store to get started
                  </Text>
                </div>

                {/* Login Form */}
                <Form method="post">
                  <BlockStack gap="500">
                    <TextField
                      label="Shopify store domain"
                      name="shop"
                      value={shop}
                      onChange={setShop}
                      autoComplete="on"
                      placeholder="your-store.myshopify.com"
                      error={errors.shop}
                      prefix={
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 8px',
                          color: 'var(--p-color-text-subdued)'
                        }}>
                          https://
                        </div>
                      }
                    />

                    <Button variant="primary" fullWidth submit size="large">
                      Continue to Shopify
                    </Button>

                  </BlockStack>
                </Form>

                {/* Help Section */}
                <Box
                  padding="600"
                  background="bg-surface-secondary"
                  borderRadius="200"
                >
                  <BlockStack gap="400">
                    <Text variant="headingSm" as="h3">
                      Don't have a store?
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      <a
                        href="https://shopify.pxf.io/PyvNjM"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--p-color-text-link)' }}
                      >
                        Create a Shopify store
                      </a>{' '}
                      to start using COD FormPay.
                    </Text>
                  </BlockStack>
                </Box>
              </BlockStack>
            </Box>
          </Card>
        </Page>
      </div>
    </AppProvider>
  );
}