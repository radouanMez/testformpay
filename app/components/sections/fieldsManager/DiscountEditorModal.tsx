import React from "react";
import {
    Modal,
    BlockStack,
    Text,
    TextField,
    Checkbox,
    ColorPicker,
    Box,
    InlineStack,
    Grid
} from "@shopify/polaris";
import { hsbToRgb } from "@shopify/polaris";
import { FormField } from "../../../types/formTypes";
import { hexToHsb, rgbToHsb } from "../utils/colorUtils";

interface DiscountEditorModalProps {
    editingDiscount: FormField | null;
    discountSettings: any;
    setDiscountSettings: any;
    discountColorState: any;
    setDiscountColorState: any;
    onClose: () => void;
    onSave: () => void;
}

export function DiscountEditorModal({
    editingDiscount,
    discountSettings,
    setDiscountSettings,
    discountColorState,
    setDiscountColorState,
    onClose,
    onSave
}: DiscountEditorModalProps) {
    return (
        <Modal
            open={!!editingDiscount}
            onClose={onClose}
            title="Edit DISCOUNT CODES"
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

                            <Text variant="headingMd" as="h3">DISCOUNT CODES SETTINGS</Text>

                            <Checkbox
                                label="Limit to 1 discount code per order"
                                checked={discountSettings.limitOnePerOrder}
                                onChange={(value) => setDiscountSettings((prev: any) => ({ ...prev, limitOnePerOrder: value }))}
                            />

                            <TextField
                                label="Discounts line text"
                                value={discountSettings.discountsLineText}
                                onChange={(value) => setDiscountSettings((prev: any) => ({ ...prev, discountsLineText: value }))}
                                autoComplete="off"
                            />

                            <TextField
                                label="Discount code field label"
                                value={discountSettings.fieldLabel}
                                onChange={(value) => setDiscountSettings((prev: any) => ({ ...prev, fieldLabel: value }))}
                                autoComplete="off"
                            />

                            <TextField
                                label="Apply button text"
                                value={discountSettings.applyButtonText}
                                onChange={(value) => setDiscountSettings((prev: any) => ({ ...prev, applyButtonText: value }))}
                                autoComplete="off"
                            />

                            <Box paddingBlockStart="400">
                                <Text as="h3" variant="bodyMd" fontWeight="bold">Apply button background color</Text>
                                <ColorPicker
                                    onChange={(color) => {
                                        setDiscountColorState(color);
                                        const rgb = hsbToRgb(color);
                                        const newColor = `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 1)`;
                                        setDiscountSettings((prev: any) => ({ ...prev, buttonBackgroundColor: newColor }));
                                    }}
                                    color={discountColorState}
                                />
                                <Box padding="200" background="bg-surface-secondary" borderRadius="100" paddingBlockStart="300">
                                    <div
                                        style={{
                                            width: "100%",
                                            height: "40px",
                                            backgroundColor: discountSettings.buttonBackgroundColor,
                                            borderRadius: "4px",
                                            border: "1px solid #E1E3E5",
                                            marginBottom: "8px"
                                        }}
                                    />
                                    <TextField
                                        label="Background color value"
                                        value={discountSettings.buttonBackgroundColor}
                                        onChange={(value) => {
                                            setDiscountSettings((prev: any) => ({ ...prev, buttonBackgroundColor: value }));
                                            if (value.startsWith('#')) {
                                                setDiscountColorState(hexToHsb(value));
                                            } else if (value.startsWith('rgb')) {
                                                setDiscountColorState(rgbToHsb(value));
                                            }
                                        }}
                                        autoComplete="off"
                                    />
                                </Box>
                            </Box>

                            <TextField
                                label="Invalid discount code error text"
                                value={discountSettings.invalidCodeError}
                                onChange={(value) => setDiscountSettings((prev: any) => ({ ...prev, invalidCodeError: value }))}
                                multiline={3}
                                autoComplete="off"
                            />

                            <TextField
                                label="1 discount code allowed error text"
                                value={discountSettings.limitError}
                                onChange={(value) => setDiscountSettings((prev: any) => ({ ...prev, limitError: value }))}
                                multiline={3}
                                autoComplete="off"
                            />
                        </Grid.Cell>
                        {/* Preview */}
                        <Grid.Cell columnSpan={{ xs: 6, lg: 5 }}>
                            {/* Preview */}
                            <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                                <Text variant="bodySm" tone="subdued" as="p">
                                    <strong>Preview:</strong>
                                </Text>
                                <div style={{
                                    padding: '12px',
                                    border: '1px dashed #E1E3E5',
                                    marginTop: '8px'
                                }}>
                                    <BlockStack gap="200">
                                        <div
                                            style={{
                                                fontWeight: 'bold',
                                                marginBottom: '8px'
                                            }}
                                        >
                                            {discountSettings.discountsLineText}
                                        </div>
                                        <InlineStack gap="200" align="start">
                                            <Box width="75%">
                                                <TextField
                                                    label={discountSettings.fieldLabel}
                                                    value=""
                                                    onChange={() => { }}
                                                    autoComplete="off"
                                                />
                                            </Box>
                                            <Box width="20%">
                                                <button
                                                    type="button"
                                                    style={{
                                                        backgroundColor: discountSettings.buttonBackgroundColor,
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        padding: '10px 16px',
                                                        fontSize: '13px',
                                                        fontWeight: 'bold',
                                                        cursor: 'pointer',
                                                        width: '100%',
                                                        marginTop: '24px'
                                                    }}
                                                >
                                                    {discountSettings.applyButtonText}
                                                </button>
                                            </Box>
                                        </InlineStack>
                                    </BlockStack>
                                </div>
                            </Box>
                        </Grid.Cell>
                    </Grid>
                </BlockStack>
            </Modal.Section>
        </Modal >
    );
}