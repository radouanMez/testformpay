import { useState } from "react";
import { FormField } from "../../../types/formTypes";

export function useShippingEditor() {
  const [shippingSettings, setShippingSettings] = useState({
    title: 'Shipping method',
    freeText: 'Free',
    fontSize: 16
  });

  const openShippingEditor = (field: FormField) => {
    if (field.shippingSettings) {
      setShippingSettings(field.shippingSettings);
    }
    return field;
  };

  const saveShippingSettings = (editingShipping: FormField | null, setFormFields: any, onClose: () => void) => {
    if (!editingShipping) return;

    setFormFields((prevFields: FormField[]) =>
      prevFields.map(field =>
        field.id === editingShipping.id
          ? {
            ...field,
            shippingSettings: {
              title: shippingSettings.title,
              freeText: shippingSettings.freeText,
              fontSize: shippingSettings.fontSize
            }
          }
          : field
      )
    );
    onClose();
  };

  return {
    shippingSettings,
    setShippingSettings,
    openShippingEditor,
    saveShippingSettings
  };
}