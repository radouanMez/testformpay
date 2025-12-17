import React from "react";
import {
    Modal,
    BlockStack,
    Text,
    TextField,
    Checkbox,
    Box
} from "@shopify/polaris";
import { FormField } from "../../../types/formTypes";

interface ShippingEditorModalProps {
    editingShipping: FormField | null;
    shippingSettings: any;
    setShippingSettings: any;
    onClose: () => void;
    onSave: () => void;
}

export function ShippingEditorModal({
    editingShipping,
    shippingSettings,
    setShippingSettings,
    onClose,
    onSave
}: ShippingEditorModalProps) {
    return (
        <Modal
            open={!!editingShipping}
            onClose={onClose}
            title="Edit SHIPPING RATES"
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
                    <Text variant="headingMd" as="h3">SHIPPING RATES SETTINGS</Text>

                    <TextField
                        label="Title"
                        value={shippingSettings.title}
                        onChange={(value) => setShippingSettings((prev: any) => ({ ...prev, title: value }))}
                        autoComplete="off"
                        helpText="This will be displayed as the shipping section title"
                    />

                    <TextField
                        label="Free text (used if a shipping rate is free)"
                        value={shippingSettings.freeText}
                        onChange={(value) => setShippingSettings((prev: any) => ({ ...prev, freeText: value }))}
                        autoComplete="off"
                        helpText="This text will be shown when shipping is free"
                    />

                    <TextField
                        label="Font size"
                        type="number"
                        value={shippingSettings.fontSize.toString()}
                        onChange={(value) => setShippingSettings((prev: any) => ({ ...prev, fontSize: parseInt(value) || 16 }))}
                        autoComplete="off"
                        helpText="Font size in pixels"
                    />

                    {/* Preview */}
                    <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                        <Text variant="bodySm" tone="subdued" as="p">
                            <strong>Preview:</strong>
                        </Text>
                        <div className="shippingSectionFormino">
                            <BlockStack gap="200">
                                <div
                                    style={{
                                        fontSize: `${shippingSettings.fontSize}px`,
                                        fontWeight: 'bold',
                                        marginBottom: '8px'
                                    }}
                                >
                                    {shippingSettings.title}
                                </div>
                                <div className="ItemShippingFormino">
                                    <Checkbox
                                    label={`Free shipping`}
                                    checked={true}
                                    onChange={() => { }}
                                    />
                                    <span>
                                    {shippingSettings.freeText}
                                    </span>
                                </div>
                            </BlockStack>
                        </div>
                    </Box>
                </BlockStack>
            </Modal.Section>
        </Modal>
    );
}