import React from "react";
import { BlockStack, InlineStack, TextField, Box } from "@shopify/polaris";
import { DiscountSettings, FormConfig, PreviewData } from "../../../types/formTypes";

interface DiscountCodesProps {
  settings: DiscountSettings;
  formConfig: FormConfig;
  previewData: PreviewData;
  onUpdateData: (field: string, value: string) => void;
}

export function DiscountCodes({ settings, formConfig, previewData, onUpdateData }: DiscountCodesProps) {
  return (
    <BlockStack gap="200">
      {!formConfig.hideFieldLabels && (
        <div
          style={{
            fontWeight: 'bold',
            color: formConfig.textColor,
            fontFamily: formConfig.fontFamily,
            marginBottom: '8px'
          }}
        >
          {settings.discountsLineText}
        </div>
      )}
      <InlineStack gap="200" align="start">
        <Box width="75%">
          <TextField
            label={formConfig.hideFieldLabels ? undefined : settings.fieldLabel}
            placeholder={formConfig.hideFieldLabels ? settings.fieldLabel : undefined}
            value={previewData.discountCode}
            onChange={(value) => onUpdateData('discountCode', value)}
            autoComplete="off"
          />
        </Box>
        <Box width="20%">
          <button
            type="button"
            style={{
              backgroundColor: settings.buttonBackgroundColor,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              width: '100%',
              marginTop: formConfig.hideFieldLabels ? '0px' : '24px'
            }}
          >
            {settings.applyButtonText}
          </button>
        </Box>
      </InlineStack>
    </BlockStack>
  );
}