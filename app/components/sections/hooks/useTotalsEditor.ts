import { useState } from "react";
import { FormField } from "../../../types/formTypes";
import { hexToHsb, rgbToHsb } from "../utils/colorUtils";

export function useTotalsEditor() {
    const [totalsSettings, setTotalsSettings] = useState({
        subtotalTitle: 'Subtotal',
        subtotalValue: '199.99$',
        shippingTitle: 'Shipping',
        shippingValue: 'Free',
        discountTitle: 'Discount',
        discountValue: '25%',
        totalTitle: 'Total',
        totalValue: '199.99$',
        showTaxesMessage: false,
        backgroundColor: 'rgba(235,235,235,1)'
    });

    const [totalsColorState, setTotalsColorState] = useState({
        hue: 0,
        saturation: 0,
        brightness: 0
    });

    const openTotalsEditor = (field: FormField) => {
        if (field.totalSettings) {
            setTotalsSettings(field.totalSettings);

            const bgColor = field.totalSettings.backgroundColor;
            let hsbColor;

            if (bgColor.startsWith('#')) {
                hsbColor = hexToHsb(bgColor);
            } else if (bgColor.startsWith('rgb')) {
                hsbColor = rgbToHsb(bgColor);
            } else {
                hsbColor = { hue: 0, saturation: 0, brightness: 0 };
            }

            setTotalsColorState(hsbColor);
        }
        return field;
    };

    const saveTotalsSettings = (editingTotals: FormField | null, setFormFields: any, onClose: () => void) => {
        if (!editingTotals) return;

        setFormFields((prevFields: FormField[]) =>
            prevFields.map(field =>
                field.id === editingTotals.id
                    ? {
                        ...field,
                        totalSettings: {
                            subtotalTitle: totalsSettings.subtotalTitle,
                            subtotalValue: totalsSettings.subtotalValue,
                            shippingTitle: totalsSettings.shippingTitle,
                            shippingValue: totalsSettings.shippingValue,
                            discountTitle: totalsSettings.discountTitle,
                            discountValue: totalsSettings.discountValue,
                            totalTitle: totalsSettings.totalTitle,
                            totalValue: totalsSettings.totalValue,
                            showTaxesMessage: totalsSettings.showTaxesMessage,
                            backgroundColor: totalsSettings.backgroundColor
                        }
                    }
                    : field
            )
        );
        onClose();
    };

    return {
        totalsSettings,
        setTotalsSettings,
        totalsColorState,
        setTotalsColorState,
        openTotalsEditor,
        saveTotalsSettings
    };
}