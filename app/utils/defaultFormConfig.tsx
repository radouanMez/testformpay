// ملف التكوينات الافتراضية بجميع اللغات
import type {
  FormConfig,
  FormField,
  ButtonSettings,
  TotalSettings,
  ShippingSettings,
  SectionSettings
} from "../types/formTypes";

// الأساسيات المشتركة بين جميع اللغات
const COMMON_CONFIG_BASE = {
  formType: "POPUP" as const,
  selectedCountry: "",
  websiteContained: false,
  primaryColor: "#008060",
  textColor: "rgba(0,0,0,1)",
  backgroundColor: "rgba(255,255,255,1)",
  borderColor: "rgba(0,0,0,1)",
  borderWidth: 1,
  borderRadius: 8,
  textSize: 14,
  shadow: true,
  stickyButton: true,
  mobileFullscreen: false,
  formStyle: "modern",
  fontFamily: "Inter, sans-serif",
  buttonColor: "#008060",
  hideCloseButton: false,
  hideFieldLabels: false,
  rtlSupport: false,
};

// تكوين زر الشراء المشترك
const COMMON_BUY_BUTTON = {
  text: "",
  subtitle: "",
  animation: "none",
  icon: "bag",
  stickyPosition: "bottom",
  backgroundColor: "rgba(0,0,0,1)",
  textColor: "rgba(255,255,255,1)",
  fontSize: 16,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: "rgba(0,0,0,1)",
  shadow: true,
  mobileSticky: false
};

