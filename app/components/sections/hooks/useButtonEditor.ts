import { useState } from "react";
import { FormField } from "../../../types/formTypes";
import { hexToHsb, rgbToHsb } from "../utils/colorUtils";

export function useButtonEditor() {
  const [buttonSettings, setButtonSettings] = useState({
    buttonText: 'COMPLETE ORDER - {order_total}',
    buttonSubtitle: '',
    buttonAnimation: 'none' as 'none' | 'pulse' | 'bounce' | 'shake',
    buttonIcon: '',
    backgroundColor: 'rgba(0,0,0,1)',
    textColor: 'rgba(255,255,255,1)',
    fontSize: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,1)',
    shadow: true
  });

  const [bgColorState, setBgColorState] = useState({
    hue: 0, saturation: 0, brightness: 0
  });

  const [textColorState, setTextColorState] = useState({
    hue: 0, saturation: 0, brightness: 0
  });

  const [borderColorState, setBorderColorState] = useState({
    hue: 0, saturation: 0, brightness: 0
  });

  const openButtonEditor = (field: FormField) => {
    if (field.buttonSettings) {
      setButtonSettings(field.buttonSettings);

      // تهيئة ألوان ColorPicker
      const bgColor = field.buttonSettings.backgroundColor;
      const textColor = field.buttonSettings.textColor;
      const borderColor = field.buttonSettings.borderColor;

      if (bgColor.startsWith('#')) {
        setBgColorState(hexToHsb(bgColor));
      } else if (bgColor.startsWith('rgb')) {
        setBgColorState(rgbToHsb(bgColor));
      }

      if (textColor.startsWith('#')) {
        setTextColorState(hexToHsb(textColor));
      } else if (textColor.startsWith('rgb')) {
        setTextColorState(rgbToHsb(textColor));
      }

      if (borderColor.startsWith('#')) {
        setBorderColorState(hexToHsb(borderColor));
      } else if (borderColor.startsWith('rgb')) {
        setBorderColorState(rgbToHsb(borderColor));
      }
    }
    return field;
  };

  const saveButtonSettings = (editingButton: FormField | null, setFormFields: any, onClose: () => void) => {
    if (!editingButton) return;

    setFormFields((prevFields: FormField[]) =>
      prevFields.map(field =>
        field.id === editingButton.id
          ? {
            ...field,
            buttonSettings: {
              buttonText: buttonSettings.buttonText,
              buttonSubtitle: buttonSettings.buttonSubtitle,
              buttonAnimation: buttonSettings.buttonAnimation,
              buttonIcon: buttonSettings.buttonIcon,
              backgroundColor: buttonSettings.backgroundColor,
              textColor: buttonSettings.textColor,
              fontSize: buttonSettings.fontSize,
              borderRadius: buttonSettings.borderRadius,
              borderWidth: buttonSettings.borderWidth,
              borderColor: buttonSettings.borderColor,
              shadow: buttonSettings.shadow
            }
          }
          : field
      )
    );
    onClose();
  };

  return {
    buttonSettings,
    setButtonSettings,
    bgColorState,
    setBgColorState,
    textColorState,
    setTextColorState,
    borderColorState,
    setBorderColorState,
    openButtonEditor,
    saveButtonSettings
  };
}