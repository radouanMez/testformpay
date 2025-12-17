import { Card, Box, BlockStack, Text, TextField, ColorPicker, hsbToRgb, Checkbox, Button, InlineStack, Select } from "@shopify/polaris";
import React, { useState } from "react";

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

  // ✅ استخدام قيم افتراضية آمنة
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

          {/* Form Style */}
          <Select
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

          {/* Text Color */}
          <Box>
            <Text as="h3" variant="bodyMd" fontWeight="bold">Text color</Text>
            <ColorPicker
              onChange={(color) => {
                setTextColorState(color);
                const rgb = hsbToRgb(color);
                handleChange("textColor", `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 1)`);
              }}
              color={textColorState}
            />
            <Box padding="200" background="bg-surface-secondary" borderRadius="100" paddingBlockStart="300">
              <TextField
                label="Text color value"
                value={safeStyle.textColor}
                onChange={(value) => {
                  handleChange("textColor", value);
                }}
                autoComplete="off"
              />
            </Box>
          </Box>

          {/* Font Size */}
          <TextField
            label="Font size"
            type="number"
            // ✅ إصلاح: استخدام القيم الآمنة
            value={safeStyle.textSize.toString()}
            onChange={(value) => handleChange("textSize", parseInt(value) || 14)}
            autoComplete="off"
            helpText="Base font size for all text in the form"
          />

          {/* Background Color */}
          <Box>
            <Text as="h3" variant="bodyMd" fontWeight="bold">Background color</Text>
            <ColorPicker
              onChange={(color) => {
                setBackgroundColorState(color);
                const rgb = hsbToRgb(color);
                handleChange("backgroundColor", `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 1)`);
              }}
              color={backgroundColorState}
            />
            <Box padding="200" background="bg-surface-secondary" borderRadius="100" paddingBlockStart="300">
              <TextField
                label=""
                value={safeStyle.backgroundColor}
                onChange={(value) => handleChange("backgroundColor", value)}
                autoComplete="off"
              />
            </Box>
            <Text as="p" variant="bodySm" tone="subdued">
              Important: changing the background color of your form could negatively affect your conversion rate.
            </Text>
          </Box>

          {/* Border Radius */}
          <TextField
            label="Border radius"
            type="number"
            // ✅ إصلاح: استخدام القيم الآمنة
            value={safeStyle.borderRadius.toString()}
            onChange={(value) => handleChange("borderRadius", parseInt(value) || 8)}
            autoComplete="off"
            helpText="Border radius in pixels"
          />

          {/* Border Width */}
          <TextField
            label="Border width"
            type="number"
            // ✅ إصلاح: استخدام القيم الآمنة
            value={safeStyle.borderWidth.toString()}
            onChange={(value) => handleChange("borderWidth", parseInt(value) || 1)}
            autoComplete="off"
            helpText="Border width in pixels"
          />

          {/* Border Color */}
          <Box>
            <Text as="h3" variant="bodyMd" fontWeight="bold">Border color</Text>
            <ColorPicker
              onChange={(color) => {
                setBorderColorState(color);
                const rgb = hsbToRgb(color);
                handleChange("borderColor", `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 1)`);
              }}
              color={borderColorState}
            />
            <Box padding="200" background="bg-surface-secondary" borderRadius="100" paddingBlockStart="300">
              <TextField
                label=""
                value={safeStyle.borderColor}
                onChange={(value) => handleChange("borderColor", value)}
                autoComplete="off"
              />
            </Box>
          </Box>

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