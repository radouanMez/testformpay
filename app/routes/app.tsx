// app.tsx
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

import {
  authenticate,
  getCurrentShop,
  getCurrentUser,
  debugSessions,
  linkSessionsToUser
} from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {

  try {
    await authenticate.admin(request);
  } catch (error) {
    // console.error("❌ Authentication failed:", error);
  }

  const currentShop = await getCurrentShop(request);
  let currentUser = await getCurrentUser(request);

  if (currentShop && currentUser) {
    const linkedCount = await linkSessionsToUser(currentShop, currentUser.id);
    if (linkedCount > 0) {
      // console.log("✅ Linked", linkedCount, "sessions to user");
    }
  }

  await debugSessions();

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    shop: currentShop,
    user: currentUser
  };
};

export default function App() {
  const { apiKey, shop, user } = useLoaderData<typeof loader>();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app">Home</s-link>
        <s-link href="/app/designer">Form Designer</s-link>
        <s-link href="/app/sales-booster">Sales Booster</s-link>
        <s-link href="/app/settings">Settings</s-link>
        <s-link href="/app/fraud-prevention">Fraud Prevention</s-link>
        <s-link href="/app/billing">Billing</s-link>
      </s-app-nav>
      <div className="body-content">
       <Outlet />
      </div>
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};