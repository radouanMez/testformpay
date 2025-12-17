// components/settings/shippings.tsx
import { useState, useEffect, useRef } from "react";
import {
  Page,
  Card,
  ResourceList,
  ResourceItem,
  Text,
  Button,
  Modal,
  TextField,
  Badge,
  Box,
  InlineStack,
  BlockStack,
  Select,
  Spinner,
  Toast,
  Frame,
} from "@shopify/polaris";
import { useAuthenticatedFetch } from "../../hooks/useAuthenticatedFetch";
import type {
  ShippingRate,
  ShippingRateFormData,
  ConditionType,
} from "../../types/shipping";

interface ShippingPageProps {
  onSave?: (data: any) => Promise<void>;
}

export default function ShippingPage({ onSave }: ShippingPageProps) {
  const authenticatedFetch = useAuthenticatedFetch();

  // 🧩 States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ content: string; error?: boolean } | null>(null);

  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [modalActive, setModalActive] = useState(false);
  const [form, setForm] = useState<ShippingRateFormData>({
    name: "",
    price: 0,
    conditions: [],
  });

  const [conditionType, setConditionType] = useState<ConditionType>(
    "if_total_greater_or_equal_than"
  );
  const [conditionValue, setConditionValue] = useState<string>("");

  // استخدام useRef لمنع التحميل المتكرر
  const hasLoaded = useRef(false);

  // ✅ تحميل إعدادات الشحن
  useEffect(() => {
    if (hasLoaded.current) return;

    let mounted = true;

    const loadShippingRates = async () => {
      try {
        const res = await authenticatedFetch("/api/shipping");

        if (!mounted) return;

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();

        if (data.success) {
          if (mounted) {
            setShippingRates(data.rates || []);
          }
        } else {
          throw new Error(data.error || "Failed to load shipping rates");
        }
      } catch (err) {
        console.error("❌ Error loading shipping rates:", err);
        if (mounted) {
          setToast({ content: "Failed to load shipping rates", error: true });
        }
      } finally {
        if (mounted) {
          setLoading(false);
          hasLoaded.current = true;
        }
      }
    };

    loadShippingRates();

    return () => {
      mounted = false;
    };
  }, [authenticatedFetch]);

  const toggleModal = () => setModalActive((prev) => !prev);

  const handleChange = (field: keyof ShippingRateFormData, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleAddCondition = () => {
    if (!conditionValue) return;
    setForm((prev) => ({
      ...prev,
      conditions: [
        ...(prev.conditions || []),
        { type: conditionType, value: conditionValue },
      ],
    }));
    setConditionValue("");
  };

  const handleRemoveCondition = (index: number) => {
    setForm((prev) => ({
      ...prev,
      conditions: prev.conditions?.filter((_, i) => i !== index),
    }));
  };

  // ✅ حفظ معدل الشحن الجديد
  const handleAddRate = async (data: ShippingRateFormData) => {
    setSaving(true);
    try {
      const newRate: ShippingRate = {
        id: crypto.randomUUID(),
        ...data
      };
      const updatedRates = [newRate, ...shippingRates];

      // استخدام onSave إذا كان موجوداً، وإلا استخدم الطريقة المباشرة
      if (onSave) {
        await onSave({ rates: updatedRates });
      } else {
        const res = await authenticatedFetch("/api/shipping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rates: updatedRates }),
        });

        if (!res.ok) {
          throw new Error("Failed to save shipping rate");
        }
      }

      setShippingRates(updatedRates);
      setToast({ content: "✅ Shipping rate added successfully" });
      toggleModal();
      setForm({ name: "", price: 0, conditions: [] });
    } catch (err) {
      console.error("Error adding shipping rate:", err);
      setToast({ content: "❌ Failed to add shipping rate", error: true });
    } finally {
      setSaving(false);
    }
  };

  // ✅ حذف معدل الشحن
  const handleDeleteRate = async (id: string) => {
    try {
      const updatedRates = shippingRates.filter(r => r.id !== id);

      // استخدام onSave إذا كان موجوداً، وإلا استخدم الطريقة المباشرة
      if (onSave) {
        await onSave({ rates: updatedRates });
      } else {
        const res = await authenticatedFetch("/api/shipping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rates: updatedRates }),
        });

        if (!res.ok) {
          throw new Error("Failed to delete rate");
        }
      }

      setShippingRates(updatedRates);
      setToast({ content: "✅ Shipping rate deleted successfully" });
    } catch (err) {
      console.error("Error deleting shipping rate:", err);
      setToast({ content: "❌ Failed to delete shipping rate", error: true });
    }
  };

  const handleSubmit = () => {
    if (!form.name || form.price < 0) return;
    handleAddRate(form);
  };

  const conditionOptions = [
    { label: "If total ≥ than", value: "if_total_greater_or_equal_than" },
    { label: "If total < than", value: "if_total_less_than" },
    { label: "If weight ≥ than", value: "if_weight_greater_or_equal_than" },
    { label: "If weight < than", value: "if_weight_less_than" },
    { label: "If quantity ≥ than", value: "if_quantity_greater_or_equal_than" },
    { label: "If quantity < than", value: "if_quantity_less_than" },
  ];

  if (loading) {
    return (
      <Page>
        <div style={{ textAlign: "center", padding: "100px" }}>
          <Spinner size="large" />
          <Text as="p" tone="subdued">Loading settings...</Text>
        </div>
      </Page>
    );
  }

  return (
    <Frame>
      <Page
        title="Shippings"
        subtitle="Manage your shipping rates and conditions"
        primaryAction={{
          content: saving ? "Add..." : "Add Rate",
          onAction: toggleModal,
          loading: saving,
        }}
      >

        {/* ✅ قائمة الشحن */}
        <div className="shipping-rates-container">
          <Card>
            <div className="rates-header">
              <Text variant="headingSm" as="h3" fontWeight="semibold">
                Active Shipping Rates ({shippingRates.length})
              </Text>
            </div>

            {shippingRates.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🚚</div>
                <Text variant="headingSm" as="h3" alignment="center">
                  No shipping rates yet
                </Text>
                <Text as="p" tone="subdued" alignment="center">
                  Add your first shipping rate to get started
                </Text>
                <div className="padding-top-20">
                  <Button onClick={toggleModal} variant="primary" tone="success">
                    Create First Rate
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rates-list-container">
                <ResourceList
                  resourceName={{ singular: "rate", plural: "rates" }}
                  items={shippingRates}
                  renderItem={(rate, _, index) => (
                    <ResourceItem
                      id={rate.id || String(index)}
                      accessibilityLabel={`View details for ${rate.name}`}
                      onClick={() => { }}
                    >
                      <div className="rate-item">
                        <Box paddingBlock="300" paddingInline="300">
                          <InlineStack align="space-between" blockAlign="center">
                            <div className="rate-info">
                              <div className="rate-main">
                                <Text as="h3" variant="bodyLg" fontWeight="bold">
                                  {rate.name}
                                </Text>
                                <div className="rate-price">
                                  <Badge tone="success" size="large">
                                    {`$${rate.price.toFixed(2)}`}
                                  </Badge>
                                </div>
                              </div>

                              {rate.description && (
                                <div className="rate-description">
                                  <Text as="p" tone="subdued">
                                    {rate.description}
                                  </Text>
                                </div>
                              )}

                              {rate.conditions && rate.conditions.length > 0 && (
                                <div className="conditions-container">
                                  <Text as="p" variant="bodySm" fontWeight="medium" tone="subdued">
                                    Conditions:
                                  </Text>
                                  <div className="conditions-list">
                                    {rate.conditions?.map((condition, i) => (
                                      <Badge
                                        key={i}
                                        tone="info"
                                        size="small"
                                      >
                                        {`${condition.type.replace(/_/g, ' ')}: ${condition.value}`}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="rate-actions">
                              <Button
                                tone="critical"
                                variant="secondary"
                                onClick={() => handleDeleteRate(rate.id || String(index))}
                                disabled={saving}
                                size="slim"
                              >
                                Delete
                              </Button>
                            </div>
                          </InlineStack>
                        </Box>
                      </div>
                    </ResourceItem>
                  )}
                />
              </div>
            )}
          </Card>
        </div>

        {/* ✅ مودال الإضافة */}
        <Modal
          open={modalActive}
          onClose={toggleModal}
          title="Add New Shipping Rate"
          primaryAction={{
            content: saving ? "Creating..." : "Create Rate",
            onAction: handleSubmit,
            disabled: saving || !form.name || form.price < 0,
            loading: saving,
          }}
          secondaryActions={[{ content: "Cancel", onAction: toggleModal }]}
          size="large"
        >
          <Modal.Section>
            <div className="shipping-form-container">
              <BlockStack gap="500">
                {/* المعلومات الأساسية */}
                <div className="form-section">
                  <div className="title-border-bottom">
                    <Text variant="headingSm" as="h3" fontWeight="semibold">
                      Basic Information
                    </Text>
                  </div>
                  <div className="form-fields-grid">
                    <TextField
                      label="Rate Name"
                      autoComplete="off"
                      value={form.name}
                      onChange={(v) => handleChange("name", v)}
                      disabled={saving}
                      placeholder="e.g., Standard Shipping"
                      requiredIndicator
                    />
                    <TextField
                      autoComplete="off"
                      label="Price ($)"
                      type="number"
                      value={String(form.price)}
                      onChange={(v) => handleChange("price", Number(v))}
                      disabled={saving}
                      placeholder="0.00"
                      min={0}
                      step={0.01}
                      requiredIndicator
                    />
                  </div>
                  <TextField
                    label="Description (Optional)"
                    autoComplete="off"
                    value={form.description || ""}
                    onChange={(v) => handleChange("description", v)}
                    disabled={saving}
                    placeholder="Add a description for this shipping rate..."
                    multiline={2}
                  />
                </div>

                {/* ✅ قسم الشروط */}
                {/* <div className="form-section">
                  <div className="title-border-bottom">
                    <Text variant="headingSm" as="h3" fontWeight="semibold">
                      Conditions (Optional)
                    </Text>
                  </div>
                  <div className="conditions-form">
                    <BlockStack gap="400">
                      <div className="condition-inputs">
                        <InlineStack gap="200" blockAlign="end">
                          <div className="condition-select">
                            <Select
                              label="Condition type"
                              options={conditionOptions}
                              value={conditionType}
                              onChange={(value) => setConditionType(value as ConditionType)}
                              disabled={saving}
                            />
                          </div>
                          <div className="condition-value">
                            <TextField
                              label="Value"
                              autoComplete="off"
                              value={conditionValue}
                              onChange={setConditionValue}
                              disabled={saving}
                              placeholder="Enter value..."
                            />
                          </div>
                          <Button
                            onClick={handleAddCondition}
                            disabled={saving || !conditionValue}
                            variant="primary"
                            tone="success"
                          >
                            Add Condition
                          </Button>
                        </InlineStack>
                      </div>

                      {form.conditions && form.conditions.length > 0 && (
                        <div className="active-conditions">
                          <Text as="p" variant="bodySm" fontWeight="medium">
                            Active Conditions ({form.conditions.length})
                          </Text>
                          <div className="conditions-list-scroll">
                            {form.conditions.map((cond, i) => (
                              <div key={i} className="condition-item">
                                <InlineStack align="space-between" blockAlign="center">
                                  <Badge tone="info" size="large">
                                    {`${cond.type.replaceAll("_", " ")}: ${cond.value}`}
                                  </Badge>
                                  <Button
                                    size="slim"
                                    tone="critical"
                                    variant="plain"
                                    onClick={() => handleRemoveCondition(i)}
                                    disabled={saving}
                                  >
                                    Remove
                                  </Button>
                                </InlineStack>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </BlockStack>
                  </div>
                </div> */}
              </BlockStack>
            </div>
          </Modal.Section>
        </Modal>

        {/* Toast Notification */}
        {
          toast && (
            <Toast
              content={toast.content}
              error={toast.error}
              onDismiss={() => setToast(null)}
            />
          )
        }
      </Page >
    </Frame>
  );
}