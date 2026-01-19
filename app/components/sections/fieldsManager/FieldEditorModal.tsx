import React from "react";
import {
    Modal,
    BlockStack,
    Text,
    TextField,
    Checkbox,
    InlineStack,
    InlineGrid,
    Box,
    Grid
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
                    <Grid>
                        <Grid.Cell columnSpan={{ xs: 6, lg: 7 }}>
                            {/* {editingField?.label} */}
                            <BlockStack gap="400">
                                <InlineStack align="start" blockAlign="start" gap="400">
                                    <div style={{ flex: 1 }}>
                                        <Text variant="headingMd" as="h3">Label</Text>
                                        <TextField
                                            labelHidden
                                            label="Label (Shown in Form)"
                                            value={fieldSettings.label}
                                            onChange={(value) => setFieldSettings((prev: any) => ({ ...prev, label: value }))}
                                            autoComplete="off"
                                        />
                                    </div>
                                </InlineStack>
                            </BlockStack>

                            <BlockStack gap="400">
                                <InlineStack align="start" blockAlign="start" gap="400">
                                    <div style={{ flex: 1 }}>
                                        <Text variant="headingMd" as="h3">Display Label (Shown in Form)</Text>
                                        <TextField
                                            labelHidden
                                            label="Display Label (Shown in Form)"
                                            value={fieldSettings.displayLabel}
                                            onChange={(value) => setFieldSettings((prev: any) => ({ ...prev, displayLabel: value }))}
                                            autoComplete="off"
                                            helpText="This label will be shown in the form preview. The original label will remain in the fields list."
                                        />
                                    </div>
                                </InlineStack>
                            </BlockStack>

                            <BlockStack gap="400">
                                <InlineStack align="start" blockAlign="start" gap="400">
                                    <div style={{ flex: 1 }}>
                                        <Text variant="headingMd" as="h3">Placeholder</Text>
                                        <TextField
                                            labelHidden
                                            label="Placeholder"
                                            value={fieldSettings.placeholder}
                                            onChange={(value) => setFieldSettings((prev: any) => ({ ...prev, placeholder: value }))}
                                            autoComplete="off"
                                        />
                                    </div>
                                </InlineStack>
                            </BlockStack>

                            <BlockStack gap="400">
                                <InlineStack align="start" blockAlign="start" gap="400">
                                    <div style={{ flex: 1 }}>
                                        <Checkbox
                                            label="Show field icon"
                                            checked={fieldSettings.showIcon}
                                            onChange={(value) => setFieldSettings((prev: any) => ({ ...prev, showIcon: value }))}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <Checkbox
                                            label="Required"
                                            checked={fieldSettings.required}
                                            onChange={(value) => setFieldSettings((prev: any) => ({ ...prev, required: value }))}
                                        />
                                    </div>
                                </InlineStack>
                            </BlockStack>

                            <BlockStack gap="400">
                                <InlineStack align="start" blockAlign="start" gap="400">
                                    <div style={{ flex: 1 }}>
                                        <TextField
                                            label="Min length"
                                            type="number"
                                            value={fieldSettings.minLength.toString()}
                                            onChange={(value) => setFieldSettings((prev: any) => ({ ...prev, minLength: parseInt(value) || 2 }))}
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <TextField
                                            label="Max length"
                                            type="number"
                                            value={fieldSettings.maxLength.toString()}
                                            onChange={(value) => setFieldSettings((prev: any) => ({ ...prev, maxLength: parseInt(value) || 250 }))}
                                            autoComplete="off"
                                        />
                                    </div>
                                </InlineStack>
                            </BlockStack>

                            <TextField
                                label="Invalid value error text"
                                value={fieldSettings.errorText}
                                onChange={(value) => setFieldSettings((prev: any) => ({ ...prev, errorText: value }))}
                                multiline={3}
                                autoComplete="off"
                                helpText="If you leave this field empty the app will use your Invalid generic field error text if the customer enters an invalid value."
                            />

                        </Grid.Cell>
                        {/* Preview */}
                        <Grid.Cell columnSpan={{ xs: 6, lg: 5 }}>
                            <Box
                                padding="400"
                                background="bg-surface-secondary"
                                borderRadius="200"
                                borderWidth="025"
                            >
                                <BlockStack gap="200">
                                    <Text variant="headingSm" as="h3" tone="subdued">Live Preview</Text>

                                    <div className="inputPreview">
                                        <TextField
                                            label={fieldSettings.displayLabel || editingField?.label}
                                            placeholder={fieldSettings.placeholder}
                                            prefix={fieldSettings.showIcon ? getIconForField(editingField?.label || "") : undefined}
                                            helpText={fieldSettings.errorText}
                                            value=""
                                            onChange={() => { }}
                                            autoComplete="off"
                                        />
                                    </div>

                                    <Box paddingBlockStart="200">
                                        <Text as="span" variant="bodyXs" tone="subdued">
                                            Character limit: {fieldSettings.minLength} - {fieldSettings.maxLength}
                                        </Text>
                                    </Box>
                                </BlockStack>
                            </Box>
                        </Grid.Cell>
                    </Grid>
                </BlockStack>
            </Modal.Section>
        </Modal>
    );
}


