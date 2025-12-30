import React from "react";
import {
  Modal,
  BlockStack,
  Text,
  TextField,
  Select,
  ColorPicker,
  Box,
  Grid,
  InlineStack,
} from "@shopify/polaris";
import { hsbToRgb } from "@shopify/polaris";
import { FormField } from "../../../types/formTypes";
import { hexToHsb, rgbToHsb } from "../utils/colorUtils";
import { SmallColorPicker, colorToRgba, parseRgbaToColor } from "../../../helpers/SmallColorPicker";


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

          <Grid>
            <Grid.Cell columnSpan={{ xs: 6, lg: 7 }}>

              {/* <Text variant="headingMd" as="h3">CUSTOM TEXT SETTINGS</Text> */}

              <Text variant="headingMd" as="h3">Title</Text>
              <TextField
                label="Title"
                labelHidden
                value={sectionSettings.customText}
                onChange={(value) => setSectionSettings((prev: any) => ({ ...prev, customText: value }))}
                multiline={3}
                autoComplete="off"
                helpText="Shortcodes: {order_total} to insert the order total, {product_name} to insert the product name"
              />

              <Box padding="200">
                <BlockStack gap="400">
                  <InlineStack align="start" blockAlign="start" gap="400">
                    <div style={{ flex: 1 }}>
                      <Text variant="headingMd" as="h3">Alignment</Text>
                      <Select
                        label="Alignment"
                        labelHidden
                        options={[
                          { label: 'Left', value: 'left' },
                          { label: 'Center', value: 'center' },
                          { label: 'Right', value: 'right' },
                        ]}
                        value={sectionSettings.alignment}
                        onChange={(value) => setSectionSettings((prev: any) => ({ ...prev, alignment: value as any }))}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Text variant="headingMd" as="h3">Font size</Text>
                      <TextField
                        label="Font size"
                        labelHidden
                        type="number"
                        value={sectionSettings.fontSize.toString()}
                        onChange={(value) => setSectionSettings((prev: any) => ({ ...prev, fontSize: parseInt(value) || 16 }))}
                        autoComplete="off"
                        helpText="Font size in pixels"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Text variant="headingMd" as="h3">Font weight</Text>
                      <Select
                        label="Font weight"
                        labelHidden
                        options={[
                          { label: 'Normal', value: 'normal' },
                          { label: 'Bold', value: 'bold' },
                          { label: 'Bolder', value: 'bolder' },
                        ]}
                        value={sectionSettings.fontWeight}
                        onChange={(value) => setSectionSettings((prev: any) => ({ ...prev, fontWeight: value as any }))}
                      />
                    </div>
                  </InlineStack>
                </BlockStack>
              </Box>

              <Box paddingBlockStart="400">
                <BlockStack gap="200">
                  <Text as="h3" variant="bodyMd" fontWeight="bold">Text Color</Text>

                  <InlineStack gap="200" align="start" blockAlign="center">
                    <div style={{ flex: 1 }}>
                      <SmallColorPicker
                        label="Text Color"
                        color={colorPickerState}
                        onChange={(color) => {
                          setColorPickerState(color);
                          const rgb = hsbToRgb(color);
                          const newColor = `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 1)`;
                          setSectionSettings((prev: any) => ({ ...prev, textColor: newColor }));
                        }}
                      />

                      <div style={{ width: '50%' }}>
                        <TextField
                          label="Text color value"
                          labelHidden
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
                      </div>
                    </div>
                  </InlineStack>
                </BlockStack>
              </Box>



            </Grid.Cell>
            {/* Preview */}
            <Grid.Cell columnSpan={{ xs: 6, lg: 5 }}>
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
                    .replace(/\{order_total\}/g, '15.00$')
                    .replace(/\{product_name\}/g, 'Product Name')}
                </div>
              </Box>
            </Grid.Cell>
          </Grid>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}