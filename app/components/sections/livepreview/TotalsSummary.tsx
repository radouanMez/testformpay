import React from "react";
import { BlockStack, InlineStack, Text } from "@shopify/polaris";
import { TotalSettings } from "../../../types/formTypes";

interface TotalsSummaryProps {
  settings: TotalSettings;
}

export function TotalsSummary({ settings }: TotalsSummaryProps) {
  return (
    <div style={{
      backgroundColor: settings.backgroundColor,
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '16px'
    }}>
      <BlockStack gap="200">
        <InlineStack align="space-between">
          <Text as="span" variant="bodySm">{settings.subtotalTitle}</Text>
          <Text as="span" variant="bodySm" fontWeight="bold">{settings.subtotalValue}</Text>
        </InlineStack>
        <InlineStack align="space-between">
          <Text as="span" variant="bodySm">{settings.shippingTitle}</Text>
          <Text as="span" variant="bodySm" fontWeight="bold">{settings.shippingValue}</Text>
        </InlineStack>
        <div className="border-total-summary-formino"></div>
        <InlineStack align="space-between">
          <Text as="span" variant="bodyMd" fontWeight="bold">{settings.totalTitle}</Text>
          <Text as="span" variant="bodyMd" fontWeight="bold">{settings.totalValue}</Text>
        </InlineStack>
        {settings.showTaxesMessage && (
          <Text as="p" variant="bodySm" tone="subdued" alignment="center">
            Taxes and shipping calculated at checkout
          </Text>
        )}
      </BlockStack>
    </div>
  );
}