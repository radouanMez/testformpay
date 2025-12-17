import { InlineStack, Button } from "@shopify/polaris";
import React from "react";

export function ActionButtons({ onSave, onCancel }: any) {
  return (
    <div>
      <InlineStack gap="400" align="end">
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="primary" tone="success" onClick={onSave}>
          Save Changes
        </Button>
      </InlineStack>
    </div>
  );
}