const getIconForField = (fieldName: string) => {
    fieldName = fieldName.toLowerCase().replace(/\s+/g, '');
    switch (fieldName) {
        case "lastname":
        case "firstname":
        case "firstName":
        case "lastName":
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="22" height="22">
                    <path fill-rule="evenodd" d="M7 8.25a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm3-1.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
                    <path fill-rule="evenodd" d="M15.168 15.435a7.5 7.5 0 1 1-10.336-10.87 7.5 7.5 0 0 1 10.336 10.87Zm-9.83-1.659a6 6 0 1 1 9.326 0 7.03 7.03 0 0 0-4.664-1.776 7.03 7.03 0 0 0-4.663 1.776Zm1.086 1.043a5.973 5.973 0 0 0 3.576 1.181c1.34 0 2.577-.44 3.576-1.181a5.53 5.53 0 0 0-3.576-1.319 5.53 5.53 0 0 0-3.576 1.319Z" />
                </svg>
            );

        case "province":
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="22" height="22">
                    <path fill-rule="evenodd" d="M14.239 4.379a.75.75 0 1 0-1.478-.257l-.457 2.628h-3.478l.413-2.371a.75.75 0 0 0-1.478-.257l-.457 2.628h-2.804a.75.75 0 0 0 0 1.5h2.543l-.609 3.5h-2.434a.75.75 0 0 0 0 1.5h2.174l-.413 2.372a.75.75 0 1 0 1.478.257l.457-2.629h3.478l-.413 2.372a.75.75 0 1 0 1.478.257l.457-2.629h2.804a.75.75 0 0 0 0-1.5h-2.543l.609-3.5h2.434a.75.75 0 0 0 0-1.5h-2.174l.413-2.371Zm-6.282 7.371h3.477l.61-3.5h-3.478l-.61 3.5Z" />
                </svg>
            );

        case "zipcode":
        case "address":
        case "address2":
        case "city":
        case "zipCode":
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="22" height="22">
                    <path fillRule="evenodd" d="M14.25 16h-3.077l.07-.061a17.427 17.427 0 0 0 1.707-1.758c1.224-1.46 2.55-3.574 2.55-5.954 0-3.167-2.328-5.477-5.5-5.477s-5.5 2.31-5.5 5.477c0 2.38 1.326 4.495 2.55 5.954a17.426 17.426 0 0 0 1.708 1.758l.069.061h-3.077a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5Zm-4.25-5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                </svg>
            );

        case "phonenumber":
        case "phone":
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="22" height="22">
                    <path d="M7.75 13.75a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.75-.75Z" />
                    <path fillRule="evenodd" d="M4.75 5.75a2.75 2.75 0 0 1 2.75-2.75h5a2.75 2.75 0 0 1 2.75 2.75v8.5a2.75 2.75 0 0 1-2.75 2.75h-5a2.75 2.75 0 0 1-2.75-2.75v-8.5Zm2.75-1.25c-.69 0-1.25.56-1.25 1.25v8.5c0 .69.56 1.25 1.25 1.25h5c.69 0 1.25-.56 1.25-1.25v-8.5c0-.69-.56-1.25-1.25-1.25h-.531a1 1 0 0 1-.969.75h-2a1 1 0 0 1-.969-.75h-.531Z" />
                </svg>
            );

        case "email":
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="22" height="22">
                    <path fill-rule="evenodd" d="M5.75 4.5c-1.519 0-2.75 1.231-2.75 2.75v5.5c0 1.519 1.231 2.75 2.75 2.75h8.5c1.519 0 2.75-1.231 2.75-2.75v-5.5c0-1.519-1.231-2.75-2.75-2.75h-8.5Zm-1.25 2.75c0-.69.56-1.25 1.25-1.25h8.5c.69 0 1.25.56 1.25 1.25v5.5c0 .69-.56 1.25-1.25 1.25h-8.5c-.69 0-1.25-.56-1.25-1.25v-5.5Zm2.067.32c-.375-.175-.821-.013-.997.363-.175.375-.013.821.363.997l3.538 1.651c.335.156.723.156 1.058 0l3.538-1.651c.376-.176.538-.622.363-.997-.175-.376-.622-.538-.997-.363l-3.433 1.602-3.433-1.602Z" />
                </svg>
            );

        default:
            return undefined;
    }
};