// تكوينات الحقول لكل لغة
const FIELD_TEMPLATES = {
  // قسم ملخص الإجمالي
  totalsSection: (lang: Record<string, string>): FormField => ({
    id: 15,
    label: lang.totalsSectionLabel || "TOTALS SUMMARY",
    movable: true,
    visible: true,
    type: "section",
    totalSettings: {
      subtotalTitle: lang.subtotalTitle || "Subtotal",
      subtotalValue: "19.99 $",
      shippingTitle: lang.shippingTitle || "Shipping",
      shippingValue: lang.freeShipping || "Free",
      discountTitle: lang.discountTitle || "Discount",
      discountValue: "",
      totalTitle: lang.totalTitle || "Total",
      totalValue: "19.99 $",
      showTaxesMessage: false,
      backgroundColor: "rgba(235,235,235,1)"
    }
  }),

  // قسم طرق الشحن
  shippingSection: (lang: Record<string, string>): FormField => ({
    id: 2,
    label: lang.shippingSectionLabel || "SHIPPING RATES",
    movable: true,
    visible: true,
    type: "section",
    shippingSettings: {
      title: lang.shippingMethod || "Shipping method",
      freeText: lang.freeShipping || "Free",
      fontSize: 16
    }
  }),

  // قسم المناطق الترويجية
  upsellSection: (lang: Record<string, string>): FormField => ({
    id: 3,
    label: lang.upsellSectionLabel || "UPSELL AREAS",
    movable: true,
    visible: true,
    type: "section"
  }),

  // قسم العنوان
  addressSection: (lang: Record<string, string>): FormField => ({
    id: 5,
    label: lang.addressSectionLabel || "Enter your shipping address",
    movable: false,
    visible: true,
    type: "section",
    sectionSettings: {
      customText: lang.addressSectionText || "Enter your shipping address",
      alignment: "center",
      fontSize: 16,
      fontWeight: "bold",
      textColor: "#000000"
    }
  }),

  // حقل الاسم الأول
  firstNameField: (lang: Record<string, string>): FormField => ({
    id: 6,
    label: lang.firstNameLabel || "First name",
    movable: true,
    visible: true,
    type: "input",
    required: true,
    displayLabel: lang.firstNameLabel || "First name",
    placeholder: lang.firstNamePlaceholder || "First name",
    showIcon: true,
    minLength: 2,
    maxLength: 250,
    errorText: lang.firstNameError || "Please enter a valid first name"
  }),

  // حقل الاسم الأخير
  lastNameField: (lang: Record<string, string>): FormField => ({
    id: 7,
    label: lang.lastNameLabel || "Last name",
    movable: true,
    visible: false,
    type: "input",
    required: true,
    displayLabel: lang.lastNameLabel || "Last name",
    placeholder: lang.lastNamePlaceholder || "Last name",
    showIcon: true,
    minLength: 2,
    maxLength: 250,
    errorText: lang.lastNameError || "Please enter a valid last name"
  }),

  // حقل رقم الهاتف
  phoneField: (lang: Record<string, string>): FormField => ({
    id: 8,
    label: lang.phoneLabel || "Phone number",
    movable: true,
    visible: true,
    type: "input",
    required: true,
    displayLabel: lang.phoneLabel || "Phone number",
    placeholder: lang.phonePlaceholder || "Phone number",
    showIcon: true,
    minLength: 10,
    maxLength: 15,
    errorText: lang.phoneError || "Please enter a valid phone number"
  }),

  // حقل العنوان
  addressField: (lang: Record<string, string>): FormField => ({
    id: 9,
    label: lang.addressLabel || "Address",
    movable: true,
    visible: true,
    type: "input",
    required: true,
    displayLabel: lang.addressLabel || "Address",
    placeholder: lang.addressPlaceholder || "Address",
    showIcon: true,
    minLength: 5,
    maxLength: 250,
    errorText: lang.addressError || "Please enter a valid address"
  }),

  // حقل العنوان 2
  address2Field: (lang: Record<string, string>): FormField => ({
    id: 10,
    label: lang.address2Label || "Address 2",
    movable: true,
    visible: false,
    type: "input",
    required: false,
    displayLabel: lang.address2Label || "Address 2",
    placeholder: lang.address2Placeholder || "Address 2 (optional)",
    showIcon: false,
    minLength: 0,
    maxLength: 250,
    errorText: ""
  }),

  // حقل المحافظة/الولاية
  provinceField: (lang: Record<string, string>): FormField => ({
    id: 11,
    label: lang.provinceLabel || "Province",
    movable: true,
    visible: false,
    type: "input",
    required: true,
    displayLabel: lang.provinceLabel || "Province",
    placeholder: lang.provincePlaceholder || "Province",
    showIcon: false,
    minLength: 2,
    maxLength: 50,
    errorText: lang.provinceError || "Please enter a valid province"
  }),

  // حقل المدينة
  cityField: (lang: Record<string, string>): FormField => ({
    id: 12,
    label: lang.cityLabel || "City",
    movable: true,
    visible: true,
    type: "input",
    required: true,
    displayLabel: lang.cityLabel || "City",
    placeholder: lang.cityPlaceholder || "City",
    showIcon: true,
    minLength: 2,
    maxLength: 50,
    errorText: lang.cityError || "Please enter a valid city"
  }),

  // حقل الرمز البريدي
  zipField: (lang: Record<string, string>): FormField => ({
    id: 13,
    label: lang.zipLabel || "Zip code",
    movable: true,
    visible: false,
    type: "input",
    required: true,
    displayLabel: lang.zipLabel || "Zip code",
    placeholder: lang.zipPlaceholder || "Zip code",
    showIcon: false,
    minLength: 3,
    maxLength: 10,
    errorText: lang.zipError || "Please enter a valid zip code"
  }),

  // حقل البريد الإلكتروني
  emailField: (lang: Record<string, string>): FormField => ({
    id: 14,
    label: lang.emailLabel || "Email",
    movable: true,
    visible: false,
    type: "input",
    required: true,
    displayLabel: lang.emailLabel || "Email",
    placeholder: lang.emailPlaceholder || "Email address",
    showIcon: false,
    minLength: 5,
    maxLength: 100,
    errorText: lang.emailError || "Please enter a valid email address"
  }),

  // زر الإرسال
  submitButton: (lang: Record<string, string>): FormField => ({
    id: 16,
    label: lang.submitButtonLabel || "SUBMIT BUTTON",
    movable: true,
    visible: true,
    type: "button",
    buttonSettings: {
      buttonText: lang.submitButtonText || "COMPLETE ORDER - {order_total}",
      buttonSubtitle: lang.buttonSubtitle || "Cash On Delivery",
      buttonAnimation: "none",
      buttonIcon: "bag",
      backgroundColor: "rgba(0,0,0,1)",
      textColor: "rgba(255,255,255,1)",
      fontSize: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "rgba(0,0,0,1)",
      shadow: true
    }
  })
};

