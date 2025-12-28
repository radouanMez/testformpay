import React from "react";
import {
    Modal,
    BlockStack,
    Text,
    TextField,
    Select,
    InlineGrid,
    ColorPicker,
    Checkbox,
    Box,
    InlineStack,
    Grid
} from "@shopify/polaris";
import { hsbToRgb } from "@shopify/polaris";
import { FormField } from "../../../types/formTypes";
import { hexToHsb, rgbToHsb } from "../utils/colorUtils";
import { SmallColorPicker, colorToRgba, parseRgbaToColor } from "../../../helpers/SmallColorPicker";


interface ButtonEditorModalProps {
    editingButton: FormField | null;
    buttonSettings: any;
    setButtonSettings: any;
    bgColorState: any;
    setBgColorState: any;
    textColorState: any;
    setTextColorState: any;
    borderColorState: any;
    setBorderColorState: any;
    onClose: () => void;
    onSave: () => void;
}

export function ButtonEditorModal({
    editingButton,
    buttonSettings,
    setButtonSettings,
    bgColorState,
    setBgColorState,
    textColorState,
    setTextColorState,
    borderColorState,
    setBorderColorState,
    onClose,
    onSave
}: ButtonEditorModalProps) {
    const updateSetting = (key: string, value: any) => {
        setButtonSettings((prev: any) => ({ ...prev, [key]: value }));
    };

    return (
        <Modal
            open={!!editingButton}
            onClose={onClose}
            title="Edit SUBMIT BUTTON"
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
                <Grid>
                    <Grid.Cell columnSpan={{ xs: 6, lg: 7 }}>

                        <Box padding="200">
                            <BlockStack gap="400">
                                <InlineStack align="start" blockAlign="start" gap="400">
                                    <div>
                                        <Text as="h3" variant="bodyMd" fontWeight="bold">Button text</Text>
                                        <TextField
                                            label="Button text"
                                            labelHidden
                                            value={buttonSettings.buttonText}
                                            onChange={(value) => updateSetting('buttonText', value)}
                                            autoComplete="off"
                                            helpText="Use {order_total} to dynamically insert the order total and {order_subtotal} to insert the order subtotal."
                                        />
                                    </div>
                                    <div style={{ width: "100%" }}>
                                        <Text as="h3" variant="bodyMd" fontWeight="bold">Button subtitle</Text>
                                        <TextField
                                            labelHidden
                                            label="Button subtitle"
                                            value={buttonSettings.buttonSubtitle}
                                            onChange={(value) => updateSetting('buttonSubtitle', value)}
                                            autoComplete="off"
                                            helpText="Optional subtitle below the button"
                                        />
                                    </div>
                                </InlineStack>
                            </BlockStack>
                        </Box>

                        <Box padding="200">
                            <BlockStack gap="400">
                                <InlineStack align="start" blockAlign="start" gap="400">
                                    <div style={{ flex: 1 }}>
                                        <Text as="h3" variant="bodyMd" fontWeight="bold">Button animation</Text>
                                        <Select
                                            labelHidden
                                            label="Button animation"
                                            options={[
                                                { label: 'None', value: 'none' },
                                                { label: 'Pulse', value: 'pulse' },
                                                { label: 'Bounce', value: 'bounce' },
                                                { label: 'Shake', value: 'shake' },
                                            ]}
                                            value={buttonSettings.buttonAnimation}
                                            onChange={(value) => updateSetting('buttonAnimation', value)}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <Text as="h3" variant="bodyMd" fontWeight="bold">Button icon</Text>
                                        <Select
                                            labelHidden
                                            label="Button icon"
                                            options={[
                                                { label: 'None', value: '' },
                                                { label: 'Shopping Cart', value: 'cart' },
                                                { label: 'Bag', value: 'bag' },
                                                { label: 'Lock', value: 'Heart' },
                                                { label: 'Star', value: 'star' },
                                                { label: 'truck', value: 'Truck' },
                                            ]}
                                            value={buttonSettings.buttonIcon}
                                            onChange={(value) => updateSetting('buttonIcon', value)}
                                        />
                                    </div>
                                </InlineStack>
                            </BlockStack>
                        </Box>

                        <Box padding="200">
                            <BlockStack gap="400">
                                <InlineStack align="start" blockAlign="start" gap="400">
                                    <div style={{ flex: 1 }}>
                                        <Text as="h3" variant="bodyMd" fontWeight="bold">Font size</Text>
                                        <TextField
                                            labelHidden
                                            label="Font size"
                                            type="number"
                                            value={buttonSettings.fontSize.toString()}
                                            onChange={(value) => updateSetting('fontSize', parseInt(value) || 16)}
                                            autoComplete="off"
                                            helpText="px"
                                        />

                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <Text as="h3" variant="bodyMd" fontWeight="bold">Border radius</Text>
                                        <TextField
                                            labelHidden
                                            label="Border radius"
                                            type="number"
                                            value={buttonSettings.borderRadius.toString()}
                                            onChange={(value) => updateSetting('borderRadius', parseInt(value) || 8)}
                                            autoComplete="off"
                                            helpText="px"
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <Text as="h3" variant="bodyMd" fontWeight="bold">Border width</Text>
                                        <TextField
                                            labelHidden
                                            label="Border width"
                                            type="number"
                                            value={buttonSettings.borderWidth.toString()}
                                            onChange={(value) => updateSetting('borderWidth', parseInt(value) || 1)}
                                            autoComplete="off"
                                            helpText="px"
                                        />
                                    </div>
                                </InlineStack>
                            </BlockStack>
                        </Box>

                        <Box padding="200">
                            <InlineStack align="start" blockAlign="start" gap="400">
                                {/* Background Color */}
                                <div style={{ flex: 1 }}>
                                    <Text as="h3" variant="bodyMd" fontWeight="bold">Background Color</Text>
                                    <SmallColorPicker
                                        label="Background Color"
                                        color={bgColorState}
                                        onChange={(color) => {
                                            setBgColorState(color);
                                            const rgb = hsbToRgb(color);
                                            const newColor = `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 1)`;
                                            updateSetting('backgroundColor', newColor);
                                        }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <TextField
                                            label="Background color"
                                            labelHidden
                                            value={buttonSettings.backgroundColor}
                                            onChange={(value) => {
                                                updateSetting('backgroundColor', value);
                                                if (value.startsWith('#')) {
                                                    setBgColorState(hexToHsb(value));
                                                } else if (value.startsWith('rgb')) {
                                                    setBgColorState(rgbToHsb(value));
                                                }
                                            }}
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>

                                {/* Text Color */}
                                <div style={{ flex: 1 }}>
                                    <Text as="h3" variant="bodyMd" fontWeight="bold">Text Color</Text>
                                    <SmallColorPicker
                                        label="Text Color"
                                        color={textColorState}
                                        onChange={(color) => {
                                            setTextColorState(color);
                                            const rgb = hsbToRgb(color);
                                            const newColor = `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 1)`;
                                            updateSetting('textColor', newColor);
                                        }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <TextField
                                            label="Text color"
                                            labelHidden
                                            value={buttonSettings.textColor}
                                            onChange={(value) => {
                                                updateSetting('textColor', value);
                                                if (value.startsWith('#')) {
                                                    setTextColorState(hexToHsb(value));
                                                } else if (value.startsWith('rgb')) {
                                                    setTextColorState(rgbToHsb(value));
                                                }
                                            }}
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>

                            </InlineStack>
                        </Box>

                        <Box padding="200">
                            <BlockStack gap="400">
                                <InlineStack align="start" blockAlign="start" gap="400">
                                    <div style={{ flex: 1 }}>
                                        <Text as="h3" variant="bodyMd" fontWeight="bold">Border Color</Text>
                                        <SmallColorPicker
                                            label="Border Color"
                                            color={borderColorState}
                                            onChange={(color) => {
                                                setBorderColorState(color);
                                                const rgb = hsbToRgb(color);
                                                const newColor = `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 1)`;
                                                updateSetting('borderColor', newColor);
                                            }}
                                        />
                                        <TextField
                                            label="Border color"
                                            labelHidden
                                            value={buttonSettings.borderColor}
                                            onChange={(value) => {
                                                updateSetting('borderColor', value);
                                                if (value.startsWith('#')) {
                                                    setBorderColorState(hexToHsb(value));
                                                } else if (value.startsWith('rgb')) {
                                                    setBorderColorState(rgbToHsb(value));
                                                }
                                            }}
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}></div>
                                </InlineStack>
                            </BlockStack>
                        </Box>

                        <Box padding="200">
                            <Checkbox
                                label="Enable shadow"
                                checked={buttonSettings.shadow}
                                onChange={(value) => updateSetting('shadow', value)}
                            />
                        </Box>

                    </Grid.Cell>
                    {/* Preview */}
                    <Grid.Cell columnSpan={{ xs: 6, lg: 5 }}>
                        <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                            <Text variant="bodySm" tone="subdued" as="p">
                                <strong>Button Preview:</strong>
                            </Text>
                            <div style={{ marginTop: '16px', textAlign: 'center' }}>
                                <button
                                    style={{
                                        backgroundColor: buttonSettings.backgroundColor,
                                        color: buttonSettings.textColor,
                                        fontSize: `${buttonSettings.fontSize}px`,
                                        borderRadius: `${buttonSettings.borderRadius}px`,
                                        border: `${buttonSettings.borderWidth}px solid ${buttonSettings.borderColor}`,
                                        boxShadow: buttonSettings.shadow ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none',
                                        padding: '12px 24px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        width: '100%',
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        textAlign: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '8px',
                                        animation: buttonSettings.buttonAnimation !== 'none' ?
                                            `${buttonSettings.buttonAnimation} 2s infinite` : 'none'
                                    }}
                                >
                                    {
                                        buttonSettings.buttonIcon && buttonSettings.buttonIcon !== 'none' &&
                                        <span style={{ display: 'flex', alignItems: 'center', marginRight: "10px" }}>
                                            {getIconSvg(buttonSettings.buttonIcon)}
                                        </span>
                                    }
                                    {buttonSettings.buttonText.replace(/\{order_total\}/g, '15.00 $').replace(/\{order_subtotal\}/g, '12.00 $')}
                                    {buttonSettings.buttonSubtitle && (
                                        <span
                                            style={{
                                                width: '100%',
                                                opacity: '0.8',
                                                fontSize: '11px',
                                            }}
                                        >
                                            {buttonSettings.buttonSubtitle}
                                        </span>
                                    )}
                                </button>

                            </div>
                        </Box>
                    </Grid.Cell>
                </Grid>
            </Modal.Section>
        </Modal>
    );
}


function getIconSvg(icon: string) {
    console.log(icon)
    switch (icon) {
        case 'cart':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="24" height="24" fill="currentColor">
                    <path d="M6.25 11.25a.75.75 0 0 0 0 1.5h2.75a.75.75 0 0 0 0-1.5h-2.75Z" />
                    <path fillRule="evenodd" d="M2.5 7.25a2.75 2.75 0 0 1 2.75-2.75h9.5a2.75 2.75 0 0 1 2.75 2.75v5.5a2.75 2.75 0 0 1-2.75 2.75h-9.5a2.75 2.75 0 0 1-2.75-2.75v-5.5Zm12.25-1.25c.69 0 1.25.56 1.25 1.25h-12c0-.69.56-1.25 1.25-1.25h9.5Zm1.25 3.25h-12v3.5c0 .69.56 1.25 1.25 1.25h9.5c.69 0 1.25-.56 1.25-1.25v-3.5Z" />
                </svg>
            );
        case 'star':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="24" height="24" fill="currentColor">
                    <path d="M11.128 4.123c-.453-.95-1.803-.95-2.256 0l-1.39 2.912-3.199.421c-1.042.138-1.46 1.422-.697 2.146l2.34 2.222-.587 3.172c-.192 1.034.901 1.828 1.825 1.327l2.836-1.54 2.836 1.54c.924.501 2.017-.293 1.825-1.327l-.587-3.172 2.34-2.222c.762-.724.345-2.008-.697-2.146l-3.2-.421-1.389-2.912Z" />
                </svg>
            );
        case 'truck':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="24" height="24" fill="currentColor">
                    <path fillRule="evenodd" d="M4 5.25a.75.75 0 0 1 .75-.75h6.991a2.75 2.75 0 0 1 2.645 1.995l.427 1.494a.25.25 0 0 0 .18.173l1.681.421a1.75 1.75 0 0 1 1.326 1.698v1.219a1.75 1.75 0 0 1-1.032 1.597 2.5 2.5 0 1 1-4.955.153h-3.025a2.5 2.5 0 1 1-4.78-.75h-.458a.75.75 0 0 1 0-1.5h2.5c.03 0 .06.002.088.005a2.493 2.493 0 0 1 1.947.745h4.43a2.493 2.493 0 0 1 1.785-.75c.698 0 1.33.286 1.783.748a.25.25 0 0 0 .217-.248v-1.22a.25.25 0 0 0-.19-.242l-1.682-.42a1.75 1.75 0 0 1-1.258-1.217l-.427-1.494a1.25 1.25 0 0 0-1.202-.907h-6.991a.75.75 0 0 1-.75-.75Zm2.5 9.25a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
                    <path d="M3.25 8a.75.75 0 0 0 0 1.5h5a.75.75 0 0 0 0-1.5h-5Z" />
                </svg>
            );
        case 'bag':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="24" height="24" fill="currentColor">
                    <path fillRule="evenodd" d="M2.5 3.75a.75.75 0 0 1 .75-.75h1.612a1.75 1.75 0 0 1 1.732 1.5h9.656a.75.75 0 0 1 .748.808l-.358 4.653a2.75 2.75 0 0 1-2.742 2.539h-6.351l.093.78a.25.25 0 0 0 .248.22h6.362a.75.75 0 0 1 0 1.5h-6.362a1.75 1.75 0 0 1-1.738-1.543l-1.04-8.737a.25.25 0 0 0-.248-.22h-1.612a.75.75 0 0 1-.75-.75Zm4.868 7.25h6.53a1.25 1.25 0 0 0 1.246-1.154l.296-3.846h-8.667l.595 5Z" />
                    <path d="M10 17a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
                    <path d="M15 17a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
                </svg>
            );
        case 'heart':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="24" height="24" fill="currentColor">
                    <path fill-rule="evenodd" d="M8.469 5.785c-.966-1.047-2.505-1.047-3.47 0-.998 1.081-.998 2.857 0 3.939l5.001 5.42 5.002-5.42c.997-1.082.997-2.858 0-3.939-.966-1.047-2.505-1.047-3.47 0l-.98 1.062a.75.75 0 0 1-1.103 0l-.98-1.062Zm-4.573-1.017c1.56-1.69 4.115-1.69 5.675 0l.429.464.429-.464c1.56-1.69 4.115-1.69 5.675 0 1.528 1.656 1.528 4.317 0 5.973l-5.185 5.62a1.25 1.25 0 0 1-1.838 0l-5.185-5.62c-1.528-1.656-1.528-4.317 0-5.973Z" />
                </svg>
            );
        default:
            return null;
    }
}
