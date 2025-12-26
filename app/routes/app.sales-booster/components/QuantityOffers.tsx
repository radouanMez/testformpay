// [file name]: QuantityOfferManager.tsx
import {
  Page, FormLayout, TextField, Select, ColorPicker, Button,
  Modal, ResourceList, EmptyState, Spinner, BlockStack,
  Thumbnail, InlineStack, Badge, Box, Grid, LegacyCard,
  Toast, Frame, Text, Popover, Checkbox
} from "@shopify/polaris";
import { useState, useCallback, useEffect, useMemo } from "react";
import { SearchIcon, PlusIcon, DeleteIcon, EditIcon } from "@shopify/polaris-icons";

// -------------------- Types --------------------
type ColorPickerColor = {
  hue: number;
  saturation: number;
  brightness: number;
  alpha?: number;
};

type Product = {
  id: string;
  title: string;
  price: number;
  featuredImage?: { url: string };
};

type QuantityTier = {
  id: string;
  title: string;
  quantity: string;
  discountType: "NONE" | "FIXED_AMOUNT" | "PERCENTAGE";
  discountValue: string;
  isPreselected: boolean;
};

// -------------------- Helpers --------------------
const colorToRgba = (color: ColorPickerColor): string => {
  const { hue, saturation, brightness, alpha = 1 } = color;
  const chroma = brightness * saturation;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = brightness - chroma;
  let r = 0, g = 0, b = 0;
  if (hue < 60) [r, g, b] = [chroma, x, 0];
  else if (hue < 120) [r, g, b] = [x, chroma, 0];
  else if (hue < 180) [r, g, b] = [0, chroma, x];
  else if (hue < 240) [r, g, b] = [0, x, chroma];
  else if (hue < 300) [r, g, b] = [x, 0, chroma];
  else[r, g, b] = [chroma, 0, x];
  return `rgba(${Math.round((r + m) * 255)}, ${Math.round((g + m) * 255)}, ${Math.round((b + m) * 255)}, ${alpha})`;
};

// Color
interface SmallColorPickerProps {
  color: ColorPickerColor;
  onChange: (color: ColorPickerColor) => void;
  label: string;
}

// -------------------- SmallColorPicker Component --------------------
const SmallColorPicker = ({ color, onChange, label }: SmallColorPickerProps) => {
  const [popoverActive, setPopoverActive] = useState(false);
  const [tempColor, setTempColor] = useState(color);

  useEffect(() => {
    setTempColor(color);
  }, [color]);

  const togglePopover = useCallback(() => {
    if (!popoverActive) setTempColor(color);
    setPopoverActive((active) => !active);
  }, [popoverActive, color]);

  const handleSave = useCallback(() => {
    onChange(tempColor);
    setPopoverActive(false);
  }, [onChange, tempColor]);

  const handleCancel = useCallback(() => {
    setTempColor(color);
    setPopoverActive(false);
  }, [color]);

  return (
    <Popover
      active={popoverActive}
      activator={
        <Button
          size="micro"
          onClick={togglePopover}
          accessibilityLabel={label}
          icon={
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '3px',
              backgroundColor: colorToRgba(color),
              border: "1px solid rgba(0,0,0,0.1)"
            }} />
          }
        >
          Select
        </Button>
      }
      onClose={handleCancel}
    >
      <Box padding="400" minWidth="200px">
        <BlockStack gap="300">
          <div style={{
            fontSize: 'var(--p-font-size-75)',
            color: 'var(--p-color-text-secondary)',
            fontWeight: 'bold'
          }}>
            {label}
          </div>
          <ColorPicker
            color={tempColor}
            onChange={setTempColor}
            allowAlpha
          />
          <InlineStack align="end" gap="200">
            <Button size="micro" onClick={handleCancel}>Cancel</Button>
            <Button size="micro" variant="primary" onClick={handleSave}>Save</Button>
          </InlineStack>
        </BlockStack>
      </Box>
    </Popover>
  );
};

