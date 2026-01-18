/* 
  OrdersPage.tsx
  - صفحة لعرض جميع الطلبات من قاعدة البيانات
  - يمكن تصفية الطلبات حسب الحالة (status)
  - عرض تفاصيل كل طلب مع إمكانية رؤية التفاصيل الكاملة
*/

import {
    Page,
    Card,
    Text,
    IndexTable,
    useIndexResourceState,
    Badge,
    EmptyState,
    SkeletonBodyText,
    SkeletonDisplayText,
    Button,
    Modal,
    TextContainer,
    InlineStack,
    Box,
    BlockStack,
    Icon,
    Select,
    TextField,
    DatePicker,
    LegacyCard,
    Divider,
    Frame,
} from "@shopify/polaris";
import {
    SearchIcon,
    FilterIcon,
    ViewIcon,
    // DownloadIcon,
} from "@shopify/polaris-icons";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";

// أنواع البيانات
interface OrderItem {
    id: string;
    title: string;
    quantity: number;
    price?: number;
    variantId?: string;
    productId?: string;
    upsellId?: string;
    product?: any;
}

interface CustomerData {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    province?: string;
    zipCode?: string;
}

interface TotalsData {
    subtotal: number;
    shipping: number;
    total: number;
    quantity?: number;
}

interface Order {
    id: string;
    orderNumber: string;
    shop: string;
    status: string;
    customerEmail?: string;
    customerPhone?: string;
    totalAmount?: number;
    clientIP?: string;
    createdAt: string;
    updatedAt: string;
    customer: CustomerData | null;
    shipping: any;
    items: OrderItem[];
    totals: TotalsData;
    discounts?: any[];
    coupons?: any[];
    upsells?: any[];
    metadata?: any;
    appliedUpsells?: any[];
    appliedDownsells?: any[];
    appliedQuantityOffers?: any[];
}

