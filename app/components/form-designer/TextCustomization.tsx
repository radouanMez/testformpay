import React from "react";
import { Card, Box, BlockStack, Text, TextField } from "@shopify/polaris";
import { TextSettings, TextCustomizationProps } from "app/types/formTypes";

export function TextCustomization({ textSettings, setTextSettings }: TextCustomizationProps) {
    const handleChange = (field: keyof TextSettings, value: string) => {
        setTextSettings({ [field]: value });
    };



    return (
        <Card>
            <Box padding="400">
                <BlockStack gap="400">
                    <Text variant="headingLg" as="h2">5. Text Customization</Text>

                    <TextField
                        label="Form Title"
                        value={textSettings.title}
                        onChange={(val) => handleChange("title", val)}
                        placeholder="e.g. Subscribe to our newsletter"
                        autoComplete="off"
                    />

                    <TextField
                        label="Success Message"
                        value={textSettings.successMessage}
                        onChange={(val) => handleChange("successMessage", val)}
                        placeholder="e.g. Thank you for joining!"
                        autoComplete="off"
                    />

                    <TextField
                        label="Error Message"
                        value={textSettings.errorMessage}
                        onChange={(val) => handleChange("errorMessage", val)}
                        placeholder="e.g. Something went wrong!"
                        autoComplete="off"
                    />

                    {/* <TextField
                        label="Subscribe"
                        value={textSettings.errorMessage}
                        onChange={(val) => handleChange("errorMessage", val)}
                        placeholder="e.g. Something went wrong!"
                        autoComplete="off"
                    /> */}
                </BlockStack>
            </Box>
        </Card>
    );
} 