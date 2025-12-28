// [file name]: Downsells.tsx
import {
  Page, Card, FormLayout, TextField, Select, ColorPicker, Button,
  TextContainer, Modal, ResourceList, EmptyState, Spinner, BlockStack,
  Thumbnail, InlineStack, Badge, Box, Divider, RangeSlider, Checkbox,
  Grid, LegacyCard, Toast, Frame, Text, Popover
} from "@shopify/polaris";
import { useState, useCallback, useEffect, useMemo } from "react";
import { SearchIcon, PlusIcon } from "@shopify/polaris-icons";
import { SmallColorPicker, colorToRgba, ColorPickerColor } from "../../../helpers/SmallColorPicker";
import { useNavigate } from "react-router";

// -------------------- Types --------------------
type Product = {
  id: string;
  title: string;
  price?: number;
  featuredImage?: {
    url: string;
    altText?: string;
  };
};

type ButtonSettings = {
  text: string;
  backgroundColor: ColorPickerColor;
  textColor: ColorPickerColor;
  fontSize: number;
  borderRadius: number;
  borderColor: ColorPickerColor;
  borderWidth: number;
  shadow: boolean;
};

type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

const formatPrice = (price?: number | null): string => {
  if (!price && price !== 0) return "$0.00";
  return `$${price.toFixed(2)}`;
};

