import { useState, useEffect } from "react";
import {
  DeleteIcon
} from '@shopify/polaris-icons';

import {
  Page,
  Card,
  Text,
  Box,
  BlockStack,
  InlineStack,
  Button,
  Select,
  Checkbox,
  Banner,
  Divider,
  Icon,
} from "@shopify/polaris";
import { useAuthenticatedFetch } from "../../hooks/useAuthenticatedFetch";

interface GoogleSheetsSettingsProps {
  shop: string | null;
  user: any;
}

export default function GoogleSheetsSettings({ shop, user }: GoogleSheetsSettingsProps) {
  const fetch = useAuthenticatedFetch();

  // --- State variables ---
  const [isConnected, setIsConnected] = useState(false);
  const [enableImport, setEnableImport] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [abandonedSheetName, setAbandonedSheetName] = useState("");
  const [importAbandoned, setImportAbandoned] = useState(false);
  const [importMultipleLines, setImportMultipleLines] = useState(false);
  const [includeAddressDetails, setIncludeAddressDetails] = useState(false);
  const [spreadsheets, setSpreadsheets] = useState<any[]>([]);
  const [sheets, setSheets] = useState<any[]>([]);
  const [abandonedSheets, setAbandonedSheets] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<{ column: string; field: string }[]>([]);

  // --- Possible order fields ---
  const orderFields = [
    { label: "Empty", value: "empty" },
    { label: "Custom text", value: "custom_text" },
    { label: "Creation date (YYYY-MM-DDTHH:MM:SSZ)", value: "created_at" },
    { label: "Creation date (YYYY-MM-DD HH:MM:SS)", value: "created_at_simple_time" },
    { label: "Creation date (YYYY-MM-DD)", value: "created_at_simple" },
    { label: "First name", value: "first_name" },
    { label: "Last name", value: "last_name" },
    { label: "Full name", value: "full_name" },
    { label: "Company", value: "company" },
    { label: "Email", value: "email" },
    { label: "Phone number", value: "phone" },
    { label: "Order note", value: "order_note" },
    { label: "Order type (abandoned or normal)", value: "order_type" },
    { label: "Order number", value: "order_name" },
    { label: "Order ID", value: "order_id" },
    { label: "Address", value: "address1" },
    { label: "Address 2", value: "address2" },
    { label: "City", value: "city" },
    { label: "Province", value: "province" },
    { label: "Zip code", value: "zip_code" },
    { label: "Country", value: "country" },
    { label: "Product name and variant", value: "product_name" },
    { label: "Product name", value: "product_name_alone" },
    { label: "Variant name", value: "variant_name" },
    { label: "Product quantity", value: "product_quantity" },
    { label: "Product SKU", value: "product_sku" },
    { label: "Product ID", value: "product_id" },
    { label: "Product vendor", value: "product_vend" },
    { label: "Product price", value: "product_price" },
    { label: "Order currency", value: "order_currency" },
    { label: "Subtotal price", value: "subtotal_price" },
    { label: "Total discounts", value: "total_discounts" },
    { label: "Discount codes applied", value: "discount_codes" },
    { label: "Shipping price", value: "shipping_price" },
    { label: "Shipping rate name", value: "shipping_name" },
    { label: "Total price", value: "total_price" },
    { label: "Total weight (grams)", value: "total_weight" },
    { label: "Page URL", value: "page_url" },
    { label: "UTM source", value: "utm_source" },
    { label: "UTM medium", value: "utm_medium" },
    { label: "UTM campaign", value: "utm_campaign" },
    { label: "UTM term", value: "utm_term" },
    { label: "UTM content", value: "utm_content" },
    { label: "IP address", value: "ip_address" },
    { label: "Store domain (myshopify.com)", value: "myshopifycom_domain" },
    { label: "Abandoned order recovery URL", value: "abandoned_rec_url" },
    { label: "All order details (in one cell)", value: "all_details" },
  ];

  // --- Fetch integration from DB ---
  const loadIntegrationData = async () => {
    try {
      const res = await fetch("/api/google/integration");
      if (res.ok) {
        const data = await res.json();
        if (data?.integration) {
          const i = data.integration;
          setIsConnected(!!i.accessToken);
          setEnableImport(i.enabled ?? false);
          setSpreadsheetId(i.spreadsheetId ?? "");
          setSheetName(i.sheetName ?? "");

          // ✅ إذا كان هناك sheet خاص بالطلبات المتروكة، فعّل الخيار تلقائيًا
          if (i.abandonedSheetName) {
            setImportAbandoned(true);
            setAbandonedSheetName(i.abandonedSheetName);
          } else {
            setImportAbandoned(false);
            setAbandonedSheetName("");
          }

          if (i.config?.columns) setColumnMapping(i.config.columns);
        }
      }
    } catch (err) {
      console.error("Failed to load integration", err);
    }
  };

  // --- Save integration ---
  const saveIntegration = async () => {
    try {
      const settings = {
        enabled: enableImport,
        spreadsheetId,
        sheetName,
        abandonedSheetName,
        config: { columns: columnMapping },
      };

      const res = await fetch("/api/google/integration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) alert("✅ Settings saved successfully!");
      else alert("❌ Failed to save settings");
    } catch (err) {
      console.error("Save error", err);
    }
  };

  // --- Handle Google Auth ---
  const handleGoogleAuth = async () => {
    try {
      if (!shop) {
        console.error("❌ No shop found from props");
        return;
      }

      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set(
        "client_id",
        "274694217538-t8jcpqbi2l0gv4je2gq6g4rtjnsqiq01.apps.googleusercontent.com"
      );
      authUrl.searchParams.set(
        "redirect_uri",
        "https://dropped-machinery-defining-enjoy.trycloudflare.com/api/google/callback"
      );
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set(
        "scope",
        "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets"
      );
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
      authUrl.searchParams.set("state", shop);

      console.log("🔐 Google Auth URL:", authUrl.toString());

      if (typeof window !== "undefined") {
        if (window.top && window.top !== window) {
          window.top.location.href = authUrl.toString();
        } else {
          window.location.href = authUrl.toString();
        }
      }
    } catch (error) {
      console.error("⚠️ Error redirecting to Google Auth:", error);
      window.open("https://accounts.google.com/o/oauth2/v2/auth", "_blank");
    }
  };

  const [loadingSpreadsheets, setLoadingSpreadsheets] = useState(false);
  const [loadingSheets, setLoadingSheets] = useState(false);

  // 🔹 تحميل قائمة الـ spreadsheets من Google API
  const handleRefreshSpreadsheets = async () => {
    try {
      setLoadingSpreadsheets(true);
      const res = await fetch("/api/google/spreadsheets");
      const data = await res.json();
      setSpreadsheets(data.spreadsheets || []);
    } catch (err) {
      console.error("Failed to load spreadsheets:", err);
    } finally {
      setLoadingSpreadsheets(false);
    }
  };

  // 🔹 تحميل الـ sheets داخل spreadsheet معين
  const loadSheets = async (spreadsheetId: string) => {
    try {
      setLoadingSheets(true);
      const res = await fetch(`/api/google/sheets?spreadsheetId=${spreadsheetId}`);
      const data = await res.json();
      setSheets(data.sheets || []);
      setAbandonedSheets(data.sheets || []);
    } catch (err) {
      console.error("Failed to load sheets:", err);
    } finally {
      setLoadingSheets(false);
    }
  };

  const handleDisconnect = async () => {
    if (confirm("Are you sure you want to disconnect your Google account?")) {
      const res = await fetch("/api/google/disconnect", { method: "POST" });
      if (res.ok) {
        alert("✅ Google account disconnected.");
        setIsConnected(false);
      } else alert("❌ Failed to disconnect.");
    }
  };

  // --- Simulate loading Google Sheets list ---
  const loadSpreadsheets = async () => {
    setSpreadsheets([{ id: "orders_db", name: "Orders Database" }]);
    setSheets([{ id: "Sheet1", name: "Orders" }]);
    setAbandonedSheets([{ id: "Abandoned", name: "Abandoned Orders" }]);
  };

  useEffect(() => {
    const init = async () => {
      await loadIntegrationData(); // تحميل الإعدادات من قاعدة البيانات
      await handleRefreshSpreadsheets(); // تحميل الملفات من Google Drive
    };
    init();
  }, []);

  useEffect(() => {
    if (spreadsheetId) {
      loadSheets(spreadsheetId);
    }
  }, [spreadsheetId]);

  // --- Columns handlers ---
  const handleColumnChange = (index: number, field: string) => {
    const updated = [...columnMapping];
    updated[index].field = field;
    setColumnMapping(updated);
  };

  const addColumn = () => {
    const nextColumn = String.fromCharCode(65 + columnMapping.length);
    setColumnMapping([...columnMapping, { column: nextColumn, field: "" }]);
  };

  const removeColumn = (index: number) => {
    const updated = columnMapping.filter((_, i) => i !== index);
    setColumnMapping(updated);
  };

  // --- UI ---
  return (
    <Page
      title="Google Sheets"
      secondaryActions={
        isConnected ? [{
          content: "Disconnect Google account",
          onAction: handleDisconnect,
          destructive: true,
        }] : []
      }
    >
      <BlockStack gap="600">
        {/* Auth Section */}
        {!isConnected && (
          <Card>
            <Box padding="400">
              <BlockStack gap="400">
                <Text variant="headingLg" as="h2">
                  Google Sheets
                </Text>

                <Banner tone="info">
                  <Text as="p" variant="bodyMd">
                    <strong>Import your COD form orders automatically on Google Sheets</strong>
                    <br />
                    To import your orders automatically on Google Sheets sign in with your Google account here:
                  </Text>
                </Banner>

                <InlineStack gap="200">
                  <Button variant="primary" onClick={handleGoogleAuth}>
                    Sign in with Google
                  </Button>
                  <Button variant="plain" tone="success">
                    Watch tutorial
                  </Button>
                </InlineStack>

                <Text as="p" tone="subdued">
                  After connecting the app to your Google account click on refresh.
                </Text>

                <Button onClick={loadIntegrationData} variant="secondary">
                  Refresh this page
                </Button>

                <Divider />

                <Banner tone="warning">
                  <Text as="p" variant="bodySm">
                    <strong>Important:</strong> When signing in with your Google account, make sure you allow all permissions for Sheets and Drive.
                  </Text>
                </Banner>
              </BlockStack>
            </Box>
          </Card>
        )}

        {/* Settings Section */}
        {isConnected && (
          <Card>
            <Box padding="400">
              <div className="settingsSheets">
                <BlockStack gap="400">

                  <Text variant="headingLg" as="h2">
                    1. Select the Google Sheet where your orders will be imported
                  </Text>

                  <Checkbox
                    label="Enable automatic import of your orders on Google Sheets"
                    checked={enableImport}
                    onChange={setEnableImport}
                  />

                  {enableImport && (
                    <BlockStack gap="400">
                      {/* --- Spreadsheet Selection --- */}
                      <InlineStack gap="400" blockAlign="center">
                        <div style={{ display: "block", width: "100%" }}>
                          <Text as="p" variant="bodyMd">
                            Select your spreadsheet
                          </Text>
                        </div>
                        <div style={{ width: "300px" }}>
                          <Select
                            label=""
                            labelHidden
                            options={[
                              { label: "Select spreadsheet", value: "" },
                              ...spreadsheets.map((s) => ({
                                label: s.name,
                                value: s.id,
                              })),
                            ]}
                            value={spreadsheetId}
                            onChange={(value) => {
                              setSpreadsheetId(value);
                              if (value) loadSheets(value);
                            }}
                          />
                        </div>
                        <div style={{ marginLeft: "50px" }}>
                          <Button variant="plain" onClick={handleRefreshSpreadsheets} loading={loadingSpreadsheets}>
                            Refresh
                          </Button>
                        </div>
                      </InlineStack>

                      {/* --- Sheet Selection --- */}
                      <InlineStack gap="400" blockAlign="center">
                        <div style={{ display: "block", width: "100%" }}>
                          <Text as="p" variant="bodyMd">
                            Select your sheet
                          </Text>
                        </div>
                        <div style={{ width: "300px" }}>
                          <Select
                            label=""
                            labelHidden
                            options={[
                              { label: "Select sheet", value: "" },
                              ...sheets.map((s) => ({
                                label: s.title,
                                value: s.title,
                              })),
                            ]}
                            value={sheetName}
                            onChange={setSheetName}
                          />
                        </div>
                        <div style={{ marginLeft: "50px" }}>
                          <Button
                            variant="plain"
                            onClick={() => loadSheets(spreadsheetId)}
                            loading={loadingSheets}
                            disabled={!spreadsheetId}
                          >
                            Refresh
                          </Button>
                        </div>
                      </InlineStack>

                      {/* --- Abandoned Orders --- */}
                      <Checkbox
                        label="Import abandoned orders on a separate sheet"
                        checked={importAbandoned}
                        onChange={setImportAbandoned}
                      />

                      {importAbandoned && (
                        <InlineStack gap="200" blockAlign="center">
                          <div style={{ display: "block", width: "100%" }}>
                            <Text as="p" variant="bodyMd">
                              Select your sheet for abandoned orders
                            </Text>
                          </div>
                          <div style={{ width: "300px" }}>
                            <Select
                              label=""
                              labelHidden
                              options={[
                                { label: "Select sheet", value: "" },
                                ...abandonedSheets.map((s) => ({
                                  label: s.title,
                                  value: s.title,
                                })),
                              ]}
                              value={abandonedSheetName}
                              onChange={setAbandonedSheetName}
                            />
                          </div>
                          <div style={{ marginLeft: "60px" }}>
                            <Button
                              variant="plain"
                              onClick={() => loadSheets(spreadsheetId)}
                              loading={loadingSheets}
                              disabled={!spreadsheetId}
                            >
                              Refresh
                            </Button>
                          </div>
                        </InlineStack>
                      )}
                    </BlockStack>
                  )}


                  <Divider />

                  {/* Columns config */}
                  <Text variant="headingLg" as="h2">
                    2. Configure your columns fields
                  </Text>

                  <Box padding="300" borderWidth="025" borderRadius="200">
                    {columnMapping.map((col, index) => (
                      <InlineStack key={col.column} gap="200" align="start" blockAlign="center">
                        <div style={{ width: "100%", marginBottom: "20px" }}>
                          <Box width="40px">
                            <Text as="p" variant="bodyMd">
                              {col.column}
                            </Text>
                          </Box>
                          <div style={{ display: "flex", width: "100%", justifyContent: "space-between" }}>
                            <Select
                              label={`Column ${col.column}`}
                              options={[{ label: "Select field", value: "" }, ...orderFields]}
                              value={col.field}
                              onChange={(val) => handleColumnChange(index, val)}
                            />
                            <button className="removeIconButton" onClick={() => removeColumn(index)}>
                              <Icon
                                source={DeleteIcon}
                                tone="base"
                              />
                            </button>
                          </div>
                        </div>
                      </InlineStack>
                    ))}
                    <Box paddingBlockStart="200">
                      <Button onClick={addColumn}>+ Add Column</Button>
                    </Box>
                  </Box>

                  <InlineStack align="end">
                    <Button onClick={saveIntegration}>Save Settings</Button>
                  </InlineStack>

                </BlockStack>
              </div>
            </Box>
          </Card>
        )}
      </BlockStack>
    </Page>
  );
}
