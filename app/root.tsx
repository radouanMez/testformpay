// /root.tsx
import "@shopify/polaris/build/esm/styles.css";
import {
  AppProvider,
  Page,
  Card,
  Text,
  BlockStack,
  Button,
  Box,
  InlineStack,
  Banner,
  Layout
} from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { ShouldRevalidateFunction } from "react-router";

import "./styles.css";

export const shouldRevalidate: ShouldRevalidateFunction = ({
  currentUrl,
  nextUrl,
  defaultShouldRevalidate,
}) => {
  return currentUrl.pathname !== nextUrl.pathname && defaultShouldRevalidate;
};

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com" />
        <link rel="dns-prefetch" href="https://cdn.shopify.com" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <Meta />
        <Links />
      </head>
      <body>
        <AppProvider i18n={enTranslations}>
          <Outlet />
          <div className="footer-copywrite">
            <p className="padding-bottom-20">
              © COD FormPay 2026 - <a href="https://shopify.pxf.io/PyvNjM">Shopify</a>
            </p>
          </div>
        </AppProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}


export function ErrorBoundary({ error }: { error: Error }) {
  console.error("App Error:", error);

  const errorMessage = error?.message || '';
  const errorStatus = (error as any)?.status;

  const isNotFoundError = errorStatus === 404 ||
    errorMessage.includes('404') ||
    errorMessage.includes('No route matches URL') ||
    errorMessage.includes('not found') ||
    errorMessage.includes('Not Found');

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>{isNotFoundError ? 'Page Not Found - COD FormPay' : 'Error - COD FormPay'}</title>
        <Meta />
        <Links />
      </head>

      <body>
        <AppProvider i18n={enTranslations}>
          <Page narrowWidth>
            <BlockStack gap="400">
              <Card>
                <Box padding="600">
                  <BlockStack gap="500" align="center">

                    {isNotFoundError ? (
                      // تصميم لصفحة 404
                      <>
                        <Text variant="headingXl" as="h2" alignment="center">
                          Page Not Found
                        </Text>

                        <Text as="p" tone="subdued" alignment="center">
                          The page you're looking for doesn't exist or has been moved.
                        </Text>

                        <InlineStack gap="300">
                          <Button url="/app" variant="primary">
                            Go to homepage
                          </Button>
                          <Button onClick={() => window.history.back()} variant="secondary">
                            Go back
                          </Button>
                        </InlineStack>
                      </>
                    ) : (

                      <>
                        <Text variant="headingXl" as="h2" alignment="center">
                          Oops! Something went wrong
                        </Text>

                        <Text as="p" tone="subdued" alignment="center">
                          We apologize for the inconvenience. Please try refreshing the page.
                        </Text>

                        <InlineStack gap="300">
                          <Button onClick={() => window.location.reload()} variant="primary">
                            Try again
                          </Button>
                          <Button url="/" variant="secondary">
                            Go to homepage
                          </Button>
                        </InlineStack>
                      </>
                    )}

                  </BlockStack>
                </Box>
              </Card>

              {!isNotFoundError && (
                <Banner tone="info" title="Need help?">
                  If this error continues, please contact our support team.
                </Banner>
              )}

            </BlockStack>
          </Page>
        </AppProvider>

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}