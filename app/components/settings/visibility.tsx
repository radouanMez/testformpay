// app.visibility.tsx
import {
    Page,
    Layout,
    Card,
    Box,
    Text,
    Checkbox,
    ChoiceList,
    TextField,
    Button,
    List,
    Badge,
    Modal,
    ResourceList,
    Thumbnail,
    Spinner,
    Toast,
    Frame
} from "@shopify/polaris";
import { useState, useCallback, useEffect, useRef } from "react";
import { useAuthenticatedFetch } from "../../hooks/useAuthenticatedFetch";
import { countryOptions } from "../../utils/countries";

interface Product {
    id: string;
    title: string;
    featuredImage?: {
        url: string;
        altText?: string;
    };
}

interface Collection {
    id: string;
    title: string;
}

interface VisibilitySettingsProps {
    onSave?: (data: any) => Promise<void>;
}

export default function VisibilitySettings({ onSave }: VisibilitySettingsProps) {
    const authenticatedFetch = useAuthenticatedFetch();

    // 🧩 States for form settings
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ content: string; error?: boolean } | null>(null);

    // --- Visibility settings ---
    const [enableProductsFilter, setEnableProductsFilter] = useState(false);
    const [disableProductsFilter, setDisableProductsFilter] = useState(false);
    const [enableCountriesFilter, setEnableCountriesFilter] = useState(false);
    const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
    const [enableOrderTotal, setEnableOrderTotal] = useState(false);
    const [minOrderTotal, setMinOrderTotal] = useState("0.00");
    const [maxOrderTotal, setMaxOrderTotal] = useState("");

    // --- Products / Collections ---
    const [includedProducts, setIncludedProducts] = useState<Product[]>([]);
    const [excludedProducts, setExcludedProducts] = useState<Product[]>([]);
    const [includedCollections, setIncludedCollections] = useState<Collection[]>([]);
    const [excludedCollections, setExcludedCollections] = useState<Collection[]>([]);

    // --- Modals ---
    const [showProductsModal, setShowProductsModal] = useState(false);
    const [showCollectionsModal, setShowCollectionsModal] = useState(false);
    const [modalType, setModalType] = useState<'include-products' | 'exclude-products' | 'include-collections' | 'exclude-collections'>('include-products');
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [selectedCollections, setSelectedCollections] = useState<string[]>([]);

    // --- States for API data ---
    const [products, setProducts] = useState<Product[]>([]);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loadingModal, setLoadingModal] = useState(false);

    // استخدام useRef لمنع التحميل المتكرر
    const hasLoaded = useRef(false);

    // --- Load existing config ---
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

                if (data.success) {
                    const vis = data.data?.visibility || {};

                    if (mounted) {
                        setEnableProductsFilter(!!vis.enableProductsFilter);
                        setDisableProductsFilter(!!vis.disableProductsFilter);
                        setEnableCountriesFilter(!!vis.enableCountriesFilter);
                        setSelectedCountries(vis.selectedCountries || []);
                        setEnableOrderTotal(!!vis.enableOrderTotal);
                        setMinOrderTotal(vis.minOrderTotal || "0.00");
                        setMaxOrderTotal(vis.maxOrderTotal || "");
                        setIncludedProducts(vis.includedProducts || []);
                        setExcludedProducts(vis.excludedProducts || []);
                        setIncludedCollections(vis.includedCollections || []);
                        setExcludedCollections(vis.excludedCollections || []);
                    }
                }
            } catch (err) {
                console.error("❌ Error loading visibility config:", err);
                if (mounted) {
                    setToast({ content: "Failed to load visibility settings", error: true });
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
    }, []);

    // GraphQL query for products
    const PRODUCTS_QUERY = `
    query {
      products(first: 50) {
        edges {
          node {
            id
            title
            featuredImage {
              url
              altText
            }
          }
        }
      }
    }
  `;

    // GraphQL query for collections
    const COLLECTIONS_QUERY = `
    query {
      collections(first: 50) {
        edges {
          node {
            id
            title
          }
        }
      }
    }
  `;

    // Fetch products from Shopify GraphQL API
    const fetchProducts = useCallback(async () => {
        setLoadingModal(true);
        try {
            const response = await authenticatedFetch("/api/graphql", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: PRODUCTS_QUERY }),
            });

            const { data, errors } = await response.json();

            if (errors) {
                console.error("GraphQL Errors:", errors);
                return;
            }

            const productsData = data.products.edges.map((edge: any) => edge.node);
            setProducts(productsData);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoadingModal(false);
        }
    }, [authenticatedFetch]);

    // Fetch collections from Shopify GraphQL API
    const fetchCollections = useCallback(async () => {
        setLoadingModal(true);
        try {
            const response = await authenticatedFetch("/api/graphql", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: COLLECTIONS_QUERY }),
            });

            const { data, errors } = await response.json();

            if (errors) {
                console.error("GraphQL Errors:", errors);
                return;
            }

            const collectionsData = data.collections.edges.map((edge: any) => edge.node);
            setCollections(collectionsData);
        } catch (error) {
            console.error("Error fetching collections:", error);
        } finally {
            setLoadingModal(false);
        }
    }, [authenticatedFetch]);

    // Open products modal
    const openProductsModal = (type: 'include-products' | 'exclude-products') => {
        setModalType(type);
        setSelectedProducts([]);
        fetchProducts();
        setShowProductsModal(true);
    };

    // Open collections modal
    const openCollectionsModal = (type: 'include-collections' | 'exclude-collections') => {
        setModalType(type);
        setSelectedCollections([]);
        fetchCollections();
        setShowCollectionsModal(true);
    };

    // Handle product selection
    const handleProductSelect = (productId: string) => {
        setSelectedProducts(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    // Handle collection selection
    const handleCollectionSelect = (collectionId: string) => {
        setSelectedCollections(prev =>
            prev.includes(collectionId)
                ? prev.filter(id => id !== collectionId)
                : [...prev, collectionId]
        );
    };

    // Add selected products
    const addSelectedProducts = () => {
        const selectedProductsData = products.filter(product =>
            selectedProducts.includes(product.id)
        );

        if (modalType === 'include-products') {
            setIncludedProducts(prev => [...prev, ...selectedProductsData]);
        } else {
            setExcludedProducts(prev => [...prev, ...selectedProductsData]);
        }

        setShowProductsModal(false);
        setSelectedProducts([]);
    };

    // Add selected collections
    const addSelectedCollections = () => {
        const selectedCollectionsData = collections.filter(collection =>
            selectedCollections.includes(collection.id)
        );

        if (modalType === 'include-collections') {
            setIncludedCollections(prev => [...prev, ...selectedCollectionsData]);
        } else {
            setExcludedCollections(prev => [...prev, ...selectedCollectionsData]);
        }

        setShowCollectionsModal(false);
        setSelectedCollections([]);
    };

    // Remove product
    const removeProduct = (productId: string, type: 'include' | 'exclude') => {
        if (type === 'include') {
            setIncludedProducts(prev => prev.filter(p => p.id !== productId));
        } else {
            setExcludedProducts(prev => prev.filter(p => p.id !== productId));
        }
    };

    // Remove collection
    const removeCollection = (collectionId: string, type: 'include' | 'exclude') => {
        if (type === 'include') {
            setIncludedCollections(prev => prev.filter(c => c.id !== collectionId));
        } else {
            setExcludedCollections(prev => prev.filter(c => c.id !== collectionId));
        }
    };

    // --- Save settings ---
    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                enableProductsFilter,
                disableProductsFilter,
                enableCountriesFilter,
                selectedCountries,
                enableOrderTotal,
                minOrderTotal,
                maxOrderTotal,
                includedProducts,
                excludedProducts,
                includedCollections,
                excludedCollections,
            };

            // إذا كان onSave موجوداً، استخدمه، وإلا استخدم الطريقة الأصلية
            if (onSave) {
                await onSave(payload);
                setToast({ content: "✅ Visibility settings saved successfully" });
            } else {
                const res = await authenticatedFetch("/api/save-settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                const data = await res.json();
                if (data.success) {
                    setToast({ content: "✅ Visibility settings saved successfully" });
                } else {
                    setToast({ content: "❌ Failed to save settings", error: true });
                }
            }
        } catch (err) {
            console.error("Save error:", err);
            setToast({ content: "Server error", error: true });
        } finally {
            setSaving(false);
        }
    };

    // --- UI helpers ---
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
                title="Visibility"
                primaryAction={{
                    content: saving ? "Saving..." : "Save Changes",
                    onAction: handleSave,
                    loading: saving,
                }}
            >
                <Layout>
                    {/* Advanced Filters Section */}
                    <Layout.Section>
                        <div className="visibility-settings-container">
                            <Card>
                                <Box padding="400">
                                    <Text variant="headingMd" as="h2">
                                        Limit your order form for only specific products, collections, countries or order totals
                                    </Text>
                                    <Text as="p" tone="subdued">
                                        Here you can choose to show your COD order form only for customers from
                                        specific countries or for specific products and collections. You can also
                                        limit the COD form based on the order total.
                                    </Text>

                                    {/* Countries Section */}
                                    <div className="countries-section">
                                        <Box paddingBlockStart="400">
                                            <Checkbox
                                                label="Enable your form only for specific countries"
                                                checked={enableCountriesFilter}
                                                onChange={setEnableCountriesFilter}
                                            />
                                            {enableCountriesFilter && (
                                                <div className="countries-list-container">
                                                    <Box paddingBlockStart="300" padding="200">
                                                        <Text variant="headingSm" as="h4" fontWeight="medium">
                                                            Select countries
                                                        </Text>
                                                        <div className="countries-scroll-wrapper">
                                                            <ChoiceList
                                                                allowMultiple
                                                                title="Countries Listing"
                                                                choices={countryOptions.map((c) => ({
                                                                    label: c.label,
                                                                    value: c.value,
                                                                }))}
                                                                selected={selectedCountries}
                                                                onChange={setSelectedCountries}
                                                            />
                                                        </div>
                                                        {selectedCountries.length > 0 && (
                                                            <div className="selected-countries-badges">
                                                                <Box paddingBlockStart="200">
                                                                    <Text as="p" variant="bodySm" fontWeight="medium" tone="subdued">
                                                                        Selected countries ({selectedCountries.length}):
                                                                    </Text>
                                                                    <div className="badges-container">
                                                                        {selectedCountries.map(countryCode => {
                                                                            const country = countryOptions.find(c => c.value === countryCode);
                                                                            return (
                                                                                <Badge key={countryCode} tone="success">
                                                                                    {country?.label}
                                                                                </Badge>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </Box>
                                                            </div>
                                                        )}
                                                    </Box>
                                                </div>
                                            )}
                                        </Box>
                                    </div>

                                    {/* Enable Products/Collections Section */}
                                    <div className="enable-products-section">
                                        <Box paddingBlockStart="400">
                                            <Checkbox
                                                label="Enable your form only for specific products and collections"
                                                checked={enableProductsFilter}
                                                onChange={setEnableProductsFilter}
                                            />
                                        </Box>

                                        {enableProductsFilter && (
                                            <div className="included-items-section">
                                                <Box paddingBlockStart="300" padding="200">
                                                    <Text as="p" variant="bodyMd" fontWeight="medium">
                                                        Your form will only be active on the following products and collections:
                                                    </Text>

                                                    <div className="action-buttons-group">
                                                        <Box paddingBlockStart="200">
                                                            <Button onClick={() => openProductsModal('include-products')}>
                                                                Add products
                                                            </Button>
                                                        </Box>

                                                        {includedProducts.length > 0 && (
                                                            <div className="items-list-container">
                                                                <Box paddingBlockStart="200">
                                                                    <Text as="p" variant="bodySm" fontWeight="medium" tone="subdued">
                                                                        Included Products ({includedProducts.length}):
                                                                    </Text>
                                                                    <div className="scrollable-list">
                                                                        <List type="bullet">
                                                                            {includedProducts.map(product => (
                                                                                <List.Item key={product.id}>
                                                                                    <div className="list-item-content">
                                                                                        <Text as="span">{product.title}</Text>
                                                                                        <Button
                                                                                            tone="critical"
                                                                                            variant="plain"
                                                                                            onClick={() => removeProduct(product.id, "include")}
                                                                                        >
                                                                                            Remove
                                                                                        </Button>
                                                                                    </div>
                                                                                </List.Item>
                                                                            ))}
                                                                        </List>
                                                                    </div>
                                                                </Box>
                                                            </div>
                                                        )}

                                                        <Box paddingBlockStart="200">
                                                            <Button onClick={() => openCollectionsModal('include-collections')}>
                                                                Add collections
                                                            </Button>
                                                        </Box>

                                                        {includedCollections.length > 0 && (
                                                            <div className="items-list-container">
                                                                <Box paddingBlockStart="200">
                                                                    <Text as="p" variant="bodySm" fontWeight="medium" tone="subdued">
                                                                        Included Collections ({includedCollections.length}):
                                                                    </Text>
                                                                    <div className="scrollable-list">
                                                                        <List type="bullet">
                                                                            {includedCollections.map(collection => (
                                                                                <List.Item key={collection.id}>
                                                                                    <div className="list-item-content">
                                                                                        <Text as="span">{collection.title}</Text>
                                                                                        <Button
                                                                                            tone="critical"
                                                                                            variant="plain"
                                                                                            onClick={() => removeCollection(collection.id, 'include')}
                                                                                        >
                                                                                            Remove
                                                                                        </Button>
                                                                                    </div>
                                                                                </List.Item>
                                                                            ))}
                                                                        </List>
                                                                    </div>
                                                                </Box>
                                                            </div>
                                                        )}
                                                    </div>
                                                </Box>
                                            </div>
                                        )}
                                    </div>

                                    {/* Disable Products/Collections Section */}
                                    <div className="disable-products-section">
                                        <Box paddingBlockStart="300">
                                            <Checkbox
                                                label="Disable your form for one or more products and collections"
                                                checked={disableProductsFilter}
                                                onChange={setDisableProductsFilter}
                                            />
                                        </Box>

                                        {disableProductsFilter && (
                                            <div className="excluded-items-section">
                                                <Box paddingBlockStart="300" padding="200">
                                                    <Text as="p" variant="bodyMd" fontWeight="medium">
                                                        Your form will not be active on the following products and collections:
                                                    </Text>

                                                    <div className="action-buttons-group">
                                                        <Box paddingBlockStart="200">
                                                            <Button onClick={() => openProductsModal('exclude-products')}>
                                                                Add products
                                                            </Button>
                                                        </Box>

                                                        {excludedProducts.length > 0 && (
                                                            <div className="items-list-container">
                                                                <Box paddingBlockStart="200">
                                                                    <Text as="p" variant="bodySm" fontWeight="medium" tone="subdued">
                                                                        Excluded Products ({excludedProducts.length}):
                                                                    </Text>
                                                                    <div className="scrollable-list">
                                                                        <List type="bullet">
                                                                            {excludedProducts.map(product => (
                                                                                <List.Item key={product.id}>
                                                                                    <div className="list-item-content">
                                                                                        <Text as="span">{product.title}</Text>
                                                                                        <Button
                                                                                            tone="critical"
                                                                                            variant="plain"
                                                                                            onClick={() => removeProduct(product.id, 'exclude')}
                                                                                        >
                                                                                            Remove
                                                                                        </Button>
                                                                                    </div>
                                                                                </List.Item>
                                                                            ))}
                                                                        </List>
                                                                    </div>
                                                                </Box>
                                                            </div>
                                                        )}

                                                        <Box paddingBlockStart="200">
                                                            <Button onClick={() => openCollectionsModal('exclude-collections')}>
                                                                Add collections
                                                            </Button>
                                                        </Box>

                                                        {excludedCollections.length > 0 && (
                                                            <div className="items-list-container">
                                                                <Box paddingBlockStart="200">
                                                                    <Text as="p" variant="bodySm" fontWeight="medium" tone="subdued">
                                                                        Excluded Collections ({excludedCollections.length}):
                                                                    </Text>
                                                                    <div className="scrollable-list">
                                                                        <List type="bullet">
                                                                            {excludedCollections.map(collection => (
                                                                                <List.Item key={collection.id}>
                                                                                    <div className="list-item-content">
                                                                                        <Text as="span">{collection.title}</Text>
                                                                                        <Button
                                                                                            tone="critical"
                                                                                            variant="plain"
                                                                                            onClick={() => removeCollection(collection.id, 'exclude')}
                                                                                        >
                                                                                            Remove
                                                                                        </Button>
                                                                                    </div>
                                                                                </List.Item>
                                                                            ))}
                                                                        </List>
                                                                    </div>
                                                                </Box>
                                                            </div>
                                                        )}
                                                    </div>
                                                </Box>
                                            </div>
                                        )}
                                    </div>

                                    {/* Order Total Settings */}
                                    <div className="order-total-section">
                                        <Box paddingBlockStart="400">
                                            <Text variant="headingMd" as="h3">
                                                Order Total Limits
                                            </Text>

                                            <Box paddingBlockStart="300">
                                                <Checkbox
                                                    label="Enable order total limits"
                                                    checked={enableOrderTotal}
                                                    onChange={setEnableOrderTotal}
                                                />
                                            </Box>

                                            {enableOrderTotal && (
                                                <div className="order-total-fields">
                                                    <Box paddingBlockStart="300">
                                                        <div className="fields-row">
                                                            <div className="field-container">
                                                                <TextField
                                                                    autoComplete="off"
                                                                    label="Minimum order"
                                                                    value={minOrderTotal}
                                                                    onChange={setMinOrderTotal}
                                                                    prefix="$"
                                                                    type="number"
                                                                />
                                                            </div>
                                                            <div className="field-container">
                                                                <TextField
                                                                    autoComplete="off"
                                                                    label="Maximum order"
                                                                    value={maxOrderTotal}
                                                                    onChange={setMaxOrderTotal}
                                                                    prefix="$"
                                                                    type="number"
                                                                    placeholder="No limit"
                                                                />
                                                            </div>
                                                        </div>
                                                    </Box>
                                                </div>
                                            )}
                                        </Box>
                                    </div>
                                </Box>
                            </Card>
                        </div>
                    </Layout.Section>
                </Layout>

                {/* Products Selection Modal */}
                <Modal
                    open={showProductsModal}
                    onClose={() => setShowProductsModal(false)}
                    title="Select Products"
                    primaryAction={{
                        content: "Add Selected",
                        onAction: addSelectedProducts,
                        disabled: selectedProducts.length === 0
                    }}
                    secondaryActions={[
                        {
                            content: "Cancel",
                            onAction: () => setShowProductsModal(false)
                        }
                    ]}
                    size="large"
                >
                    <Modal.Section>
                        {loadingModal ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <Spinner size="large" />
                                <Text as="p" tone="subdued">Loading products...</Text>
                            </div>
                        ) : (
                            <ResourceList
                                resourceName={{ singular: 'product', plural: 'products' }}
                                items={products}
                                selectedItems={selectedProducts}
                                onSelectionChange={(selected) => {
                                    if (selected === 'All') {
                                        setSelectedProducts(products.map((p) => p.id));
                                    } else {
                                        setSelectedProducts(selected);
                                    }
                                }}
                                selectable
                                renderItem={(product) => {
                                    const { id, title, featuredImage } = product;
                                    const media = featuredImage ? (
                                        <Thumbnail
                                            source={featuredImage.url}
                                            alt={featuredImage.altText || title}
                                        />
                                    ) : undefined;

                                    return (
                                        <ResourceList.Item
                                            id={id}
                                            onClick={() => { }}
                                            media={media}
                                        >
                                            <Text variant="bodyMd" fontWeight="bold" as="h3">
                                                {title}
                                            </Text>
                                        </ResourceList.Item>
                                    );
                                }}
                            />
                        )}
                    </Modal.Section>
                </Modal>

                {/* Collections Selection Modal */}
                <Modal
                    open={showCollectionsModal}
                    onClose={() => setShowCollectionsModal(false)}
                    title="Select Collections"
                    primaryAction={{
                        content: "Add Selected",
                        onAction: addSelectedCollections,
                        disabled: selectedCollections.length === 0
                    }}
                    secondaryActions={[
                        {
                            content: "Cancel",
                            onAction: () => setShowCollectionsModal(false)
                        }
                    ]}
                    size="large"
                >
                    <Modal.Section>
                        {loadingModal ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <Spinner size="large" />
                                <Text as="p" tone="subdued">Loading collections...</Text>
                            </div>
                        ) : (
                            <ResourceList
                                resourceName={{ singular: 'collection', plural: 'collections' }}
                                items={collections}
                                selectedItems={selectedCollections}
                                onSelectionChange={(selected) => {
                                    if (selected === 'All') {
                                        setSelectedCollections(collections.map((c) => c.id));
                                    } else {
                                        setSelectedCollections(selected);
                                    }
                                }}
                                selectable
                                renderItem={(collection) => {
                                    const { id, title } = collection;

                                    return (
                                        <ResourceList.Item
                                            id={id}
                                            onClick={() => { }}
                                        >
                                            <Text variant="bodyMd" fontWeight="bold" as="h3">
                                                {title}
                                            </Text>
                                        </ResourceList.Item>
                                    );
                                }}
                            />
                        )}
                    </Modal.Section>
                </Modal>

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