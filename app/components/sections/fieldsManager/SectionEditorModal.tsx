import React from "react";
import {
  Modal,
  BlockStack,
  Text,
  TextField,
  Select,
  ColorPicker,
  Box
} from "@shopify/polaris";
import { hsbToRgb } from "@shopify/polaris";
import { FormField } from "../../../types/formTypes";
import { hexToHsb, rgbToHsb } from "../utils/colorUtils";

interface SectionEditorModalProps {
  editingSection: FormField | null;
  sectionSettings: any;
  setSectionSettings: any;
  colorPickerState: any;
  setColorPickerState: any;
  onClose: () => void;
  onSave: () => void;
}

export function SectionEditorModal({
  editingSection,
  sectionSettings,
  setSectionSettings,
  colorPickerState,
  setColorPickerState,
  onClose,
  onSave
}: SectionEditorModalProps) {
  return (
    <Modal
      open={!!editingSection}
      onClose={onClose}
      title={`Customize ${editingSection?.label}`}
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
          <Text variant="headingMd" as="h3">CUSTOM TEXT SETTINGS</Text>

          <TextField
            label="Text"
            value={sectionSettings.customText}
            onChange={(value) => setSectionSettings((prev: any) => ({ ...prev, customText: value }))}
            multiline={3}
            autoComplete="off"
            helpText="Shortcodes: {order_total} to insert the order total, {product_name} to insert the product name"
          />

          <Select
            label="Alignment"
            options={[
              { label: 'Left', value: 'left' },
              { label: 'Center', value: 'center' },
              { label: 'Right', value: 'right' },
            ]}
            value={sectionSettings.alignment}
            onChange={(value) => setSectionSettings((prev: any) => ({ ...prev, alignment: value as any }))}
          />

          <TextField
            label="Font size"
            type="number"
            value={sectionSettings.fontSize.toString()}
            onChange={(value) => setSectionSettings((prev: any) => ({ ...prev, fontSize: parseInt(value) || 16 }))}
            autoComplete="off"
            helpText="Font size in pixels"
          />

          <Select
            label="Font weight"
            options={[
              { label: 'Normal', value: 'normal' },
              { label: 'Bold', value: 'bold' },
              { label: 'Bolder', value: 'bolder' },
            ]}
            value={sectionSettings.fontWeight}
            onChange={(value) => setSectionSettings((prev: any) => ({ ...prev, fontWeight: value as any }))}
          />

          <Box paddingBlockStart="400">
            <Text as="h3" variant="bodyMd" fontWeight="bold">Text color</Text>

            <ColorPicker
              onChange={(color) => {
                setColorPickerState(color);
                const rgb = hsbToRgb(color);
                const newColor = `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 1)`;
                setSectionSettings((prev: any) => ({ ...prev, textColor: newColor }));
              }}
              color={colorPickerState}
            />

            <Box padding="200" background="bg-surface-secondary" borderRadius="100" paddingBlockStart="300">
              <div
                style={{
                  width: "100%",
                  height: "40px",
                  backgroundColor: sectionSettings.textColor,
                  borderRadius: "4px",
                  border: "1px solid #E1E3E5",
                  marginBottom: "8px"
                }}
              />
              <TextField
                label="Text color value"
                value={sectionSettings.textColor}
                onChange={(value) => {
                  setSectionSettings((prev: any) => ({ ...prev, textColor: value }));
                  if (value.startsWith('#')) {
                    setColorPickerState(hexToHsb(value));
                  } else if (value.startsWith('rgb')) {
                    setColorPickerState(rgbToHsb(value));
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
              textAlign: sectionSettings.alignment,
              fontSize: `${sectionSettings.fontSize}px`,
              fontWeight: sectionSettings.fontWeight,
              color: sectionSettings.textColor,
              marginTop: '8px',
              padding: '8px',
              border: '1px dashed #E1E3E5'
            }}>
              {(sectionSettings.customText || '')
                .replace(/\{order_total\}/g, '15.00 db')
                .replace(/\{product_name\}/g, 'Product Name')}
            </div>
          </Box>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}