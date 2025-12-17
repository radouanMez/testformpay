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
  Checkbox,
  Grid,
  LegacyCard,
  Popover
} from "@shopify/polaris";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { SearchIcon, PlusIcon } from "@shopify/polaris-icons";
import { useNavigate } from "react-router";

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

interface SmallColorPickerProps {
  color: ColorPickerColor;
  onChange: (color: ColorPickerColor) => void;
  label: string;
}

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
  const navigate = useNavigate();
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

  const [existingUpsells, setExistingUpsells] = useState<any[]>([]);
  const [loadingUpsells, setLoadingUpsells] = useState(false);

  const [isCreating, setIsCreating] = useState(false);

  const [editingUpsell, setEditingUpsell] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUpsellId, setEditingUpsellId] = useState<string | null>(null);

  // -------------------- Fetch Products --------------------
  const getImageMaxWidth = () => {
    switch (imageSize) {
      case "SMALL": return "100px";
      case "MEDIUM": return "200px";
      case "LARGE": return "300px";
      default: return "200px";
    }
  };

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
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchExistingUpsells();
  }, []);

  const fetchExistingUpsells = async () => {
    setLoadingUpsells(true);
    try {
      const response = await fetch("/api/upsells");
      console.log("Response status:", response.status);
      console.log("Response headers:", [...response.headers.entries()]);
      const text = await response.text();
      console.log("Response text:", text);
      let data;
      try {
        data = JSON.parse(text);
        console.log("Parsed data:", data);
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
        return;
      }
      setExistingUpsells(data.data || data);
      console.log("*******---------********");
      console.log(existingUpsells.length);
    } catch (error) {
      console.error("Error fetching upsells:", error);
    } finally {
      setLoadingUpsells(false);
    }
  };
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

  const fetchSpecificProduct = async (productId: string): Promise<Product | null> => {
    try {
      // إذا كان المنتج موجوداً في القائمة المحملة
      const existingProduct = products.find(p => p.id === productId);
      if (existingProduct) {
        return existingProduct;
      }

      // إذا لم يكن موجوداً، جلب تفاصيله من Shopify
      const PRODUCT_QUERY = `
      query GetProduct($id: ID!) {
        product(id: $id) {
          id
          title
          featuredImage { url altText }
          variants(first: 1) {
            edges {
              node {
                price
              }
            }
          }
        }
      }
    `;

      const response = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: PRODUCT_QUERY,
          variables: { id: productId }
        })
      });

      const json = await response.json();

      if (json.data?.product) {
        const productData = json.data.product;
        const product: Product = {
          id: productData.id,
          title: productData.title,
          price: parseFloat(productData.variants.edges[0].node.price),
          featuredImage: productData.featuredImage
        };

        // إضافة المنتج للقائمة المحملة
        setProducts(prev => [...prev, product]);

        return product;
      }

      return null;
    } catch (error) {
      console.error("Error fetching product:", error);
      return null;
    }
  };

  // دالة لملء النموذج عند النقر على Edit
  const handleEditUpsell = async (upsellId: string) => {
    try {
      const response = await fetch(`/api/upsells/${upsellId}`);
      const result = await response.json();

      if (result.success) {
        const upsell = result.data;
        setEditingUpsell(upsell);
        setIsEditing(true);
        setIsCreating(true);
        setEditingUpsellId(upsell.id);
        setIsEditing(true);

        // ملء النموذج ببيانات الـ upsell
        setUpsellName(upsell.name);
        setUpsellType(upsell.type || "ONE_CLICK");

        // ملء إعدادات العرض
        if (upsell.displayRules) {
          setTriggerMode(upsell.displayRules.triggerMode || "ALL");

          // تحميل trigger products إذا كانت محددة
          if (upsell.displayRules.triggerProducts &&
            upsell.displayRules.triggerProducts !== "ALL" &&
            Array.isArray(upsell.displayRules.triggerProducts)) {

            const triggerProductIds = upsell.displayRules.triggerProducts;
            const loadedTriggerProducts: Product[] = [];

            // تحميل كل منتج trigger
            for (const productId of triggerProductIds) {
              const product = await fetchSpecificProduct(productId);
              if (product) {
                loadedTriggerProducts.push(product);
              }
            }

            setSelectedTriggerProducts(loadedTriggerProducts);
          }
        }

        // ملء إعدادات الخصم
        if (upsell.productSettings?.discount) {
          setDiscountType(upsell.productSettings.discount.type || "NONE");
          setDiscountValue(upsell.productSettings.discount.value || "");
        }

        if (upsell.productSettings?.upsellProductId) {
          const product = await fetchSpecificProduct(upsell.productSettings.upsellProductId);
          if (product) {
            setSelectedUpsellProduct(product);
            console.log("✅ Upsell product loaded:", product.title);
          } else {
            console.error("❌ Failed to load upsell product");
            alert("Could not load the upsell product. Please select it manually.");
          }
        }

        if (upsell.displayRules) {
          setTriggerMode(upsell.displayRules.triggerMode || "ALL");

          // تحميل trigger products إذا كانت محددة
          if (upsell.displayRules.triggerProducts &&
            upsell.displayRules.triggerProducts !== "ALL" &&
            Array.isArray(upsell.displayRules.triggerProducts)) {

            const triggerProductIds = upsell.displayRules.triggerProducts;
            const loadedTriggerProducts: Product[] = [];

            // تحميل كل منتج trigger
            for (const productId of triggerProductIds) {
              const product = await fetchSpecificProduct(productId);
              if (product) {
                loadedTriggerProducts.push(product);
              }
            }

            setSelectedTriggerProducts(loadedTriggerProducts);
          }
        }

        // ملء إعدادات التصميم
        if (upsell.designSettings) {
          setTitle(upsell.designSettings.title || "");
          setSubtitle(upsell.designSettings.subtitle || "");
          setProductTitle(upsell.designSettings.productTitle || "");
          setProductDescription(upsell.designSettings.productDescription || "");

          // ملء إعدادات الصورة
          if (upsell.designSettings.image) {
            setShowProductImage(upsell.designSettings.image.show || true);
            setImageSize(upsell.designSettings.image.size || "MEDIUM");
            setImageBorderRadius(upsell.designSettings.image.borderRadius || 8);
            setImageShadow(upsell.designSettings.image.shadow || false);
          }

          if (upsell.designSettings.titleColor) {
            const titleColorParsed = typeof upsell.designSettings.titleColor === 'string'
              ? parseRgbaToColor(upsell.designSettings.titleColor)
              : upsell.designSettings.titleColor;
            setTitleColor(titleColorParsed);
          }

          if (upsell.designSettings.subtitleColor) {
            const subtitleColorParsed = typeof upsell.designSettings.subtitleColor === 'string'
              ? parseRgbaToColor(upsell.designSettings.subtitleColor)
              : upsell.designSettings.subtitleColor;
            setSubtitleColor(subtitleColorParsed);
          }

          if (upsell.designSettings.priceColor) {
            const priceColorParsed = typeof upsell.designSettings.priceColor === 'string'
              ? parseRgbaToColor(upsell.designSettings.priceColor)
              : upsell.designSettings.priceColor;
            setPriceColor(priceColorParsed);
          }

          // ملء إعدادات الأزرار
          if (upsell.designSettings.addButton) {
            const addBtn = upsell.designSettings.addButton;

            // تحويل ألوان الخلفية والنص
            const backgroundColor = typeof addBtn.backgroundColor === 'string'
              ? parseRgbaToColor(addBtn.backgroundColor)
              : addBtn.backgroundColor || { hue: 0, saturation: 0, brightness: 0, alpha: 1 };

            const textColor = typeof addBtn.textColor === 'string'
              ? parseRgbaToColor(addBtn.textColor)
              : addBtn.textColor || { hue: 0, saturation: 0, brightness: 1, alpha: 1 };

            const borderColor = typeof addBtn.borderColor === 'string'
              ? parseRgbaToColor(addBtn.borderColor)
              : addBtn.borderColor || { hue: 0, saturation: 0, brightness: 0, alpha: 1 };

            setAddButtonSettings(prev => ({
              ...prev,
              text: addBtn.text || prev.text,
              animation: addBtn.animation || prev.animation,
              icon: addBtn.icon || prev.icon,
              backgroundColor,
              textColor,
              fontSize: addBtn.fontSize || prev.fontSize,
              borderRadius: addBtn.borderRadius || prev.borderRadius,
              borderColor,
              borderWidth: addBtn.borderWidth || prev.borderWidth,
              shadow: addBtn.shadow || prev.shadow,
            }));
          }

          if (upsell.designSettings.noButton) {
            const noBtn = upsell.designSettings.noButton;

            // تحويل ألوان الخلفية والنص
            const backgroundColor = typeof noBtn.backgroundColor === 'string'
              ? parseRgbaToColor(noBtn.backgroundColor)
              : noBtn.backgroundColor || { hue: 0, saturation: 0, brightness: 1, alpha: 1 };

            const textColor = typeof noBtn.textColor === 'string'
              ? parseRgbaToColor(noBtn.textColor)
              : noBtn.textColor || { hue: 0, saturation: 0, brightness: 0, alpha: 1 };

            const borderColor = typeof noBtn.borderColor === 'string'
              ? parseRgbaToColor(noBtn.borderColor)
              : noBtn.borderColor || { hue: 0, saturation: 0, brightness: 0, alpha: 1 };

            setNoButtonSettings(prev => ({
              ...prev,
              text: noBtn.text || prev.text,
              backgroundColor,
              textColor,
              fontSize: noBtn.fontSize || prev.fontSize,
              borderRadius: noBtn.borderRadius || prev.borderRadius,
              borderColor,
              borderWidth: noBtn.borderWidth || prev.borderWidth,
              shadow: noBtn.shadow || prev.shadow,
            }));
          }

        }

        setTimeout(() => {
          const formSection = document.getElementById('upsell-form-section');
          if (formSection) {
            formSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    } catch (error) {
      console.error("Error loading upsell:", error);
    }
  };

  // دالة لإعادة تعيين النموذج لإنشاء جديد
  const handleCreateNew = () => {
    resetForm();
    // تمرير الشاشة للنموذج
    setTimeout(() => {
      const formSection = document.getElementById('upsell-form-section');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // دالة لإعادة تعيين النموذج
  const resetForm = () => {
    setUpsellName("");
    setUpsellType("ONE_CLICK");
    setTriggerMode("ALL");
    setSelectedTriggerProducts([]);
    setSelectedUpsellProduct(null);
    setDiscountType("NONE");
    setDiscountValue("");
    setTitle("Add {product_name} to your order!");
    setSubtitle("");
    setProductTitle("");
    setProductDescription("");
    setShowProductImage(true);
    setImageSize("MEDIUM");
    setImageBorderRadius(8);
    setImageShadow(false);
    setAddButtonSettings({
      text: "Add to my order",
      animation: "NONE",
      icon: "",
      backgroundColor: { hue: 0, saturation: 0, brightness: 0, alpha: 1 },
      textColor: { hue: 0, saturation: 0, brightness: 1, alpha: 1 },
      fontSize: 16,
      borderRadius: 8,
      borderColor: { hue: 0, saturation: 0, brightness: 0, alpha: 1 },
      borderWidth: 1,
      shadow: false,
    });
    setNoButtonSettings({
      text: "No thank you, complete my order",
      animation: "NONE",
      icon: "",
      backgroundColor: { hue: 0, saturation: 0, brightness: 1, alpha: 1 },
      textColor: { hue: 0, saturation: 0, brightness: 0, alpha: 1 },
      fontSize: 16,
      borderRadius: 8,
      borderColor: { hue: 0, saturation: 0, brightness: 0, alpha: 1 },
      borderWidth: 1,
      shadow: false,
    });
  };

  // تعديل دالة handleSave للتعامل مع التعديل والإنشاء
  const handleSave = async () => {
    // التحقق من البيانات المطلوبة
    if (!upsellName.trim()) {
      alert("Please enter an upsell name");
      return;
    }

    if (!selectedUpsellProduct) {
      alert("Please select an upsell product");
      return;
    }

    // إعداد payload
    const upsellPayload = {
      name: upsellName,
      type: upsellType,
      status: "DRAFT",
      basicSettings: { upsellName, upsellType },
      displayRules: {
        triggerMode,
        triggerProducts: triggerMode === "SPECIFIC"
          ? selectedTriggerProducts.map(p => p.id)
          : "ALL",
      },
      productSettings: {
        upsellProductId: selectedUpsellProduct.id,
        discount: { type: discountType, value: discountValue },
        price: selectedUpsellProduct.price,
        calculatedPrice,
      },
      designSettings: {
        title,
        subtitle,
        titleColor: colorToRgba(titleColor),
        subtitleColor: colorToRgba(subtitleColor),
        priceColor: colorToRgba(priceColor),
        productTitle,
        productDescription,
        image: {
          show: showProductImage,
          size: imageSize,
          borderRadius: imageBorderRadius,
          shadow: imageShadow,
        },
        addButton: {
          text: addButtonSettings.text,
          animation: addButtonSettings.animation,
          icon: addButtonSettings.icon,
          backgroundColor: colorToRgba(addButtonSettings.backgroundColor),
          textColor: colorToRgba(addButtonSettings.textColor),
          fontSize: addButtonSettings.fontSize,
          borderRadius: addButtonSettings.borderRadius,
          borderColor: colorToRgba(addButtonSettings.borderColor),
          borderWidth: addButtonSettings.borderWidth,
          shadow: addButtonSettings.shadow,
        },
        noButton: {
          text: noButtonSettings.text,
          backgroundColor: colorToRgba(noButtonSettings.backgroundColor),
          textColor: colorToRgba(noButtonSettings.textColor),
          fontSize: noButtonSettings.fontSize,
          borderRadius: noButtonSettings.borderRadius,
          borderColor: colorToRgba(noButtonSettings.borderColor),
          borderWidth: noButtonSettings.borderWidth,
          shadow: noButtonSettings.shadow,
        },
      },
      statistics: {
        views: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
      },
    };

    try {
      let response;

      if (isEditing && editingUpsell) {
        // تحديث الـ upsell الموجود
        response = await fetch(`/api/upsells/${editingUpsell.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(upsellPayload),
        });
      } else {
        // إنشاء upsell جديد
        response = await fetch("/api/upsells", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(upsellPayload),
        });
      }

      const result = await response.json();

      if (result.success) {
        alert(isEditing ? "Upsell updated successfully!" : "Upsell created successfully!");

        // إعادة تعيين النموذج
        resetForm();
        setEditingUpsell(null);
        setIsEditing(false);

        // تحديث قائمة الـ upsells
        fetchExistingUpsells();
      } else {
        throw new Error(result.error || "Failed to save upsell");
      }
    } catch (error: any) {
      console.error("Error saving upsell:", error);
      alert(`Error saving upsell: ${error.message}`);
    }
  };

  const handleCancel = () => {
    resetForm();
  };

  const parseRgbaToColor = (rgbaString: string): ColorPickerColor => {
    // تحويل string مثل "rgba(255, 0, 0, 1)" إلى ColorPickerColor
    const match = rgbaString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);

    if (!match) {
      // قيمة افتراضية إذا فشل التحويل
      console.warn("Failed to parse color:", rgbaString);
      return { hue: 0, saturation: 0, brightness: 0, alpha: 1 };
    }

    const r = parseInt(match[1]) / 255;
    const g = parseInt(match[2]) / 255;
    const b = parseInt(match[3]) / 255;
    const alpha = match[4] ? parseFloat(match[4]) : 1;

    // تحويل RGB إلى HSV
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let hue = 0;
    if (delta !== 0) {
      if (max === r) {
        hue = ((g - b) / delta) % 6;
      } else if (max === g) {
        hue = (b - r) / delta + 2;
      } else {
        hue = (r - g) / delta + 4;
      }

      hue = Math.round(hue * 60);
      if (hue < 0) hue += 360;
    }

    const saturation = max === 0 ? 0 : delta / max;
    const brightness = max;

    return {
      hue,
      saturation,
      brightness,
      alpha
    };
  };


  const SmallColorPicker = ({ color, onChange, label }: SmallColorPickerProps) => {
    const [popoverActive, setPopoverActive] = useState(false);

    const [tempColor, setTempColor] = useState(color);

    const togglePopover = useCallback(() => {
      if (!popoverActive) setTempColor(color);
      setPopoverActive((active) => !active);
    }, [popoverActive, color]);

    const handleSave = () => {
      onChange(tempColor);
      setPopoverActive(false);
    };

    const handleCancel = () => {
      setTempColor(color);
      setPopoverActive(false);
    };

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
                width: 16,
                height: 16,
                borderRadius: 3,
                backgroundColor: colorToRgba(color),
                border: "1px solid rgba(0,0,0,0.1)"
              }} />
            }
          >
          </Button>
        }
        onClose={handleCancel}
      >
        <Box padding="400">
          <BlockStack gap="300">
            <div style={{ fontSize: '12px', color: 'var(--p-color-text-secondary)', marginBottom: '8px' }}>
              {label}
            </div>
            <ColorPicker
              color={tempColor}
              onChange={(newColor) => setTempColor({ ...newColor, alpha: 1 })}
            // allowAlpha
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





  // -------------------- Render --------------------
  return (
    <Page
      title={isEditing ? `Editing: ${editingUpsell?.name}` : "Upsell Manager"}
      primaryAction={
        isCreating ? {
          content: isEditing ? "Update Upsell" : "Save Upsell",
          onAction: handleSave,
        } : {
          content: "Create New Upsell",
          icon: PlusIcon,
          onAction: handleCreateNew,
        }
      }
      secondaryActions={
        isCreating
          ? [
            {
              content: "Cancel",
              onAction: () => {
                resetForm();
                setEditingUpsell(null);
                setIsEditing(false);
                setIsCreating(false);
              },
            }
          ]
          : undefined
      }
    >

      {/* قائمة الـ upsells الموجودة */}
      {!isCreating && existingUpsells.length > 0 && (
        <LegacyCard title="Your Upsells" sectioned>
          <ResourceList
            items={existingUpsells}
            loading={loadingUpsells}
            renderItem={(upsell) => (
              <ResourceList.Item
                id={upsell.id}
                onClick={() => handleEditUpsell(upsell.id)}
                media={
                  <Badge
                    tone={
                      upsell.status === "ACTIVE" ? "success" :
                        upsell.status === "DRAFT" ? "warning" :
                          "critical"
                    }
                  >
                    {upsell.status}
                  </Badge>
                }
              >
                <InlineStack align="space-between" blockAlign="center">
                  <div>
                    <TextContainer>
                      <p><strong>{upsell.name}</strong></p>
                      <p>• Type: {upsell.type}</p>
                      <p>• Created: {new Date(upsell.createdAt).toLocaleDateString()}</p>
                    </TextContainer>
                  </div>
                  <Button
                    size="slim"
                    variant="primary"
                    onClick={() => handleEditUpsell(upsell.id)}
                  >
                    Edit
                  </Button>
                </InlineStack>
              </ResourceList.Item>
            )}
            emptyState={
              <EmptyState
                heading="No upsells yet"
                action={{
                  content: "Create your first upsell",
                  onAction: () => { },
                }}
                image=""
              >
                <p>Create an upsell to increase your average order value.</p>
              </EmptyState>
            }
          />
        </LegacyCard>
      )}

      {isEditing && (
        <Box padding="200" borderRadius="200">
          <InlineStack align="center" gap="200">
            <Badge tone="success">Editing Mode</Badge>
            <TextContainer>
              <p>You are editing an existing upsell. Changes will update the original.</p>
            </TextContainer>
          </InlineStack>
        </Box>
      )}

      {/* استخدام Grid لتقسيم الصفحة */}
      {isCreating && (
        <Grid>
          {/* العمود الأيسر - الإعدادات */}
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 7, xl: 7 }}>
            <BlockStack gap="400">

              {/* ================= BASIC SETTINGS ================= */}
              <LegacyCard title="Basic Settings" sectioned>
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

                      {/* ... rest of trigger products code ... */}
                    </Box>
                  )}

                  <Divider />

                  {/* ================= UPSELL PRODUCT ================= */}
                  <TextContainer>
                    <h3>Upsell Product</h3>
                    <p>Product to offer as an upsell:</p>
                  </TextContainer>

                  <LegacyCard sectioned>
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
                      <Box paddingBlockStart="200">
                        <InlineStack gap="200" blockAlign="center">
                          {selectedUpsellProduct.featuredImage?.url && (
                            <Thumbnail
                              source={selectedUpsellProduct.featuredImage.url}
                              alt={selectedUpsellProduct.title}
                              size="small"
                            />
                          )}
                          <div>
                            <p><strong>{selectedUpsellProduct.title}</strong></p>
                            <p>{formatPrice(selectedUpsellProduct.price)}</p>
                            {isEditing && (
                              <Badge tone="info">Current Upsell Product</Badge>
                            )}
                          </div>
                        </InlineStack>
                      </Box>
                    ) : (
                      <EmptyState
                        heading={isEditing ? "Loading product..." : "No product selected"}
                        action={{
                          content: "Select Product",
                          onAction: () => setUpsellModalOpen(true),
                        }}
                        image=""
                      >
                        <p>{isEditing ? "Loading the upsell product..." : "Choose which product to offer as an upsell."}</p>
                      </EmptyState>
                    )}

                  </LegacyCard>

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
                </FormLayout>
              </LegacyCard>

              {/* ================= DESIGN SETTINGS ================= */}
              <LegacyCard title="Design Settings" sectioned>
                <BlockStack gap="400">
                  {/* Title Section */}
                  <LegacyCard title="Title & Subtitle" sectioned>
                    <BlockStack gap="200">
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

                      <TextField
                        autoComplete="off"
                        label="Subtitle Text"
                        value={subtitle}
                        onChange={setSubtitle}
                        helpText="Shortcodes: {product_name}, {first_name}"
                      />
                      {subtitle && (
                        <Box>
                          <label>Subtitle Color</label>
                          <ColorPicker color={subtitleColor} onChange={setSubtitleColor} allowAlpha />
                        </Box>
                      )}
                    </BlockStack>
                  </LegacyCard>

                  {/* Product Information */}
                  <LegacyCard title="Product Information" sectioned>
                    <BlockStack gap="200">
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
                  </LegacyCard>

                  {/* Product Image Settings */}
                  <LegacyCard title="Product Image" sectioned>
                    <BlockStack gap="200">
                      <Checkbox
                        label="Show Product Image"
                        checked={showProductImage}
                        onChange={setShowProductImage}
                      />

                      {showProductImage && (
                        <>
                          <Select
                            label="Image Size"
                            options={[
                              { label: "Small", value: "SMALL" },
                              { label: "Medium", value: "MEDIUM" },
                              { label: "Large", value: "LARGE" },
                            ]}
                            value={imageSize}
                            onChange={(value) => setImageSize(value as "SMALL" | "MEDIUM" | "LARGE")}
                          />

                          <RangeSlider
                            label="Image Border Radius"
                            value={imageBorderRadius}
                            onChange={(value) => {
                              const numericValue = typeof value === 'number' ? value : value[0];
                              setImageBorderRadius(numericValue);
                            }}
                            min={0}
                            max={50}
                            output
                            suffix="px"
                          />

                          <Checkbox
                            label="Enable Image Shadow"
                            checked={imageShadow}
                            onChange={setImageShadow}
                          />
                        </>
                      )}
                    </BlockStack>
                  </LegacyCard>

                  {/* Add to Order Button */}
                  <LegacyCard title="Add to Order Button" sectioned>
                    <BlockStack gap="300">
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

                      <InlineStack align="space-between" gap="400">
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
                            color={addButtonSettings.backgroundColor}
                            onChange={(color) => setAddButtonSettings(prev => ({ ...prev, backgroundColor: color }))}
                            label="Background Color"
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
                            color={addButtonSettings.textColor}
                            onChange={(color: any) =>
                              setAddButtonSettings({ ...addButtonSettings, textColor: color })
                            }
                            label="Text Color"
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
                            color={addButtonSettings.borderColor}
                            onChange={(color: any) =>
                              setAddButtonSettings({ ...addButtonSettings, borderColor: color })
                            }
                            label="Text Color"
                          />
                        </Box>
                        <Box width="48%">
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
                        <Box width="48%">
                          <RangeSlider
                            label="Border Radius"
                            value={addButtonSettings.borderRadius}
                            onChange={(value) => {
                              const numericValue = typeof value === 'number' ? value : value[0];
                              setAddButtonSettings({ ...addButtonSettings, borderRadius: numericValue });
                            }}
                            min={0}
                            max={50}
                            output
                            suffix="px"
                          />
                        </Box>

                        <Box width="48%">
                          <RangeSlider
                            label="Border Width"
                            value={addButtonSettings.borderWidth}
                            onChange={(value) => {
                              const numericValue = typeof value === 'number' ? value : value[0];
                              setAddButtonSettings({ ...addButtonSettings, borderWidth: numericValue });
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
                            checked={addButtonSettings.shadow}
                            onChange={(checked) =>
                              setAddButtonSettings({ ...addButtonSettings, shadow: checked })
                            }
                          />
                        </Box>
                      </InlineStack>
                    </BlockStack>
                  </LegacyCard>

                  {/* No Thank You Button */}
                  <LegacyCard title="No Thank You Button" sectioned>
                    <BlockStack gap="300">
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
                              const numericValue = typeof value === 'number' ? value : value[0];
                              setNoButtonSettings({ ...noButtonSettings, fontSize: numericValue });
                            }}
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
                              const numericValue = typeof value === 'number' ? value : value[0];
                              setNoButtonSettings({ ...noButtonSettings, borderRadius: numericValue });
                            }}
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
                            onChange={(color) =>
                              setNoButtonSettings({ ...noButtonSettings, borderColor: color })
                            }
                            allowAlpha
                          />
                        </Box>
                        <Box width="50%">
                          <RangeSlider
                            label="Border Width"
                            value={noButtonSettings.borderWidth}
                            onChange={(value) => {
                              const numericValue = typeof value === 'number' ? value : value[0];
                              setNoButtonSettings({ ...noButtonSettings, borderWidth: numericValue });
                            }}
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
                          checked={noButtonSettings.shadow}
                          onChange={(checked) =>
                            setNoButtonSettings({ ...noButtonSettings, shadow: checked })
                          }
                        />
                      </Box>
                    </BlockStack>
                  </LegacyCard>
                </BlockStack>
              </LegacyCard>
            </BlockStack>
          </Grid.Cell>

          {/* العمود الأيمن - المعاينة */}
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 5, xl: 5 }}>
            <LegacyCard title="Live Preview" sectioned>
              <div
                style={{
                  position: "sticky",
                  top: "20px",
                  maxHeight: "calc(100vh - 100px)",
                  overflowY: "auto"
                }}
              >
                <Box
                  padding="400"
                  background="bg-surface"
                  borderRadius="200"
                >
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
                            {/* صورة المنتج */}
                            {showProductImage && selectedUpsellProduct.featuredImage?.url && (
                              <div style={{
                                borderRadius: `${imageBorderRadius}px`,
                                boxShadow: imageShadow ? 'var(--p-shadow-300)' : 'none',
                                maxWidth: getImageMaxWidth(),
                                margin: "0 auto",
                                overflow: "hidden",
                              }}>
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
                                      borderRadius: `${Math.max(imageBorderRadius - 4, 0)}px`,
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
                      {/* الأزرار في Live Preview */}
                      <Box paddingBlockStart="400">
                        <BlockStack gap="200">
                          {/* زر Add to Order - استخدم div مع أنماط مخصصة */}
                          <div
                            style={{
                              backgroundColor: colorToRgba(addButtonSettings.backgroundColor),
                              color: colorToRgba(addButtonSettings.textColor),
                              fontSize: `${addButtonSettings.fontSize}px`,
                              borderRadius: `${addButtonSettings.borderRadius}px`,
                              border: `${addButtonSettings.borderWidth}px solid ${colorToRgba(addButtonSettings.borderColor)}`,
                              boxShadow: addButtonSettings.shadow
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
                              gap: '8px',
                              minHeight: `${addButtonSettings.fontSize + 24}px`,
                              // Animation
                              animation: addButtonSettings.animation === 'PULSE'
                                ? 'pulse 2s infinite'
                                : addButtonSettings.animation === 'BOUNCE'
                                  ? 'bounce 1s infinite'
                                  : 'none',
                            }}
                            onMouseEnter={(e) => {
                              // إضافة تأثير hover ديناميكي
                              if (addButtonSettings.animation === 'NONE') {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = addButtonSettings.shadow
                                  ? '0 6px 16px rgba(0, 0, 0, 0.2)'
                                  : '0 4px 8px rgba(0, 0, 0, 0.1)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (addButtonSettings.animation === 'NONE') {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = addButtonSettings.shadow
                                  ? '0 4px 12px rgba(0, 0, 0, 0.15)'
                                  : 'none';
                              }
                            }}
                          >
                            {/* أيقونة إذا كانت موجودة */}
                            {addButtonSettings.icon && (
                              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                                {/* هنا يمكنك إضافة أيقونة حسب الاسم */}
                                {addButtonSettings.icon}
                              </span>
                            )}
                            {addButtonSettings.text}
                          </div>

                          {/* زر No Thank You - استخدم div مع أنماط مخصصة */}
                          <div
                            style={{
                              backgroundColor: colorToRgba(noButtonSettings.backgroundColor),
                              color: colorToRgba(noButtonSettings.textColor),
                              fontSize: `${noButtonSettings.fontSize}px`,
                              borderRadius: `${noButtonSettings.borderRadius}px`,
                              border: `${noButtonSettings.borderWidth}px solid ${colorToRgba(noButtonSettings.borderColor)}`,
                              boxShadow: noButtonSettings.shadow
                                ? `0 2px 8px rgba(0, 0, 0, 0.1)`
                                : 'none',
                              padding: '10px 20px',
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minHeight: `${noButtonSettings.fontSize + 20}px`,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = noButtonSettings.shadow
                                ? '0 4px 12px rgba(0, 0, 0, 0.15)'
                                : '0 2px 6px rgba(0, 0, 0, 0.08)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = noButtonSettings.shadow
                                ? '0 2px 8px rgba(0, 0, 0, 0.1)'
                                : 'none';
                            }}
                          >
                            {noButtonSettings.text}
                          </div>
                        </BlockStack>
                      </Box>

                    </TextContainer>
                  </BlockStack>
                </Box>
              </div>
            </LegacyCard>
          </Grid.Cell>
        </Grid>
      )
      }

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

      {/* ================= MODALS ================= */}
      {/* Keep the existing modals here */}
    </Page>
  );

}

