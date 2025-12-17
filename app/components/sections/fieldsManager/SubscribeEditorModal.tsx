// في sections/fieldsManager/SubscribeEditorModal.tsx
import React from "react";
import {
    Modal,
    TextField,
    Checkbox,
    BlockStack,
    Box,
    Text,
    ColorPicker,
    hsbToRgb
} from "@shopify/polaris";
import { FormField, SubscribeSettings } from "../../../types/formTypes";

interface SubscribeEditorModalProps {
    editingSubscribe: FormField | null;
    subscribeSettings: SubscribeSettings;
    setSubscribeSettings: (settings: SubscribeSettings) => void;
    subscribeColorState: any;
    setSubscribeColorState: (color: any) => void;
    onClose: () => void;
    onSave: () => void;
}

export function SubscribeEditorModal({
    editingSubscribe,
    subscribeSettings,
    setSubscribeSettings,
    subscribeColorState,
    setSubscribeColorState,
    onClose,
    onSave
}: SubscribeEditorModalProps) {
    if (!editingSubscribe) return null;

    const handleChange = (field: keyof SubscribeSettings, value: string | boolean) => {
        setSubscribeSettings({
            ...subscribeSettings,
            [field]: value
        });
    };

    return (
        <Modal
            open={true}
            onClose={onClose}
            title="Subscribe Settings"
            primaryAction={{
                content: "Save",
                onAction: onSave,
            }}
            secondaryActions={[
                {
                    content: "Cancel",
                    onAction: onClose,
                },
            ]}
            size="large"
        >
            <Modal.Section>
                <BlockStack gap="400">
                    <TextField
                        label="Subscribe Label"
                        value={subscribeSettings.label}
                        onChange={(value) => handleChange("label", value)}
                        autoComplete="off"
                        helpText="Main text for the subscribe checkbox"
                    />

                    <TextField
                        label="Description"
                        value={subscribeSettings.description}
                        onChange={(value) => handleChange("description", value)}
                        autoComplete="off"
                        multiline={3}
                        helpText="Additional description text"
                    />

                    <TextField
                        label="Privacy Text"
                        value={subscribeSettings.privacyText}
                        onChange={(value) => handleChange("privacyText", value)}
                        autoComplete="off"
                        helpText="Privacy policy agreement text"
                    />

                    <Checkbox
                        label="Checked by default"
                        checked={subscribeSettings.checkedByDefault}
                        onChange={(value) => handleChange("checkedByDefault", value)}
                        helpText="Subscribe checkbox will be pre-checked"
                    />

                    <Box>
                        <Text as="h3" variant="bodyMd" fontWeight="bold">Text Color</Text>
                        <ColorPicker
                            onChange={(color) => {
                                setSubscribeColorState(color);
                                const rgb = hsbToRgb(color);
                                handleChange("textColor", `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 1)`);
                            }}
                            color={subscribeColorState}
                        />
                    </Box>

                    <Box>
                        <Text as="h3" variant="bodyMd" fontWeight="bold">Background Color</Text>
                        <ColorPicker
                            onChange={(color) => {
                                const rgb = hsbToRgb(color);
                                handleChange("backgroundColor", `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 1)`);
                            }}
                            color={{ hue: 0, saturation: 0, brightness: 1 }}
                        />
                    </Box>

                    {/* Preview Section */}
                    <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                        <Text as="h3" variant="bodyMd" fontWeight="bold">Preview</Text>
                        <Box padding="300">
                            <div style={{
                                backgroundColor: subscribeSettings.backgroundColor,
                                color: subscribeSettings.textColor,
                                padding: '16px',
                                borderRadius: '8px',
                                border: '1px solid #e1e3e5'
                            }}>
                                <Checkbox
                                    label={subscribeSettings.label}
                                    checked={subscribeSettings.checkedByDefault}
                                    onChange={() => { }}
                                />
                                {subscribeSettings.description && (
                                    <Text as="p" variant="bodySm" tone="subdued">
                                        {subscribeSettings.description}
                                    </Text>
                                )}
                                {subscribeSettings.privacyText && (
                                    <Text as="p" variant="bodySm" tone="subdued">
                                        {subscribeSettings.privacyText}
                                    </Text>
                                )}
                            </div>
                        </Box>
                    </Box>
                </BlockStack>
            </Modal.Section>
        </Modal>
    );
}