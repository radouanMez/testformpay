import { useState } from "react";
import { FormField } from "../../../types/formTypes";
import { hexToHsb, rgbToHsb } from "../utils/colorUtils";

export function useSectionEditor() {
  const [sectionSettings, setSectionSettings] = useState({
    customText: '',
    alignment: 'center' as 'left' | 'center' | 'right',
    fontSize: 16,
    fontWeight: 'bold' as 'normal' | 'bold' | 'bolder',
    textColor: '#000000'
  });

  const [colorPickerState, setColorPickerState] = useState({
    hue: 0,
    saturation: 0,
    brightness: 0
  });

  const openSectionEditor = (field: FormField) => {
    const currentColor = field.sectionSettings?.textColor || '#000000';
    let hsbColor;

    if (currentColor.startsWith('#')) {
      hsbColor = hexToHsb(currentColor);
    } else if (currentColor.startsWith('rgb')) {
      hsbColor = rgbToHsb(currentColor);
    } else {
      hsbColor = { hue: 0, saturation: 0, brightness: 0 };
    }

    setSectionSettings({
      customText: field.sectionSettings?.customText || field.label,
      alignment: field.sectionSettings?.alignment || 'center',
      fontSize: field.sectionSettings?.fontSize || 16,
      fontWeight: field.sectionSettings?.fontWeight || 'bold',
      textColor: currentColor
    });

    setColorPickerState(hsbColor);
    return field;
  };

  const saveSectionSettings = (editingSection: FormField | null, setFormFields: any, onClose: () => void) => {
    if (!editingSection) return;

    setFormFields((prevFields: FormField[]) =>
      prevFields.map(field =>
        field.id === editingSection.id
          ? {
            ...field,
            sectionSettings: {
              customText: sectionSettings.customText,
              alignment: sectionSettings.alignment,
              fontSize: sectionSettings.fontSize,
              fontWeight: sectionSettings.fontWeight,
              textColor: sectionSettings.textColor
            }
          }
          : field
      )
    );
    onClose();
  };

  return {
    sectionSettings,
    setSectionSettings,
    colorPickerState,
    setColorPickerState,
    openSectionEditor,
    saveSectionSettings
  };
}