export default function OrdersPage() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFilter, setDateFilter] = useState<{ start: Date | null, end: Date | null }>({
        start: null,
        end: null
    });

    // أضف هذه داخل OrdersPage
    const [currentPage, setCurrentPage] = useState(1);
    const [paginationInfo, setPaginationInfo] = useState({
        hasNext: false,
        hasPrevious: false,
        totalPages: 1,
        totalCount: 0
    });

    const [totalGlobalRevenue, setTotalGlobalRevenue] = useState(0);

    // جلب الطلبات من API
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            // نرسل رقم الصفحة الحالية والحد (مثلاً 10 أو 20)
            const response = await fetch(`/api/orders?page=${currentPage}&limit=20`);
            const data = await response.json();

            if (data.success) {
                const ordersData = data.data.map((order: any) => {
                    const parseData = (field: any) => {
                        if (!field) return null;
                        if (typeof field === 'object') return field;
                        try { return JSON.parse(String(field)); } catch { return field; }
                    };

                    return {
                        ...order,
                        createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString(),
                        customer: parseData(order.customer),
                        items: parseData(order.items) || [],
                        totals: parseData(order.totals) || {},
                        shipping: parseData(order.shipping),
                    };
                });

                setOrders(ordersData);

                // تحديث معلومات الترقيم من الـ API
                setPaginationInfo({
                    hasNext: currentPage < data.pagination.pages,
                    hasPrevious: currentPage > 1,
                    totalPages: data.pagination.pages,
                    totalCount: data.pagination.total
                });

                setTotalGlobalRevenue(data.totalRevenue || 0);

            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    }, [currentPage]); // ملاحظة: يجب إضافة currentPage هنا ليعاد التحميل عند تغير الصفحة

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // تصفية الطلبات حسب الحالة والتاريخ والبحث
    const filteredOrders = orders.filter(order => {
        // تصفية حسب الحالة
        if (statusFilter !== "all" && order.status !== statusFilter) {
            return false;
        }

        // تصفية حسب البحث
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matches =
                order.orderNumber?.toLowerCase().includes(query) ||
                order.customerEmail?.toLowerCase().includes(query) ||
                order.customerPhone?.toLowerCase().includes(query) ||
                `${order.customer?.first_name} ${order.customer?.last_name}`.toLowerCase().includes(query) ||
                order.id.toLowerCase().includes(query);

            if (!matches) return false;
        }

        // تصفية حسب التاريخ
        if (dateFilter.start || dateFilter.end) {
            const orderDate = new Date(order.createdAt);

            if (dateFilter.start && orderDate < dateFilter.start) {
                return false;
            }

            if (dateFilter.end) {
                const endDate = new Date(dateFilter.end);
                endDate.setHours(23, 59, 59, 999);
                if (orderDate > endDate) {
                    return false;
                }
            }
        }

        return true;
    });

    // إعداد جدول الطلبات
    const {
        selectedResources,
        allResourcesSelected,
        handleSelectionChange,
    } = useIndexResourceState(
        filteredOrders.map(order => ({ id: order.id }))
    );

    const ordersTableRows = filteredOrders.map((order, index) => {
        // const customer = order.customer || {};
        const customer = order.customer || {};

        console.log('order customer data:', {
            order: order
        });

        const customerName = order.customer ?
            `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim()
            : 'No Name'

        const phone = order.customerPhone || customer.phone || 'No Phone';

        const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return {
            id: order.id,
            position: index,
            orderNumber: order.orderNumber || `N/A-${order.id.substring(0, 8)}`,
            customerName,
            phone,
            email: order.customerEmail || customer.email || 'No email',
            total: order.totalAmount
                ? `$${order.totalAmount.toFixed(2)}`
                : order.totals?.total
                    ? `$${order.totals.total.toFixed(2)}`
                    : '$0.00',
            date: orderDate,
            items: order.items?.length || 0,
            ip: order.clientIP || 'N/A'
        };
    });

    // معالجة عرض تفاصيل الطلب
    const handleViewOrderDetails = (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (order) {
            setSelectedOrder(order);
            setDetailModalOpen(true);
        }
    };

    // معالجة تصدير الطلبات
    const handleExportOrders = () => {
        const csvData = [
            ['Order ID', 'Order Number', 'Date', 'Customer', 'Email', 'Phone', 'Status', 'Total', 'Items'],
            ...filteredOrders.map(order => [
                order.id,
                order.orderNumber || '',
                new Date(order.createdAt).toLocaleDateString(),
                order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : '',
                order.customerEmail || order.customer?.email || '',
                order.customerPhone || order.customer?.phone || '',
                order.status,
                order.totalAmount ? `$${order.totalAmount.toFixed(2)}` : `$${order.totals?.total?.toFixed(2) || '0.00'}`,
                order.items?.length || 0
            ])
        ];

        const csvContent = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    // تنسيق التاريخ
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // حساب إحصائيات الطلبات
    const orderStats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        completed: orders.filter(o => o.status === 'completed' || o.status === 'paid').length,
        totalRevenue: orders.reduce((sum, order) =>
            sum + (order.totalAmount || order.totals?.total || 0), 0
        )
    };

    return (
        <Frame>
            <Page
                title="Orders"
                subtitle={`${orderStats.total} orders, $${orderStats.totalRevenue.toFixed(2)} total revenue`}
                primaryAction={{
                    content: "Export",
                    // icon: DownloadIcon,
                    onAction: handleExportOrders,
                }}
                secondaryActions={[
                    {
                        content: "Refresh",
                        onAction: fetchOrders,
                    },
                ]}
            >
                {/* بطاقات الإحصائيات */}
                <div style={{ marginBottom: '20px' }}>
                    <Box padding="200">
                        <InlineStack align="start" blockAlign="start" gap="400">
                            <div style={{ flex: 1 }}>
                                <LegacyCard>
                                    <div style={{ padding: "15px" }}>
                                        <Text variant="headingMd" as="h3">
                                            Total Orders
                                        </Text>
                                        <Text variant="headingLg" as="p">
                                            {paginationInfo.totalCount}
                                        </Text>
                                    </div>
                                </LegacyCard>
                            </div>
                            <div style={{ flex: 1 }}>
                                <LegacyCard>
                                    <div style={{ padding: "15px" }}>
                                        <Text variant="headingMd" as="h3">Total Revenue</Text>
                                        <Text variant="headingLg" as="p">
                                            ${totalGlobalRevenue.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </Text>
                                    </div>
                                </LegacyCard>
                            </div>
                            <div style={{ flex: 1 }}>
                                <LegacyCard>
                                    <div style={{ padding: "15px" }}>
                                        <Text variant="headingMd" as="h3">Total Revenue</Text>
                                        <Text variant="headingLg" as="p">
                                            ${orderStats.totalRevenue.toFixed(2)}
                                        </Text>
                                    </div>
                                </LegacyCard>
                            </div>
                            <div style={{ flex: 1 }}>
                                <LegacyCard>
                                    <div style={{ padding: "15px" }}>
                                        <Text variant="headingMd" as="h3">Total Revenue</Text>
                                        <Text variant="headingLg" as="p">
                                            ${orderStats.totalRevenue.toFixed(2)}
                                        </Text>
                                    </div>
                                </LegacyCard>
                            </div>
                        </InlineStack>
                    </Box>
                </div>

                {/* جدول الطلبات */}
                <Card>
                    {loading ? (
                        <Box padding="400">
                            <BlockStack gap="200">
                                {[...Array(5)].map((_, i) => (
                                    <SkeletonBodyText key={i} lines={1} />
                                ))}
                            </BlockStack>
                        </Box>
                    ) : filteredOrders.length === 0 ? (
                        <EmptyState
                            heading="No orders found"
                            action={{ content: 'Refresh', onAction: fetchOrders }}
                            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                        >
                            <p>No orders match your search criteria.</p>
                        </EmptyState>
                    ) : (
                        <IndexTable
                            resourceName={{ singular: 'order', plural: 'orders + All' }}
                            itemCount={filteredOrders.length}
                            selectedItemsCount={selectedResources.length}
                            onSelectionChange={handleSelectionChange}
                            headings={[
                                { title: 'Order' },
                                { title: 'Date' },
                                { title: 'Customer' },
                                { title: 'Total' },
                                { title: 'Items' },
                            ]}
                            hasZebraStriping
                            pagination={{
                                hasNext: paginationInfo.hasNext,
                                hasPrevious: paginationInfo.hasPrevious,
                                onNext: () => {
                                    setCurrentPage((prev) => prev + 1);
                                },
                                onPrevious: () => {
                                    setCurrentPage((prev) => prev - 1);
                                },
                            }}
                        >
                            {ordersTableRows.map((row, index) => (
                                <IndexTable.Row
                                    id={row.id}
                                    key={row.id}
                                    selected={selectedResources.includes(row.id)}
                                    position={index}
                                >
                                    <IndexTable.Cell>
                                        <Text variant="bodyMd" fontWeight="bold" as="span">
                                            {row.orderNumber}
                                        </Text>
                                        <br />
                                        <Text as="span">
                                            {row.date}
                                        </Text>
                                    </IndexTable.Cell>
                                    <IndexTable.Cell>
                                        <BlockStack gap="100">
                                            <Text variant="bodyMd" as="span">
                                                {row.customerName || 'No Name'}
                                            </Text>
                                            <Text variant="bodySm" as="span" tone="subdued">
                                                {row.phone || 'No Phone'}
                                            </Text>
                                        </BlockStack>
                                    </IndexTable.Cell>
                                    <IndexTable.Cell>
                                        <Text variant="bodyMd" fontWeight="bold" as="span">
                                            {row.total}
                                        </Text>
                                    </IndexTable.Cell>
                                    <IndexTable.Cell>{row.items} items</IndexTable.Cell>
                                    <IndexTable.Cell>
                                        <InlineStack gap="200">
                                            <Button
                                                size="slim"
                                                variant="tertiary"
                                                icon={ViewIcon}
                                                onClick={() => handleViewOrderDetails(row.id)}
                                            >
                                                
                                            </Button>
                                        </InlineStack>
                                    </IndexTable.Cell>
                                </IndexTable.Row>
                            ))}

                        </IndexTable>
                    )}
                </Card>

                {/* Modal تفاصيل الطلب */}
                {selectedOrder && (
                    <Modal
                        open={detailModalOpen}
                        onClose={() => setDetailModalOpen(false)}
                        title={`Order ${selectedOrder.orderNumber || selectedOrder.id}`}
                        primaryAction={{
                            content: 'Close',
                            onAction: () => setDetailModalOpen(false),
                        }}
                    // large
                    >
                        <Modal.Section>
                            <BlockStack gap="400">
                                {/* معلومات الطلب الأساسية */}
                                <LegacyCard sectioned>
                                    <BlockStack gap="200">

                                        <Grid grid={{ xs: 1, sm: 2, md: 2, lg: 4, xl: 4 }} gap="200">
                                            <Box>
                                                <Text variant="bodySm" as="p" tone="subdued">Order ID</Text>
                                                <Text variant="bodyMd" as="p">{selectedOrder.id}</Text>
                                            </Box>
                                            <Box>
                                                <Text variant="bodySm" as="p" tone="subdued">Order Number</Text>
                                                <Text variant="bodyMd" as="p">{selectedOrder.orderNumber || 'N/A'}</Text>
                                            </Box>
                                            <Box>
                                                <Text variant="bodySm" as="p" tone="subdued">Created At</Text>
                                                <Text variant="bodyMd" as="p">{formatDate(selectedOrder.createdAt)}</Text>
                                            </Box>
                                            <Box>
                                                <Text variant="bodySm" as="p" tone="subdued">Updated At</Text>
                                                <Text variant="bodyMd" as="p">{formatDate(selectedOrder.updatedAt)}</Text>
                                            </Box>
                                        </Grid>

                                        <Divider />

                                        <Grid grid={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 3 }} gap="200">
                                            <Box>
                                                <Text variant="bodySm" as="p" tone="subdued">Shop</Text>
                                                <Text variant="bodyMd" as="p">{selectedOrder.shop}</Text>
                                            </Box>
                                            <Box>
                                                <Text variant="bodySm" as="p" tone="subdued">Client IP</Text>
                                                <Text variant="bodyMd" as="p">{selectedOrder.clientIP || 'N/A'}</Text>
                                            </Box>
                                            <Box>
                                                <Text variant="bodySm" as="p" tone="subdued">Total Amount</Text>
                                                <Text variant="bodyMd" as="p" fontWeight="bold">
                                                    ${selectedOrder.totalAmount?.toFixed(2) || selectedOrder.totals?.total?.toFixed(2) || '0.00'}
                                                </Text>
                                            </Box>
                                        </Grid>
                                    </BlockStack>
                                </LegacyCard>

                                {/* معلومات العميل */}
                                <LegacyCard title="Customer Information" sectioned>
                                    <BlockStack gap="200">
                                        {selectedOrder.customer ? (
                                            <>
                                                <InlineStack align="space-between">
                                                    <Text variant="bodyMd" as="p" fontWeight="bold">
                                                        {selectedOrder.customer.first_name} {selectedOrder.customer.last_name}
                                                    </Text>
                                                    {selectedOrder.customerEmail && (
                                                        <Text variant="bodySm" as="p">{selectedOrder.customerEmail}</Text>
                                                    )}
                                                </InlineStack>

                                                <Grid grid={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 3 }} gap="200">
                                                    {selectedOrder.customer.email && (
                                                        <Box>
                                                            <Text variant="bodySm" as="p" tone="subdued">Email</Text>
                                                            <Text variant="bodyMd" as="p">{selectedOrder.customer.email}</Text>
                                                        </Box>
                                                    )}
                                                    {selectedOrder.customer.phone && (
                                                        <Box>
                                                            <Text variant="bodySm" as="p" tone="subdued">Phone</Text>
                                                            <Text variant="bodyMd" as="p">{selectedOrder.customer.phone}</Text>
                                                        </Box>
                                                    )}
                                                    {selectedOrder.customer.address && (
                                                        <Box>
                                                            <Text variant="bodySm" as="p" tone="subdued">Address</Text>
                                                            <Text variant="bodyMd" as="p">{selectedOrder.customer.address}</Text>
                                                        </Box>
                                                    )}
                                                    {selectedOrder.customer.city && (
                                                        <Box>
                                                            <Text variant="bodySm" as="p" tone="subdued">City</Text>
                                                            <Text variant="bodyMd" as="p">{selectedOrder.customer.city}</Text>
                                                        </Box>
                                                    )}
                                                    {selectedOrder.customer.province && (
                                                        <Box>
                                                            <Text variant="bodySm" as="p" tone="subdued">Province</Text>
                                                            <Text variant="bodyMd" as="p">{selectedOrder.customer.province}</Text>
                                                        </Box>
                                                    )}
                                                    {selectedOrder.customer.zipCode && (
                                                        <Box>
                                                            <Text variant="bodySm" as="p" tone="subdued">Zip Code</Text>
                                                            <Text variant="bodyMd" as="p">{selectedOrder.customer.zipCode}</Text>
                                                        </Box>
                                                    )}
                                                </Grid>
                                            </>
                                        ) : (
                                            <Text variant="bodyMd" as="p" tone="subdued">No customer information available</Text>
                                        )}
                                    </BlockStack>
                                </LegacyCard>

                                <LegacyCard title="Order Items" sectioned>
                                    <BlockStack gap="200">
                                        {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                            selectedOrder.items.map((item, index) => {
                                                console.log(`Processing item ${index}:`, item);

                                                // 1. التحقق من نوع العنصر
                                                const isUpsellItem = selectedOrder.upsells?.length != 0;
                                                console.log("isUpsellItem")
                                                console.log("isUpsellItem")
                                                console.log("isUpsellItem")
                                                console.log("********************************")
                                                console.log(selectedOrder.upsells)
                                                console.log(selectedOrder)
                                                console.log("********************************")
                                                console.log(isUpsellItem)
                                                // 2. معالجة العناصر العادية
                                                if (!item.upsellId && item.product) {
                                                    const product = item.product;
                                                    const variantId = item.variantId;

                                                    // البحث عن الـ variant المحدد
                                                    const selectedVariant = product?.variants?.find((v: any) =>
                                                        v.id == variantId || v.id.toString() === variantId?.toString()
                                                    );

                                                    // استخدام الصورة من المنتج أو الـ variant
                                                    const imageUrl = product?.featured_image ||
                                                        selectedVariant?.featured_image ||
                                                        product?.images?.[0];

                                                    // الحصول على السعر
                                                    let price = 0;
                                                    if (item.product.variants[0].price) {
                                                        price = item.product.variants[0].price;
                                                    }
                                                    else if (selectedVariant?.price) price = selectedVariant.price;
                                                    else if (product?.price_min) price = product.price_min;
                                                    else if (product?.price) price = product.price;

                                                    // اسم الـ variant
                                                    const variantTitle = selectedVariant?.title ||
                                                        selectedVariant?.name ||
                                                        'Default';

                                                    // اسم المنتج
                                                    const productTitle = product?.title || 'Product';

                                                    // الكمية
                                                    const quantity = item.quantity || 1;

                                                    return (
                                                        <div key={index} style={{ padding: '10px 0', borderBottom: '1px solid #f1f1f1' }}>
                                                            <InlineStack align="start" gap="200">
                                                                {/* الصورة */}
                                                                {imageUrl && (
                                                                    <div style={{
                                                                        width: '60px',
                                                                        height: '60px',
                                                                        borderRadius: '4px',
                                                                        overflow: 'hidden',
                                                                        flexShrink: 0
                                                                    }}>
                                                                        <img
                                                                            src={imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl}
                                                                            alt={productTitle}
                                                                            style={{
                                                                                width: '100%',
                                                                                height: '100%',
                                                                                objectFit: 'cover'
                                                                            }}
                                                                            onError={(e) => {
                                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                            }}
                                                                        />
                                                                    </div>
                                                                )}

                                                                {/* تفاصيل المنتج */}
                                                                <div style={{ flex: 1 }}>
                                                                    <InlineStack align="space-between">
                                                                        <div>
                                                                            <Text variant="bodyMd" as="p" fontWeight="bold">
                                                                                {productTitle}
                                                                            </Text>

                                                                            {variantTitle !== 'Default Title' && variantTitle !== 'Default' && (
                                                                                <Text variant="bodySm" as="p" tone="subdued">
                                                                                    Variant: {variantTitle}
                                                                                </Text>
                                                                            )}

                                                                            <Text variant="bodySm" as="p" tone="subdued">
                                                                                Qty: {quantity}
                                                                            </Text>
                                                                        </div>

                                                                        {/* السعر */}
                                                                        <Text variant="bodyMd" as="p" fontWeight="bold">
                                                                            ${((price / 100) * quantity).toFixed(2)}
                                                                        </Text>
                                                                    </InlineStack>

                                                                    {price > 0 && (
                                                                        <Text variant="bodySm" as="p" tone="subdued">
                                                                            ${(price / 100).toFixed(2)} each
                                                                        </Text>
                                                                    )}
                                                                </div>
                                                            </InlineStack>
                                                        </div>
                                                    );
                                                }

                                                // 3. معالجة عناصر الـ Upsell
                                                else if (item.upsellId) {
                                                    const upsellTitle = item.title || 'Upsell Product';
                                                    const price = (item?.price) || 0;
                                                    const quantity = item.quantity || 1;
                                                    const variantId = item.variantId;
                                                    const productId = item.productId;
                                                    const upsellId = item.upsellId;

                                                    return (
                                                        <div key={index} style={{
                                                            padding: '10px 0',
                                                        }}>
                                                            <InlineStack align="start" gap="200">
                                                                {/* تفاصيل الـ Upsell */}
                                                                <div style={{ flex: 1 }}>
                                                                    <InlineStack align="space-between">
                                                                        <div>
                                                                            <Text variant="bodyMd" as="p" fontWeight="bold">
                                                                                {upsellTitle}
                                                                            </Text>

                                                                            <InlineStack align="center">
                                                                                <Badge size="small" tone="success">
                                                                                    UPSELL
                                                                                </Badge>
                                                                            </InlineStack>

                                                                            <Text variant="bodySm" as="p" tone="subdued">
                                                                                Qty: {quantity}
                                                                            </Text>

                                                                            {variantId && (
                                                                                <Text variant="bodySm" as="p" tone="subdued">
                                                                                    Variant ID: {variantId}
                                                                                </Text>
                                                                            )}
                                                                        </div>

                                                                        {/* السعر */}
                                                                        <Text variant="bodyMd" as="p" fontWeight="bold" tone="success">
                                                                            ${((price * 100) * quantity).toFixed(2)}
                                                                        </Text>
                                                                    </InlineStack>

                                                                    {price > 0 && (
                                                                        <Text variant="bodySm" as="p" tone="subdued">
                                                                            ${(price * 100).toFixed(2)}
                                                                        </Text>
                                                                    )}
                                                                </div>
                                                            </InlineStack>
                                                        </div>
                                                    );
                                                }

                                                // 4. حالة العنصر غير المعروف
                                                else {
                                                    return (
                                                        <h3>
                                                            Upsell
                                                        </h3>
                                                    );
                                                }
                                            })
                                        ) : (
                                            <Text variant="bodyMd" as="p" tone="subdued">No items in this order</Text>
                                        )}
                                    </BlockStack>
                                </LegacyCard>

                                {/* الملخص المالي */}
                                <LegacyCard title="Order Summary" sectioned>
                                    <BlockStack gap="100">
                                        {selectedOrder.totals && (
                                            <>
                                                <InlineStack align="space-between">
                                                    <Text variant="bodyMd" as="p">Subtotal</Text>
                                                    <Text variant="bodyMd" as="p">
                                                        ${selectedOrder.totals.subtotal?.toFixed(2) || '0.00'}
                                                    </Text>
                                                </InlineStack>
                                                <InlineStack align="space-between">
                                                    <Text variant="bodyMd" as="p">Shipping</Text>
                                                    <Text variant="bodyMd" as="p">
                                                        ${selectedOrder.totals.shipping?.toFixed(2) || '0.00'}
                                                    </Text>
                                                </InlineStack>
                                                {selectedOrder.discounts && selectedOrder.discounts.length > 0 && (
                                                    <InlineStack align="space-between">
                                                        <Text variant="bodyMd" as="p" tone="success">Discounts</Text>
                                                        <Text variant="bodyMd" as="p" tone="success">
                                                            -${selectedOrder.discounts.reduce((sum, d) => sum + (d.amount || 0), 0).toFixed(2)}
                                                        </Text>
                                                    </InlineStack>
                                                )}
                                                <Divider />
                                                <InlineStack align="space-between">
                                                    <Text variant="headingMd" as="p" fontWeight="bold">Total</Text>
                                                    <Text variant="headingMd" as="p" fontWeight="bold">
                                                        ${selectedOrder.totals.total?.toFixed(2) || '0.00'}
                                                    </Text>
                                                </InlineStack>
                                            </>
                                        )}
                                    </BlockStack>
                                </LegacyCard>

                                {/* العروض الإضافية */}
                                {(selectedOrder.appliedUpsells?.length || selectedOrder.appliedDownsells?.length || selectedOrder.appliedQuantityOffers?.length) ? (
                                    <LegacyCard title="Applied Offers" sectioned>
                                        <BlockStack gap="200">
                                            {selectedOrder.appliedUpsells && selectedOrder.appliedUpsells.length > 0 && (
                                                <Box>
                                                    <Text variant="bodyMd" as="p" fontWeight="bold">Upsells</Text>
                                                    {selectedOrder.appliedUpsells.map((upsell, index) => (
                                                        <Text key={index} variant="bodySm" as="p" tone="subdued">
                                                            • {upsell.name || 'Upsell'} - {upsell.discount?.value || '0'} {upsell.discount?.type === 'PERCENTAGE' ? '%' : '$'}
                                                        </Text>
                                                    ))}
                                                </Box>
                                            )}

                                            {selectedOrder.appliedDownsells && selectedOrder.appliedDownsells.length > 0 && (
                                                <Box>
                                                    <Text variant="bodyMd" as="p" fontWeight="bold">Downsells</Text>
                                                    {selectedOrder.appliedDownsells.map((downsell, index) => (
                                                        <Text key={index} variant="bodySm" as="p" tone="subdued">
                                                            • {downsell.name || 'Downsell'} - {downsell.discount?.value || '0'} {downsell.discount?.type === 'PERCENTAGE' ? '%' : '$'}
                                                        </Text>
                                                    ))}
                                                </Box>
                                            )}

                                            {selectedOrder.appliedQuantityOffers && selectedOrder.appliedQuantityOffers.length > 0 && (
                                                <Box>
                                                    <Text variant="bodyMd" as="p" fontWeight="bold">Quantity Offers</Text>
                                                    {selectedOrder.appliedQuantityOffers.map((offer, index) => (
                                                        <Text key={index} variant="bodySm" as="p" tone="subdued">
                                                            • {offer.name || 'Quantity Offer'} - {offer.discountValue || '0'} {offer.discountType === 'PERCENTAGE' ? '%' : '$'}
                                                        </Text>
                                                    ))}
                                                </Box>
                                            )}
                                        </BlockStack>
                                    </LegacyCard>
                                ) : null}
                            </BlockStack>
                        </Modal.Section>
                    </Modal>
                )}
            </Page>
        </Frame >
    );
}

// Grid component helper
const Grid = ({ children, grid, gap = '0' }: any) => {
    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: grid ? `repeat(${Object.values(grid)[0] || 1}, 1fr)` : '1fr',
        gap: typeof gap === 'number' ? `${gap}px` : gap,
    };

    return <div style={gridStyle}>{children}</div>;
};