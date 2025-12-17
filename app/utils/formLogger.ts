import { FormConfig } from "../types/formTypes";

export const logFormConfiguration = (formConfig: FormConfig) => {
  const saveData = {
    formType: formConfig.formType,
    selectedCountry: formConfig.selectedCountry,
    websiteContained: formConfig.websiteContained,
    style: {
      primaryColor: formConfig.primaryColor,
      textColor: formConfig.textColor,
      backgroundColor: formConfig.backgroundColor,
      borderColor: formConfig.borderColor,
      borderWidth: formConfig.borderWidth,
      borderRadius: formConfig.borderRadius,
      textSize: formConfig.textSize,
      shadow: formConfig.shadow,
      stickyButton: formConfig.stickyButton,
      mobileFullscreen: formConfig.mobileFullscreen,
      formStyle: formConfig.formStyle,
      fontFamily: formConfig.fontFamily,
      hideCloseButton: formConfig.hideCloseButton,
      hideFieldLabels: formConfig.hideFieldLabels,
      rtlSupport: formConfig.rtlSupport
    },
    text: {
      title: formConfig.title,
      successMessage: formConfig.successMessage,
      errorMessage: formConfig.errorMessage
    },
    // إضافة إعدادات زر الشراء
    buyButton: formConfig.buyButton ? {
      text: formConfig.buyButton.text,
      subtitle: formConfig.buyButton.subtitle,
      animation: formConfig.buyButton.animation,
      icon: formConfig.buyButton.icon,
      stickyPosition: formConfig.buyButton.stickyPosition,
      backgroundColor: formConfig.buyButton.backgroundColor,
      textColor: formConfig.buyButton.textColor,
      fontSize: formConfig.buyButton.fontSize,
      borderRadius: formConfig.buyButton.borderRadius,
      borderWidth: formConfig.buyButton.borderWidth,
      borderColor: formConfig.buyButton.borderColor,
      shadow: formConfig.buyButton.shadow,
      mobileSticky: formConfig.buyButton.mobileSticky
    } : null,
    fields: formConfig.fields
      .filter(field => field.visible)
      .map(field => ({
        id: field.id,
        label: field.label,
        displayLabel: field.displayLabel,
        type: field.type,
        required: field.required,
        placeholder: field.placeholder,
        showIcon: field.showIcon,
        minLength: field.minLength,
        maxLength: field.maxLength,
        errorText: field.errorText,
        // إضافة جميع الإعدادات الجديدة
        sectionSettings: field.sectionSettings ? {
          customText: field.sectionSettings.customText,
          alignment: field.sectionSettings.alignment,
          fontSize: field.sectionSettings.fontSize,
          fontWeight: field.sectionSettings.fontWeight,
          textColor: field.sectionSettings.textColor
        } : null,
        totalSettings: field.totalSettings ? {
          subtotalTitle: field.totalSettings.subtotalTitle,
          subtotalValue: field.totalSettings.subtotalValue,
          shippingTitle: field.totalSettings.shippingTitle,
          shippingValue: field.totalSettings.shippingValue,
          totalTitle: field.totalSettings.totalTitle,
          totalValue: field.totalSettings.totalValue,
          showTaxesMessage: field.totalSettings.showTaxesMessage,
          backgroundColor: field.totalSettings.backgroundColor
        } : null,
        shippingSettings: field.shippingSettings ? {
          title: field.shippingSettings.title,
          freeText: field.shippingSettings.freeText,
          fontSize: field.shippingSettings.fontSize
        } : null,
        discountSettings: field.discountSettings ? {
          limitOnePerOrder: field.discountSettings.limitOnePerOrder,
          discountsLineText: field.discountSettings.discountsLineText,
          fieldLabel: field.discountSettings.fieldLabel,
          applyButtonText: field.discountSettings.applyButtonText,
          buttonBackgroundColor: field.discountSettings.buttonBackgroundColor,
          invalidCodeError: field.discountSettings.invalidCodeError,
          limitError: field.discountSettings.limitError
        } : null,
        buttonSettings: field.buttonSettings ? {
          buttonText: field.buttonSettings.buttonText,
          buttonSubtitle: field.buttonSettings.buttonSubtitle,
          buttonAnimation: field.buttonSettings.buttonAnimation,
          buttonIcon: field.buttonSettings.buttonIcon,
          backgroundColor: field.buttonSettings.backgroundColor,
          textColor: field.buttonSettings.textColor,
          fontSize: field.buttonSettings.fontSize,
          borderRadius: field.buttonSettings.borderRadius,
          borderWidth: field.buttonSettings.borderWidth,
          borderColor: field.buttonSettings.borderColor,
          shadow: field.buttonSettings.shadow
        } : null,
        position: formConfig.fields.findIndex(f => f.id === field.id)
      })),
    fieldsOrder: formConfig.fields
      .filter(field => field.visible)
      .map(field => field.label),
    hiddenFields: formConfig.fields
      .filter(field => !field.visible)
      .map(field => field.label),
    totalFields: formConfig.fields.length,
    visibleFields: formConfig.fields.filter(field => field.visible).length,
    hiddenFieldsCount: formConfig.fields.filter(field => !field.visible).length
  };

  console.log("🎯 ===== FORM CONFIGURATION SAVED =====");
  console.log("📦 FORM TYPE & DISPLAY:");
  console.log("   - Form Type:", saveData.formType);
  console.log("   - Selected Country:", saveData.selectedCountry);
  console.log("   - Website Contained:", saveData.websiteContained);

  console.log("🎨 STYLE SETTINGS:");
  Object.entries(saveData.style).forEach(([key, value]) => {
    console.log(`   - ${key}:`, value);
  });

  console.log("📝 TEXT SETTINGS:");
  Object.entries(saveData.text).forEach(([key, value]) => {
    console.log(`   - ${key}:`, value);
  });

  // إضافة قسم إعدادات زر الشراء
  console.log("🛒 BUY BUTTON SETTINGS:");
  if (saveData.buyButton) {
    Object.entries(saveData.buyButton).forEach(([key, value]) => {
      console.log(`   - ${key}:`, value);
    });
  } else {
    console.log("   - No buy button settings configured");
  }

  console.log("🔧 FIELDS CONFIGURATION:");
  console.log("   - Total Fields:", saveData.totalFields);
  console.log("   - Visible Fields:", saveData.visibleFields);
  console.log("   - Hidden Fields:", saveData.hiddenFieldsCount);
  console.log("   - Fields Order:", saveData.fieldsOrder);

  console.log("📊 FIELDS DETAILS:");
  saveData.fields.forEach((field, index) => {
    console.log(`   ${index + 1}. ${field.label} (${field.type})`);
    console.log(`      - Display Label: ${field.displayLabel || 'Same as original'}`);
    console.log(`      - Required: ${field.required}`);
    console.log(`      - Placeholder: ${field.placeholder}`);
    console.log(`      - Show Icon: ${field.showIcon}`);

    // تفاصيل sectionSettings
    if (field.sectionSettings) {
      console.log(`      - Section Settings:`);
      Object.entries(field.sectionSettings).forEach(([key, value]) => {
        console.log(`         ${key}:`, value);
      });
    }

    // تفاصيل totalSettings
    if (field.totalSettings) {
      console.log(`      - Total Settings:`);
      Object.entries(field.totalSettings).forEach(([key, value]) => {
        console.log(`         ${key}:`, value);
      });
    }

    // تفاصيل shippingSettings
    if (field.shippingSettings) {
      console.log(`      - Shipping Settings:`);
      Object.entries(field.shippingSettings).forEach(([key, value]) => {
        console.log(`         ${key}:`, value);
      });
    }

    // تفاصيل discountSettings
    if (field.discountSettings) {
      console.log(`      - Discount Settings:`);
      Object.entries(field.discountSettings).forEach(([key, value]) => {
        console.log(`         ${key}:`, value);
      });
    }

    // تفاصيل buttonSettings
    if (field.buttonSettings) {
      console.log(`      - Button Settings:`);
      Object.entries(field.buttonSettings).forEach(([key, value]) => {
        console.log(`         ${key}:`, value);
      });
    }
  });

  console.log("🎯 ===== END CONFIGURATION =====");
};