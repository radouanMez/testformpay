import { useState, useEffect } from "react";
import { FormConfig, FormField } from "../types/formTypes";

// القيم الافتراضية الكاملة مع جميع الحقول
const getDefaultFormConfig = (): FormConfig => ({
    formType: "POPUP",
    selectedCountry: "custom",
    websiteContained: false,
    primaryColor: '#008060',
    textColor: 'rgba(0,0,0,1)',
    backgroundColor: 'rgba(255,255,255,1)',
    borderColor: 'rgba(0,0,0,1)',
    borderWidth: 1,
    borderRadius: 8,
    textSize: 14,
    shadow: true,
    stickyButton: true,
    mobileFullscreen: false,
    formStyle: 'modern',
    fontFamily: 'Inter, sans-serif',
    buttonColor: '#008060',
    title: "Complete Your Order",
    buttonText: "Complete Order",
    successMessage: "Thank you for your order!",
    errorMessage: "Something went wrong!",
    hideCloseButton: false,
    hideFieldLabels: false,
    rtlSupport: false,

    buyButton: {
        text: "Buy with Cash on Delivery",
        subtitle: "Cash on Delivery",
        animation: "none",
        icon: "cart",
        stickyPosition: "bottom",
        backgroundColor: 'rgba(0, 0, 0, 1)',
        textColor: '#FFFFFF',
        fontSize: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,1)",
        shadow: true,
        mobileSticky: false
    },

    // ✅ جميع الحقول موجودة مع إضافة displayLabel للحقول من نوع input
    fields: [
        {
            id: 15,
            label: 'TOTALS SUMMARY',
            movable: true,
            visible: true,
            type: 'section',
            // totalSettings: {
            //     subtotalTitle: 'Subtotal',
            //     subtotalValue: '199.99$',
            //     shippingTitle: 'Shipping',
            //     shippingValue: 'Free',
            //     totalTitle: 'Total',
            //     totalValue: '199.99$',
            //     showTaxesMessage: false,
            //     backgroundColor: 'rgba(235,235,235,1)'
            // }
        },
        {
            id: 2,
            label: 'SHIPPING RATES',
            movable: true,
            visible: true,
            type: 'section',
            shippingSettings: {
                title: 'Shipping method',
                freeText: 'Free',
                fontSize: 16
            }
        },
        {
            id: 4,
            label: 'DISCOUNT CODES',
            movable: true,
            visible: false,
            type: 'section',
            discountSettings: {
                limitOnePerOrder: true,
                discountsLineText: 'Discounts',
                fieldLabel: 'Discount code',
                applyButtonText: 'Apply',
                buttonBackgroundColor: 'rgba(0,0,0,1)',
                invalidCodeError: 'Enter a valid discount code.',
                limitError: 'Only 1 discount per order is allowed.'
            }
        },
        {
            id: 3,
            label: 'UPSELL AREAS',
            movable: true,
            visible: false,
            type: 'section'
        },
        {
            id: 5,
            label: 'Enter your shipping address',
            movable: false,
            visible: true,
            type: 'section',
            sectionSettings: {
                customText: 'Enter your shipping address',
                alignment: 'center',
                fontSize: 16,
                fontWeight: 'bold',
                textColor: '#000000'
            }
        },
        {
            id: 6,
            label: 'First name', // الثابت - اسم الحقل الأساسي
            displayLabel: 'First name', // قابل للتعديل - التسمية المعروضة
            movable: true,
            visible: true,
            type: 'input',
            required: true,
            placeholder: 'First name',
            showIcon: false,
            minLength: 2,
            maxLength: 250,
            errorText: 'Please enter a valid first name'
        },
        {
            id: 7,
            label: 'Last name',
            displayLabel: 'Last name',
            movable: true,
            visible: true,
            type: 'input',
            required: true,
            placeholder: 'Last name',
            showIcon: false,
            minLength: 2,
            maxLength: 250,
            errorText: 'Please enter a valid last name'
        },
        {
            id: 8,
            label: 'Phone number',
            displayLabel: 'Phone number',
            movable: true,
            visible: true,
            type: 'input',
            required: true,
            placeholder: 'Phone number',
            showIcon: false,
            minLength: 10,
            maxLength: 15,
            errorText: 'Please enter a valid phone number'
        },
        {
            id: 9,
            label: 'Address',
            displayLabel: 'Address',
            movable: true,
            visible: true,
            type: 'input',
            required: true,
            placeholder: 'Address',
            showIcon: false,
            minLength: 5,
            maxLength: 250,
            errorText: 'Please enter a valid address'
        },
        {
            id: 10,
            label: 'Address 2',
            displayLabel: 'Address 2',
            movable: true,
            visible: true,
            type: 'input',
            required: false,
            placeholder: 'Address 2 (optional)',
            showIcon: false,
            minLength: 0,
            maxLength: 250,
            errorText: ''
        },
        {
            id: 11,
            label: 'Province',
            displayLabel: 'Province',
            movable: true,
            visible: true,
            type: 'input',
            required: true,
            placeholder: 'Province',
            showIcon: false,
            minLength: 2,
            maxLength: 50,
            errorText: 'Please enter a valid province'
        },
        {
            id: 12,
            label: 'City',
            displayLabel: 'City',
            movable: true,
            visible: true,
            type: 'input',
            required: true,
            placeholder: 'City',
            showIcon: false,
            minLength: 2,
            maxLength: 50,
            errorText: 'Please enter a valid city'
        },
        {
            id: 13,
            label: 'Zip code',
            displayLabel: 'Zip code',
            movable: true,
            visible: true,
            type: 'input',
            required: true,
            placeholder: 'Zip code',
            showIcon: false,
            minLength: 3,
            maxLength: 10,
            errorText: 'Please enter a valid zip code'
        },
        {
            id: 14,
            label: 'Email',
            displayLabel: 'Email',
            movable: true,
            visible: true,
            type: 'input',
            required: true,
            placeholder: 'Email address',
            showIcon: false,
            minLength: 5,
            maxLength: 100,
            errorText: 'Please enter a valid email address'
        },
        {
            id: 16,
            label: 'SUBMIT BUTTON',
            movable: true,
            visible: true,
            type: 'button',
            buttonSettings: {
                buttonText: "COMPLETE ORDER - {order_total}",
                buttonSubtitle: "",
                buttonAnimation: "none",
                buttonIcon: "",
                backgroundColor: "rgba(0,0,0,1)",
                textColor: "rgba(255,255,255,1)",
                fontSize: 16,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "rgba(0,0,0,1)",
                shadow: true
            }
        },
        {
            id: 17,
            type: 'subscribe',
            label: 'Subscribe to updates',
            visible: true,
            movable: true,
            subscribeSettings: {
                label: "Subscribe to stay updated with new products and offers!",
                description: "Get the latest updates on new products and special offers",
                checkedByDefault: true,
                privacyText: "I agree to the privacy policy",
                textColor: "#000000",
                backgroundColor: "#ffffff"
            }
        }
    ]
});

