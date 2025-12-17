import {
  Page,
  Layout,
  Card,
  Box,
  Text,
  Checkbox,
  TextField,
  RadioButton,
  Button,
  Banner,
  Spinner,
  Toast,
  Frame,
} from "@shopify/polaris";
import { useState, useEffect, useRef } from "react";
import { useAuthenticatedFetch } from "../../hooks/useAuthenticatedFetch";

interface GeneralSettingsProps {
  onSave?: (data: any) => Promise<void>;
}

export default function GeneralSettingsSection({ onSave }: GeneralSettingsProps) {
  const authenticatedFetch = useAuthenticatedFetch();

  // 🧩 States
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ content: string; error?: boolean } | null>(null);

  // ✅ Order Options
  const [createCODOrders, setCreateCODOrders] = useState(true);
  const [saveAsDraft, setSaveAsDraft] = useState(true);
  const [saveUTM, setSaveUTM] = useState(false);

  // ✅ Form Options
  const [disableDiscounts, setDisableDiscounts] = useState(false);
  const [disableAutofill, setDisableAutofill] = useState(false);
  const [removeLeadingZero, setRemoveLeadingZero] = useState(false);
  const [addTag, setAddTag] = useState(true);

  // ✅ Redirect Options
  const [redirectType, setRedirectType] = useState("default");
  const [customURL, setCustomURL] = useState("");
  const [whatsAppNumber, setWhatsAppNumber] = useState("");
  const [whatsAppMessage, setWhatsAppMessage] = useState("");
  const [thankYouMessage, setThankYouMessage] = useState(
    "Thank you for your purchase! 🎉\nWe will contact you soon to confirm your order. ✅"
  );

  // استخدام useRef لمنع التحميل المتكرر
  const hasLoaded = useRef(false);

  // ✅ تحميل الإعدادات الحالية
  useEffect(() => {
    if (hasLoaded.current) return;

    let mounted = true;

    const loadSettings = async () => {
      try {
        const res = await authenticatedFetch("/api/save-settings");

        if (!mounted) return;

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();

        if (data.success && data.data?.general) {
          const general = data.data.general;

          if (mounted) {
            // Order Options
            if (general.orderOptions) {
              setCreateCODOrders(general.orderOptions.createCODOrders ?? true);
              setSaveAsDraft(general.orderOptions.saveAsDraft ?? true);
              setSaveUTM(general.orderOptions.saveUTM ?? false);
            }

            // Form Options
            if (general.formOptions) {
              setDisableDiscounts(general.formOptions.disableDiscounts ?? false);
              setDisableAutofill(general.formOptions.disableAutofill ?? false);
              setRemoveLeadingZero(general.formOptions.removeLeadingZero ?? false);
              setAddTag(general.formOptions.addTag ?? true);
            }

            // Redirect Options
            if (general.redirectOptions) {
              setRedirectType(general.redirectOptions.redirectType || "default");
              setCustomURL(general.redirectOptions.customURL || "");
              setWhatsAppNumber(general.redirectOptions.whatsAppNumber || "");
              setWhatsAppMessage(general.redirectOptions.whatsAppMessage || "");
              setThankYouMessage(general.redirectOptions.thankYouMessage ||
                "Thank you for your purchase! 🎉\nWe will contact you soon to confirm your order. ✅");
            }
          }
        }
      } catch (err) {
        console.error("❌ Error loading general settings:", err);
        if (mounted) {
          setToast({ content: "Failed to load general settings", error: true });
        }
      } finally {
        if (mounted) {
          setLoading(false);
          hasLoaded.current = true;
        }
      }
    };

    loadSettings();

    return () => {
      mounted = false;
    };
  }, [authenticatedFetch]);

  // ✅ Handle save
  const handleSave = async () => {
    setIsSaving(true);

    try {
      const payload = {
        orderOptions: { createCODOrders, saveAsDraft, saveUTM },
        formOptions: { disableDiscounts, disableAutofill, removeLeadingZero, addTag },
        redirectOptions: {
          redirectType,
          customURL,
          whatsAppNumber,
          whatsAppMessage,
          thankYouMessage,
        },
      };

      // استخدام onSave إذا كان موجوداً، وإلا استخدم الطريقة المباشرة
      if (onSave) {
        await onSave(payload);
      } else {
        const res = await authenticatedFetch("/api/save-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error("Failed to save settings");
        }
      }

      setToast({ content: "✅ General settings saved successfully" });
    } catch (error) {
      console.error("Error saving settings:", error);
      setToast({ content: "❌ Failed to save general settings", error: true });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <Page>
        <div style={{ textAlign: "center", padding: "100px" }}>
          <Spinner size="large" />
          <Text as="p" tone="subdued">
            Loading settings...
          </Text>
        </div>
      </Page>
    );
  }

  return (
    <Frame>
      <Page
        title="General"
        primaryAction={{
          content: isSaving ? "Saving..." : "Save changes",
          onAction: handleSave,
          disabled: isSaving,
          loading: isSaving,
        }}
      >
        <Layout>
          {/* Advanced Settings */}
          <Layout.Section>
            <Card>
              <Box padding="400">
                <Text variant="headingMd" as="h2">
                  Customize your advanced settings
                </Text>

                {/* Order Options */}
                <Box paddingBlockStart="400">
                  <Text variant="headingSm" as="h3">
                    Order Options
                  </Text>
                  <Box paddingBlockStart="200">
                    <p>
                      <Checkbox
                        label="Create orders with the Cash on Delivery (COD) payment method"
                        checked={createCODOrders}
                        onChange={setCreateCODOrders}
                      />
                    </p>
                    <p>
                      <Checkbox
                        label="Save orders as draft orders"
                        checked={saveAsDraft}
                        onChange={setSaveAsDraft}
                      />
                    </p>
                    <p>
                      <Checkbox
                        label="Save UTM parameters on the additional details section of orders"
                        checked={saveUTM}
                        onChange={setSaveUTM}
                      />
                    </p>
                  </Box>
                </Box>

                {/* Form Options */}
                <Box paddingBlockStart="400">
                  <Text variant="headingSm" as="h3">
                    Form Options
                  </Text>
                  <Box paddingBlockStart="200">
                    <p>
                      <Checkbox
                        label="Disable your Shopify automatic discounts on the COD form"
                        checked={disableDiscounts}
                        onChange={setDisableDiscounts}
                      />
                    </p>
                    <p>
                      <Checkbox
                        label="Disable autofill and autocomplete on the COD form"
                        checked={disableAutofill}
                        onChange={setDisableAutofill}
                      />
                    </p>
                    <p>
                      <Checkbox
                        label="Remove the 0 at the beginning of phone numbers in the final order in Shopify"
                        checked={removeLeadingZero}
                        onChange={setRemoveLeadingZero}
                      />
                    </p>
                    <p>
                      <Checkbox
                        label="Add the formino_cod_form tag to orders from the COD form"
                        checked={addTag}
                        onChange={setAddTag}
                      />
                    </p>
                  </Box>
                </Box>
              </Box>
            </Card>
          </Layout.Section>

          {/* Redirect Settings */}
          <Layout.Section>
            <Card>
              <Box padding="400">
                <Text variant="headingMd" as="h2">
                  Select your redirect after customers complete their purchase
                </Text>

                <Box paddingBlockStart="300">
                  <p>
                    <RadioButton
                      label="Redirect customers to the default Shopify thank you page"
                      checked={redirectType === "default"}
                      id="default"
                      name="redirect"
                      onChange={() => setRedirectType("default")}
                    />
                  </p>

                  <p>
                    <RadioButton
                      label="Redirect customers to a custom page or link"
                      checked={redirectType === "custom"}
                      id="custom"
                      name="redirect"
                      onChange={() => setRedirectType("custom")}
                    />
                  </p>

                  {redirectType === "custom" && (
                    <Box paddingBlockStart="200">
                      <TextField
                        autoComplete="off"
                        label="Custom page URL"
                        value={customURL}
                        onChange={setCustomURL}
                        placeholder="https://yourstore.com/thank-you"
                      />
                      <Text tone="subdued" as="p">
                        Shortcodes: {"{product_title}, {order_id}, {order_number}"}
                      </Text>
                    </Box>
                  )}

                  <p>
                    <RadioButton
                      label="Redirect customers to a WhatsApp chat with you"
                      checked={redirectType === "whatsapp"}
                      id="whatsapp"
                      name="redirect"
                      onChange={() => setRedirectType("whatsapp")}
                    />
                  </p>

                  {redirectType === "whatsapp" && (
                    <Box paddingBlockStart="200">
                      <TextField
                        autoComplete="off"
                        label="Your WhatsApp phone number"
                        value={whatsAppNumber}
                        onChange={setWhatsAppNumber}
                        helpText="Include your country code, e.g. +918673376262"
                      />
                      <TextField
                        autoComplete="off"
                        label="Pre-filled WhatsApp message"
                        value={whatsAppMessage}
                        onChange={setWhatsAppMessage}
                        multiline={4}
                      />
                      <Text tone="subdued" as="p">
                        Shortcodes: {"{product_summary}, {order_id}, {first_name}, {phone}, {order_total}"}
                      </Text>
                    </Box>
                  )}

                  <p>
                    <RadioButton
                      label="Show a custom thank you message inside the form"
                      checked={redirectType === "message"}
                      id="message"
                      name="redirect"
                      onChange={() => setRedirectType("message")}
                    />
                  </p>

                  {redirectType === "message" && (
                    <Box paddingBlockStart="200">
                      <TextField
                        autoComplete="off"
                        label="Message"
                        value={thankYouMessage}
                        onChange={setThankYouMessage}
                        multiline={6}
                      />
                      <Text tone="subdued" as="p">
                        Shortcodes: {"{first_name}, {order_id}, {order_total}, {product_title}"}
                      </Text>
                    </Box>
                  )}
                </Box>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>

        {/* Toast Notification */}
        {toast && (
          <Toast
            content={toast.content}
            error={toast.error}
            onDismiss={() => setToast(null)}
          />
        )}
      </Page>
    </Frame>
  );
}