import React from "react";
import {
    Modal,
    BlockStack,
    Text,
    TextField,
    Checkbox,
    InlineStack,
    InlineGrid,
    Box
} from "@shopify/polaris";
import { FormField } from "../../../types/formTypes";

interface FieldEditorModalProps {
    editingField: FormField | null;
    fieldSettings: any;
    setFieldSettings: any;
    onClose: () => void;
    onSave: () => void;
}

export function FieldEditorModal({
    editingField,
    fieldSettings,
    setFieldSettings,
    onClose,
    onSave
}: FieldEditorModalProps) {
    return (
        <Modal
            open={!!editingField}
            onClose={onClose}
            title={`Edit ${editingField?.label} Field`}
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
                    <Text variant="headingMd" as="h3">{editingField?.label} FIELD</Text>

                    <TextField
                        label="Display Label (Shown in Form)"
                        value={fieldSettings.displayLabel}
                        onChange={(value) => setFieldSettings((prev: any) => ({ ...prev, displayLabel: value }))}
                        autoComplete="off"
                        helpText="This label will be shown in the form preview. The original label will remain in the fields list."
                    />

                    <TextField
                        label="Placeholder"
                        value={fieldSettings.placeholder}
                        onChange={(value) => setFieldSettings((prev: any) => ({ ...prev, placeholder: value }))}
                        autoComplete="off"
                    />

                    <InlineStack gap="400">
                        <Checkbox
                            label="Show field icon"
                            checked={fieldSettings.showIcon}
                            onChange={(value) => setFieldSettings((prev: any) => ({ ...prev, showIcon: value }))}
                        />
                        <Checkbox
                            label="Required"
                            checked={fieldSettings.required}
                            onChange={(value) => setFieldSettings((prev: any) => ({ ...prev, required: value }))}
                        />
                    </InlineStack>

                    <InlineGrid columns={2} gap="400">
                        <TextField
                            label="Min length"
                            type="number"
                            value={fieldSettings.minLength.toString()}
                            onChange={(value) => setFieldSettings((prev: any) => ({ ...prev, minLength: parseInt(value) || 2 }))}
                            autoComplete="off"
                        />
                        <TextField
                            label="Max length"
                            type="number"
                            value={fieldSettings.maxLength.toString()}
                            onChange={(value) => setFieldSettings((prev: any) => ({ ...prev, maxLength: parseInt(value) || 250 }))}
                            autoComplete="off"
                        />
                    </InlineGrid>

                    <TextField
                        label="Invalid value error text"
                        value={fieldSettings.errorText}
                        onChange={(value) => setFieldSettings((prev: any) => ({ ...prev, errorText: value }))}
                        multiline={3}
                        autoComplete="off"
                        helpText="If you leave this field empty the app will use your Invalid generic field error text if the customer enters an invalid value."
                    />

                    <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                        <Text variant="bodySm" tone="subdued" as="p">
                            <strong>Original Label:</strong> {editingField?.label}
                        </Text>
                        <Text variant="bodySm" tone="subdued" as="p">
                            <strong>Display Label:</strong> {fieldSettings.displayLabel || editingField?.label}
                        </Text>
                        <Text variant="bodySm" tone="subdued" as="p">
                            <strong>Placeholder:</strong> {fieldSettings.placeholder || fieldSettings.displayLabel || editingField?.label}
                        </Text>
                        {fieldSettings.showIcon && (
                            <Text variant="bodySm" tone="subdued" as="p">
                                <strong>Icon:</strong> 🔍 (Search icon will appear)
                            </Text>
                        )}
                    </Box>
                </BlockStack>
            </Modal.Section>
        </Modal>
    );
}