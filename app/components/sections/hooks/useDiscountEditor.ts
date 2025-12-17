import { useState } from "react";
import { FormField } from "../../../types/formTypes";
import { hexToHsb, rgbToHsb } from "../utils/colorUtils";

export function useDiscountEditor() {
    const [discountSettings, setDiscountSettings] = useState({
        limitOnePerOrder: true,
        discountsLineText: 'Discounts',
        fieldLabel: 'Discount code',
        applyButtonText: 'Apply',
        buttonBackgroundColor: 'rgba(0,0,0,1)',
        invalidCodeError: 'Enter a valid discount code.',
        limitError: 'Only 1 discount per order is allowed.'
    });

    const [discountColorState, setDiscountColorState] = useState({
        hue: 0,
        saturation: 0,
        brightness: 0
    });

    const openDiscountEditor = (field: FormField) => {
        if (field.discountSettings) {
            setDiscountSettings(field.discountSettings);

            const bgColor = field.discountSettings.buttonBackgroundColor;
            let hsbColor;

            if (bgColor.startsWith('#')) {
                hsbColor = hexToHsb(bgColor);
            } else if (bgColor.startsWith('rgb')) {
                hsbColor = rgbToHsb(bgColor);
            } else {
                hsbColor = { hue: 0, saturation: 0, brightness: 0 };
            }

            setDiscountColorState(hsbColor);
        }
        return field;
    };

    const saveDiscountSettings = (editingDiscount: FormField | null, setFormFields: any, onClose: () => void) => {
        if (!editingDiscount) return;

        setFormFields((prevFields: FormField[]) =>
            prevFields.map(field =>
                field.id === editingDiscount.id
                    ? {
                        ...field,
                        discountSettings: {
                            limitOnePerOrder: discountSettings.limitOnePerOrder,
                            discountsLineText: discountSettings.discountsLineText,
                            fieldLabel: discountSettings.fieldLabel,
                            applyButtonText: discountSettings.applyButtonText,
                            buttonBackgroundColor: discountSettings.buttonBackgroundColor,
                            invalidCodeError: discountSettings.invalidCodeError,
                            limitError: discountSettings.limitError
                        }
                    }
                    : field
            )
        );
        onClose();
    };

    return {
        discountSettings,
        setDiscountSettings,
        discountColorState,
        setDiscountColorState,
        openDiscountEditor,
        saveDiscountSettings
    };
}