// ترجمات لكل لغة
export const TRANSLATIONS = {
  // الإنجليزية
  en: {
    // العناوين الرئيسية
    title: "CASH ON DELIVERY",
    buttonText: "Complete Order", // زر النموذج الرئيسي
    successMessage: "Thank you for your order!",
    errorMessage: "Something went wrong!",

    // زر الشراء
    buyButtonText: "Buy with Cash on Delivery",

    // رسالة الشكر
    thankYouMessage: "Thank you for your purchase! 🎉\nWe will contact you soon to confirm your order. ✅",

    // حقول النموذج
    totalsSectionLabel: "TOTALS SUMMARY",
    subtotalTitle: "Subtotal",
    shippingTitle: "Shipping",
    freeShipping: "Free",
    discountTitle: "Discount",
    totalTitle: "Total",

    shippingSectionLabel: "SHIPPING RATES",
    shippingMethod: "Shipping method",

    upsellSectionLabel: "UPSELL AREAS",

    addressSectionLabel: "Enter your shipping address",
    addressSectionText: "Enter your shipping address",

    firstNameLabel: "First name",
    firstNamePlaceholder: "First name",
    firstNameError: "Please enter a valid first name",

    lastNameLabel: "Last name",
    lastNamePlaceholder: "Last name",
    lastNameError: "Please enter a valid last name",

    phoneLabel: "Phone number",
    phonePlaceholder: "Phone number",
    phoneError: "Please enter a valid phone number",

    addressLabel: "Address",
    addressPlaceholder: "Address",
    addressError: "Please enter a valid address",

    address2Label: "Address 2",
    address2Placeholder: "Address 2 (optional)",

    provinceLabel: "Province",
    provincePlaceholder: "Province",
    provinceError: "Please enter a valid province",

    cityLabel: "City",
    cityPlaceholder: "City",
    cityError: "Please enter a valid city",

    zipLabel: "Zip code",
    zipPlaceholder: "Zip code",
    zipError: "Please enter a valid zip code",

    emailLabel: "Email",
    emailPlaceholder: "Email address",
    emailError: "Please enter a valid email address",

    submitButtonLabel: "SUBMIT BUTTON",
    submitButtonText: "COMPLETE ORDER - {order_total}",
    buttonSubtitle: "Cash On Delivery"
  },

  // العربية
  ar: {
    title: "الدفع عند الاستلام",
    buttonText: "إكمال الطلب",
    successMessage: "شكرًا لك على طلبك!",
    errorMessage: "حدث خطأ ما!",

    buyButtonText: "شراء بالدفع عند الاستلام",

    thankYouMessage: "شكرًا لك على شرائك! 🎉\nسنتواصل معك قريبًا لتأكيد طلبك. ✅",

    totalsSectionLabel: "ملخص الإجمالي",
    subtotalTitle: "المجموع الفرعي",
    shippingTitle: "الشحن",
    freeShipping: "مجاني",
    discountTitle: "الخصم",
    totalTitle: "الإجمالي",

    shippingSectionLabel: "أسعار الشحن",
    shippingMethod: "طريقة الشحن",

    upsellSectionLabel: "مناطق البيع الإضافي",

    addressSectionLabel: "أدخل عنوان الشحن",
    addressSectionText: "أدخل عنوان الشحن الخاص بك",

    firstNameLabel: "firstname",
    firstNamePlaceholder: "الاسم الأول",
    firstNameError: "يرجى إدخال اسم أول صالح",

    lastNameLabel: "lastname",
    lastNamePlaceholder: "الاسم الأخير",
    lastNameError: "يرجى إدخال اسم أخير صالح",

    phoneLabel: "phonenumber",
    phonePlaceholder: "رقم الهاتف",
    phoneError: "يرجى إدخال رقم هاتف صالح",

    addressLabel: "address",
    addressPlaceholder: "العنوان",
    addressError: "يرجى إدخال عنوان صالح",

    address2Label: "address2",
    address2Placeholder: "العنوان 2 (اختياري)",

    provinceLabel: "province",
    provincePlaceholder: "المحافظة",
    provinceError: "يرجى إدخال محافظة صالحة",

    cityLabel: "city",
    cityPlaceholder: "المدينة",
    cityError: "يرجى إدخال مدينة صالحة",

    zipLabel: "zipcode",
    zipPlaceholder: "الرمز البريدي",
    zipError: "يرجى إدخال رمز بريدي صالح",

    emailLabel: "email",
    emailPlaceholder: "عنوان البريد الإلكتروني",
    emailError: "يرجى إدخال عنوان بريد إلكتروني صالح",

    submitButtonLabel: "زر الإرسال",
    submitButtonText: "إكمال الطلب - {order_total}",
    buttonSubtitle: "الدفع عند الاستلام"
  },

  // الفرنسية
  fr: {
    title: "PAIEMENT À LA LIVRAISON",
    buttonText: "Terminer la commande",
    successMessage: "Merci pour votre commande !",
    errorMessage: "Quelque chose s'est mal passé !",

    buyButtonText: "Acheter avec paiement à la livraison",

    thankYouMessage: "Merci pour votre achat ! 🎉\nNous vous contacterons bientôt pour confirmer votre commande. ✅",

    totalsSectionLabel: "RÉSUMÉ DES TOTAUX",
    subtotalTitle: "Sous-total",
    shippingTitle: "Livraison",
    freeShipping: "Gratuit",
    discountTitle: "Remise",
    totalTitle: "Total",

    shippingSectionLabel: "TARIFS DE LIVRAISON",
    shippingMethod: "Méthode de livraison",

    upsellSectionLabel: "ZONES DE VENTE INCITATIVE",

    addressSectionLabel: "Entrez votre adresse de livraison",
    addressSectionText: "Entrez votre adresse de livraison",

    firstNameLabel: "firstname",
    firstNamePlaceholder: "Prénom",
    firstNameError: "Veuillez entrer un prénom valide",

    lastNameLabel: "lastname",
    lastNamePlaceholder: "Nom",
    lastNameError: "Veuillez entrer un nom valide",

    phoneLabel: "phonenumber",
    phonePlaceholder: "Numéro de téléphone",
    phoneError: "Veuillez entrer un numéro de téléphone valide",

    addressLabel: "address",
    addressPlaceholder: "Adresse",
    addressError: "Veuillez entrer une adresse valide",

    address2Label: "address2",
    address2Placeholder: "Adresse 2 (optionnel)",

    provinceLabel: "province",
    provincePlaceholder: "Province",
    provinceError: "Veuillez entrer une province valide",

    cityLabel: "city",
    cityPlaceholder: "Ville",
    cityError: "Veuillez entrer une ville valide",

    zipLabel: "zipcode",
    zipPlaceholder: "Code postal",
    zipError: "Veuillez entrer un code postal valide",

    emailLabel: "email",
    emailPlaceholder: "Adresse email",
    emailError: "Veuillez entrer une adresse email valide",

    submitButtonLabel: "BOUTON D'ENVOI",
    submitButtonText: "TERMINER LA COMMANDE - {order_total}",
    buttonSubtitle: "Paiement à la livraison"
  },

  // الإسبانية
  es: {
    title: "PAGO CONTRA REEMBOLSO",
    buttonText: "Completar pedido",
    successMessage: "¡Gracias por su pedido!",
    errorMessage: "¡Algo salió mal!",

    buyButtonText: "Comprar con pago contra reembolso",

    thankYouMessage: "¡Gracias por su compra! 🎉\nNos pondremos en contacto pronto para confirmar su pedido. ✅",

    totalsSectionLabel: "RESUMEN DE TOTALES",
    subtotalTitle: "Subtotal",
    shippingTitle: "Envío",
    freeShipping: "Gratis",
    discountTitle: "Descuento",
    totalTitle: "Total",

    shippingSectionLabel: "TARIFAS DE ENVÍO",
    shippingMethod: "Método de envío",

    upsellSectionLabel: "ZONAS DE VENTA ADICIONAL",

    addressSectionLabel: "Ingrese su dirección de envío",
    addressSectionText: "Ingrese su dirección de envío",

    firstNameLabel: "firstname",
    firstNamePlaceholder: "Nombre",
    firstNameError: "Por favor ingrese un nombre válido",

    lastNameLabel: "lastname",
    lastNamePlaceholder: "Apellido",
    lastNameError: "Por favor ingrese un apellido válido",

    phoneLabel: "phonenumber",
    phonePlaceholder: "Número de teléfono",
    phoneError: "Por favor ingrese un número de teléfono válido",

    addressLabel: "address",
    addressPlaceholder: "Dirección",
    addressError: "Por favor ingrese una dirección válida",

    address2Label: "address2",
    address2Placeholder: "Dirección 2 (opcional)",

    provinceLabel: "province",
    provincePlaceholder: "Provincia",
    provinceError: "Por favor ingrese una provincia válida",

    cityLabel: "city",
    cityPlaceholder: "Ciudad",
    cityError: "Por favor ingrese una ciudad válida",

    zipLabel: "zipcode",
    zipPlaceholder: "Código postal",
    zipError: "Por favor ingrese un código postal válido",

    emailLabel: "email",
    emailPlaceholder: "Dirección de email",
    emailError: "Por favor ingrese una dirección de email válida",

    submitButtonLabel: "BOTÓN DE ENVÍO",
    submitButtonText: "COMPLETAR PEDIDO - {order_total}",
    buttonSubtitle: "Pago contra reembolso"
  },

  // الألمانية
  de: {
    title: "NACHNAHME",
    buttonText: "Bestellung abschließen",
    successMessage: "Vielen Dank für Ihre Bestellung!",
    errorMessage: "Etwas ist schief gelaufen!",

    buyButtonText: "Kaufen mit Nachnahme",

    thankYouMessage: "Vielen Dank für Ihren Einkauf! 🎉\nWir werden uns bald mit Ihnen in Verbindung setzen, um Ihre Bestellung zu bestätigen. ✅",

    totalsSectionLabel: "SUMMENZUSAMMENFASSUNG",
    subtotalTitle: "Zwischensumme",
    shippingTitle: "Versand",
    freeShipping: "Kostenlos",
    discountTitle: "Rabatt",
    totalTitle: "Gesamt",

    shippingSectionLabel: "VERSANDKOSTEN",
    shippingMethod: "Versandart",

    upsellSectionLabel: "UPSELL-BEREICHE",

    addressSectionLabel: "Geben Sie Ihre Lieferadresse ein",
    addressSectionText: "Geben Sie Ihre Lieferadresse ein",

    firstNameLabel: "firstname",
    firstNamePlaceholder: "Vorname",
    firstNameError: "Bitte geben Sie einen gültigen Vornamen ein",

    lastNameLabel: "lastname",
    lastNamePlaceholder: "Nachname",
    lastNameError: "Bitte geben Sie einen gültigen Nachnamen ein",

    phoneLabel: "phonenumber",
    phonePlaceholder: "Telefonnummer",
    phoneError: "Bitte geben Sie eine gültige Telefonnummer ein",

    addressLabel: "address",
    addressPlaceholder: "Adresse",
    addressError: "Bitte geben Sie eine gültige Adresse ein",

    address2Label: "address2",
    address2Placeholder: "Adresse 2 (optional)",

    provinceLabel: "province",
    provincePlaceholder: "Bundesland",
    provinceError: "Bitte geben Sie ein gültiges Bundesland ein",

    cityLabel: "city",
    cityPlaceholder: "Stadt",
    cityError: "Bitte geben Sie eine gültige Stadt ein",

    zipLabel: "zipcode",
    zipPlaceholder: "Postleitzahl",
    zipError: "Bitte geben Sie eine gültige Postleitzahl ein",

    emailLabel: "email",
    emailPlaceholder: "E-Mail-Adresse",
    emailError: "Bitte geben Sie eine gültige E-Mail-Adresse ein",

    submitButtonLabel: "SENDEN-KNOPS",
    submitButtonText: "BESTELLUNG ABSCHLIESSEN - {order_total}",
    buttonSubtitle: "Nachnahme"
  },

  // التركية
  tr: {
    title: "KAPIDA ÖDEME",
    buttonText: "Siparişi Tamamla",
    successMessage: "Siparişiniz için teşekkürler!",
    errorMessage: "Bir şeyler yanlış gitti!",

    buyButtonText: "Kapıda Ödeme ile Satın Al",

    thankYouMessage: "Satın aldığınız için teşekkürler! 🎉\nSiparişinizi onaylamak için yakında sizinle iletişime geçeceğiz. ✅",

    totalsSectionLabel: "TOPLAM ÖZETİ",
    subtotalTitle: "Ara Toplam",
    shippingTitle: "Kargo",
    freeShipping: "Ücretsiz",
    discountTitle: "Indirim",
    totalTitle: "Toplam",

    shippingSectionLabel: "KARGO ÜCRETLERİ",
    shippingMethod: "Kargo yöntemi",

    upsellSectionLabel: "EK SATIŞ ALANLARI",

    addressSectionLabel: "Teslimat adresinizi girin",
    addressSectionText: "Teslimat adresinizi girin",

    firstNameLabel: "firstname",
    firstNamePlaceholder: "Ad",
    firstNameError: "Lütfen geçerli bir ad girin",

    lastNameLabel: "lastname",
    lastNamePlaceholder: "Soyad",
    lastNameError: "Lütfen geçerli bir soyad girin",

    phoneLabel: "phonenumber",
    phonePlaceholder: "Telefon numarası",
    phoneError: "Lütfen geçerli bir telefon numarası girin",

    addressLabel: "address",
    addressPlaceholder: "Adres",
    addressError: "Lütfen geçerli bir adres girin",

    address2Label: "address2",
    address2Placeholder: "Adres 2 (isteğe bağlı)",

    provinceLabel: "province",
    provincePlaceholder: "İl",
    provinceError: "Lütfen geçerli bir il girin",

    cityLabel: "city",
    cityPlaceholder: "Şehir",
    cityError: "Lütfen geçerli bir şehir girin",

    zipLabel: "zipcode",
    zipPlaceholder: "Posta kodu",
    zipError: "Lütfen geçerli bir posta kodu girin",

    emailLabel: "email",
    emailPlaceholder: "E-posta adresi",
    emailError: "Lütfen geçerli bir e-posta adresi girin",

    submitButtonLabel: "GÖNDER DÜĞMESİ",
    submitButtonText: "SİPARİŞİ TAMAMLA - {order_total}",
    buttonSubtitle: "Kapıda Ödeme"
  }
};


