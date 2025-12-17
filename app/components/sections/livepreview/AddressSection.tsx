import React from "react";
import { BlockStack, Checkbox } from "@shopify/polaris";
import { SectionSettings, FormConfig } from "../../../types/formTypes";
import { InputFieldsRenderer } from "./InputFieldsRenderer";

interface AddressSectionProps {
  settings: SectionSettings;
  formConfig: FormConfig;
  previewData: any;
  subscribeChecked: boolean;
  onUpdateData: (field: string, value: string) => void;
  onSubscribeChange: (checked: boolean) => void;
}

export function AddressSection({
  settings,
  formConfig,
  previewData,
  subscribeChecked,
  onUpdateData,
  onSubscribeChange
}: AddressSectionProps) {
  const sectionStyle = {
    textAlign: settings.alignment,
    fontSize: `${settings.fontSize}px`,
    fontWeight: settings.fontWeight,
    color: settings.textColor,
    marginBottom: '16px',
    fontFamily: formConfig.fontFamily,
    lineHeight: '1.4'
  };

  console.log("settings")
  console.log(settings)
  console.log("formConfig")
  console.log(formConfig)
  console.log("subscribeChecked")
  console.log(subscribeChecked)
  
  return (
    <BlockStack gap="300">

      {/* {!formConfig.hideFieldLabels && (
        <div style={sectionStyle}>
          {settings.customText || ''
            .replace(/\{order_total\}/g, '15.00 $')
            .replace(/\{product_name\}/g, 'Product Name')
          }
        </div>
      )} */}
      
      <InputFieldsRenderer
        formConfig={formConfig}
        previewData={previewData}
        onUpdateData={onUpdateData}
      />

      {/* <Checkbox
        label="Subscribe to stay updated with new products and offers!"
        checked={subscribeChecked}
        onChange={onSubscribeChange}
      /> */}

    </BlockStack>
  );
}