import React from "react";
import { BlockStack, Checkbox } from "@shopify/polaris";
import { ShippingSettings, FormConfig } from "../../../types/formTypes";

interface ShippingRatesProps {
  settings: ShippingSettings;
  formConfig: FormConfig;
}

export function ShippingRates({ settings, formConfig }: ShippingRatesProps) {
  // console.log(settings)
  return (
    <div className="shippingSectionFormino">
      <BlockStack gap="200">
        {settings.title && (
          <div
            style={{
              fontSize: `${settings.fontSize}px`,
              fontWeight: 'bold',
              color: formConfig.textColor,
              fontFamily: formConfig.fontFamily,
              marginBottom: '8px'
            }}
          >
            {settings.title}
          </div>
        )}
        <div className="ItemShippingFormino">
          <Checkbox
            label={`Free shipping`}
            checked={true}
            onChange={() => { }}
          />
          <span>
            {settings.freeText}
          </span>
        </div>

      </BlockStack>
    </div>
  );
} 