// src/components/form-designer/ButtonSettingsPanel.tsx
import React, { useState, useEffect } from "react";
import {
  Card,
  Box,
  BlockStack,
  Text,
  TextField,
  Select,
  InlineGrid,
  ColorPicker,
  Checkbox
} from "@shopify/polaris";
import { hsbToRgb } from "@shopify/polaris";
import { ButtonSettings } from "../../../types/formTypes";
import { hexToHsb, rgbToHsb } from "../utils/colorUtils";

interface ButtonSettingsPanelProps {
  settings: ButtonSettings;
  setSettings: (settings: ButtonSettings) => void;
}

export function ButtonSettingsPanel({ settings, setSettings }: ButtonSettingsPanelProps) {
  const [bgColorState, setBgColorState] = useState({
    hue: 0,
    saturation: 0,
    brightness: 0
  });

  const [textColorState, setTextColorState] = useState({
    hue: 0,
    saturation: 0,
    brightness: 0
  });

  const [borderColorState, setBorderColorState] = useState({
    hue: 0,
    saturation: 0,
    brightness: 0
  });

  // تهيئة ألوان ColorPicker
  useEffect(() => {
    if (settings.backgroundColor.startsWith('#')) {
      setBgColorState(hexToHsb(settings.backgroundColor));
    } else if (settings.backgroundColor.startsWith('rgb')) {
      setBgColorState(rgbToHsb(settings.backgroundColor));
    }

    if (settings.textColor.startsWith('#')) {
      setTextColorState(hexToHsb(settings.textColor));
    } else if (settings.textColor.startsWith('rgb')) {
      setTextColorState(rgbToHsb(settings.textColor));
    }

    if (settings.borderColor.startsWith('#')) {
      setBorderColorState(hexToHsb(settings.borderColor));
    } else if (settings.borderColor.startsWith('rgb')) {
      setBorderColorState(rgbToHsb(settings.borderColor));
    }
  }, []);

  const updateSetting = (key: keyof ButtonSettings, value: any) => {
    setSettings({
      ...settings,
      [key]: value
    });
  };

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <Text variant="headingLg" as="h2">Submit Button Settings</Text>

          <TextField
            label="Button text"
            value={settings.buttonText}
            onChange={(value) => updateSetting('buttonText', value)}
            autoComplete="off"
            helpText="Use {order_total} to dynamically insert the order total and {order_subtotal} to insert the order subtotal."
          />

          <TextField
            label="Button subtitle"
            value={settings.buttonSubtitle}
            onChange={(value) => updateSetting('buttonSubtitle', value)}
            autoComplete="off"
            helpText="Optional subtitle below the button"
          />

          <Select
            label="Button animation"
            options={[
              { label: 'None', value: 'none' },
              { label: 'Pulse', value: 'pulse' },
              { label: 'Bounce', value: 'bounce' },
              { label: 'Shake', value: 'shake' },
            ]}
            value={settings.buttonAnimation}
            onChange={(value) => updateSetting('buttonAnimation', value as any)}
          />

          <Select
            label="Button icon"
            options={[
              { label: 'None', value: '' },
              { label: 'Shopping Cart', value: 'cart' },
              { label: 'Bag', value: 'bag' },
              { label: 'Lock', value: 'Heart' },
              { label: 'Star', value: 'star' },
              { label: 'truck', value: 'Truck' },
            ]}
            value={settings.buttonIcon}
            onChange={(value) => updateSetting('buttonIcon', value)}
          />

          <InlineGrid columns={2} gap="400">
            <Box>
              <Text as="h3" variant="bodyMd" fontWeight="bold">Background Color</Text>
              <ColorPicker
                onChange={(color) => {
                  setBgColorState(color);
                  const rgb = hsbToRgb(color);
                  const newColor = `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 1)`;
                  updateSetting('backgroundColor', newColor);
                }}
                color={bgColorState}
              />
              <Box padding="200" background="bg-surface-secondary" borderRadius="100" paddingBlockStart="300">
                <div
                  style={{
                    width: "100%",
                    height: "40px",
                    backgroundColor: settings.backgroundColor,
                    borderRadius: "4px",
                    border: "1px solid #E1E3E5",
                    marginBottom: "8px"
                  }}
                />
                <TextField
                  label="Background color"
                  value={settings.backgroundColor}
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
              </Box>
            </Box>

            <Box>
              <Text as="h3" variant="bodyMd" fontWeight="bold">Text Color</Text>
              <ColorPicker
                onChange={(color) => {
                  setTextColorState(color);
                  const rgb = hsbToRgb(color);
                  const newColor = `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 1)`;
                  updateSetting('textColor', newColor);
                }}
                color={textColorState}
              />
              <Box padding="200" background="bg-surface-secondary" borderRadius="100" paddingBlockStart="300">
                <div
                  style={{
                    width: "100%",
                    height: "40px",
                    backgroundColor: settings.textColor,
                    borderRadius: "4px",
                    border: "1px solid #E1E3E5",
                    marginBottom: "8px"
                  }}
                />
                <TextField
                  label="Text color"
                  value={settings.textColor}
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
              </Box>
            </Box>
          </InlineGrid>

          <InlineGrid columns={3} gap="400">
            <TextField
              label="Font size"
              type="number"
              value={settings.fontSize.toString()}
              onChange={(value) => updateSetting('fontSize', parseInt(value) || 16)}
              autoComplete="off"
              helpText="px"
            />

            <TextField
              label="Border radius"
              type="number"
              value={settings.borderRadius.toString()}
              onChange={(value) => updateSetting('borderRadius', parseInt(value) || 8)}
              autoComplete="off"
              helpText="px"
            />

            <TextField
              label="Border width"
              type="number"
              value={settings.borderWidth.toString()}
              onChange={(value) => updateSetting('borderWidth', parseInt(value) || 1)}
              autoComplete="off"
              helpText="px"
            />
          </InlineGrid>

          <Box>
            <Text as="h3" variant="bodyMd" fontWeight="bold">Border Color</Text>
            <ColorPicker
              onChange={(color) => {
                setBorderColorState(color);
                const rgb = hsbToRgb(color);
                const newColor = `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 1)`;
                updateSetting('borderColor', newColor);
              }}
              color={borderColorState}
            />
            <Box padding="200" background="bg-surface-secondary" borderRadius="100" paddingBlockStart="300">
              <div
                style={{
                  width: "100%",
                  height: "40px",
                  backgroundColor: settings.borderColor,
                  borderRadius: "4px",
                  border: "1px solid #E1E3E5",
                  marginBottom: "8px"
                }}
              />
              <TextField
                label="Border color"
                value={settings.borderColor}
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
            </Box>
          </Box>

          <Checkbox
            label="Enable shadow"
            checked={settings.shadow}
            onChange={(value) => updateSetting('shadow', value)}
          />

          {/* Preview */}
          <Box padding="400" background="bg-surface-secondary" borderRadius="200">
            <Text variant="bodySm" tone="subdued" as="p">
              <strong>Button Preview:</strong>
            </Text>
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                style={{
                  backgroundColor: settings.backgroundColor,
                  color: settings.textColor,
                  fontSize: `${settings.fontSize}px`,
                  borderRadius: `${settings.borderRadius}px`,
                  border: `${settings.borderWidth}px solid ${settings.borderColor}`,
                  boxShadow: settings.shadow ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none',
                  padding: '12px 24px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  width: '100%',
                  marginBottom: '8px'
                }}
              >
                {settings.buttonIcon && <span style={{ marginRight: '8px' }}>{settings.buttonIcon}</span>}
                {settings.buttonText.replace(/\{order_total\}/g, '15.00 db').replace(/\{order_subtotal\}/g, '12.00 db')}
              </button>
              {settings.buttonSubtitle && (
                <Text as="p" variant="bodySm" tone="subdued">
                  {settings.buttonSubtitle}
                </Text>
              )}
            </div>
          </Box>
        </BlockStack>
      </Box>
    </Card>
  );
}