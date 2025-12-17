import { Card, Box, BlockStack, Text, Select, Checkbox } from "@shopify/polaris";
import { countryOptions } from "../../utils/countries"; // تأكد من المسار الصحيح

interface CountrySettingsProps {
  selectedCountry: string;
  setSelectedCountry: (value: string) => void;
  websiteContained: boolean;
  setWebsiteContained: (value: boolean) => void;
}

export function CountrySettings({
  selectedCountry,
  setSelectedCountry,
  websiteContained,
  setWebsiteContained,
}: CountrySettingsProps) {
  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <Text variant="headingLg" as="h2">
            2. Select your form country
          </Text>

          {/* قسم اختيار الدولة */}
          <Box width="100%">
            <BlockStack gap="200">
              <Text as="span" variant="bodyMd" fontWeight="bold">
                Country Settings
              </Text>

              {/* قائمة الدول */}
              <Select
                label="Choose your country"
                options={countryOptions}
                value={selectedCountry}
                onChange={(value) => setSelectedCountry(value)}
              />

              <Text as="span" variant="bodySm" tone="subdued">
                Select the country to adapt your form to its address format and language.
              </Text>
            </BlockStack>
          </Box>
          
        </BlockStack>
      </Box>
    </Card>
  );
}
