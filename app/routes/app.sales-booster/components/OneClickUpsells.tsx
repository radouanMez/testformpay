/*
  UpsellCreatePage.tsx
  - Complete upsell creation with trigger products and single upsell product
  - Clean single-select modal for both trigger and upsell products
  - Discount input appears dynamically
  - Discount validation (% <= 100, positive amounts, doesn't exceed price)
  - Discount calculated & shown in Preview based on product price
*/

import {
  Page,
  Card,
  FormLayout,
  TextField,
  Select,
  ColorPicker,
  Button,
  TextContainer,
  Modal,
  ResourceList,
  EmptyState,
  Spinner,
  BlockStack,
  Thumbnail,
  InlineStack,
  Badge,
  Box,
  Divider,
  RangeSlider,
  Checkbox
} from "@shopify/polaris";
import { useState, useCallback, useMemo, useEffect } from "react";
import { SearchIcon } from "@shopify/polaris-icons";

// -------------------- Types --------------------

type ColorPickerColor = {
  hue: number;
  brightness: number;
  saturation: number;
  alpha?: number;
};

type Product = {
  id: string;
  title: string;
  price?: number;
  featuredImage?: {
    url: string;
    altText?: string;
  };
};

type UpsellType = "ONE_CLICK" | "BUNDLE" | "DISCOUNT";
type DiscountType = "NONE" | "PERCENTAGE" | "FIXED_AMOUNT";
type TriggerMode = "ALL" | "SPECIFIC";

// -------------------- GraphQL --------------------

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

// -------------------- Helpers --------------------

const colorToRgba = (color: ColorPickerColor): string => {
  const { hue, saturation, brightness, alpha = 1 } = color;

  if (saturation === 0) {
    const v = Math.round(brightness * 255);
    return `rgba(${v},${v},${v},${alpha})`;
  }

  const c = (1 - Math.abs(2 * brightness - 1)) * saturation;
  const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
  const m = brightness - c / 2;

  let r = 0, g = 0, b = 0;
  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else[r, g, b] = [c, 0, x];

  return `rgba(${Math.round((r + m) * 255)},${Math.round(
    (g + m) * 255
  )},${Math.round((b + m) * 255)},${alpha})`;
};

const formatPrice = (price?: number | null): string => {
  if (!price && price !== 0) return "$0.00";
  return `$${price.toFixed(2)}`;
};

type ButtonSettings = {
  text: string;
  animation: "NONE" | "PULSE" | "BOUNCE";
  icon?: string;
  backgroundColor: ColorPickerColor;
  textColor: ColorPickerColor;
  fontSize: number;
  borderRadius: number;
  borderColor: ColorPickerColor;
  borderWidth: number;
  shadow: boolean;
};

// -------------------- Component --------------------