const PRODUCTS_QUERY = `
  query {
    products(first: 50) {
      edges {
        node {
          id
          title
          featuredImage { url }
          variants(first:1){edges{node{price}}}
        }
      }
    }
  }
`;

// -------------------- Main Component --------------------
export default function QuantityOfferManager() {
  const [view, setView] = useState<"LIST" | "EDIT">("LIST");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [offers, setOffers] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form States
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE">("DRAFT");
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [tiers, setTiers] = useState<QuantityTier[]>([]);

  // Design States
  const [borderColor, setBorderColor] = useState<ColorPickerColor>({ hue: 0, saturation: 0, brightness: 0.8 });
  const [bgColor, setBgColor] = useState<ColorPickerColor>({ hue: 0, saturation: 0, brightness: 1 });
  const [priceColor, setPriceColor] = useState<ColorPickerColor>({ hue: 0, saturation: 0, brightness: 1 });

  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [usedProductIds, setUsedProductIds] = useState<string[]>([]);
  const [productModal, setProductModal] = useState(false);
  const [tierModal, setTierModal] = useState(false);
  const [currentTier, setCurrentTier] = useState<QuantityTier | null>(null);

  // --- Logic: Fetch Offers & Products (Avoid Duplicates) ---
  const fetchProductsAndOffers = useCallback(async () => {
    setLoadingProducts(true);
    try {
      // 1. جلب العروض الحالية لمعرفة المنتجات المستخدمة
      const offersRes = await fetch("/api/quantity-offers");
      const offersJson = await offersRes.json();
      let alreadyUsed: string[] = [];

      if (offersJson.success) {
        setOffers(offersJson.data);
        offersJson.data.forEach((off: any) => {
          if (off.id !== editingId) { // استثناء العرض الحالي عند التعديل
            const ids = off.productSettings?.productIds || [];
            alreadyUsed = [...alreadyUsed, ...ids];
          }
        });
        setUsedProductIds(alreadyUsed);
      }

      // 2. جلب منتجات Shopify عبر GraphQL
      const gqlRes = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: PRODUCTS_QUERY })
      });
      const gqlJson = await gqlRes.json();
      const shopifyItems = gqlJson.data.products.edges.map((e: any) => ({
        id: e.node.id,
        title: e.node.title,
        price: parseFloat(e.node.variants.edges[0].node.price),
        featuredImage: e.node.featuredImage
      }));

      // 3. التصفية: استبعاد المنتجات المستخدمة في عروض أخرى
      const availableItems = shopifyItems.filter((p: Product) => !alreadyUsed.includes(p.id));
      setProducts(availableItems);

    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoadingProducts(false);
      setLoading(false);
    }
  }, [editingId]);

  useEffect(() => { if (view === "LIST") fetchProductsAndOffers(); }, [view, fetchProductsAndOffers]);
  useEffect(() => { if (productModal) fetchProductsAndOffers(); }, [productModal]);

  // --- 2. Tier Handlers ---
  const handleAddTier = () => {
    const newTier: QuantityTier = {
      id: Math.random().toString(),
      title: "Buy {quantity} items",
      quantity: (tiers.length + 1).toString(),
      discountType: "PERCENTAGE",
      discountValue: "10",
      isPreselected: false
    };
    setTiers([...tiers, newTier]);
  };

  const handleEditTier = (tier: QuantityTier) => {
    setCurrentTier({ ...tier });
    setTierModal(true);
  };

  const saveTierChanges = () => {
    if (currentTier) {
      setTiers(tiers.map(t => t.id === currentTier.id ? currentTier : t));
      setTierModal(false);
    }
  };

  const removeTier = (id: string) => {
    setTiers(tiers.filter(t => t.id !== id));
  };
  // --- Handlers ---
  const handleSave = async () => {
    setIsSaving(true);
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/quantity-offers/${editingId}` : "/api/quantity-offers";

    const payload = {
      name,
      status,
      tiers,
      productSettings: { productIds: selectedProducts.map(p => p.id) },
      designSettings: { borderColor, bgColor }
    };

    try {
      await fetch(url, { method, body: JSON.stringify(payload) });
      setView("LIST");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleProductSelection = (product: Product) => {
    const isSelected = selectedProducts.find(p => p.id === product.id);
    if (isSelected) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    } else {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  // --- Render ---
  return (
    <Frame>
      {view === "LIST" ? (
        <Page title="Quantity Offers" primaryAction={{ content: "Create Offer", onAction: () => { setEditingId(null); setView("EDIT"); } }}>
          {loading ? <Spinner /> : (
            <LegacyCard>
              <ResourceList
                resourceName={{ singular: 'offer', plural: 'offers' }}
                items={offers}
                renderItem={(item) => (
                  <ResourceList.Item id={item.id} onClick={() => { setEditingId(item.id); setView("EDIT"); }} accessibilityLabel={`Edit ${item.name}`}>
                    <InlineStack align="space-between">
                      <Text as="p">{item.name}</Text>
                      <Badge tone={item.status === "ACTIVE" ? "success" : "info"}>{item.status}</Badge>
                    </InlineStack>
                  </ResourceList.Item>
                )}
              />
            </LegacyCard>
          )}
        </Page>
      ) : (
        <Page
          title={editingId ? "Edit Offer" : "New Quantity Offer"}
          backAction={{ onAction: () => setView("LIST") }}
          primaryAction={{ content: "Save Offer", onAction: handleSave, loading: isSaving }}
        >
          <Grid>
            {/* Left Column: Settings */}
            <Grid.Cell columnSpan={{ xs: 6, lg: 7 }}>
              <BlockStack gap="500">

                <LegacyCard title="1. Configure the offer" sectioned>
                  <FormLayout>
                    <TextField label="Offer name" value={name} onChange={setName} autoComplete="off" />
                    <Text variant="headingSm" as="h6">Target Products</Text>
                    <Button onClick={() => setProductModal(true)}>
                      {`Select Products (${selectedProducts.length})`}
                    </Button>
                  </FormLayout>
                </LegacyCard>

                <LegacyCard title="2. Configure your quantity offers" sectioned>
                  <BlockStack gap="400">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e1e3e5', textAlign: 'left' }}>
                          <th style={{ padding: '8px' }}>Title</th>
                          <th style={{ padding: '8px' }}>Quantity</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tiers.map((tier) => (
                          <tr key={tier.id} style={{ borderBottom: '1px solid #f1f2f3' }}>
                            <td style={{ padding: '12px 8px' }}>{tier.title}</td>
                            <td style={{ padding: '12px 8px' }}>{tier.quantity}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                              <InlineStack align="end" gap="200">
                                <Button icon={EditIcon} variant="tertiary" onClick={() => handleEditTier(tier)} />
                                <Button icon={DeleteIcon} tone="critical" variant="tertiary" onClick={() => setTiers(tiers.filter(t => t.id !== tier.id))} />
                              </InlineStack>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <Box>
                      <Button icon={PlusIcon} onClick={handleAddTier}>Add offer</Button>
                    </Box>
                  </BlockStack>
                </LegacyCard>

                <LegacyCard title="3. Customize design" sectioned>
                  <Grid>
                    <Grid.Cell columnSpan={{ xs: 6, md: 3 }}>
                      <SmallColorPicker label="Background" color={bgColor} onChange={setBgColor} />
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 6, md: 3 }}>
                      <SmallColorPicker label="Border" color={borderColor} onChange={setBorderColor} />
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 6, md: 3 }}>
                      <SmallColorPicker label="Price" color={priceColor} onChange={setPriceColor} />
                    </Grid.Cell>
                  </Grid>
                </LegacyCard>
              </BlockStack>
            </Grid.Cell>

            {/* Right Column: Live Preview */}
            <Grid.Cell columnSpan={{ xs: 6, lg: 5 }}>
              <div style={{ position: 'sticky', top: '20px' }}>
                <LegacyCard title="Live Preview" sectioned>
                  <Box padding="400">
                    <div style={{
                      border: `1px solid ${colorToRgba(borderColor)}`,
                      borderRadius: '8px',
                      backgroundColor: colorToRgba(bgColor),
                      overflow: 'hidden'
                    }}>
                      {tiers.map((tier, idx) => (
                        <div key={tier.id} style={{
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: idx !== tiers.length - 1 ? `1px solid ${colorToRgba(borderColor)}` : 'none',
                          background: tier.isPreselected ? 'rgba(0,0,0,0.03)' : 'transparent'
                        }}>
                          <InlineStack gap="300" blockAlign="center">
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #ccc', backgroundColor: tier.isPreselected ? '#008060' : 'white' }} />
                            <Text as="span" variant="bodyMd">{tier.title.replace('{product_name}', 'Product Name')}</Text>
                          </InlineStack>
                          <Text as="span" variant="bodyMd" fontWeight="bold" tone="success">
                            {tier.discountType !== 'NONE' ? `-$${tier.discountValue}` : '$20.00'}
                          </Text>
                        </div>
                      ))}
                    </div>
                  </Box>
                </LegacyCard>
              </div>
            </Grid.Cell>
          </Grid>

          {/* Tier Edit Modal */}
          <Modal
            open={tierModal}
            onClose={() => setTierModal(false)}
            title="Configure Tier"
            primaryAction={{ content: "Done", onAction: saveTierChanges }}
          >
            <Modal.Section>
              {currentTier && (
                <FormLayout>
                  <TextField label="Title" value={currentTier.title} onChange={(v) => setCurrentTier({ ...currentTier, title: v })} autoComplete="off" />
                  <TextField label="Quantity" type="number" value={currentTier.quantity} onChange={(v) => setCurrentTier({ ...currentTier, quantity: v })} autoComplete="off" />
                  <Select
                    label="Discount Type"
                    options={[{ label: 'No Discount', value: 'NONE' }, { label: 'Percentage', value: 'PERCENTAGE' }, { label: 'Fixed Amount', value: 'FIXED_AMOUNT' }]}
                    value={currentTier.discountType}
                    onChange={(v: any) => setCurrentTier({ ...currentTier, discountType: v })}
                  />
                  <TextField label="Discount Value" type="number" value={currentTier.discountValue} onChange={(v) => setCurrentTier({ ...currentTier, discountValue: v })} autoComplete="off" />
                  <Checkbox label="Preselect this offer" checked={currentTier.isPreselected} onChange={(v) => setCurrentTier({ ...currentTier, isPreselected: v })} />
                </FormLayout>
              )}
            </Modal.Section>
          </Modal>

          {/* Product Selection Modal */}
          <Modal
            open={productModal}
            onClose={() => setProductModal(false)}
            title="Select Products"
            loading={loadingProducts}
          >
            <Modal.Section>
              <ResourceList
                items={products}
                renderItem={(product) => (
                  <ResourceList.Item id={product.id} onClick={() => toggleProductSelection(product)}>
                    <InlineStack gap="400" blockAlign="center">
                      <Thumbnail source={product.featuredImage?.url || ''} alt={product.title} />
                      <div style={{ flexGrow: 1 }}><Text variant="bodyMd" fontWeight="bold" as="span">{product.title}</Text></div>
                      {selectedProducts.find(p => p.id === product.id) && <Badge tone="success">Selected</Badge>}
                    </InlineStack>
                  </ResourceList.Item>
                )}
              />
            </Modal.Section>
          </Modal>
        </Page>
      )}
    </Frame>
  );
}