export function createDefaultFormConfig(language: string = "en", shop?: string): FormConfig {
  const lang = TRANSLATIONS[language as keyof typeof TRANSLATIONS] || TRANSLATIONS.en;

  const isRTL = language === 'ar';
  
  const fields: FormField[] = [
    FIELD_TEMPLATES.totalsSection(lang),
    FIELD_TEMPLATES.shippingSection(lang),
    FIELD_TEMPLATES.upsellSection(lang),
    FIELD_TEMPLATES.addressSection(lang),
    FIELD_TEMPLATES.firstNameField(lang),
    FIELD_TEMPLATES.lastNameField(lang),
    FIELD_TEMPLATES.phoneField(lang),
    FIELD_TEMPLATES.addressField(lang),
    FIELD_TEMPLATES.address2Field(lang),
    FIELD_TEMPLATES.provinceField(lang),
    FIELD_TEMPLATES.cityField(lang),
    FIELD_TEMPLATES.zipField(lang),
    FIELD_TEMPLATES.emailField(lang),
    FIELD_TEMPLATES.submitButton(lang)
  ];

  return {
    ...COMMON_CONFIG_BASE,
    title: lang.title,
    buttonText: lang.buttonText,
    successMessage: lang.successMessage,
    errorMessage: lang.errorMessage,
    rtlSupport: isRTL,
    buyButton: {
      ...COMMON_BUY_BUTTON,
      text: lang.buyButtonText
    },
    fields
  };
}