// -------------------- Main Component --------------------
export default function DownsellManager() {
  const navigate = useNavigate();

  // --- States ---
  const [view, setView] = useState<"LIST" | "EDIT">("LIST");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Toast States
  const [toastActive, setToastActive] = useState(false);
  const [toastContent, setToastContent] = useState("");
  const [toastError, setToastError] = useState(false);

  // Data States
  const [downsells, setDownsells] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE">("DRAFT");
  const [showTimes, setShowTimes] = useState("1");

  // Product States
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedDownsellProduct, setSelectedDownsellProduct] = useState<Product | null>(null);
  const [downsellModalOpen, setDownsellModalOpen] = useState(false);

  // Discount States
  const [discountType, setDiscountType] = useState<DiscountType>("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("10");
  const [disableOtherDiscounts, setDisableOtherDiscounts] = useState(false);

  // Design States
  const [title, setTitle] = useState("Wait! We have a special gift");
  const [titleColor, setTitleColor] = useState<ColorPickerColor>({ hue: 0, saturation: 0, brightness: 0 });
  const [titleFontSize, setTitleFontSize] = useState(24);
  const [subtitle, setSubtitle] = useState("Don't leave yet, grab this one-time offer");
  const [subtitleColor, setSubtitleColor] = useState<ColorPickerColor>({ hue: 0, saturation: 0, brightness: 0.4 });
  const [plaqueText, setPlaqueText] = useState("LIMITED TIME");
  const [plaqueBgColor, setPlaqueBgColor] = useState<ColorPickerColor>({ hue: 0, saturation: 1, brightness: 0.8 });
  const [plaqueTextColor, setPlaqueTextColor] = useState<ColorPickerColor>({ hue: 0, saturation: 0, brightness: 1 });

  // Button Settings
  const [primaryBtnSettings, setPrimaryBtnSettings] = useState<ButtonSettings>({
    text: "Claim My {discount} Discount",
    backgroundColor: { hue: 120, saturation: 0.8, brightness: 0.4, alpha: 1 },
    textColor: { hue: 0, saturation: 0, brightness: 1, alpha: 1 },
    fontSize: 16,
    borderRadius: 8,
    borderColor: { hue: 0, saturation: 0, brightness: 0, alpha: 1 },
    borderWidth: 1,
    shadow: false,
  });

  const [secondaryBtnSettings, setSecondaryBtnSettings] = useState<ButtonSettings>({
    text: "No thank you, I'll pass",
    backgroundColor: { hue: 0, saturation: 0, brightness: 1, alpha: 1 },
    textColor: { hue: 0, saturation: 0, brightness: 0, alpha: 1 },
    fontSize: 16,
    borderRadius: 8,
    borderColor: { hue: 0, saturation: 0, brightness: 0, alpha: 1 },
    borderWidth: 1,
    shadow: false,
  });

  // Image Settings
  const [showProductImage, setShowProductImage] = useState(true);
  const [imageSize, setImageSize] = useState<"SMALL" | "MEDIUM" | "LARGE">("MEDIUM");
  const [imageBorderRadius, setImageBorderRadius] = useState(8);
  const [imageShadow, setImageShadow] = useState(false);

  // Delete Modal
  const [deleteModalActive, setDeleteModalActive] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const usedProductIds = useMemo(() => {
    return downsells
      .filter(ds => ds.id !== editingId) // استثناء العرض الحالي إذا كنا في وضع التعديل لكي لا يختفي منتجه
      .map(ds => ds.productSettings?.productId)
      .filter(Boolean);
  }, [downsells, editingId]);

  const availableProducts = useMemo(() => {
    return products.filter(product => {
      const currentEditingDownsell = downsells.find(d => d.id === editingId);
      const currentProductId = currentEditingDownsell?.productSettings?.productId;

      return !usedProductIds.includes(product.id) || product.id === currentProductId;
    });
  }, [products, usedProductIds, editingId, downsells]);

  const discountErrorMessage = useMemo(() => {
    const val = Number(discountValue);
    if (discountType === "PERCENTAGE" && (val < 0 || val > 100)) {
      return "Value must be between 0% and 100%";
    }
    if (discountType === "FIXED_AMOUNT" && selectedDownsellProduct && val > (selectedDownsellProduct.price || 0)) {
      return `Discount exceeds product price (${formatPrice(selectedDownsellProduct.price)})`;
    }
    return ""; // نص فارغ يعني لا يوجد خطأ
  }, [discountValue, discountType, selectedDownsellProduct]);

  // --- GraphQL Query ---
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

  // --- Fetch Products ---
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
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
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // --- Fetch Downsells ---
  const fetchDownsells = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/downsells");
      const result = await response.json();
      if (result.success) setDownsells(result.data);
    } catch (error) {
      console.error("Error fetching downsells:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDownsells();
    fetchProducts();
  }, [fetchDownsells, fetchProducts]);

  // --- Product Selection ---
  const handleSelectDownsellProduct = useCallback((product: Product) => {
    setSelectedDownsellProduct(product);
    setDownsellModalOpen(false);
  }, []);

  // --- Calculate Discounted Price ---
  const calculatedPrice = useMemo(() => {
    if (!selectedDownsellProduct || !selectedDownsellProduct.price) return null;
    const base = selectedDownsellProduct.price;
    const value = Number(discountValue) || 0;

    if (discountType === "PERCENTAGE") {
      return Math.max(base - base * (value / 100), 0);
    }
    if (discountType === "FIXED_AMOUNT") {
      return Math.max(base - value, 0);
    }
    return base;
  }, [selectedDownsellProduct, discountType, discountValue]);

  // --- Create New Downsell ---
  const handleCreateNew = () => {
    setEditingId(null);
    setIsEditing(false);
    setName("");
    setStatus("DRAFT");
    setShowTimes("1");
    setDiscountType("PERCENTAGE");
    setDiscountValue("10");
    setDisableOtherDiscounts(false);
    setSelectedDownsellProduct(null);

    // Reset design to defaults
    setTitle("Wait! We have a special gift");
    setTitleColor({ hue: 0, saturation: 0, brightness: 0 });
    setTitleFontSize(24);
    setSubtitle("Don't leave yet, grab this one-time offer");
    setSubtitleColor({ hue: 0, saturation: 0, brightness: 0.4 });
    setPlaqueText("LIMITED TIME");
    setPlaqueBgColor({ hue: 0, saturation: 1, brightness: 0.8 });
    setPlaqueTextColor({ hue: 0, saturation: 0, brightness: 1 });

    setPrimaryBtnSettings({
      text: "Claim My {discount} Discount",
      backgroundColor: { hue: 120, saturation: 0.8, brightness: 0.4, alpha: 1 },
      textColor: { hue: 0, saturation: 0, brightness: 1, alpha: 1 },
      fontSize: 16,
      borderRadius: 8,
      borderColor: { hue: 0, saturation: 0, brightness: 0, alpha: 1 },
      borderWidth: 1,
      shadow: false,
    });

    setSecondaryBtnSettings({
      text: "No thank you, I'll pass",
      backgroundColor: { hue: 0, saturation: 0, brightness: 1, alpha: 1 },
      textColor: { hue: 0, saturation: 0, brightness: 0, alpha: 1 },
      fontSize: 16,
      borderRadius: 8,
      borderColor: { hue: 0, saturation: 0, brightness: 0, alpha: 1 },
      borderWidth: 1,
      shadow: false,
    });

    setShowProductImage(true);
    setImageSize("MEDIUM");
    setImageBorderRadius(8);
    setImageShadow(false);

    setView("EDIT");
  };

  // --- Edit Downsell ---
  const handleEdit = (downsell: any) => {
    setEditingId(downsell.id);
    setIsEditing(true);
    setName(downsell.name);
    setStatus(downsell.status || "DRAFT");

    const basic = downsell.basicSettings || {};
    setShowTimes(basic.showTimes || "1");
    setDisableOtherDiscounts(basic.disableOtherDiscounts || false);

    const prod = downsell.productSettings || {};
    setDiscountType(prod.discountType || "PERCENTAGE");
    setDiscountValue(prod.discountValue?.toString() || "10");

    // ربط المنتج المختار
    if (prod.productId) {
      const foundProduct = products.find(p => p.id === prod.productId);
      setSelectedDownsellProduct(foundProduct || null);
    }

    const design = downsell.designSettings || {};
    setTitle(design.title || "");
    setTitleFontSize(design.titleFontSize || 24);
    setSubtitle(design.subtitle || "");

    // استرجاع الألوان (تعمل الآن لأننا حفظناها كـ Objects)
    if (design.titleColor) setTitleColor(design.titleColor);
    if (design.subtitleColor) setSubtitleColor(design.subtitleColor);

    if (design.plaque) {
      setPlaqueText(design.plaque.text || "");
      if (design.plaque.bg) setPlaqueBgColor(design.plaque.bg);
      if (design.plaque.color) setPlaqueTextColor(design.plaque.color);
    }

    // استرجاع أزرار التحكم
    if (design.primaryBtn) {
      setPrimaryBtnSettings(design.primaryBtn);
    }

    // استرجاع الزر الثاني (هنا كانت المشكلة، يجب تعيين الكائن كاملاً)
    if (design.secondaryBtn) {
      setSecondaryBtnSettings(design.secondaryBtn);
    }

    // استرجاع إعدادات الصورة
    if (design.image) {
      setShowProductImage(design.image.show);
      setImageSize(design.image.size);
      setImageBorderRadius(design.image.borderRadius);
      setImageShadow(design.image.shadow);
    }

    setView("EDIT");
  };
  // --- Save Downsell ---
  const handleSave = async () => {
    if (isSaving) return;

    if (!name.trim()) {
      setToastContent("Please enter a downsell name");
      setToastError(true);
      setToastActive(true);
      return;
    }

    if (!selectedDownsellProduct) {
      setToastContent("Please select a downsell product");
      setToastError(true);
      setToastActive(true);
      return;
    }

    if (discountErrorMessage) {
      setToastContent(discountErrorMessage);
      setToastError(true);
      setToastActive(true);
      return;
    }

    setIsSaving(true);

    const payload = {
      name,
      status,
      basicSettings: {
        showTimes,
        disableOtherDiscounts
      },
      productSettings: {
        productId: selectedDownsellProduct.id,
        productPrice: selectedDownsellProduct.price,
        discountType,
        discountValue,
        calculatedPrice
      },
      designSettings: {
        title,
        titleFontSize,
        titleColor,
        subtitle,
        subtitleColor,
        plaque: {
          text: plaqueText,
          bg: plaqueBgColor,
          color: plaqueTextColor
        },
        primaryBtn: {
          ...primaryBtnSettings,
        },
        secondaryBtn: {
          ...secondaryBtnSettings,
        },
        image: {
          show: showProductImage,
          size: imageSize,
          borderRadius: imageBorderRadius,
          shadow: imageShadow,
        },
      }
    };

    try {
      const url = isEditing ? `/api/downsells/${editingId}` : "/api/downsells";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.success) {
        setToastContent(isEditing ? "Updated successfully" : "Created successfully");
        setToastError(false);
        setToastActive(true);
        fetchDownsells();
        setView("LIST");
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      setToastContent(error.message || "Failed to save");
      setToastError(true);
      setToastActive(true);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Delete Downsell ---
  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const response = await fetch(`/api/downsells/${itemToDelete}`, { method: "DELETE" });
      const result = await response.json();

      if (result.success) {
        setToastContent("Deleted successfully");
        setToastError(false);
        setToastActive(true);
        fetchDownsells();
      } else {
        setToastContent("Error: " + result.error);
        setToastError(true);
        setToastActive(true);
      }
    } catch (error) {
      setToastContent("An error occurred while connecting to the server.");
      setToastError(true);
      setToastActive(true);
    } finally {
      setDeleteModalActive(false);
      setItemToDelete(null);
    }
  };

  // --- Image Size Helper ---
  const getImageMaxWidth = () => {
    switch (imageSize) {
      case "SMALL": return "100px";
      case "MEDIUM": return "200px";
      case "LARGE": return "300px";
      default: return "200px";
    }
  };

  const getProductName = (downsell: any): string => {
    // الطريقة 1: إذا كان اسم المنتج مخزن مباشرة
    if (downsell.productSettings?.productTitle) {
      return downsell.productSettings.productTitle;
    }

    // الطريقة 2: البحث عن المنتج في قائمة products
    const productId = downsell.productSettings?.productId;
    if (productId) {
      const product = products.find(p => p.id === productId);
      return product?.title || "Unknown Product";
    }

    return "No Product Selected";
  };

  // --- List View ---
  const listView = (
    <Page
      title="Downsells"
      primaryAction={{
        content: "Create Downsell",
        icon: PlusIcon,
        onAction: handleCreateNew,
      }}
    >
      <div>
        {isLoading ? (
          <Box padding="1000">
            <BlockStack align="center" inlineAlign="center" gap="400">
              <Spinner size="large" />
              <p style={{ color: 'var(--p-color-text-secondary)' }}>Loading your downsells...</p>
            </BlockStack>
          </Box>
        ) : downsells.length > 0 ? (
          <LegacyCard title="Your Downsells" sectioned>
            <ResourceList
              resourceName={{ singular: 'downsell', plural: 'downsells' }}
              items={downsells}
              renderItem={(downsell) => (

                <div
                  className="downsellItem"
                  style={{
                    border: "1px solid rgb(233 232 232)",
                    borderRadius: "8px",
                    marginBottom: "8px",
                    padding: "4px"
                  }}
                >
                  <ResourceList.Item
                    id={downsell.id}
                    onClick={() => { }}
                    persistActions
                    media={
                      <Badge
                        tone={
                          downsell.status === "ACTIVE" ? "success" :
                            downsell.status === "DRAFT" ? "warning" : "critical"
                        }
                      >
                        {downsell.status}
                      </Badge>
                    }
                  >
                    <InlineStack align="space-between" blockAlign="center">
                      <div className="downsellListingDetails">
                        <TextContainer>
                          <p><strong>{downsell.name}</strong></p>
                          <p style={{ color: '#6d7175', fontSize: '13px' }}>
                            • Product: {getProductName(downsell)}
                            <br />
                            • Created: {new Date(downsell.createdAt).toLocaleDateString()}
                          </p>
                        </TextContainer>
                      </div>

                      <InlineStack gap="200">
                        <Button
                          size="slim"
                          variant="secondary"
                          onClick={() => handleEdit(downsell)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="slim"
                          tone="critical"
                          variant="tertiary"
                          onClick={() => {
                            setItemToDelete(downsell.id);
                            setDeleteModalActive(true);
                          }}
                        >
                          Delete
                        </Button>
                      </InlineStack>
                    </InlineStack>
                  </ResourceList.Item>
                </div>
              )}
            />
          </LegacyCard>
        ) : (
          <EmptyState
            heading="No downsells found"
            action={{
              content: 'Create Downsell',
              onAction: handleCreateNew
            }}
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>You haven't created any downsells yet. Create a downsell to recover abandoned carts.</p>
          </EmptyState>
        )}
      </div>
    </Page>
  );

  // --- Edit View ---
  const editView = (
    <Page
      title={isEditing ? "Edit Downsell" : "New Downsell"}
      backAction={{ onAction: () => setView("LIST") }}
      primaryAction={{
        content: isEditing ? "Update Downsell" : "Save Downsell",
        onAction: handleSave,
        loading: isSaving,
        disabled: isSaving,
      }}
    >
      <Grid>
        <Grid.Cell columnSpan={{ xs: 6, lg: 7 }}>
          <BlockStack gap="500">
            {/* 1. Configuration Section */}
            <LegacyCard title="1. Configure the downsell" sectioned>
              <FormLayout>
                <div className="custom-switch">
                  <InlineStack align="space-between">
                    <h4>Downsell Status</h4>
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
                  label="Downsell name"
                  value={name}
                  onChange={setName}
                  autoComplete="off"
                  helpText="Give your downsell a descriptive name for internal use"
                />

                <Select
                  label="Show the downsell for:"
                  options={[
                    { label: "1 time", value: "1" },
                    { label: "2 times", value: "2" },
                    { label: "3 times", value: "3" }
                  ]}
                  value={showTimes}
                  onChange={setShowTimes}
                />

                <Divider />

                {/* Downsell Product Selection */}
                <TextContainer>
                  <h3>Downsell Product</h3>
                  <p>Product to offer as a downsell:</p>
                </TextContainer>

                <LegacyCard sectioned>
                  <InlineStack align="space-between" blockAlign="center">
                    <strong>Selected Downsell Product</strong>
                    <Button
                      size="slim"
                      onClick={() => {
                        setDownsellModalOpen(true);
                        fetchProducts();
                      }}
                    >
                      {selectedDownsellProduct ? "Change Product" : "Select Product"}
                    </Button>
                  </InlineStack>

                  {selectedDownsellProduct ? (
                    <Box paddingBlockStart="200">
                      <InlineStack gap="200" blockAlign="center">
                        {selectedDownsellProduct.featuredImage?.url && (
                          <Thumbnail
                            source={selectedDownsellProduct.featuredImage.url}
                            alt={selectedDownsellProduct.title}
                            size="small"
                          />
                        )}
                        <div>
                          <p><strong>{selectedDownsellProduct.title}</strong></p>
                          <p>{formatPrice(selectedDownsellProduct.price)}</p>
                          {isEditing && (
                            <Badge tone="info">Current Downsell Product</Badge>
                          )}
                        </div>
                      </InlineStack>
                    </Box>
                  ) : (
                    <EmptyState
                      heading="No product selected"
                      action={{
                        content: "Select Product",
                        onAction: () => setDownsellModalOpen(true),
                      }}
                      image=""
                    >
                      <p>Choose which product to offer as a downsell.</p>
                    </EmptyState>
                  )}
                </LegacyCard>

                <Divider />

                <Text variant="headingSm" as="h6">Offer Discount</Text>
                <InlineStack gap="400">
                  <div style={{ flex: 1 }}>
                    <Select
                      label="Type"
                      options={[
                        { label: "Percentage", value: "PERCENTAGE" },
                        { label: "Fixed Amount", value: "FIXED_AMOUNT" }
                      ]}
                      value={discountType}
                      onChange={(value) => setDiscountType(value as DiscountType)}
                    />
                  </div>
                  <TextField
                    autoComplete="off"
                    label="Value"
                    type="number"
                    value={discountValue}
                    onChange={setDiscountValue}
                    suffix={discountType === "PERCENTAGE" ? "%" : "$"}
                    error={discountErrorMessage ? true : false}
                    helpText={discountErrorMessage || (discountType === "PERCENTAGE" ? "Enter percentage" : "Enter amount")}
                  />
                </InlineStack>

                <Checkbox
                  label="Disable other discount codes"
                  checked={disableOtherDiscounts}
                  onChange={setDisableOtherDiscounts}
                />
              </FormLayout>
            </LegacyCard>

            {/* 2. Customization Section */}
            <LegacyCard title="2. Customize the downsell" sectioned>
              <BlockStack gap="400">
                {/* Title Section */}
                <LegacyCard title="Title & Subtitle" sectioned>
                  <InlineStack align="space-between" gap="400">
                    <Box width="66%">
                      <TextField
                        autoComplete="off"
                        label="Title Text"
                        value={title}
                        onChange={setTitle}
                      />
                    </Box>
                    <Box width="30%">
                      <div style={{
                        fontSize: 'var(--p-font-size-75)',
                        fontWeight: 'var(--p-font-weight-regular)',
                        color: 'var(--p-color-text-secondary)',
                        marginBottom: '4px'
                      }}>
                        Title Color
                      </div>
                      <SmallColorPicker
                        color={titleColor}
                        onChange={setTitleColor}
                        label="Title Color"
                      />
                    </Box>
                  </InlineStack>

                  <Box paddingBlockStart="300">
                    <InlineStack align="space-between" gap="400">
                      <Box width="66%">
                        <TextField
                          autoComplete="off"
                          label="Subtitle Text"
                          value={subtitle}
                          onChange={setSubtitle}
                        />
                      </Box>
                      {subtitle && (
                        <Box width="30%">
                          <div style={{
                            fontSize: 'var(--p-font-size-75)',
                            fontWeight: 'var(--p-font-weight-regular)',
                            color: 'var(--p-color-text-secondary)',
                            marginBottom: '4px'
                          }}>
                            Subtitle Color
                          </div>
                          <SmallColorPicker
                            color={subtitleColor}
                            onChange={setSubtitleColor}
                            label="Subtitle Color"
                          />
                        </Box>
                      )}
                    </InlineStack>
                  </Box>

                  <Box paddingBlockStart="300">
                    <RangeSlider
                      label="Title Font Size"
                      value={titleFontSize}
                      onChange={(value) => {
                        const numericValue = typeof value === 'number' ? value : value[0];
                        setTitleFontSize(numericValue);
                      }}
                      min={14}
                      max={40}
                      output
                      suffix="px"
                    />
                  </Box>
                </LegacyCard>

                {/* Discount Plaque */}
                <LegacyCard title="Discount Plaque" sectioned>
                  <BlockStack gap="300">
                    <TextField
                      autoComplete="off"
                      label="Plaque Text"
                      value={plaqueText}
                      onChange={setPlaqueText}
                    />
                    <InlineStack gap="400" align="space-between">
                      <Box width="48%">
                        <div style={{
                          fontSize: 'var(--p-font-size-75)',
                          fontWeight: 'var(--p-font-weight-regular)',
                          color: 'var(--p-color-text-secondary)',
                          marginBottom: '4px'
                        }}>
                          Background Color
                        </div>
                        <SmallColorPicker
                          color={plaqueBgColor}
                          onChange={setPlaqueBgColor}
                          label="Plaque Background"
                        />
                      </Box>
                      <Box width="48%">
                        <div style={{
                          fontSize: 'var(--p-font-size-75)',
                          fontWeight: 'var(--p-font-weight-regular)',
                          color: 'var(--p-color-text-secondary)',
                          marginBottom: '4px'
                        }}>
                          Text Color
                        </div>
                        <SmallColorPicker
                          color={plaqueTextColor}
                          onChange={setPlaqueTextColor}
                          label="Plaque Text Color"
                        />
                      </Box>
                    </InlineStack>
                  </BlockStack>
                </LegacyCard>

                {/* Primary Button */}
                <LegacyCard title="Primary Button" sectioned>
                  <BlockStack gap="300">
                    <TextField
                      autoComplete="off"
                      label="Button Text"
                      value={primaryBtnSettings.text}
                      onChange={(value) =>
                        setPrimaryBtnSettings({ ...primaryBtnSettings, text: value })
                      }
                      helpText="Use {discount} to show discount amount"
                    />

                    <InlineStack align="space-between" gap="400" wrap>
                      <Box width="48%">
                        <div style={{
                          fontSize: 'var(--p-font-size-75)',
                          fontWeight: 'var(--p-font-weight-regular)',
                          color: 'var(--p-color-text-secondary)',
                          marginBottom: '4px'
                        }}>
                          Background
                        </div>
                        <SmallColorPicker
                          color={primaryBtnSettings.backgroundColor}
                          onChange={(newColor) => setPrimaryBtnSettings(prev => ({
                            ...prev,
                            backgroundColor: newColor
                          }))}
                          label="Button Background"
                        />
                      </Box>

                      <Box width="48%">
                        <div style={{
                          fontSize: 'var(--p-font-size-75)',
                          fontWeight: 'var(--p-font-weight-regular)',
                          color: 'var(--p-color-text-secondary)',
                          marginBottom: '4px'
                        }}>
                          Text Color
                        </div>
                        <SmallColorPicker
                          color={primaryBtnSettings.textColor}
                          onChange={(color) =>
                            setPrimaryBtnSettings({ ...primaryBtnSettings, textColor: color })
                          }
                          label="Button Text Color"
                        />
                      </Box>

                      <Box width="48%">
                        <RangeSlider
                          label="Font Size"
                          value={primaryBtnSettings.fontSize}
                          onChange={(value) => {
                            const numericValue = typeof value === 'number' ? value : value[0];
                            setPrimaryBtnSettings({ ...primaryBtnSettings, fontSize: numericValue });
                          }}
                          min={12}
                          max={24}
                          output
                          suffix="px"
                        />
                      </Box>

                      <Box width="48%">
                        <RangeSlider
                          label="Border Radius"
                          value={primaryBtnSettings.borderRadius}
                          onChange={(value) => {
                            const numericValue = typeof value === 'number' ? value : value[0];
                            setPrimaryBtnSettings({ ...primaryBtnSettings, borderRadius: numericValue });
                          }}
                          min={0}
                          max={50}
                          output
                          suffix="px"
                        />
                      </Box>

                      <Box width="48%">
                        <div style={{
                          fontSize: 'var(--p-font-size-75)',
                          fontWeight: 'var(--p-font-weight-regular)',
                          color: 'var(--p-color-text-secondary)',
                          marginBottom: '4px'
                        }}>
                          Border Color
                        </div>
                        <SmallColorPicker
                          color={primaryBtnSettings.borderColor}
                          onChange={(color) =>
                            setPrimaryBtnSettings({ ...primaryBtnSettings, borderColor: color })
                          }
                          label="Border Color"
                        />
                      </Box>

                      <Box width="48%">
                        <RangeSlider
                          label="Border Width"
                          value={primaryBtnSettings.borderWidth}
                          onChange={(value) => {
                            const numericValue = typeof value === 'number' ? value : value[0];
                            setPrimaryBtnSettings({ ...primaryBtnSettings, borderWidth: numericValue });
                          }}
                          min={0}
                          max={10}
                          output
                          suffix="px"
                        />
                      </Box>

                      <Box>
                        <Checkbox
                          label="Enable Shadow"
                          checked={primaryBtnSettings.shadow}
                          onChange={(checked) =>
                            setPrimaryBtnSettings({ ...primaryBtnSettings, shadow: checked })
                          }
                        />
                      </Box>
                    </InlineStack>
                  </BlockStack>
                </LegacyCard>

                {/* Secondary Button */}
                <LegacyCard title="Secondary Button" sectioned>
                  <BlockStack gap="300">
                    <TextField
                      autoComplete="off"
                      label="Button Text"
                      value={secondaryBtnSettings.text}
                      onChange={(value) =>
                        setSecondaryBtnSettings({ ...secondaryBtnSettings, text: value })
                      }
                    />

                    <InlineStack align="space-between" gap="400" wrap>
                      <Box width="48%">
                        <div style={{
                          fontSize: 'var(--p-font-size-75)',
                          fontWeight: 'var(--p-font-weight-regular)',
                          color: 'var(--p-color-text-secondary)',
                          marginBottom: '4px'
                        }}>
                          Background
                        </div>
                        <SmallColorPicker
                          color={secondaryBtnSettings.backgroundColor}
                          onChange={(newColor) => setSecondaryBtnSettings(prev => ({
                            ...prev,
                            backgroundColor: newColor
                          }))}
                          label="Button Background"
                        />
                      </Box>
                      <Box width="48%">
                        <div style={{
                          fontSize: 'var(--p-font-size-75)',
                          fontWeight: 'var(--p-font-weight-regular)',
                          color: 'var(--p-color-text-secondary)',
                          marginBottom: '4px'
                        }}>
                          Text Color
                        </div>
                        <SmallColorPicker
                          color={secondaryBtnSettings.textColor}
                          onChange={(color) =>
                            setSecondaryBtnSettings({ ...secondaryBtnSettings, textColor: color })
                          }
                          label="Button Text Color"
                        />
                      </Box>
                      <Box>
                        <RangeSlider
                          label="Font Size"
                          value={secondaryBtnSettings.fontSize}
                          onChange={(value) => {
                            const numericValue = typeof value === 'number' ? value : value[0];
                            setSecondaryBtnSettings({ ...secondaryBtnSettings, fontSize: numericValue });
                          }}
                          min={12}
                          max={24}
                          output
                          suffix="px"
                        />
                      </Box>
                      <Box>
                        <RangeSlider
                          label="Border Radius"
                          value={secondaryBtnSettings.borderRadius}
                          onChange={(value) => {
                            const numericValue = typeof value === 'number' ? value : value[0];
                            setSecondaryBtnSettings({ ...secondaryBtnSettings, borderRadius: numericValue });
                          }}
                          min={0}
                          max={50}
                          output
                          suffix="px"
                        />
                      </Box>
                      <Box width="48%">
                        <div style={{
                          fontSize: 'var(--p-font-size-75)',
                          fontWeight: 'var(--p-font-weight-regular)',
                          color: 'var(--p-color-text-secondary)',
                          marginBottom: '4px'
                        }}>
                          Border Color
                        </div>
                        <SmallColorPicker
                          color={secondaryBtnSettings.borderColor}
                          onChange={(color) =>
                            setSecondaryBtnSettings({ ...secondaryBtnSettings, borderColor: color })
                          }
                          label="Border Color"
                        />
                      </Box>
                      <Box>
                        <RangeSlider
                          label="Border Width"
                          value={secondaryBtnSettings.borderWidth}
                          onChange={(value) => {
                            const numericValue = typeof value === 'number' ? value : value[0];
                            setSecondaryBtnSettings({ ...secondaryBtnSettings, borderWidth: numericValue });
                          }}
                          min={0}
                          max={50}
                          output
                          suffix="px"
                        />
                      </Box>
                      <Box>
                        <Checkbox
                          label="Enable Shadow"
                          checked={secondaryBtnSettings.shadow}
                          onChange={(checked) =>
                            setSecondaryBtnSettings({ ...secondaryBtnSettings, shadow: checked })
                          }
                        />
                      </Box>
                    </InlineStack>
                  </BlockStack>
                </LegacyCard>
              </BlockStack>
            </LegacyCard>
          </BlockStack>
        </Grid.Cell>

        {/* Live Preview */}
        <Grid.Cell columnSpan={{ xs: 6, lg: 5 }}>
          <div style={{ position: "sticky", top: "20px" }}>
            <LegacyCard title="Live Preview" sectioned>
              <div
                style={{
                  maxWidth: "400px",
                  border: "2px solid #ebebeb",
                  borderRadius: "8px",
                  padding: "20px",
                  margin: "0 auto"
                }}
              >
                <Box
                  background="bg-surface"
                  borderRadius="200"
                >
                  <BlockStack gap="400" align="center">

                    {/* Title */}
                    <h1 style={{
                      color: colorToRgba(titleColor),
                      fontSize: `${titleFontSize}px`,
                      fontWeight: "bold",
                      textAlign: "center",
                      margin: 0
                    }}>
                      {title}
                    </h1>

                    {/* Subtitle */}
                    {subtitle && (
                      <p style={{
                        color: colorToRgba(subtitleColor),
                        textAlign: "center",
                        margin: 0
                      }}>
                        {subtitle}
                      </p>
                    )}

                    {/* Plaque */}
                    <div className="plaqueDiscountParent">
                      <div
                        className="plaqueDiscount"
                        style={{
                          backgroundColor: colorToRgba(plaqueBgColor),
                          color: colorToRgba(plaqueTextColor),
                        }}>
                        {plaqueText}
                      </div>
                    </div>

                    {/* Buttons */}
                    <Box width="100%" paddingBlockStart="400">
                      <BlockStack gap="200">
                        <div
                          style={{
                            backgroundColor: colorToRgba(primaryBtnSettings.backgroundColor),
                            color: colorToRgba(primaryBtnSettings.textColor),
                            fontSize: `${primaryBtnSettings.fontSize}px`,
                            borderRadius: `${primaryBtnSettings.borderRadius}px`,
                            border: `${primaryBtnSettings.borderWidth}px solid ${colorToRgba(primaryBtnSettings.borderColor)}`,
                            boxShadow: primaryBtnSettings.shadow
                              ? `0 4px 12px rgba(0, 0, 0, 0.15)`
                              : 'none',
                            padding: '12px 24px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: `${primaryBtnSettings.fontSize + 24}px`,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = primaryBtnSettings.shadow
                              ? '0 6px 16px rgba(0, 0, 0, 0.2)'
                              : '0 4px 8px rgba(0, 0, 0, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = primaryBtnSettings.shadow
                              ? '0 4px 12px rgba(0, 0, 0, 0.15)'
                              : 'none';
                          }}
                        >
                          {primaryBtnSettings.text.replace("{discount}",
                            discountType === "PERCENTAGE" ? `${discountValue}%` : `$${discountValue}`
                          )}
                        </div>

                        {/* Secondary Button */}
                        <div
                          style={{
                            backgroundColor: colorToRgba(secondaryBtnSettings.backgroundColor),
                            color: colorToRgba(secondaryBtnSettings.textColor),
                            fontSize: `${secondaryBtnSettings.fontSize}px`,
                            borderRadius: `${secondaryBtnSettings.borderRadius}px`,
                            border: `${secondaryBtnSettings.borderWidth}px solid ${colorToRgba(secondaryBtnSettings.borderColor)}`,
                            boxShadow: secondaryBtnSettings.shadow
                              ? `0 2px 8px rgba(0, 0, 0, 0.1)`
                              : 'none',
                            padding: '10px 20px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: `${secondaryBtnSettings.fontSize + 20}px`,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = secondaryBtnSettings.shadow
                              ? '0 4px 12px rgba(0, 0, 0, 0.15)'
                              : '0 2px 6px rgba(0, 0, 0, 0.08)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = secondaryBtnSettings.shadow
                              ? '0 2px 8px rgba(0, 0, 0, 0.1)'
                              : 'none';
                          }}
                        >
                          {secondaryBtnSettings.text}
                        </div>
                      </BlockStack>
                    </Box>
                  </BlockStack>
                </Box>
              </div>
            </LegacyCard>
          </div>
        </Grid.Cell>
      </Grid >
    </Page >
  );

  return (
    <Frame>
      <div style={{ backgroundColor: 'rgb(241 241 241)', minHeight: '100vh', width: '100%', border: "1px solid rgb(233 232 232)", borderRadius: "8px" }}>
        {view === "LIST" ? listView : editView}

        {/* Product Selection Modal */}
        <Modal
          open={downsellModalOpen}
          onClose={() => setDownsellModalOpen(false)}
          title="Select Downsell Product"
          primaryAction={{
            content: "Cancel",
            onAction: () => setDownsellModalOpen(false),
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
                items={products.filter(product => !usedProductIds.includes(product.id))}
                renderItem={(product) => (
                  <ResourceList.Item
                    id={product.id}
                    onClick={() => handleSelectDownsellProduct(product)}
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
                      {selectedDownsellProduct?.id === product.id && (
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

        {/* Delete Modal */}
        <Modal
          open={deleteModalActive}
          onClose={() => setDeleteModalActive(false)}
          title="Are you sure about deleting it?"
          primaryAction={{
            content: "Delete",
            destructive: true,
            onAction: confirmDelete
          }}
          secondaryActions={[{
            content: "Cancel",
            onAction: () => setDeleteModalActive(false)
          }]}
        >
          <Modal.Section>
            <p>This downsell will be permanently deleted. This action cannot be undone.</p>
          </Modal.Section>
        </Modal>

        {/* Toast */}
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