export default function UpsellCreatePage() {
  // Basic Configuration
  const [upsellName, setUpsellName] = useState("");
  const [upsellType, setUpsellType] = useState<UpsellType>("ONE_CLICK");

  // Products Data
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Trigger Products Modal
  const [triggerModalOpen, setTriggerModalOpen] = useState(false);
  const [triggerMode, setTriggerMode] = useState<TriggerMode>("ALL");
  const [selectedTriggerProducts, setSelectedTriggerProducts] = useState<Product[]>([]);

  // Upsell Product Modal
  const [upsellModalOpen, setUpsellModalOpen] = useState(false);
  const [selectedUpsellProduct, setSelectedUpsellProduct] = useState<Product | null>(null);

  // Discount Settings
  const [discountType, setDiscountType] = useState<DiscountType>("NONE");
  const [discountValue, setDiscountValue] = useState("");

  // Discount Validation
  const discountError = useMemo(() => {
    const value = Number(discountValue);

    if (discountType === "PERCENTAGE") {
      if (value > 100) return "Percentage cannot exceed 100%";
      if (value < 0) return "Percentage cannot be negative";
    }

    if (discountType === "FIXED_AMOUNT") {
      if (value < 0) return "Amount cannot be negative";
      if (selectedUpsellProduct?.price && value > selectedUpsellProduct.price) {
        return "Discount cannot exceed product price";
      }
    }

    return undefined;
  }, [discountType, discountValue, selectedUpsellProduct]);

  // Text Settings
  const [title, setTitle] = useState("Add {product_name} to your order!");
  const [subtitle, setSubtitle] = useState("");
  const [buttonText, setButtonText] = useState("Add to my order");

  // Color Settings
  const [titleColor, setTitleColor] = useState<ColorPickerColor>({ hue: 0, saturation: 0, brightness: 0 });
  const [subtitleColor, setSubtitleColor] = useState<ColorPickerColor>({ hue: 0, saturation: 0, brightness: 0 });
  const [priceColor, setPriceColor] = useState<ColorPickerColor>({ hue: 0, saturation: 0, brightness: 0 });
  const [buttonBgColor, setButtonBgColor] = useState<ColorPickerColor>({ hue: 0, saturation: 0, brightness: 0 });
  const [buttonTextColor, setButtonTextColor] = useState<ColorPickerColor>({ hue: 0, saturation: 0, brightness: 1 });

  const [addButtonSettings, setAddButtonSettings] = useState<ButtonSettings>({
    text: "Add to my order",
    animation: "NONE",
    icon: "",
    backgroundColor: { hue: 0, saturation: 0, brightness: 0, alpha: 1 }, // أسود
    textColor: { hue: 0, saturation: 0, brightness: 1, alpha: 1 }, // أبيض
    fontSize: 16,
    borderRadius: 8,
    borderColor: { hue: 0, saturation: 0, brightness: 0, alpha: 1 },
    borderWidth: 1,
    shadow: false,
  });

  const [noButtonSettings, setNoButtonSettings] = useState<ButtonSettings>({
    text: "No thank you, complete my order",
    animation: "NONE",
    icon: "",
    backgroundColor: { hue: 0, saturation: 0, brightness: 1, alpha: 1 }, // أبيض
    textColor: { hue: 0, saturation: 0, brightness: 0, alpha: 1 }, // أسود
    fontSize: 16,
    borderRadius: 8,
    borderColor: { hue: 0, saturation: 0, brightness: 0, alpha: 1 },
    borderWidth: 1,
    shadow: false,
  });

  const [showProductImage, setShowProductImage] = useState(true);
  const [imageSize, setImageSize] = useState<"SMALL" | "MEDIUM" | "LARGE">("MEDIUM");
  const [imageBorderRadius, setImageBorderRadius] = useState(8);
  const [imageShadow, setImageShadow] = useState(false);

  const [productTitle, setProductTitle] = useState("");
  const [productDescription, setProductDescription] = useState("");
  // -------------------- Fetch Products --------------------

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: PRODUCTS_QUERY })
    });
    const json = await res.json();
    const items = json.data.products.edges.map((e: any) => ({
      id: e.node.id,
      title: e.node.title,
      price: parseFloat(e.node.variants.edges[0].node.price),
      featuredImage: e.node.featuredImage
    }));
    setProducts(items);
    setLoading(false);
  }, []);


  // ---------------- PRICE LOGIC ----------------
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const finalPrice = (() => {
    // if (!upsellProduct) return 0;
    // if (discountType === "PERCENTAGE") {
    //   return Math.max(0, upsellProduct.price * (1 - discountValue / 100));
    // }
    // if (discountType === "FIXED") {
    //   return Math.max(0, upsellProduct.price - discountValue);
    // }
    // return upsellProduct.price;
  })();

  // -------------------- Product Selection Handlers --------------------

  const handleSelectTriggerProduct = useCallback((product: Product) => {
    setSelectedTriggerProducts(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      }
      return [...prev, product];
    });
  }, []);

  const handleSelectUpsellProduct = useCallback((product: Product) => {
    setSelectedUpsellProduct(product);
    setUpsellModalOpen(false);
  }, []);

  const removeTriggerProduct = useCallback((productId: string) => {
    setSelectedTriggerProducts(prev => prev.filter(p => p.id !== productId));
  }, []);

  const clearTriggerProducts = useCallback(() => {
    setSelectedTriggerProducts([]);
  }, []);

  // -------------------- Discount Calculation --------------------

  const calculatedPrice = useMemo(() => {
    if (!selectedUpsellProduct || !selectedUpsellProduct.price) return null;

    const base = selectedUpsellProduct.price;
    const value = Number(discountValue) || 0;

    if (discountType === "PERCENTAGE") {
      return Math.max(base - base * (value / 100), 0);
    }

    if (discountType === "FIXED_AMOUNT") {
      return Math.max(base - value, 0);
    }

    return base;
  }, [selectedUpsellProduct, discountType, discountValue]);


  const handleSave = () => {
    // const payload = {
    //   trigger:
    //     triggerMode === "ALL"
    //       ? "ALL"
    //       : triggerProducts.map(p => p.id),
    // upsellProductId: upsellProduct?.id,
    // discount: { type: discountType, value: discountValue },
    // design: {
    //   title,
    //   subtitle,
    //   productTitle,
    //   productDescription,
    //   addButton: { text: addBtnText, radius: addBtnRadius, shadow: addBtnShadow },
    //   noButton: { text: noBtnText, radius: noBtnRadius }
    // }
    // };


    console.log("UPSSELL SAVE PAYLOAD");
  };

  // -------------------- Render --------------------

  return (
    <Page
      title="Create New Upsell"
      primaryAction={{
        content: "Save Upsell",
        onAction: () => {
          // Save logic here
          console.log({
            upsellName,
            upsellType,
            triggerMode,
            triggerProducts: selectedTriggerProducts,
            upsellProduct: selectedUpsellProduct,
            discountType,
            discountValue,
          });
        },
      }}
    >
      {/* ================= BASIC SETTINGS ================= */}
      <div className="marginBottom10">
        <Card>
          <FormLayout>
            <TextField
              autoComplete="off"
              label="Upsell Name"
              value={upsellName}
              onChange={setUpsellName}
              helpText="Give your upsell a descriptive name for internal use"
            />

            <Select
              label="Upsell Type"
              options={[
                { label: "One Click", value: "ONE_CLICK" },
                { label: "Bundle", value: "BUNDLE" },
                { label: "Discount", value: "DISCOUNT" },
              ]}
              value={upsellType}
              onChange={(v) => setUpsellType(v as UpsellType)}
            />

            <Divider />

            {/* ================= TRIGGER PRODUCTS ================= */}
            <TextContainer>
              <h3>Trigger Products</h3>
              <p>Show this upsell when customers buy:</p>
            </TextContainer>

            <Select
              label=""
              options={[
                { label: "All products", value: "ALL" },
                { label: "Specific products", value: "SPECIFIC" },
              ]}
              value={triggerMode}
              onChange={(v) => setTriggerMode(v as TriggerMode)}
            />

            {triggerMode === "SPECIFIC" && (
              <Box paddingBlockStart="400">
                <InlineStack align="space-between">
                  <TextContainer>
                    <p>Selected products ({selectedTriggerProducts.length})</p>
                  </TextContainer>
                  <Button size="slim" onClick={() => {
                    setTriggerModalOpen(true);
                    fetchProducts();
                  }}>
                    {selectedTriggerProducts.length > 0 ? "Add More Products" : "Select Products"}
                  </Button>
                </InlineStack>

                {selectedTriggerProducts.length > 0 && (
                  <Box paddingBlockStart="200">
                    <BlockStack gap="200">
                      {selectedTriggerProducts.map(product => (
                        <InlineStack key={product.id} align="space-between" blockAlign="center">
                          <InlineStack gap="200" blockAlign="center">
                            {product.featuredImage?.url && (
                              <Thumbnail
                                source={product.featuredImage.url}
                                alt={product.title}
                                size="small"
                              />
                            )}
                            <span>{product.title}</span>
                          </InlineStack>
                          <Button
                            size="micro"
                            tone="critical"
                            onClick={() => removeTriggerProduct(product.id)}
                          >
                            Remove
                          </Button>
                        </InlineStack>
                      ))}
                      <Button
                        size="micro"
                        tone="critical"
                        variant="plain"
                        onClick={clearTriggerProducts}
                      >
                        Clear all
                      </Button>
                    </BlockStack>
                  </Box>
                )}

                {selectedTriggerProducts.length === 0 && (
                  <EmptyState
                    heading="No products selected"
                    action={{
                      content: "Select Products",
                      onAction: () => {
                        setTriggerModalOpen(true);
                        fetchProducts();
                      },
                    }}
                    image=""
                  >
                    <p>Select specific products that will trigger this upsell offer.</p>
                  </EmptyState>
                )}
              </Box>
            )}

            <Divider />

            {/* ================= UPSELL PRODUCT ================= */}
            <TextContainer>
              <h3>Upsell Product</h3>
              <p>Product to offer as an upsell:</p>
            </TextContainer>

            <Card>
              <InlineStack align="space-between" blockAlign="center">
                <strong>Selected Upsell Product</strong>
                <Button
                  size="slim"
                  onClick={() => {
                    setUpsellModalOpen(true);
                    fetchProducts();
                  }}
                >
                  {selectedUpsellProduct ? "Change Product" : "Select Product"}
                </Button>
              </InlineStack>

              {selectedUpsellProduct ? (
                <Box paddingBlockStart="400">
                  <ResourceList
                    items={[selectedUpsellProduct]}
                    renderItem={(product) => (
                      <ResourceList.Item
                        id={product.id}
                        onClick={() => handleSelectUpsellProduct(product)}
                        media={
                          product.featuredImage?.url ? (
                            <Thumbnail
                              source={product.featuredImage.url}
                              alt={product.title}
                            />
                          ) : undefined
                        }
                      >
                        <InlineStack align="space-between" blockAlign="center">
                          <div>
                            <TextContainer>
                              <p><strong>{product.title}</strong></p>
                            </TextContainer>
                          </div>
                          <Badge tone="success">
                            {formatPrice(product.price)}
                          </Badge>
                        </InlineStack>
                      </ResourceList.Item>
                    )}
                  />
                </Box>
              ) : (
                <Box paddingBlockStart="400">
                  <EmptyState
                    heading="No product selected"
                    action={{
                      content: "Select Product",
                      onAction: () => {
                        setUpsellModalOpen(true);
                        fetchProducts();
                      },
                    }}
                    image=""
                  >
                    <p>Choose which product to offer as an upsell.</p>
                  </EmptyState>
                </Box>
              )}
            </Card>

            {/* ================= DISCOUNT SETTINGS ================= */}
            <Select
              label="Apply this discount"
              value={discountType}
              options={[
                { label: "None", value: "NONE" },
                { label: "Percentage", value: "PERCENTAGE" },
                { label: "Fixed Amount", value: "FIXED_AMOUNT" },
              ]}
              onChange={(v) => {
                setDiscountType(v as DiscountType);
                if (v === "NONE") setDiscountValue("");
              }}
            />

            {discountType !== "NONE" && (
              <TextField
                autoComplete="off"
                type="number"
                label={discountType === "PERCENTAGE" ? "Discount Percentage" : "Discount Amount"}
                value={discountValue}
                onChange={setDiscountValue}
                error={discountError}
                suffix={discountType === "PERCENTAGE" ? "%" : "$"}
                helpText={
                  discountType === "PERCENTAGE"
                    ? "Enter the percentage discount to apply"
                    : "Enter the fixed amount discount to apply"
                }
              />
            )}

            {/* في قسم Discount Calculation في Preview */}
            {selectedUpsellProduct && calculatedPrice !== null && (
              <Box paddingBlock="400">
                <BlockStack gap="200">
                  <p><strong>{selectedUpsellProduct.title}</strong></p>

                  {selectedUpsellProduct.price && (
                    <InlineStack gap="200" align="start">
                      {discountType !== "NONE" && (
                        <>
                          <s style={{ color: '#999' }}>{formatPrice(selectedUpsellProduct.price)}</s>
                          <span style={{ color: colorToRgba(priceColor), fontWeight: 'bold' }}>
                            {formatPrice(calculatedPrice)} {/* الأن calculatedPrice لن تكون null */}
                          </span>
                          <Badge tone="success">
                            {discountType === "PERCENTAGE"
                              ? `${discountValue}% OFF`
                              : `$${discountValue} OFF`}
                          </Badge>
                        </>
                      )}

                      {discountType === "NONE" && (
                        <span style={{ color: colorToRgba(priceColor), fontWeight: 'bold' }}>
                          {formatPrice(selectedUpsellProduct.price)}
                        </span>
                      )}
                    </InlineStack>
                  )}
                </BlockStack>
              </Box>
            )}

          </FormLayout>
        </Card>
      </div>

      {/* ================= DESIGN SETTINGS ================= */}
      <div className="marginBottom10">
        <Card>
          <TextContainer>
            <h2>Customize the Design</h2>
            <p>Customize how the upsell offer appears to customers.</p>
          </TextContainer>

          <FormLayout>
            {/* Title Section */}
            <Card padding="400">
              <BlockStack gap="200">
                <TextContainer>
                  <h3>Title</h3>
                </TextContainer>
                <TextField
                  autoComplete="off"
                  label="Title Text"
                  value={title}
                  onChange={setTitle}
                  helpText="Shortcodes: {product_name}, {first_name}"
                />
                <Box>
                  <label>Title Color</label>
                  <ColorPicker color={titleColor} onChange={setTitleColor} allowAlpha />
                </Box>
              </BlockStack>
            </Card>

            {/* Subtitle Section */}
            {subtitle && (
              <Card padding="400">
                <BlockStack gap="200">
                  <TextContainer>
                    <h3>Subtitle</h3>
                  </TextContainer>
                  <TextField
                    autoComplete="off"
                    label="Subtitle Text"
                    value={subtitle}
                    onChange={setSubtitle}
                    helpText="Shortcodes: {product_name}, {first_name}"
                  />
                  <Box>
                    <label>Subtitle Color</label>
                    <ColorPicker color={subtitleColor} onChange={setSubtitleColor} allowAlpha />
                  </Box>
                </BlockStack>
              </Card>
            )}

            {/* Product Information Section */}
            <Card padding="400">
              <BlockStack gap="200">
                <TextContainer>
                  <h3>Product Information</h3>
                </TextContainer>
                <TextField
                  autoComplete="off"
                  label="Custom Product Title"
                  value={productTitle}
                  onChange={setProductTitle}
                  placeholder="Leave empty to use Shopify title"
                  helpText="Override the product title in the upsell"
                />
                <TextField
                  autoComplete="off"
                  label="Custom Product Description"
                  value={productDescription}
                  onChange={setProductDescription}
                  multiline={3}
                  placeholder="Leave empty to use Shopify description"
                  helpText="Override the product description in the upsell"
                />
                <Box>
                  <label>Product Price Color</label>
                  <ColorPicker color={priceColor} onChange={setPriceColor} allowAlpha />
                </Box>
              </BlockStack>
            </Card>

            {/* Add to Order Button */}
            <Card padding="400">
              <BlockStack gap="300">
                <TextContainer>
                  <h3>Add to Order Button</h3>
                </TextContainer>

                <TextField
                  autoComplete="off"
                  label="Button Text"
                  value={addButtonSettings.text}
                  onChange={(value) =>
                    setAddButtonSettings({ ...addButtonSettings, text: value })
                  }
                />

                <Select
                  label="Button Animation"
                  options={[
                    { label: "None", value: "NONE" },
                    { label: "Pulse", value: "PULSE" },
                    { label: "Bounce", value: "BOUNCE" },
                  ]}
                  value={addButtonSettings.animation}
                  onChange={(value) =>
                    setAddButtonSettings({ ...addButtonSettings, animation: value as "NONE" | "PULSE" | "BOUNCE" })
                  }
                />

                <TextField
                  autoComplete="off"
                  label="Button Icon (optional)"
                  value={addButtonSettings.icon || ""}
                  onChange={(value) =>
                    setAddButtonSettings({ ...addButtonSettings, icon: value })
                  }
                  helpText="Enter icon name from Shopify icon library"
                  placeholder="e.g., AddMajor, CheckoutMajor"
                />

                <InlineStack align="space-between" gap="400">
                  <Box width="50%">
                    <label>Background Color</label>
                    <ColorPicker
                      color={addButtonSettings.backgroundColor}
                      onChange={(color) =>
                        setAddButtonSettings({ ...addButtonSettings, backgroundColor: color })
                      }
                      allowAlpha
                    />
                  </Box>
                  <Box width="50%">
                    <label>Text Color</label>
                    <ColorPicker
                      color={addButtonSettings.textColor}
                      onChange={(color) =>
                        setAddButtonSettings({ ...addButtonSettings, textColor: color })
                      }
                      allowAlpha
                    />
                  </Box>
                </InlineStack>

                <InlineStack align="space-between" gap="400">
                  <Box width="50%">
                    <RangeSlider
                      label="Font Size"
                      value={addButtonSettings.fontSize}
                      onChange={(value) => {
                        const fontSize1Value = typeof value === 'number' ? value : value[0];
                        setAddButtonSettings({ ...addButtonSettings, fontSize: fontSize1Value })
                      }
                      }
                      min={12}
                      max={24}
                      output
                      suffix="px"
                    />
                  </Box>
                  <Box width="50%">
                    <RangeSlider
                      label="Border Radius"
                      value={addButtonSettings.borderRadius}
                      onChange={(value) => {
                        const borderRadiusValue = typeof value === 'number' ? value : value[0];
                        setAddButtonSettings({ ...addButtonSettings, borderRadius: borderRadiusValue })
                      }
                      }
                      min={0}
                      max={50}
                      output
                      suffix="px"
                    />
                  </Box>
                </InlineStack>

                <InlineStack align="space-between" gap="400">
                  <Box width="50%">
                    <label>Border Color</label>
                    <ColorPicker
                      color={addButtonSettings.borderColor}
                      onChange={(color) =>
                        setAddButtonSettings({ ...addButtonSettings, borderColor: color })
                      }
                      allowAlpha
                    />
                  </Box>
                  <Box width="50%">
                    <RangeSlider
                      label="Border Width"
                      value={addButtonSettings.borderWidth}
                      onChange={(value) => {
                        const borderWidthValue = typeof value === 'number' ? value : value[0];
                        setAddButtonSettings({ ...addButtonSettings, borderWidth: borderWidthValue })
                      }
                      }
                      min={0}
                      max={10}
                      output
                      suffix="px"
                    />
                  </Box>
                </InlineStack>

                <Box>
                  <Checkbox
                    label="Enable Shadow"
                    checked={addButtonSettings.shadow}
                    onChange={(checked) =>
                      setAddButtonSettings({ ...addButtonSettings, shadow: checked })
                    }
                  />
                </Box>
              </BlockStack>
            </Card>

            {/* No Thank You Button */}
            <Card padding="400">
              <BlockStack gap="300">
                <TextContainer>
                  <h3>No Thank You Button</h3>
                </TextContainer>

                <TextField
                  autoComplete="off"
                  label="Button Text"
                  value={noButtonSettings.text}
                  onChange={(value) =>
                    setNoButtonSettings({ ...noButtonSettings, text: value })
                  }
                />

                <InlineStack align="space-between" gap="400">
                  <Box width="50%">
                    <label>Background Color</label>
                    <ColorPicker
                      color={noButtonSettings.backgroundColor}
                      onChange={(color) =>
                        setNoButtonSettings({ ...noButtonSettings, backgroundColor: color })
                      }
                      allowAlpha
                    />
                  </Box>
                  <Box width="50%">
                    <label>Text Color</label>
                    <ColorPicker
                      color={noButtonSettings.textColor}
                      onChange={(color) =>
                        setNoButtonSettings({ ...noButtonSettings, textColor: color })
                      }
                      allowAlpha
                    />
                  </Box>
                </InlineStack>

                <InlineStack align="space-between" gap="400">
                  <Box width="50%">
                    <RangeSlider
                      label="Font Size"
                      value={noButtonSettings.fontSize}
                      onChange={(value) => {
                        const fontSizeValue = typeof value === 'number' ? value : value[0];
                        setNoButtonSettings({ ...noButtonSettings, fontSize: fontSizeValue })
                      }
                      }
                      min={12}
                      max={24}
                      output
                      suffix="px"
                    />
                  </Box>
                  <Box width="50%">
                    <RangeSlider
                      label="Border Radius"
                      value={noButtonSettings.borderRadius}
                      onChange={(value) => {
                        const borderValue = typeof value === 'number' ? value : value[0];
                        setNoButtonSettings({ ...noButtonSettings, borderRadius: borderValue })
                      }
                      }
                      min={0}
                      max={50}
                      output
                      suffix="px"
                    />
                  </Box>
                </InlineStack>

                <InlineStack align="space-between" gap="400">
                  <Box width="50%">
                    <label>Border Color</label>
                    <ColorPicker
                      color={noButtonSettings.borderColor}
                      onChange={(color) => {
                        setNoButtonSettings({ ...noButtonSettings, borderColor: color })
                      }
                      }
                      allowAlpha
                    />
                  </Box>
                  <Box width="50%">
                    <RangeSlider
                      label="Font Size"
                      value={addButtonSettings.fontSize}
                      onChange={(value) => {
                        const numericValue = typeof value === 'number' ? value : value[0];
                        setAddButtonSettings({ ...addButtonSettings, fontSize: numericValue });
                      }}
                      min={12}
                      max={24}
                      output
                      suffix="px"
                    />
                  </Box>
                </InlineStack>

                <Box>
                  <Checkbox
                    label="Enable Shadow"
                    checked={noButtonSettings.shadow}
                    onChange={(checked) =>
                      setNoButtonSettings({ ...noButtonSettings, shadow: checked })
                    }
                  />
                </Box>
              </BlockStack>
            </Card>
          </FormLayout>
        </Card>
      </div>

      {/* ================= PREVIEW ================= */}
      <div className="marginBottom10">
        <Card>
          <TextContainer>
            <h2>Preview</h2>
            <p>See how your upsell offer will appear to customers.</p>
          </TextContainer>

          <Box padding="400" background="bg-surface" borderRadius="200">
            <BlockStack gap="400">
              <TextContainer>
                <h2 style={{ color: colorToRgba(titleColor) }}>
                  {title.replace('{product_name}', selectedUpsellProduct?.title || 'Product')}
                </h2>

                {subtitle && (
                  <p style={{ color: colorToRgba(subtitleColor) }}>
                    {subtitle.replace('{product_name}', selectedUpsellProduct?.title || 'Product')}
                  </p>
                )}

                {selectedUpsellProduct && (
                  <Box paddingBlock="400">
                    <BlockStack gap="300">
                      {showProductImage && selectedUpsellProduct.featuredImage?.url && (
                        <div
                          style={{
                            padding: "8px",
                            backgroundColor: "var(--p-color-bg-surface)",
                            borderRadius: `${imageBorderRadius}px`,
                            boxShadow: imageShadow ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                            maxWidth: imageSize === "SMALL" ? "100px" :
                                      imageSize === "MEDIUM" ? "200px" :
                                      "300px",
                            margin: "0 auto",
                            overflow: "hidden"
                          }}
                        >
                          <Box
                          padding="200"
                          background="bg-surface"
                          >
                            <img
                              src={selectedUpsellProduct.featuredImage.url}
                              alt={selectedUpsellProduct.featuredImage.altText || selectedUpsellProduct.title}
                              style={{
                                width: "100%",
                                height: "auto",
                                borderRadius: `${imageBorderRadius - 4}px`,
                                display: "block",
                              }}
                            />
                          </Box>
                        </div>
                      )}

                      {/* معلومات المنتج */}
                      <BlockStack gap="200">
                        <p style={{
                          fontSize: "18px",
                          fontWeight: "bold",
                          margin: 0
                        }}>
                          {productTitle || selectedUpsellProduct.title}
                        </p>

                        {productDescription && (
                          <p style={{
                            color: "#666",
                            margin: 0,
                            fontSize: "14px"
                          }}>
                            {productDescription}
                          </p>
                        )}

                        {/* السعر */}
                        {selectedUpsellProduct.price && (
                          <InlineStack gap="200" align="start" blockAlign="center">
                            {discountType !== "NONE" && calculatedPrice && (
                              <>
                                <s style={{
                                  color: '#999',
                                  fontSize: "14px"
                                }}>
                                  {formatPrice(selectedUpsellProduct.price)}
                                </s>
                                <span style={{
                                  color: colorToRgba(priceColor),
                                  fontWeight: 'bold',
                                  fontSize: "18px"
                                }}>
                                  {formatPrice(calculatedPrice)}
                                </span>
                                <Badge tone="success">
                                  {discountType === "PERCENTAGE"
                                    ? `${discountValue}% OFF`
                                    : `$${discountValue} OFF`}
                                </Badge>
                              </>
                            )}

                            {discountType === "NONE" && (
                              <span style={{
                                color: colorToRgba(priceColor),
                                fontWeight: 'bold',
                                fontSize: "18px"
                              }}>
                                {formatPrice(selectedUpsellProduct.price)}
                              </span>
                            )}
                          </InlineStack>
                        )}
                      </BlockStack>
                    </BlockStack>
                  </Box>
                )}

                {/* الأزرار */}
                <Box paddingBlockStart="400">
                  <BlockStack gap="200">
                    {/* Add to Order Button */}
                    <div style={{
                      backgroundColor: colorToRgba(addButtonSettings.backgroundColor),
                      color: colorToRgba(addButtonSettings.textColor),
                      fontSize: `${addButtonSettings.fontSize}px`,
                      borderRadius: `${addButtonSettings.borderRadius}px`,
                      border: `${addButtonSettings.borderWidth}px solid ${colorToRgba(addButtonSettings.borderColor)}`,
                      boxShadow: addButtonSettings.shadow ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
                      padding: '12px 24px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      animation: addButtonSettings.animation === 'PULSE' ? 'pulse 2s infinite' :
                        addButtonSettings.animation === 'BOUNCE' ? 'bounce 1s infinite' : 'none',
                      fontWeight: 'bold',
                      transition: 'all 0.3s ease',
                    }}>
                      {addButtonSettings.text}
                    </div>

                    {/* No Thank You Button */}
                    <div style={{
                      backgroundColor: colorToRgba(noButtonSettings.backgroundColor),
                      color: colorToRgba(noButtonSettings.textColor),
                      fontSize: `${noButtonSettings.fontSize}px`,
                      borderRadius: `${noButtonSettings.borderRadius}px`,
                      border: `${noButtonSettings.borderWidth}px solid ${colorToRgba(noButtonSettings.borderColor)}`,
                      boxShadow: noButtonSettings.shadow ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                      padding: '10px 20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}>
                      {noButtonSettings.text}
                    </div>
                  </BlockStack>
                </Box>
              </TextContainer>
            </BlockStack>
          </Box>
        </Card>
      </div>

      {/* ================= MODALS ================= */}

      {/* Trigger Products Modal */}
      <Modal
        open={triggerModalOpen}
        onClose={() => setTriggerModalOpen(false)}
        title="Select Trigger Products"
        primaryAction={{
          content: "Done",
          onAction: () => setTriggerModalOpen(false),
        }}
        secondaryActions={[
          {
            content: "Clear All",
            onAction: clearTriggerProducts,
          },
        ]}
      >
        <Modal.Section>
          {loading ? (
            <Box padding="800">
              <InlineStack align="center">
                <Spinner />
              </InlineStack>
            </Box>
          ) : (
            <ResourceList
              items={products}
              selectedItems={selectedTriggerProducts.map(p => p.id)}
              onSelectionChange={(selectedIds) => {
                // تحديث المنتجات المختارة بناءً على IDs
                const selectedProducts = products.filter(product =>
                  selectedIds.includes(product.id)
                );
                setSelectedTriggerProducts(selectedProducts);
              }}
              renderItem={(product) => {
                const isSelected = selectedTriggerProducts.some(p => p.id === product.id);

                return (
                  <ResourceList.Item
                    id={product.id}
                    onClick={() => {
                      // احتفظ بـ onClick للتوافقية
                      handleSelectTriggerProduct(product);
                    }}
                    media={
                      product.featuredImage?.url ? (
                        <Thumbnail
                          source={product.featuredImage.url}
                          alt={product.title}
                        />
                      ) : undefined
                    }
                    accessibilityLabel={`Select ${product.title}`}
                  >
                    <InlineStack align="space-between" blockAlign="center">
                      <div>
                        <TextContainer>
                          <p><strong>{product.title}</strong></p>
                          <p>{formatPrice(product.price)}</p>
                        </TextContainer>
                      </div>
                      {isSelected && <Badge tone="success">Selected</Badge>}
                    </InlineStack>
                  </ResourceList.Item>
                );
              }}
              emptyState={
                <EmptyState
                  heading="No products found"
                  image=""
                >
                  <p>No products are available in your store.</p>
                </EmptyState>
              }
            />
          )}
        </Modal.Section>
      </Modal>

      {/* Upsell Product Modal */}
      <Modal
        open={upsellModalOpen}
        onClose={() => setUpsellModalOpen(false)}
        title="Select Upsell Product"
        primaryAction={{
          content: "Cancel",
          onAction: () => setUpsellModalOpen(false),
        }}
      >
        <Modal.Section>
          {loading ? (
            <Box padding="800">
              <InlineStack align="center">
                <Spinner />
              </InlineStack>
            </Box>
          ) : (
            <ResourceList
              items={products}
              renderItem={(product) => (
                <ResourceList.Item
                  id={product.id}
                  onClick={() => handleSelectUpsellProduct(product)}
                  media={
                    product.featuredImage?.url ? (
                      <Thumbnail
                        source={product.featuredImage.url}
                        alt={product.title}
                      />
                    ) : undefined
                  }
                >
                  <InlineStack align="space-between" blockAlign="center">
                    <div>
                      <TextContainer>
                        <p><strong>{product.title}</strong></p>
                        <p>{formatPrice(product.price)}</p>
                      </TextContainer>
                    </div>
                    {selectedUpsellProduct?.id === product.id && (
                      <Badge tone="success">Selected</Badge>
                    )}
                  </InlineStack>
                </ResourceList.Item>
              )}
              emptyState={
                <EmptyState
                  heading="No products found"
                  image=""
                >
                  <p>No products are available in your store.</p>
                </EmptyState>
              }
            />
          )}
        </Modal.Section>
      </Modal>
    </Page>
  );
}