// وظيفة للحصول على جميع التكوينات الافتراضية
export function getAllDefaultConfigs(shop?: string): Record<string, FormConfig> {
  const configs: Record<string, FormConfig> = {};

  Object.keys(TRANSLATIONS).forEach(lang => {
    configs[lang] = createDefaultFormConfig(lang, shop);
  });

  return configs;
}

// وظيفة مساعدة للحصول على لغة افتراضية بناءً على الدولة
export function getLanguageByCountry(countryCode: string): string {
  const countryLanguageMap: Record<string, string> = {
    // countries arabic
    'SA': 'ar', // السعودية
    'AE': 'ar', // الإمارات
    'EG': 'ar', // مصر
    'MA': 'fr', // المغرب (فرنسية)
    'DZ': 'ar', // الجزائر
    'TN': 'ar', // تونس
    'JO': 'ar', // الأردن
    'LB': 'ar', // لبنان
    'KW': 'ar', // الكويت
    'QA': 'ar', // قطر
    'BH': 'ar', // البحرين
    'OM': 'ar', // عمان
    'YE': 'ar', // اليمن
    'IQ': 'ar', // العراق
    'SY': 'ar', // سوريا

    // أوروبا
    'FR': 'fr', // فرنسا
    'BE': 'fr', // بلجيكا (فرنسية)
    'CH': 'de', // سويسرا (ألمانية)
    'DE': 'de', // ألمانيا
    'AT': 'de', // النمسا
    'ES': 'es', // إسبانيا
    'IT': 'it', // إيطاليا
    'PT': 'pt', // البرتغال
    'GB': 'en', // بريطانيا
    'IE': 'en', // أيرلندا
    'TR': 'tr', // تركيا
    'NL': 'nl', // هولندا
    'SE': 'sv', // السويد
    'NO': 'no', // النرويج
    'DK': 'da', // الدنمارك
    'FI': 'fi', // فنلندا
    'PL': 'pl', // بولندا
    'RU': 'ru', // روسيا
    'UA': 'uk', // أوكرانيا

    // أمريكا الشمالية
    'US': 'en', // الولايات المتحدة
    'CA': 'en', // كندا (الإنجليزية)
    'MX': 'es', // المكسيك

    // أمريكا الجنوبية
    'BR': 'pt', // البرازيل
    'AR': 'es', // الأرجنتين
    'CL': 'es', // تشيلي
    'CO': 'es', // كولومبيا
    'PE': 'es', // بيرو

    // آسيا
    'CN': 'zh', // الصين
    'JP': 'ja', // اليابان
    'KR': 'ko', // كوريا الجنوبية
    'IN': 'hi', // الهند
    'ID': 'id', // إندونيسيا
    'TH': 'th', // تايلاند
    'VN': 'vi', // فيتنام
    'PH': 'fil', // الفلبين
    'MY': 'ms', // ماليزيا
    'SG': 'en', // سنغافورة

    // أفريقيا
    'ZA': 'en', // جنوب أفريقيا
    'NG': 'en', // نيجيريا
    'KE': 'sw', // كينيا
    'ET': 'am', // إثيوبيا
    'GH': 'en'  // غانا
  };

  return countryLanguageMap[countryCode.toUpperCase()] || 'en';
}

// تصدير التكوين الافتراضي (الإنجليزية)
export const DEFAULT_FORM_CONFIG = createDefaultFormConfig('en');