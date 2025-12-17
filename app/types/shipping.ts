export type ConditionType =
  | 'if_total_greater_or_equal_than'
  | 'if_total_less_than'
  | 'if_weight_greater_or_equal_than'
  | 'if_weight_less_than'
  | 'if_quantity_greater_or_equal_than'
  | 'if_quantity_less_than'
  | 'if_product_included'
  | 'if_product_not_included';

export interface ShippingCondition {
  type: ConditionType;
  value: string;
}

export interface ShippingRate {
  id?: string;
  name: string;
  description?: string;
  price: number;
  conditions?: ShippingCondition[];
  countries?: string[];
}

// ✅ هذا هو النوع الذي كان مفقود
export interface ShippingRateFormData {
  name: string;
  description?: string;
  price: number;
  conditionType?: ConditionType;
  conditionValue?: string;
  countries?: string[];
  conditions?: ShippingCondition[]; // ✅ أضف هذا السطر
}

export interface ShippingSettings {
  id: string;
  shop: string;
  userId: string;
  rates: ShippingRate[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
