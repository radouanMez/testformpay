// app.settings.tsx
import { Page, Tabs } from "@shopify/polaris";
import { Suspense, lazy, useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ViewIcon,
  DeleteIcon,
  EditIcon,
  TextIcon,
} from "@shopify/polaris-icons";

// ✅ Lazy load لتحسين الأداء
const VisibilitySettings = lazy(() => import("../../components/settings/visibility"));
const GeneralSettingsSection = lazy(() => import("../../components/settings/general"));
const ShippingPage = lazy(() => import("../../components/settings/shippings"));
const GoogleSheetsSettings = lazy(() => import("../../components/settings/googlesheets"));
const PartnersSettings = lazy(() => import("../../components/settings/partners"));

import { authenticate, getCurrentShop, getCurrentUser } from "../../shopify.server";

// ✅ Loader لتحميل بيانات المصادقة والـ shop والـ user
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  const shop = await getCurrentShop(request);
  const user = await getCurrentUser(request);

  console.log("===========================================================");
  console.log("Shop:", shop);
  console.log("User:", user);
  console.log("===========================================================");

  return {
    shop,
    user,
  };
};

// ✅ المكون الرئيسي لصفحة الإعدادات
export default function SettingsPage() {
  // 🔹 جلب بيانات الـloader
  const { shop, user } = useLoaderData<typeof loader>();

  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    { id: "general", content: "General", panelID: "general-content" },
    { id: "visibility", content: "Visibility", panelID: "visibility-content" },
    { id: "shippings", content: "Shippings", panelID: "shippings-content" },
    { id: "google-sheets", content: "Google Sheets", panelID: "google-sheets-content" },
  ];

  // ✅ الدالة التي تحدد محتوى كل تبويب
  const renderTabContent = () => {
    switch (selectedTab) {
      case 0:
        return (
          <GeneralSettingsSection
            onSave={async (data: any) => {
              try {
                const res = await fetch("/api/save-settings", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(data),
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.error || "Failed to save general settings");
                console.log("✅ General settings saved", result);
              } catch (err) {
                console.error("❌ Error saving general settings", err);
              }
            }}
          />
        );

      case 1:
        return (
          <VisibilitySettings
            onSave={async (data: any) => {
              try {
                const res = await fetch("/api/save-settings", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(data),
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.error || "Failed to save visibility settings");
                console.log("✅ Visibility settings saved", result);
              } catch (err) {
                console.error("❌ Error saving visibility settings", err);
              }
            }}
          />
        );

      case 2:
        return (
          <ShippingPage
            onSave={async (data: any) => {
              try {
                const res = await fetch("/api/shipping", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(data),
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.error || "Failed to save shipping settings");
                console.log("✅ Shipping settings saved", result);
              } catch (err) {
                console.error("❌ Error saving shipping settings", err);
              }
            }}
          />
        ); 

      case 3:
        // ✅ تمرير shop و user إلى GoogleSheetsSettings
        return <GoogleSheetsSettings shop={shop} user={user} />;

      default:
        return <div>Tab not found</div>;
    }
  };

  return (
    <Page title="App Settings" subtitle="Manage your app preferences and integrations.">
      <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab} fitted>
        <div className="page-settings-empty">
          {/* <Suspense fallback={<div>Loading settings...</div>}> */}
          <Suspense>
            {renderTabContent()}
          </Suspense>
        </div>
      </Tabs>
    </Page>
  );
}
