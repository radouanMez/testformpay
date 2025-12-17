import { Card, Box, BlockStack, InlineStack, Text, Divider } from "@shopify/polaris";
import React from "react";


import styles from "../../routes/app.designer/styles.module.css";

export function FormTypeSelector({ selectedFormType, setSelectedFormType }: any) {
    return (
        <Card>
            <Box padding="400">
                <BlockStack gap="400">
                    <Text variant="headingLg" as="h2">
                        1. Select your form type
                    </Text>

                    <div className={styles.gridTypeForm}>
                        <InlineStack gap="400">
                            {["POPUP", "EMBEDDED"].map((type) => (
                                <Box width="45%" key={type}>
                                    <div  className={styles.gridTypeFormFlex} onClick={() => setSelectedFormType(type)} style={{ cursor: "pointer" }}>
                                        <Box
                                            padding="400"
                                            background={selectedFormType === type ? "bg-surface" : "bg"}
                                            borderRadius="200"
                                            borderWidth="100"
                                            borderColor={selectedFormType === type ? "border-success" : "border"}
                                            borderStyle="solid"
                                        >
                                            <BlockStack gap="200">
                                                <Text as="span" variant="bodyMd" fontWeight="bold">
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </Text>
                                                <Text as="span" variant="bodySm" tone="subdued">
                                                    {type === "POPUP"
                                                        ? "Form appears as a popup overlay on your product pages"
                                                        : "Form embedded directly in your product pages"}
                                                </Text>
                                            </BlockStack>
                                        </Box>
                                    </div>
                                </Box>
                            ))}
                        </InlineStack>
                    </div>
                    <Box paddingBlockStart="400">
                        <Divider />
                        <Box paddingBlockStart="400">
                            <Text as="h4" variant="bodyMd" fontWeight="semibold">
                                Setup Progress
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                                Configure your form type and settings to get started.
                            </Text>
                        </Box>
                    </Box>
                </BlockStack>
            </Box>
        </Card>
    );
}
