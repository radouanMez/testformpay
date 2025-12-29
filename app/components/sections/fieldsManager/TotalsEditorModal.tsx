import React from "react";
import {
    Modal,
    BlockStack,
    Text,
    TextField,
    Checkbox,
    InlineGrid,
    ColorPicker,
    Box,
    InlineStack,
    Grid
} from "@shopify/polaris";
import { hsbToRgb } from "@shopify/polaris";
import { FormField } from "../../../types/formTypes";
import { hexToHsb, rgbToHsb } from "../utils/colorUtils";
import { SmallColorPicker, colorToRgba, parseRgbaToColor } from "../../../helpers/SmallColorPicker";


interface TotalsEditorModalProps {
    editingTotals: FormField | null;
    totalsSettings: any;
    setTotalsSettings: any;
    totalsColorState: any;
    setTotalsColorState: any;
    onClose: () => void;
    onSave: () => void;
}

export function TotalsEditorModal({
    editingTotals,
    totalsSettings,
    setTotalsSettings,
    totalsColorState,
    setTotalsColorState,
    onClose,
    onSave
}: TotalsEditorModalProps) {
    return (
        <Modal
            open={!!editingTotals}
            onClose={onClose}
            title="Edit TOTALS SUMMARY"
            primaryAction={{
                content: 'Save changes',
                onAction: onSave,
            }}
            secondaryActions={[
                {
                    content: 'Cancel',
                    onAction: onClose,
                },
            ]}
            size="large"
        >
            <Modal.Section>
                <BlockStack gap="400">
                    <Grid>
                        <Grid.Cell columnSpan={{ xs: 6, lg: 7 }}>

                            {/* <Text variant="headingMd" as="h3">TOTALS SUMMARY SETTINGS</Text> */}

                            <InlineGrid columns={2} gap="400">
                                <div style={{ flex: 1, marginTop: '5px' }}>
                                    <Text as="h3" variant="bodyMd" fontWeight="bold">Subtotal Title</Text>
                                    <TextField
                                        label="Subtotal Title"
                                        labelHidden
                                        value={totalsSettings.subtotalTitle}
                                        onChange={(value) => setTotalsSettings((prev: any) => ({ ...prev, subtotalTitle: value }))}
                                        autoComplete="off"
                                    />
                                </div>
                                <div style={{ flex: 1, marginTop: '5px' }}>
                                    <Text as="h3" variant="bodyMd" fontWeight="bold">Subtotal Value</Text>
                                    <TextField
                                        label="Subtotal Value"
                                        labelHidden
                                        value={totalsSettings.subtotalValue}
                                        onChange={(value) => setTotalsSettings((prev: any) => ({ ...prev, subtotalValue: value }))}
                                        autoComplete="off"
                                    />
                                </div>
                            </InlineGrid>

                            <InlineGrid columns={2} gap="400">
                                <div style={{ flex: 1, marginTop: '5px' }}>
                                    <Text as="h3" variant="bodyMd" fontWeight="bold">Shipping Title</Text>
                                    <TextField
                                        label="Shipping Title"
                                        labelHidden
                                        value={totalsSettings.shippingTitle}
                                        onChange={(value) => setTotalsSettings((prev: any) => ({ ...prev, shippingTitle: value }))}
                                        autoComplete="off"
                                    />
                                </div>
                                 <div style={{ flex: 1, marginTop: '5px' }}>
                                    <Text as="h3" variant="bodyMd" fontWeight="bold">Shipping Value</Text>
                                    <TextField
                                        label="Shipping Value"
                                        labelHidden
                                        value={totalsSettings.shippingValue}
                                        onChange={(value) => setTotalsSettings((prev: any) => ({ ...prev, shippingValue: value }))}
                                        autoComplete="off"
                                    />
                                </div>
                            </InlineGrid>

                            <InlineGrid columns={2} gap="400">
                                 <div style={{ flex: 1, marginTop: '5px' }}>
                                    <Text as="h3" variant="bodyMd" fontWeight="bold">Discount Title</Text>
                                    <TextField  
                                        labelHidden
                                        label="Discount Title"
                                        value={totalsSettings.discountTitle}
                                        onChange={(value) => setTotalsSettings((prev: any) => ({ ...prev, discountTitle: value }))}
                                        autoComplete="off"
                                    />
                                </div>
                                 <div style={{ flex: 1, marginTop: '5px' }}>
                                    <Text as="h3" variant="bodyMd" fontWeight="bold">Discount Value</Text>
                                    <TextField
                                        labelHidden
                                        label="Discount Value"
                                        value={totalsSettings.discountValue}
                                        onChange={(value) => setTotalsSettings((prev: any) => ({ ...prev, discountValue: value }))}
                                        autoComplete="off"
                                    />
                                </div>
                            </InlineGrid>

                            <InlineGrid columns={2} gap="400">
                                 <div style={{ flex: 1, marginTop: '5px' }}>
                                    <Text as="h3" variant="bodyMd" fontWeight="bold">Total Title</Text>
                                    <TextField
                                        labelHidden
                                        label="Total Title"
                                        value={totalsSettings.totalTitle}
                                        onChange={(value) => setTotalsSettings((prev: any) => ({ ...prev, totalTitle: value }))}
                                        autoComplete="off"
                                    />
                                </div>
                                 <div style={{ flex: 1, marginTop: '5px' }}>
                                    <Text as="h3" variant="bodyMd" fontWeight="bold">Total Value</Text>
                                    <TextField
                                        label="Total Value"
                                        labelHidden
                                        value={totalsSettings.totalValue}
                                        onChange={(value) => setTotalsSettings((prev: any) => ({ ...prev, totalValue: value }))}
                                        autoComplete="off"
                                    />
                                </div>
                            </InlineGrid>

                            <Box paddingBlockStart="400">
                                <BlockStack gap="100">
                                    <Text as="h3" variant="bodyMd" fontWeight="bold">Background Color</Text>
                                    <InlineStack align="start" blockAlign="center" gap="200">
                                        <div style={{ flex: 1 }}>
                                            <SmallColorPicker
                                                label="Background Color"
                                                color={totalsColorState}
                                                onChange={(color) => {
                                                    setTotalsColorState(color);
                                                    const rgb = hsbToRgb(color);
                                                    const newColor = `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 1)`;
                                                    setTotalsSettings((prev: any) => ({ ...prev, backgroundColor: newColor }));
                                                }}
                                            />

                                            <div style={{ width: '50%', marginTop: '5px' }}>
                                                <TextField
                                                    label="Background color value"
                                                    labelHidden
                                                    value={totalsSettings.backgroundColor}
                                                    onChange={(value) => {
                                                        setTotalsSettings((prev: any) => ({ ...prev, backgroundColor: value }));
                                                        if (value.startsWith('#')) {
                                                            setTotalsColorState(hexToHsb(value));
                                                        } else if (value.startsWith('rgb')) {
                                                            setTotalsColorState(rgbToHsb(value));
                                                        }
                                                    }}
                                                    autoComplete="off"
                                                    prefix={
                                                        <div style={{
                                                            width: '20px',
                                                            height: '20px',
                                                            borderRadius: '2px',
                                                            backgroundColor: totalsSettings.backgroundColor,
                                                            border: '1px solid #dfe3e8'
                                                        }} />
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </InlineStack>
                                </BlockStack>
                            </Box>

                            <Checkbox
                                label="Show taxes message"
                                checked={totalsSettings.showTaxesMessage}
                                onChange={(value) => setTotalsSettings((prev: any) => ({ ...prev, showTaxesMessage: value }))}
                                helpText="Display a message about taxes and shipping calculated at checkout"
                            />

                        </Grid.Cell>
                        {/* Preview */}
                        <Grid.Cell columnSpan={{ xs: 6, lg: 5 }}>
                            <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                                <Text variant="bodySm" tone="subdued" as="p">
                                    <strong>Preview:</strong>
                                </Text>
                                <div style={{
                                    backgroundColor: totalsSettings.backgroundColor,
                                    padding: '16px',
                                    borderRadius: '8px',
                                    border: '1px dashed #E1E3E5',
                                    marginTop: '8px'
                                }}>
                                    <BlockStack gap="200">
                                        <InlineStack align="space-between">
                                            <Text as="span" variant="bodySm">{totalsSettings.subtotalTitle}</Text>
                                            <Text as="span" variant="bodySm" fontWeight="bold">{totalsSettings.subtotalValue}</Text>
                                        </InlineStack>
                                        <InlineStack align="space-between">
                                            <Text as="span" variant="bodySm">{totalsSettings.shippingTitle}</Text>
                                            <Text as="span" variant="bodySm" fontWeight="bold">{totalsSettings.shippingValue}</Text>
                                        </InlineStack>
                                        <InlineStack align="space-between">
                                            <Text as="span" variant="bodySm">{totalsSettings.discountTitle}</Text>
                                            <Text as="span" variant="bodySm" fontWeight="bold">{totalsSettings.discountValue}</Text>
                                        </InlineStack>
                                        <InlineStack align="space-between">
                                            <Text as="span" variant="bodyMd" fontWeight="bold">{totalsSettings.totalTitle}</Text>
                                            <Text as="span" variant="bodyMd" fontWeight="bold">{totalsSettings.totalValue}</Text>
                                        </InlineStack>
                                        {totalsSettings.showTaxesMessage && (
                                            <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                                                Taxes and shipping calculated at checkout
                                            </Text>
                                        )}
                                    </BlockStack>
                                </div>
                            </Box>
                        </Grid.Cell>
                    </Grid>
                </BlockStack>
            </Modal.Section>
        </Modal>
    );
} 