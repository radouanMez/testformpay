import React, { useState, useEffect } from 'react';
import {
    Page,
    Card,
    TextField,
    Layout,
    FormLayout,
    ChoiceList,
    Link,
    Text,
    BlockStack,
    InlineStack,
    Button,
    Toast,
    Frame
} from '@shopify/polaris';

export function UserBlocking() {
    const [blockedEmails, setBlockedEmails] = useState('');
    const [blockedPhones, setBlockedPhones] = useState('');
    const [blockedIPs, setBlockedIPs] = useState('');
    const [allowedIPs, setAllowedIPs] = useState('');
    const [blockedPostalCodes, setBlockedPostalCodes] = useState('');
    const [allowedPostalCodes, setAllowedPostalCodes] = useState('');
    const [blockMessage, setBlockMessage] = useState('Your order has been blocked due to security reasons.');
    const [orderLimitHours, setOrderLimitHours] = useState('');
    const [quantityLimit, setQuantityLimit] = useState('');
    const [postalCodeAction, setPostalCodeAction] = useState<string[]>(['exclude']);
    const [isSaving, setIsSaving] = useState(false);
    const [activeToast, setActiveToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // 🔥 أضف دالة showToast هنا
    const showToast = (message: string) => {
        setToastMessage(message);
        setActiveToast(true);
        console.log('🎯 Showing toast:', message);
    };

    useEffect(() => {
        console.log('🔍 UserBlocking component mounted - loading settings...');
        loadSettings();
    }, []);

    const loadSettings = async () => {
        console.log('📥 Starting to load settings from API...');
        try {
            const response = await fetch('/api/user-blocking-settings');
            console.log('📡 API Response status:', response.status);

            if (response.ok) {
                let settings = await response.json();
                console.log('✅ Raw API response:', settings);

                // إذا كان array، خذ أول عنصر
                if (Array.isArray(settings)) {
                    settings = settings.length > 0 ? settings[0] : {};
                    console.log('🔄 Extracted first item from array:', settings);
                }

                if (settings && Object.keys(settings).length > 0) {
                    console.log('🔄 Populating form with loaded settings...');

                    setBlockedEmails(Array.isArray(settings.blockedEmails) ? settings.blockedEmails.join('\n') : '');
                    setBlockedPhones(Array.isArray(settings.blockedPhones) ? settings.blockedPhones.join('\n') : '');
                    setBlockedIPs(Array.isArray(settings.blockedIPs) ? settings.blockedIPs.join('\n') : '');
                    setAllowedIPs(Array.isArray(settings.allowedIPs) ? settings.allowedIPs.join('\n') : '');
                    setBlockedPostalCodes(Array.isArray(settings.blockedPostalCodes) ? settings.blockedPostalCodes.join('\n') : '');
                    setAllowedPostalCodes(Array.isArray(settings.allowedPostalCodes) ? settings.allowedPostalCodes.join('\n') : '');
                    setBlockMessage(settings.blockMessage || 'Your order has been blocked due to security reasons.');
                    setOrderLimitHours(settings.orderLimitHours?.toString() || '');
                    setQuantityLimit(settings.quantityLimit?.toString() || '');
                    setPostalCodeAction([settings.postalCodeAction || 'exclude']);

                    console.log('✅ Form populated successfully');
                    showToast('✅ Settings loaded successfully'); // ✅ الآن تعمل
                } else {
                    console.log('ℹ️ No settings found, using defaults');
                }
            } else {
                console.error('❌ Failed to load settings, status:', response.status);
            }
        } catch (error) {
            console.error('💥 Error loading settings:', error);
            showToast('❌ Error loading settings'); // ✅ الآن تعمل
        }
    };

    const handleSave = async () => {
        console.log('💾 Starting save process...');
        setIsSaving(true);

        try {
            const settingsData = {
                orderLimitHours: orderLimitHours ? parseInt(orderLimitHours) : null,
                quantityLimit: quantityLimit ? parseInt(quantityLimit) : null,
                blockedEmails: blockedEmails.split('\n').filter(email => email.trim()),
                blockedPhones: blockedPhones.split('\n').filter(phone => phone.trim()),
                blockedIPs: blockedIPs.split('\n').filter(ip => ip.trim()),
                allowedIPs: allowedIPs.split('\n').filter(ip => ip.trim()),
                blockMessage,
                postalCodeAction: postalCodeAction[0],
                blockedPostalCodes: blockedPostalCodes.split('\n').filter(code => code.trim()),
                allowedPostalCodes: allowedPostalCodes.split('\n').filter(code => code.trim())
            };

            console.log('📦 Prepared data for API:', settingsData);

            const response = await fetch('/api/user-blocking-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settingsData),
            });

            console.log('📡 Save API response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API Error response:', errorText);
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ Save API response data:', result);

            if (result.success) {
                console.log('🎉 Settings saved successfully!');
                showToast('✅ User blocking settings saved successfully'); // ✅ الآن تعمل
            } else {
                console.error('❌ Save failed with error:', result.error);
                showToast(`❌ Failed to save: ${result.error}`); // ✅ الآن تعمل
            }

        } catch (error) {
            console.error('💥 Error saving settings:', error);
            showToast(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`); // ✅ الآن تعمل
        } finally {
            setIsSaving(false);
            console.log('🏁 Save process completed');
        }
    };

    const toastMarkup = activeToast ? (
        <Toast
            content={toastMessage}
            onDismiss={() => setActiveToast(false)}
            duration={3000}
        />
    ) : null;


    return (
        <Frame>
            <Page
                title="User Blocking"
                primaryAction={{
                    content: isSaving ? "Saving..." : "Save changes",
                    onAction: handleSave,
                    disabled: isSaving,
                    loading: isSaving,
                }}
            >

                <Layout>
                    <Layout.Section>
                        <Card>
                            <BlockStack gap="400">
                                <Text variant="headingMd" as="h2">User Verification</Text>
                                <FormLayout>
                                    <TextField
                                        autoComplete="off"
                                        label="Limit orders made from the same customer in X hours"
                                        helpText="To determine the customer we use a combination of IP address, email or phone number."
                                        type="number"
                                        value={orderLimitHours}
                                        onChange={setOrderLimitHours}
                                        suffix="hours"
                                    />

                                    <TextField
                                        autoComplete="off"
                                        label="Block orders if they contain more than X quantity of products"
                                        type="number"
                                        value={quantityLimit}
                                        onChange={setQuantityLimit}
                                    />
                                </FormLayout>
                            </BlockStack>
                        </Card>
                    </Layout.Section>

                    <Layout.Section>
                        <Card>
                            <BlockStack gap="400">
                                <Text variant="headingMd" as="h2">Advanced</Text>
                                <InlineStack gap="400" align="start" wrap>
                                    <div style={{ flex: 1, minWidth: '300px' }}>
                                        <BlockStack gap="400">

                                            <TextField
                                                autoComplete="off"
                                                label="Emails to block (separated by a new line)"
                                                helpText="Enter one email per line"
                                                multiline={4}
                                                value={blockedEmails}
                                                onChange={setBlockedEmails}
                                                placeholder="johnsmith@gmail.com"
                                            />

                                            <TextField
                                                autoComplete="off"
                                                label="Phone numbers to block (separated by a new line)"
                                                helpText="Enter the phone numbers without country code. One per line."
                                                multiline={4}
                                                value={blockedPhones}
                                                onChange={setBlockedPhones}
                                                placeholder="6721956382"
                                            />
                                            
                                        </BlockStack>
                                    </div>
                                    <div style={{ flex: 1, minWidth: '300px' }}>
                                        <BlockStack gap="400">

                                            <TextField
                                                autoComplete="off"
                                                label="IP addresses to block (separated by a new line)"
                                                helpText={
                                                    <Text as="span" variant="bodyMd" tone="subdued">
                                                        How to find the IP address of a customer?{' '}
                                                        <Link url="https://support.google.com/" external>
                                                            Learn more
                                                        </Link>
                                                    </Text>
                                                }
                                                multiline={4}
                                                value={blockedIPs}
                                                onChange={setBlockedIPs}
                                                placeholder="1.56.78.9"
                                            />

                                            <TextField
                                                autoComplete="off"
                                                label="IP addresses to always allow (separated by a new line)"
                                                helpText={
                                                    <Text as="span" variant="bodyMd" tone="subdued">
                                                        How to find the IP address of a customer?{' '}
                                                        <Link url="https://support.google.com/" external>
                                                            Learn more
                                                        </Link>
                                                    </Text>
                                                }
                                                multiline={4}
                                                value={allowedIPs}
                                                onChange={setAllowedIPs}
                                                placeholder="1.56.78.9"
                                            />

                                        </BlockStack>
                                    </div>
                                </InlineStack>
                            </BlockStack>
                        </Card>
                    </Layout.Section>

                    <Layout.Section>
                        <Card>
                            <BlockStack gap="400">
                                <Text variant="headingMd" as="h2">Block Message</Text>
                                <TextField
                                    autoComplete="off"
                                    label="Message to show in the form when an order is blocked"
                                    helpText="This message will be shown inside the form after an order is blocked for the IP, email or phone number."
                                    multiline={3}
                                    value={blockMessage}
                                    onChange={setBlockMessage}
                                />
                            </BlockStack>
                        </Card>
                    </Layout.Section>

                    <Layout.Section>
                        <Card>
                            <BlockStack gap="400">
                                <Text variant="headingMd" as="h2">Postal Code Restrictions</Text>
                                <FormLayout>
                                    <ChoiceList
                                        title="Use this section to exclude postal codes from your form or only allow a list of postal codes on your form."
                                        choices={[
                                            {
                                                label: 'Exclude a list of postal codes from making orders on the form',
                                                value: 'exclude'
                                            },
                                            {
                                                label: 'Allow only a list of postal codes to make orders on the form',
                                                value: 'allow'
                                            }
                                        ]}
                                        selected={postalCodeAction}
                                        onChange={setPostalCodeAction}
                                    />

                                    {postalCodeAction.includes('exclude') && (
                                        <TextField
                                            autoComplete="off"
                                            label="Postal codes to exclude (separated by a new line)"
                                            multiline={4}
                                            value={blockedPostalCodes}
                                            onChange={setBlockedPostalCodes}
                                            placeholder="12345"
                                        />
                                    )}

                                    {postalCodeAction.includes('allow') && (
                                        <TextField
                                            autoComplete="off"
                                            label="Postal codes to allow (separated by a new line)"
                                            multiline={4}
                                            value={allowedPostalCodes}
                                            onChange={setAllowedPostalCodes}
                                            placeholder="12345"
                                        />
                                    )}
                                </FormLayout>
                            </BlockStack>
                        </Card>
                    </Layout.Section>
                </Layout>
                {/* Toast Notification */}
                {toastMarkup}
            </Page>
        </Frame>
    );
}