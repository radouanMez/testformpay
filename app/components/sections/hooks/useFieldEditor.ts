import { useState } from "react";
import { FormField } from "../../../types/formTypes";

export function useFieldEditor() {
  const [fieldSettings, setFieldSettings] = useState({
    label: '',
    displayLabel: '',
    placeholder: '',
    showIcon: false,
    required: false,
    minLength: 2,
    maxLength: 250,
    errorText: ''
  });

  const openFieldEditor = (field: FormField) => {
    setFieldSettings({
      label: field.label,
      displayLabel: field.displayLabel || field.label,
      placeholder: field.placeholder || field.label,
      showIcon: field.showIcon || false,
      required: field.required || false,
      minLength: field.minLength || 2,
      maxLength: field.maxLength || 250,
      errorText: field.errorText || ''
    });
    return field;
  };

  const saveFieldSettings = (editingField: FormField | null, setFormFields: any, onClose: () => void) => {
    if (!editingField) return;

    setFormFields((prevFields: FormField[]) =>
      prevFields.map(field =>
        field.id === editingField.id
          ? {
            ...field,
            label: fieldSettings.label,
            displayLabel: fieldSettings.displayLabel !== field.label ? fieldSettings.displayLabel : undefined,
            placeholder: fieldSettings.placeholder,
            showIcon: fieldSettings.showIcon,
            required: fieldSettings.required,
            minLength: fieldSettings.minLength,
            maxLength: fieldSettings.maxLength,
            errorText: fieldSettings.errorText
          }
          : field
      )
    );
    onClose();
  };

  return {
    fieldSettings,
    setFieldSettings,
    openFieldEditor,
    saveFieldSettings
  };
}