// دالة لجلب البيانات من API
const fetchFormConfigFromDB = async (): Promise<Partial<FormConfig> | null> => {
    try {
        const response = await fetch('/api/form-config');
        if (response.ok) {
            const result = await response.json();
            return result.data || null;
        }
        return null;
    } catch (error) {
        console.error('Failed to fetch form config:', error);
        return null;
    }
};

// دالة للحفظ في API
const saveToDatabase = async (config: FormConfig): Promise<boolean> => {
    try {
        const response = await fetch('/api/form-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(config),
        });

        if (response.ok) {
            const result = await response.json();
            return result.success;
        }
        return false;
    } catch (error) {
        console.error('Failed to save form config:', error);
        return false;
    }
};

export const useFormConfig = () => {
    const [formConfig, setFormConfig] = useState<FormConfig>(getDefaultFormConfig());
    const [isLoading, setIsLoading] = useState(true);

    // جلب الإعدادات من API عند التحميل
    useEffect(() => {
        const loadFormConfig = async () => {
            setIsLoading(true);
            try {
                const dbConfig = await fetchFormConfigFromDB();
                if (dbConfig) {
                    // دمج البيانات من DB مع الافتراضيات
                    setFormConfig(prev => ({
                        ...prev,
                        ...dbConfig,
                        // دمج الحقول بشكل ذكي للحفاظ على label الأصلي
                        fields: dbConfig.fields
                            ? prev.fields.map(prevField => {
                                const dbField = dbConfig.fields?.find(f => f.id === prevField.id);
                                if (dbField) {
                                    return {
                                        ...prevField,
                                        ...dbField,
                                        // احتفظ بـ label الأصلي من prevField
                                        label: prevField.label,
                                        // استخدم displayLabel من dbField إذا كان موجوداً
                                        displayLabel: dbField.displayLabel || prevField.displayLabel
                                    };
                                }
                                return prevField;
                            })
                            : prev.fields,
                        buyButton: dbConfig.buyButton ? { ...prev.buyButton, ...dbConfig.buyButton } : prev.buyButton
                    }));
                }
            } catch (error) {
                console.error('Error loading form config:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadFormConfig();
    }, []);

    // دوال التحديث
    const updateFormType = (formType: "POPUP" | "EMBEDDED") => {
        setFormConfig(prev => ({ ...prev, formType }));
    };

    const updateCountrySettings = (country: string, contained: boolean) => {
        setFormConfig(prev => ({
            ...prev,
            selectedCountry: country,
            websiteContained: contained
        }));
    };

    const updateFields: React.Dispatch<React.SetStateAction<FormField[]>> = (fields) => {
        setFormConfig(prev => ({
            ...prev,
            fields: typeof fields === 'function' ? fields(prev.fields) : fields
        }));
    };

    const updateStyleSettings = (styleUpdates: Partial<FormConfig>) => {
        setFormConfig(prev => ({ ...prev, ...styleUpdates }));
    };

    const updateTextSettings = (textUpdates: Partial<FormConfig>) => {
        setFormConfig(prev => ({
            ...prev,
            ...textUpdates
        }));
    };

    const updatePartialConfig = (updates: Partial<FormConfig>) => {
        setFormConfig(prev => ({ ...prev, ...updates }));
    };

    // دالة الحفظ التي تستدعي API
    const saveConfig = async (): Promise<boolean> => {
        const success = await saveToDatabase(formConfig);
        if (success) {
            console.log('✅ Form configuration saved to database');
        } else {
            console.error('❌ Failed to save form configuration');
        }
        return success;
    };

    return {
        formConfig,
        setFormConfig,
        isLoading,
        updateFormType,
        updateCountrySettings,
        updateFields,
        updateStyleSettings,
        updateTextSettings,
        updatePartialConfig,
        saveConfig
    };
};