// app/sales-booster/route.tsx
import { Page, Tabs, Card } from "@shopify/polaris";
import { Suspense, useState, useCallback } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useLocation } from "react-router";

import { authenticate, getCurrentShop, getCurrentUser } from "../../shopify.server";
import type { Shop, User } from "./types";

import OneClickUpsells from "./components/OneClickUpsells";
import OneTickUpsells from "./components/OneTickUpsells";
import Downsells from "./components/Downsells";
import QuantityOffers from "./components/QuantityOffers";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  const shop = await getCurrentShop(request);
  const user = await getCurrentUser(request);
  return { shop, user };
};

export default function UpsellsPage() {
  const { shop, user } = useLoaderData<{ shop: Shop; user: User }>();

  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { id: "one-click", content: "One-Click Upsells" },
    { id: "one-tick", content: "One-Tick Upsells" },
    { id: "downsells", content: "Downsells" },
    { id: "quantity", content: "Quantity Offers" },
  ];

  const params = new URLSearchParams(location.search);
  const tabFromUrl = params.get("tab");

  const tabIndex = Math.max(
    0,
    tabs.findIndex((t) => t.id === tabFromUrl)
  );

  const [selectedTab, setSelectedTab] = useState(tabIndex);

  const handleTabChange = useCallback(
    (index: number) => {
      setSelectedTab(index);
      navigate(`?tab=${tabs[index].id}`, { replace: true });
    },
    [navigate]
  );

  return (
    <Page
      title="Sales Booster"
      subtitle="Increase your AOV with smart offers"
    >
      <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange} fitted>
        <Suspense fallback={<div>Loading...</div>}>
          <Card>
            {selectedTab === 0 && <OneClickUpsells />}
            {selectedTab === 1 && <OneTickUpsells />}
            {selectedTab === 2 && <Downsells />}
            {selectedTab === 3 && <QuantityOffers />}
          </Card>
        </Suspense>
      </Tabs>
    </Page>
  );
}
