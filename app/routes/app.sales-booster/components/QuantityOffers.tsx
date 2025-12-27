// [file name]: QuantityOfferManager.tsx
import {
  Page, FormLayout, TextField, Select, ColorPicker, Button,
  Modal, ResourceList, EmptyState, Spinner, BlockStack,
  Thumbnail, InlineStack, Badge, Box, Grid, LegacyCard,
  Toast, Frame, Text, Popover, Checkbox, TextContainer, Divider, Link
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
  hideComparisonPrice: boolean;
  priceColor: ColorPickerColor;
  plaqueText: string;
  plaqueTextColor: ColorPickerColor;
  plaqueBgColor: ColorPickerColor;
  imageUrl: string;
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

// Color Picker Interface
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

  // Toast States (مضافة من Downsells)
  const [toastActive, setToastActive] = useState(false);
  const [toastContent, setToastContent] = useState("");
  const [toastError, setToastError] = useState(false);

  // Delete Modal States (مضافة من Downsells)
  const [deleteModalActive, setDeleteModalActive] = useState(false);
  const [tierToDelete, setTierToDelete] = useState<string | null>(null);

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

  const [hideProductImage, setHideProductImage] = useState(false);
  const [hideVariantNumbers, setHideVariantNumbers] = useState(false);
  const [useComparisonAsOldPrice, setUseComparisonAsOldPrice] = useState(false);

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
      setToastContent("Error fetching data");
      setToastError(true);
      setToastActive(true);
    } finally {
      setLoadingProducts(false);
      setLoading(false);
    }
  }, [editingId]);

  // --- وظيفة جديدة: تحميل بيانات العرض عند التعديل ---
  const loadOfferData = useCallback(async (offerId: string) => {
    try {
      const response = await fetch(`/api/quantity-offers/${offerId}`);
      const result = await response.json();

      if (result.success && result.data) {
        const offer = result.data;

        // تحميل البيانات الأساسية
        setName(offer.name);
        setStatus(offer.status || "DRAFT");
        setTiers(offer.tiers || []);

        // تحميل إعدادات التصميم
        if (offer.designSettings) {
          const { borderColor: bc, bgColor: bg, priceColor: pc } = offer.designSettings;
          if (bc) setBorderColor(bc);
          if (bg) setBgColor(bg);
          if (pc) setPriceColor(pc);
        }

        // تحميل المنتجات المختارة - هذه هي الخطوة المفقودة!
        if (offer.productSettings?.productIds) {
          // جلب المنتجات من قائمة المنتجات المتاحة
          const gqlRes = await fetch("/api/graphql", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: PRODUCTS_QUERY })
          });
          const gqlJson = await gqlRes.json();
          const allProducts = gqlJson.data.products.edges.map((e: any) => ({
            id: e.node.id,
            title: e.node.title,
            price: parseFloat(e.node.variants.edges[0].node.price),
            featuredImage: e.node.featuredImage
          }));

          // تصفية المنتجات المختارة
          const selected = allProducts.filter((p: Product) =>
            offer.productSettings.productIds.includes(p.id)
          );
          setSelectedProducts(selected);
        }

        setToastContent("Offer loaded successfully");
        setToastError(false);
        setToastActive(true);
      }
    } catch (error) {
      console.error("Error loading offer data:", error);
      setToastContent("Error loading offer data");
      setToastError(true);
      setToastActive(true);
    }
  }, []);

  useEffect(() => {
    if (view === "LIST") fetchProductsAndOffers();
  }, [view, fetchProductsAndOffers]);

  useEffect(() => {
    if (productModal) fetchProductsAndOffers();
  }, [productModal]);

  // --- 2. Tier Handlers ---
  const createNewTier = (qty: number): QuantityTier => ({
    id: Math.random().toString(),
    title: `Buy ${qty} items`,
    quantity: qty.toString(),
    discountType: "PERCENTAGE",
    discountValue: "25",
    isPreselected: false,
    hideComparisonPrice: false,
    priceColor: { hue: 0, saturation: 0, brightness: 0 },
    plaqueText: "Save 25%",
    plaqueTextColor: { hue: 0, saturation: 0, brightness: 1 },
    plaqueBgColor: { hue: 120, saturation: 0.8, brightness: 0.5 },
    imageUrl: ""
  });

  const handleEditTier = (tier: QuantityTier) => {
    setCurrentTier({ ...tier });
    setTierModal(true);
  };

  const saveTierChanges = () => {
    if (currentTier) {
      setTiers(tiers.map(t => t.id === currentTier.id ? currentTier : t));
      setTierModal(false);
      setToastContent("Tier updated successfully");
      setToastError(false);
      setToastActive(true);
    }
  };

  const confirmDeleteTier = () => {
    if (tierToDelete) {
      setTiers(tiers.filter(t => t.id !== tierToDelete));
      setDeleteModalActive(false);
      setTierToDelete(null);
      setToastContent("Tier deleted successfully");
      setToastError(false);
      setToastActive(true);
    }
  };

  // --- Handlers ---
  const handleSave = async () => {
    setIsSaving(true);

    // تحقق من الأخطاء (مضافة من Downsells)
    if (!name.trim()) {
      setToastContent("Please enter an offer name");
      setToastError(true);
      setToastActive(true);
      setIsSaving(false);
      return;
    }

    if (selectedProducts.length === 0) {
      setToastContent("Please select at least one product");
      setToastError(true);
      setToastActive(true);
      setIsSaving(false);
      return;
    }

    if (tiers.length === 0) {
      setToastContent("Please add at least one tier");
      setToastError(true);
      setToastActive(true);
      setIsSaving(false);
      return;
    }

    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/quantity-offers/${editingId}` : "/api/quantity-offers";

    const payload = {
      name,
      status,
      tiers,
      productSettings: {
        productIds: selectedProducts.map(p => p.id),
        productTitles: selectedProducts.map(p => p.title)
      },
      designSettings: {
        bgColor,
        borderColor,
        hideProductImage,
        hideVariantNumbers,
        useComparisonAsOldPrice,
      }
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (result.success) {
        setToastContent(editingId ? "Offer updated successfully" : "Offer created successfully");
        setToastError(false);
        setToastActive(true);
        setView("LIST");
        fetchProductsAndOffers();
      } else {
        throw new Error(result.error || "Failed to save");
      }
    } catch (error: any) {
      setToastContent(error.message || "Failed to save offer");
      setToastError(true);
      setToastActive(true);
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

  // --- Edit Offer ---
  const handleEdit = async (offer: any) => {
    setEditingId(offer.id);

    // تحميل البيانات الأساسية مباشرة من الـ offer
    setName(offer.name);
    setStatus(offer.status || "DRAFT");
    setTiers(offer.tiers || []);

    // تحميل إعدادات التصميم
    if (offer.designSettings) {
      const { borderColor: bc, bgColor: bg, priceColor: pc } = offer.designSettings;
      if (bc) setBorderColor(bc);
      if (bg) setBgColor(bg);
      if (pc) setPriceColor(pc);
    }

    // هذا هو الجزء المهم - نحتاج لتحميل المنتجات
    if (offer.productSettings?.productIds) {
      // جلب جميع المنتجات أولاً
      const gqlRes = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: PRODUCTS_QUERY })
      });

      const gqlJson = await gqlRes.json();
      const allProducts = gqlJson.data.products.edges.map((e: any) => ({
        id: e.node.id,
        title: e.node.title,
        price: parseFloat(e.node.variants.edges[0].node.price),
        featuredImage: e.node.featuredImage
      }));

      // تصفية المنتجات المختارة
      const selected = allProducts.filter((p: Product) =>
        offer.productSettings.productIds.includes(p.id)
      );
      setSelectedProducts(selected);
    }

    setView("EDIT");
  };

  // --- Create New Offer ---
  const handleCreateNew = () => {
    setEditingId(null);
    setName("");
    setStatus("DRAFT");
    setSelectedProducts([]);
    setTiers([]);
    setBorderColor({ hue: 0, saturation: 0, brightness: 0.8 });
    setBgColor({ hue: 0, saturation: 0, brightness: 1 });
    setPriceColor({ hue: 0, saturation: 0, brightness: 1 });
    setView("EDIT");
  };

  // --- Delete Offer ---
  const handleDeleteOffer = async (id: string) => {
    try {
      const response = await fetch(`/api/quantity-offers/${id}`, { method: "DELETE" });
      const result = await response.json();

      if (result.success) {
        setToastContent("Offer deleted successfully");
        setToastError(false);
        setToastActive(true);
        fetchProductsAndOffers();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      setToastContent(error.message || "Failed to delete offer");
      setToastError(true);
      setToastActive(true);
    }
  };

  // --- المنتجات المتاحة مع استثناء العرض الحالي ---
  const availableProducts = useMemo(() => {
    // عند التعديل، نسمح بعرض المنتجات المختارة حالياً
    return products.filter(product => {
      // إذا كان المنتج مختاراً في العرض الحالي، اظهره
      if (selectedProducts.find(p => p.id === product.id)) {
        return true;
      }

      // إذا كان المنتج مستخدماً في عروض أخرى، استبعده
      return !usedProductIds.includes(product.id);
    });
  }, [products, usedProductIds, selectedProducts]);

  const editOffer = (
    <Page
      title={editingId ? "Edit Offer" : "New Quantity Offer"}
      backAction={{ onAction: () => setView("LIST") }}
      primaryAction={{
        content: "Save Offer",
        onAction: handleSave,
        loading: isSaving,
        disabled: isSaving
      }}
    >
      <Grid>
        {/* Left Column: Settings */}
        <Grid.Cell columnSpan={{ xs: 6, lg: 6 }}>
          <BlockStack gap="500">

            <LegacyCard title="1. Configure the offer" sectioned>
              <FormLayout>
                <div className="custom-switch">
                  <InlineStack align="space-between">
                    <h4>Offer Status</h4>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={status === "ACTIVE"}
                        onChange={(e) => setStatus(e.target.checked ? "ACTIVE" : "DRAFT")}
                      />
                      <span className="slider round"></span>
                    </label>
                  </InlineStack>
                </div>

                <TextField
                  label="Offer name"
                  value={name}
                  onChange={setName}
                  autoComplete="off"
                  error={!name.trim() ? "Offer name is required" : undefined}
                />

                <Text variant="headingSm" as="h6">Target Products</Text>
                <Button onClick={() => setProductModal(true)}>
                  {`Select Products (${selectedProducts.length})`}
                </Button>

                {selectedProducts.length > 0 && (
                  <Box paddingBlockStart="200">
                    <BlockStack gap="200">
                      {selectedProducts.map((product) => (
                        <InlineStack key={product.id} gap="200" blockAlign="center">
                          {product.featuredImage?.url && (
                            <Thumbnail
                              source={product.featuredImage.url}
                              alt={product.title}
                              size="small"
                            />
                          )}
                          <div>
                            <p><strong>{product.title}</strong></p>
                            <p>${product.price.toFixed(2)}</p>
                          </div>
                          <Button
                            icon={DeleteIcon}
                            tone="critical"
                            variant="tertiary"
                            onClick={() => {
                              toggleProductSelection(product)
                            }}
                          />
                        </InlineStack>
                      ))}
                    </BlockStack>
                  </Box>
                )}
              </FormLayout>
            </LegacyCard>

            <LegacyCard title="2. Configure your quantity offers" sectioned>
              <BlockStack gap="400">
                {tiers.length === 0 ? (
                  <EmptyState
                    heading="No tiers added"
                    action={{
                      content: "Add Tier",
                      onAction: () => {
                        const newTier = createNewTier(1);
                        setTiers([newTier]);
                      }
                    }}
                    image=""
                  >
                    <p>Add quantity tiers to create your offer.</p>
                  </EmptyState>
                ) : (
                  <>
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
                                <Button
                                  icon={DeleteIcon}
                                  tone="critical"
                                  variant="tertiary"
                                  onClick={() => {
                                    setTierToDelete(tier.id);
                                    setDeleteModalActive(true);
                                  }}
                                />
                              </InlineStack>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
                <Box>
                  <Button icon={PlusIcon} onClick={() => setTiers([...tiers, createNewTier(tiers.length + 1)])}>Add Tier</Button>                    </Box>
              </BlockStack>
            </LegacyCard>

            <LegacyCard title="3. Customize the design and behaviour" sectioned>
              <BlockStack gap="500">
                {/* خيارات الألوان */}
                <Grid>
                  <Grid.Cell columnSpan={{ xs: 6, md: 3 }}>
                    <SmallColorPicker
                      label="Background color"
                      color={bgColor}
                      onChange={setBgColor}
                    />
                  </Grid.Cell>
                  <Grid.Cell columnSpan={{ xs: 6, md: 3 }}>
                    <SmallColorPicker
                      label="Border color"
                      color={borderColor}
                      onChange={setBorderColor}
                    />
                  </Grid.Cell>
                </Grid>

                <Divider />

                {/* خيارات السلوك (Behaviour) */}
                <BlockStack gap="200">
                  <Checkbox
                    label="Hide product image"
                    checked={hideProductImage}
                    onChange={setHideProductImage}
                  />
                  <Checkbox
                    label="Hide numbers next to variant selectors (if a product has variants)"
                    checked={hideVariantNumbers}
                    onChange={setHideVariantNumbers}
                  />
                  <Checkbox
                    label="Use the comparison price as the old price in each offer"
                    helpText="Offers discounts are still calculated using the real product price"
                    checked={useComparisonAsOldPrice}
                    onChange={setUseComparisonAsOldPrice}
                  />
                </BlockStack>
              </BlockStack>
            </LegacyCard>
          </BlockStack>
        </Grid.Cell>

        {/* Live Preview Column */}
        <Grid.Cell columnSpan={{ xs: 6, lg: 6 }}>
          <LegacyCard title="Live Preview" sectioned>
            <div style={{
            }}>
              {tiers.map((t, i) => {
                const basePrice = selectedProducts.length > 0 ? selectedProducts[0].price : 0;
                const qty = parseInt(t.quantity) || 1;
                const totalPrice = basePrice * qty;

                let discountedPrice = totalPrice;
                if (t.discountType === "PERCENTAGE") {
                  discountedPrice = totalPrice * (1 - parseInt(t.discountValue) / 100);
                } else if (t.discountType === "FIXED_AMOUNT") {
                  discountedPrice = totalPrice - parseInt(t.discountValue);
                }

                const isFirstTier = i === 0;
                const rowBgColor = isFirstTier ? colorToRgba(bgColor) : 'transparent';
                const rowBorderColor = colorToRgba(borderColor);

                return (
                  <div key={t.id} style={{
                    padding: '16px',
                    border: i === tiers.length - 1 ? '1px solid silver' : `3px solid ${rowBorderColor}`,
                    backgroundColor: rowBgColor,
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    borderRadius: '8px',
                    marginBottom: '10px',
                  }}>

                    {/* تم حذف كود الـ Radio Button من هنا */}

                    {/* صورة المنتج (تظهر إذا لم تكن مخفية) */}
                    {!hideProductImage && (selectedProducts[0]?.featuredImage?.url || t.imageUrl) && (
                      <div
                        style={{
                          flexShrink: 0,
                          width: "54px",
                          height: "54px",
                          borderRadius: "8px",
                        }}
                      >
                        <img
                          style={{ width: "54px !important", height: "54px !important", borderRadius: "8px", }}
                          src={t.imageUrl || selectedProducts[0]?.featuredImage?.url || ""}
                          alt=""
                          width={"54px"}
                          height={"54px"}
                        />
                      </div>
                    )}

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Text variant="bodyMd" fontWeight="bold" as="span">{t.title}</Text>

                        {/* الملصق (Plaque) */}
                        {t.plaqueText && (
                          <div>
                            <span style={{
                              backgroundColor: colorToRgba(t.plaqueBgColor),
                              color: colorToRgba(t.plaqueTextColor),
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              display: 'inline-block'
                            }}>
                              {t.plaqueText}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {/* السعر القديم */}
                      {!t.hideComparisonPrice && t.discountType !== "NONE" && basePrice > 0 && (
                        <Text as="span" variant="bodySm" tone="subdued">
                          {totalPrice.toFixed(2)} $
                        </Text>
                      )}

                      {/* السعر الجديد */}
                      <div style={{
                        color: colorToRgba(t.priceColor),
                        fontWeight: 'bold',
                        fontSize: '16px'
                      }}>
                        {basePrice > 0 ? `${discountedPrice.toFixed(2)} $` : "0.00 $"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </LegacyCard>
        </Grid.Cell>

      </Grid>


      {/* Configuration Modal */}
      <Modal
        open={tierModal}
        onClose={() => setTierModal(false)}
        title="Configure Tier"
        primaryAction={{ content: "Save Changes", onAction: saveTierChanges }}
      >
        <Modal.Section>
          {currentTier && (
            <FormLayout>
              <Grid>
                <Grid.Cell columnSpan={{ xs: 6, md: 3 }}>
                  <TextField label="Title" value={currentTier.title} onChange={(v) => setCurrentTier({ ...currentTier, title: v })} autoComplete="off" />
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 6, md: 3 }}>
                  <TextField label="Quantity" type="number" value={currentTier.quantity} onChange={(v) => setCurrentTier({ ...currentTier, quantity: v })} autoComplete="off" />
                </Grid.Cell>
              </Grid>

              <Checkbox label="Preselect this offer" checked={currentTier.isPreselected} onChange={(v) => setCurrentTier({ ...currentTier, isPreselected: v })} />
              <Checkbox label="Hide the comparison price on the offer" checked={currentTier.hideComparisonPrice} onChange={(v) => setCurrentTier({ ...currentTier, hideComparisonPrice: v })} />

              <Divider />

              <Text variant="headingSm" as="h6">Discount Settings</Text>
              <InlineStack gap="400">
                <Select label="Discount Type" options={['NONE', 'PERCENTAGE', 'FIXED_AMOUNT']} value={currentTier.discountType} onChange={(v: any) => setCurrentTier({ ...currentTier, discountType: v })} />
                <TextField label="Value" type="number" value={currentTier.discountValue} onChange={(v) => setCurrentTier({ ...currentTier, discountValue: v })} autoComplete="off" />
                <SmallColorPicker label="Price Color" color={currentTier.priceColor} onChange={(c) => setCurrentTier({ ...currentTier, priceColor: c })} />
              </InlineStack>

              <Divider />

              <Text variant="headingSm" as="h6">Plaque & Image</Text>
              <FormLayout.Group>
                <TextField label="Plaque Text" value={currentTier.plaqueText} onChange={(v) => setCurrentTier({ ...currentTier, plaqueText: v })} autoComplete="off" placeholder="Save 25%" />
                <TextField label="Image URL" value={currentTier.imageUrl} onChange={(v) => setCurrentTier({ ...currentTier, imageUrl: v })} autoComplete="off" helpText={<Link url="#">How to change your offer image</Link>} />
              </FormLayout.Group>

              <InlineStack gap="400">
                <SmallColorPicker label="Plaque Background" color={currentTier.plaqueBgColor} onChange={(c) => setCurrentTier({ ...currentTier, plaqueBgColor: c })} />
                <SmallColorPicker label="Plaque Text Color" color={currentTier.plaqueTextColor} onChange={(c) => setCurrentTier({ ...currentTier, plaqueTextColor: c })} />
              </InlineStack>
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
        primaryAction={{
          content: "Done",
          onAction: () => setProductModal(false)
        }}
      >
        <Modal.Section>
          {loadingProducts ? (
            <Box padding="800">
              <InlineStack align="center">
                <Spinner />
              </InlineStack>
            </Box>
          ) : (
            <ResourceList
              items={availableProducts}
              renderItem={(product) => (
                <ResourceList.Item id={product.id} onClick={() => toggleProductSelection(product)}>
                  <InlineStack gap="400" blockAlign="center">
                    <Thumbnail source={product.featuredImage?.url || ''} alt={product.title} />
                    <div style={{ flexGrow: 1 }}>
                      <Text variant="bodyMd" fontWeight="bold" as="span">{product.title}</Text>
                      <Text variant="bodySm" as="p" tone="subdued">${product.price.toFixed(2)}</Text>
                    </div>
                    {selectedProducts.find(p => p.id === product.id) && (
                      <Badge tone="success">Selected</Badge>
                    )}
                  </InlineStack>
                </ResourceList.Item>
              )}
              emptyState={
                <EmptyState
                  heading="No products available"
                  image=""
                >
                  <p>All products are already used in other offers or no products found.</p>
                </EmptyState>
              }
            />
          )}
        </Modal.Section>
      </Modal>

      {/* Delete Tier Confirmation Modal (مضافة من Downsells) */}
      <Modal
        open={deleteModalActive}
        onClose={() => setDeleteModalActive(false)}
        title="Delete Tier"
        primaryAction={{
          content: "Delete",
          destructive: true,
          onAction: confirmDeleteTier
        }}
        secondaryActions={[{
          content: "Cancel",
          onAction: () => setDeleteModalActive(false)
        }]}
      >
        <Modal.Section>
          <p>Are you sure you want to delete this tier? This action cannot be undone.</p>
        </Modal.Section>
      </Modal>
    </Page>
  );

  const listView = (
    <LegacyCard  title="Your offers" sectioned>
      <ResourceList
        resourceName={{ singular: 'offer', plural: 'offers' }}
        items={offers}
        renderItem={(item) => (
          <div
            className="offerItem"
            style={{
              border: "1px solid rgb(233 232 232)",
              borderRadius: "8px",
              marginBottom: "8px",
              padding: "4px"
            }}
          >
            <ResourceList.Item
              id={item.id}
              onClick={() => handleEdit(item)}
              persistActions
              media={
                <Badge
                  tone={item.status === "ACTIVE" ? "success" : "info"}
                >
                  {item.status}
                </Badge>
              }
            >
              <InlineStack align="space-between" blockAlign="center">
                <div className="offerListingDetails">
                  <TextContainer>
                    <p><strong>{item.name}</strong></p>
                    <p style={{ color: '#6d7175', fontSize: '13px' }}>
                      • Products: {item.productSettings?.productIds?.length || 0}
                      <br />
                      • Created: {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </TextContainer>
                </div>

                <InlineStack gap="200">
                  <Button
                    size="slim"
                    variant="secondary"
                    onClick={() => {
                      handleEdit(item);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="slim"
                    tone="critical"
                    variant="tertiary"
                    onClick={() => {
                      handleDeleteOffer(item.id);
                    }}
                  >
                    Delete
                  </Button>
                </InlineStack>
              </InlineStack>
            </ResourceList.Item>
          </div>
        )}
        emptyState={
          <EmptyState
            heading="No offers found"
            action={{
              content: 'Create Offer',
              onAction: handleCreateNew
            }}
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>You haven't created any quantity offers yet. Create an offer to boost sales.</p>
          </EmptyState>
        }
      />
    </LegacyCard>
  );

  // --- Render ---
  return (
    <Frame>
      <div style={{ backgroundColor: 'rgb(241 241 241)', minHeight: '100vh', width: '100%', border: "1px solid rgb(233 232 232)", borderRadius: "8px" }}>
      {view === "LIST" ? (
        <Page
          title="Quantity Offers"
          primaryAction={{
            content: "Create Offer",
            onAction: handleCreateNew
          }}
        >
          {loading ?
            <Box padding="1000">
              <BlockStack align="center" inlineAlign="center" gap="400">
                <Spinner size="large" />
                <p style={{ color: 'var(--p-color-text-secondary)' }}>
                  Loading your quantity offers...
                </p>
              </BlockStack>
            </Box>
            : (
              listView
            )}
        </Page>
      ) : (
        editOffer
      )}

      {/* Toast Notification (مضافة من Downsells) */}
      {toastActive && (
        <Toast
          content={toastContent}
          onDismiss={() => setToastActive(false)}
          error={toastError}
        />
      )}
      </div>
    </Frame>
  );
}