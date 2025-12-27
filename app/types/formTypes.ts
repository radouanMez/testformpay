export interface FormConfig {
  formType: "POPUP" | "EMBEDDED";
  selectedCountry: string;
  websiteContained: boolean;
  primaryColor: string;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  textSize: number;
  shadow: boolean;
  stickyButton: boolean;
  mobileFullscreen: boolean;
  formStyle: string;
  fontFamily: string;
  buttonColor: string;
  title: string;
  buttonText: string;
  successMessage: string;
  errorMessage: string;

  hideCloseButton?: boolean;
  hideFieldLabels?: boolean;
  rtlSupport?: boolean;

  buyButton?: {
    text: string;
    subtitle?: string;
    animation?: string;
    icon?: string;
    stickyPosition?: string;
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
    shadow?: boolean;
    mobileSticky?: boolean;
  };

  fields: FormField[];
}

export interface StyleSettings {
  primaryColor?: string;
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  textSize?: number;
  shadow?: boolean;
  stickyButton?: boolean;
  mobileFullscreen?: boolean;
  fontFamily?: string;
  formStyle?: string;
  hideCloseButton?: boolean;
  hideFieldLabels?: boolean;
  rtlSupport?: boolean;
}

export interface TextSettings {
  title?: string;
  buttonText?: string;
  successMessage?: string;
  errorMessage?: string;

  buyButtonSubtitle?: string;
  buyButtonIcon?: string;
  buyButtonAnimation?: "none" | "pulse" | "bounce" | "shake";
  buyButtonStickyMobile?: boolean;
  buyButtonShowCart?: boolean;
  buyButtonShowCheckout?: boolean;
  buyButtonBackgroundColor?: string;
  buyButtonTextColor?: string;
  buyButtonFontSize?: number;
  buyButtonBorderRadius?: number;
  buyButtonBorderWidth?: number;
  buyButtonBorderColor?: string;
  buyButtonShadow?: boolean;
}

export interface FormField {
  id: number;
  label: string;
  movable: boolean;
  visible: boolean;
  type: 'section' | 'input' | 'button' | 'subscribe';
  required?: boolean;
  displayLabel?: string;
  placeholder?: string;

  fieldSettings?: FieldSettings;

  sectionSettings?: SectionSettings;
  totalSettings?: TotalSettings;
  shippingSettings?: ShippingSettings;
  discountSettings?: DiscountSettings;
  buttonSettings?: ButtonSettings;
  showIcon?: boolean;
  minLength?: number;
  maxLength?: number;
  errorText?: string;
  subscribeSettings?: SubscribeSettings;
}

export interface FieldSettings {
  showIcon?: boolean;
  minLength?: number;
  maxLength?: number;
  errorText?: string;
  sectionSettings?: SectionSettings;
  buttonSettings?: ButtonSettings;
  totalSettings?: TotalSettings;
  shippingSettings?: ShippingSettings;
  discountSettings?: DiscountSettings;
}

export interface AdvancedSettings {
  formStyle?: string;
  successMessage?: string;
  errorMessage?: string;
}

export interface SectionSettings {
  customText?: string;
  alignment?: 'left' | 'center' | 'right';
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | 'bolder';
  textColor?: string;
}

export interface ButtonSettings {
  buttonText: string;
  buttonSubtitle: string;
  buttonAnimation: 'none' | 'pulse' | 'bounce' | 'shake';
  buttonIcon: string;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  shadow: boolean;
}

export interface TotalSettings {
  subtotalTitle: string;
  subtotalValue: string;
  shippingTitle: string;
  shippingValue: string;
  discountTitle: string;
  discountValue: string;
  totalTitle: string;
  totalValue: string;
  showTaxesMessage: boolean;
  backgroundColor: string;
}

export interface ShippingSettings {
  title: string;
  freeText: string;
  fontSize: number;
}

export interface DiscountSettings {
  limitOnePerOrder: boolean;
  discountsLineText: string;
  fieldLabel: string;
  applyButtonText: string;
  buttonBackgroundColor: string;
  invalidCodeError: string;
  limitError: string;
}

export interface FieldsManagerProps {
  formFields: FormField[];
  setFormFields: React.Dispatch<React.SetStateAction<FormField[]>>;
}

export interface StylingSettingsProps {
  style: StyleSettings;
  setStyle: (updates: Partial<StyleSettings>) => void;
}

export interface TextCustomizationProps {
  textSettings: TextSettings;
  setTextSettings: (updates: Partial<TextSettings>) => void;
}

export interface LivePreviewProps {
  formConfig: FormConfig;
}

export interface FormTypeSelectorProps {
  selectedFormType: "POPUP" | "EMBEDDED";
  setSelectedFormType: (formType: "POPUP" | "EMBEDDED") => void;
}

export interface CountrySettingsProps {
  selectedCountry: string;
  setSelectedCountry: (country: string) => void;
  websiteContained: boolean;
  setWebsiteContained: (contained: boolean) => void;
}

export interface ActionButtonsProps {
  onSave: () => void;
  onCancel: () => void;
}

export type PreviewData = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  address2: string;
  province: string;
  city: string;
  zipCode: string;
  email: string;
  discountCode: string;
};

export interface SubscribeSettings {
  label: string;
  description: string;
  checkedByDefault: boolean;
  privacyText: string;
  textColor: string;
  backgroundColor: string;
}