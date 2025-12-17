import { FormField, SectionSettings, TotalSettings, ShippingSettings, DiscountSettings } from '../../../types/formTypes';

export const getSectionSettings = (fields: FormField[], fieldId: number): SectionSettings => {
  const field = fields.find(f => f.id === fieldId);

  if (!field || !field.sectionSettings) {
    return {
      customText: field?.label || 'Enter your shipping address',
      alignment: 'center' as const,
      fontSize: 16,
      fontWeight: 'bold' as const,
      textColor: '#000000'
    };
  }

  return {
    customText: field.sectionSettings.customText || field.label,
    alignment: field.sectionSettings.alignment || 'center',
    fontSize: field.sectionSettings.fontSize || 16,
    fontWeight: field.sectionSettings.fontWeight || 'bold',
    textColor: field.sectionSettings.textColor || '#000000'
  };
};

export const getTotalsSettings = (fields: FormField[], fieldId: number): TotalSettings => {
  const field = fields.find(f => f.id === fieldId);

  if (!field || !field.totalSettings) {
    return {
      subtotalTitle: 'Subtotal',
      subtotalValue: '199.99 $',
      shippingTitle: 'Shipping',
      shippingValue: 'Free',
      totalTitle: 'Total',
      totalValue: '199.99 $',
      showTaxesMessage: false,
      backgroundColor: 'rgba(235,235,235,1)'
    };
  }

  return field.totalSettings;
};

export const getShippingSettings = (fields: FormField[], fieldId: number): ShippingSettings => {
  const field = fields.find(f => f.id === fieldId);

  if (!field || !field.shippingSettings) {
    return {
      title: 'Shipping method',
      freeText: 'Free',
      fontSize: 16
    };
  }

  return field.shippingSettings;
};

export const getDiscountSettings = (fields: FormField[], fieldId: number): DiscountSettings => {
  const field = fields.find(f => f.id === fieldId);

  if (!field || !field.discountSettings) {
    return {
      limitOnePerOrder: true,
      discountsLineText: 'Discounts',
      fieldLabel: 'Discount code',
      applyButtonText: 'Apply',
      buttonBackgroundColor: 'rgba(0,0,0,1)',
      invalidCodeError: 'Enter a valid discount code.',
      limitError: 'Only 1 discount per order is allowed.'
    };
  }

  return field.discountSettings;
};