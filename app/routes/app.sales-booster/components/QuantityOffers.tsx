// app/sales-booster/components/QuantityOffers.tsx
import { Card, Text } from "@shopify/polaris";

export default function QuantityOffers() {
  return (
    <Card>
      <Text variant="headingMd" as="h2">
        QuantityOffers
      </Text>
      <Text as="p">
        Create quantity offers with one click.
      </Text>
    </Card>
  );
}
