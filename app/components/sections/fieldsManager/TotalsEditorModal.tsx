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
    InlineStack
} from "@shopify/polaris";
import { hsbToRgb } from "@shopify/polaris";
import { FormField } from "../../../types/formTypes";
import { hexToHsb, rgbToHsb } from "../utils/colorUtils";

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
                    <Text variant="headingMd" as="h3">TOTALS SUMMARY SETTINGS</Text>

                    <InlineGrid columns={2} gap="400">
                        <TextField
                            label="Subtotal Title"
                            value={totalsSettings.subtotalTitle}
                            onChange={(value) => setTotalsSettings((prev: any) => ({ ...prev, subtotalTitle: value }))}
                            autoComplete="off"
                        />
                        <TextField
                            label="Subtotal Value"
                            value={totalsSettings.subtotalValue}
                            onChange={(value) => setTotalsSettings((prev: any) => ({ ...prev, subtotalValue: value }))}
                            autoComplete="off"
                        />
                    </InlineGrid>

                    <InlineGrid columns={2} gap="400">
                        <TextField
                            label="Shipping Title"
                            value={totalsSettings.shippingTitle}
                            onChange={(value) => setTotalsSettings((prev: any) => ({ ...prev, shippingTitle: value }))}
                            autoComplete="off"
                        />
                        <TextField
                            label="Shipping Value"
                            value={totalsSettings.shippingValue}
                            onChange={(value) => setTotalsSettings((prev: any) => ({ ...prev, shippingValue: value }))}
                            autoComplete="off"
                        />
                    </InlineGrid>

                    <InlineGrid columns={2} gap="400">
                        <TextField
                            label="Discount Title"
                            value={totalsSettings.discountTitle}
                            onChange={(value) => setTotalsSettings((prev: any) => ({ ...prev, discountTitle: value }))}
                            autoComplete="off"
                        />
                        <TextField
                            label="Discount Value"
                            value={totalsSettings.discountValue}
                            onChange={(value) => setTotalsSettings((prev: any) => ({ ...prev, discountValue: value }))}
                            autoComplete="off"
                        />
                    </InlineGrid>

                    <InlineGrid columns={2} gap="400">
                        <TextField
                            label="Total Title"
                            value={totalsSettings.totalTitle}
                            onChange={(value) => setTotalsSettings((prev: any) => ({ ...prev, totalTitle: value }))}
                            autoComplete="off"
                        />
                        <TextField
                            label="Total Value"
                            value={totalsSettings.totalValue}
                            onChange={(value) => setTotalsSettings((prev: any) => ({ ...prev, totalValue: value }))}
                            autoComplete="off"
                        />
                    </InlineGrid>

                    <Checkbox
                        label="Show taxes message"
                        checked={totalsSettings.showTaxesMessage}
                        onChange={(value) => setTotalsSettings((prev: any) => ({ ...prev, showTaxesMessage: value }))}
                        helpText="Display a message about taxes and shipping calculated at checkout"
                    />

                    <Box paddingBlockStart="400">
                        <Text as="h3" variant="bodyMd" fontWeight="bold">Background Color</Text>

                        <ColorPicker
                            onChange={(color) => {
                                setTotalsColorState(color);
                                const rgb = hsbToRgb(color);
                                const newColor = `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 1)`;
                                setTotalsSettings((prev: any) => ({ ...prev, backgroundColor: newColor }));
                            }}
                            color={totalsColorState}
                        />

                        <Box padding="200" background="bg-surface-secondary" borderRadius="100" paddingBlockStart="300">
                            <div
                                style={{
                                    width: "100%",
                                    height: "40px",
                                    backgroundColor: totalsSettings.backgroundColor,
                                    borderRadius: "4px",
                                    border: "1px solid #E1E3E5",
                                    marginBottom: "8px"
                                }}
                            />
                            <TextField
                                label="Background color value"
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
                            />
                        </Box>
                    </Box>

                    {/* Preview */}
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
                </BlockStack>
            </Modal.Section>
        </Modal>
    );
} 