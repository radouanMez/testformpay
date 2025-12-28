import { Card, Box, BlockStack, Text, TextField, ColorPicker, hsbToRgb, Checkbox, Button, InlineStack, Select } from "@shopify/polaris";
import React, { useState } from "react";
import { SmallColorPicker, colorToRgba, parseRgbaToColor } from "../../helpers/SmallColorPicker";

interface StyleSettings {
  primaryColor: string;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  textSize: number;
  shadow: boolean;
  stickyButton: boolean;
  mobileFullscreen: boolean;
  fontFamily: string;
  formStyle: string;
  hideCloseButton: boolean;
  hideFieldLabels: boolean;
  rtlSupport: boolean;
}

interface StylingSettingsProps {
  style: StyleSettings;
  setStyle: (updates: Partial<StyleSettings>) => void;
}

export function StylingSettings({ style, setStyle }: StylingSettingsProps) {
  const [textColorState, setTextColorState] = useState({ hue: 0, saturation: 0, brightness: 0 });
  const [backgroundColorState, setBackgroundColorState] = useState({ hue: 0, saturation: 0, brightness: 1 });
  const [borderColorState, setBorderColorState] = useState({ hue: 0, saturation: 0, brightness: 0 });

  const safeStyle = {
    textSize: style.textSize || 14,
    borderRadius: style.borderRadius || 8,
    borderWidth: style.borderWidth || 1,
    textColor: style.textColor || 'rgba(0,0,0,1)',
    backgroundColor: style.backgroundColor || 'rgba(255,255,255,1)',
    borderColor: style.borderColor || 'rgba(0,0,0,1)',
    shadow: style.shadow !== undefined ? style.shadow : true,
    stickyButton: style.stickyButton !== undefined ? style.stickyButton : true,
    mobileFullscreen: style.mobileFullscreen !== undefined ? style.mobileFullscreen : false,
    fontFamily: style.fontFamily || 'Inter, sans-serif',
    formStyle: style.formStyle || 'modern',
    hideCloseButton: style.hideCloseButton !== undefined ? style.hideCloseButton : false,
    hideFieldLabels: style.hideFieldLabels !== undefined ? style.hideFieldLabels : false,
    rtlSupport: style.rtlSupport !== undefined ? style.rtlSupport : false,
    primaryColor: style.primaryColor || '#008060'
  };

  const handleChange = (field: keyof StyleSettings, value: any) => {
    setStyle({ [field]: value });
  };

  const resetToDefault = () => {
    setStyle({
      primaryColor: '#008060',
      textColor: 'rgba(0,0,0,1)',
      backgroundColor: 'rgba(255,255,255,1)',
      borderColor: 'rgba(0,0,0,1)',
      borderWidth: 1,
      borderRadius: 8,
      textSize: 14,
      shadow: true,
      stickyButton: true,
      mobileFullscreen: false,
      fontFamily: 'Inter, sans-serif',
      formStyle: 'modern',
      hideCloseButton: false,
      hideFieldLabels: false,
      rtlSupport: false
    });
  };

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <InlineStack align="space-between" blockAlign="center">
            <Text variant="headingLg" as="h2">
              4. Styling Settings
            </Text>
            <Button variant="secondary" onClick={resetToDefault}>
              Reset to default
            </Button>
          </InlineStack>

          <BlockStack gap="400">
            <InlineStack align="start" blockAlign="start" gap="400">
              <div style={{ flex: 1 }}>
                {/* Form Style */}
                <Text as="h3" variant="bodyMd" fontWeight="bold">Form style</Text>
                <Select
                  labelHidden
                  label="Form style"
                  options={[
                    { label: 'Modern', value: 'modern' },
                    { label: 'Classic', value: 'classic' },
                    { label: 'Minimal', value: 'minimal' },
                    { label: 'Rounded', value: 'rounded' },
                  ]}
                  value={safeStyle.formStyle}
                  onChange={(value) => handleChange("formStyle", value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Text as="h3" variant="bodyMd" fontWeight="bold">Font size</Text>
                <TextField
                  label="Font size"
                  labelHidden
                  type="number"
                  suffix="px"
                  value={safeStyle.textSize.toString()}
                  onChange={(value) => handleChange("textSize", parseInt(value) || 14)}
                  autoComplete="off"
                  helpText="Base size for text"
                />
              </div>
            </InlineStack>
          </BlockStack>

          <BlockStack gap="400">
            <InlineStack align="start" blockAlign="start" gap="400">
              <div style={{ flex: 1 }}>
                <Text as="h3" variant="bodyMd" fontWeight="bold">Border radius</Text>
                <TextField
                  label="Border radius"
                  labelHidden
                  type="number"
                  suffix="px"
                  value={safeStyle.borderRadius.toString()}
                  onChange={(value) => handleChange("borderRadius", parseInt(value) || 0)}
                  autoComplete="off"
                  helpText="Radius in pixels"
                />
              </div>
              {/* Border Width */}
              <div style={{ flex: 1 }}>
                <Text as="h3" variant="bodyMd" fontWeight="bold">Border width</Text>
                <TextField
                  labelHidden
                  label="Border width"
                  type="number"
                  suffix="px"
                  value={safeStyle.borderWidth.toString()}
                  onChange={(value) => handleChange("borderWidth", parseInt(value) || 0)}
                  autoComplete="off"
                  helpText="Width in pixels"
                />
              </div>
            </InlineStack>
          </BlockStack>

          <BlockStack gap="400">
            <InlineStack align="start" blockAlign="start" gap="400">
              {/* Text Color */}
              <div style={{ flex: 1 }}>
                <Text as="h3" variant="bodyMd" fontWeight="bold">Text color</Text>
                <SmallColorPicker
                  label="Text Color"
                  color={textColorState}
                  onChange={(color) => {
                    setTextColorState(color);
                    const rgbaString = colorToRgba(color);
                    handleChange("textColor", rgbaString);
                  }}
                />
                <div style={{ flexGrow: 1, maxWidth: '200px' }}>
                  <TextField
                    label="Text color value"
                    labelHidden
                    value={safeStyle.textColor}
                    onChange={(value) => {
                      handleChange("textColor", value);
                      const parsed = parseRgbaToColor(value);
                      if (parsed) setTextColorState(parsed);
                    }}
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* القسم الثاني: Background Color */}
              <div style={{ flex: 1 }}>
                <Text as="h3" variant="bodyMd" fontWeight="bold">Background color</Text>
                <SmallColorPicker
                  label="Background Color"
                  color={backgroundColorState}
                  onChange={(color) => {
                    setBackgroundColorState(color);
                    const rgbaString = colorToRgba(color);
                    handleChange("backgroundColor", rgbaString);
                  }}
                />
                <div style={{ flexGrow: 1, maxWidth: '200px' }}>
                  <TextField
                    label="Background color value"
                    labelHidden
                    value={safeStyle.backgroundColor}
                    onChange={(value) => {
                      handleChange("backgroundColor", value);
                      const parsed = parseRgbaToColor(value);
                      if (parsed) setBackgroundColorState(parsed);
                    }}
                    autoComplete="off"
                  />
                </div>
                {/* <Box paddingBlockStart="100">
                    <Text as="p" variant="bodySm" tone="subdued">
                      <span style={{ color: '#D72C0D', fontWeight: 'bold' }}>Important:</span> changing the background color could negatively affect conversion.
                    </Text>
                  </Box> */}
              </div>

            </InlineStack>
          </BlockStack>

          {/* Border Color */}
          <BlockStack gap="400">
            <InlineStack align="start" blockAlign="start" gap="400">
              <div style={{ flex: 1 }}>
                <Text as="h3" variant="bodyMd" fontWeight="bold">Border color</Text>
                <SmallColorPicker
                  label="Border Color"
                  color={borderColorState}
                  onChange={(color) => {
                    setBorderColorState(color);
                    const rgbaString = colorToRgba(color);
                    handleChange("borderColor", rgbaString);
                  }}
                />

                <div style={{ flexGrow: 1, maxWidth: '200px' }}>
                  <TextField
                    label=""
                    labelHidden
                    value={safeStyle.borderColor}
                    onChange={(value) => {
                      handleChange("borderColor", value);
                      const parsed = parseRgbaToColor(value);
                      if (parsed) setBorderColorState(parsed);
                    }}
                    autoComplete="off"
                  />
                </div>
              </div>
            </InlineStack>
          </BlockStack>

          {/* Checkbox Settings */}
          <BlockStack gap="200">
            <Checkbox
              label="Shadow"
              checked={safeStyle.shadow}
              onChange={(value) => handleChange("shadow", value)}
              helpText="Add shadow effect to the form"
            />

            <Checkbox
              label="Hide close form button"
              checked={safeStyle.hideCloseButton}
              onChange={(value) => handleChange("hideCloseButton", value)}
              helpText="Hide the close button in popup forms"
            />

            <Checkbox
              label="Hide fields labels"
              checked={safeStyle.hideFieldLabels}
              onChange={(value) => handleChange("hideFieldLabels", value)}
              helpText="Hide labels above form fields (use placeholders only)"
            />

            <Checkbox
              label="Enable RTL support (for Arabic languages)"
              checked={safeStyle.rtlSupport}
              onChange={(value) => handleChange("rtlSupport", value)}
              helpText="Enable right-to-left text direction"
            />

            <Checkbox
              label="Sticky submit button"
              checked={safeStyle.stickyButton}
              onChange={(value) => handleChange("stickyButton", value)}
              helpText="Submit button stays visible while scrolling"
            />
          </BlockStack>
        </BlockStack>
      </Box>
    </Card>
  );
}