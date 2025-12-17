import { billingService } from "./billingService";

interface BillingConfig {
  name: string;
  price: number;
  interval: 'EVERY_30_DAYS' | 'ANNUAL';
  trialDays?: number;
}

export class ShopifyBillingService {
  // إنشاء شحن متكرر في Shopify باستخدام REST API
  async createRecurringChargeRest(shop: string, config: BillingConfig, accessToken: string) {
    if (!accessToken) {
      throw new Error('Access token is required');
    }

    const shopOnlyName = shop.replace(".myshopify.com", "");

    const returnUrl = `https://admin.shopify.com/store/${shopOnlyName}/apps/formino/app/billing`;
    const test = process.env.NODE_ENV !== 'production';

    // تأكد من أن السعر هو رقم وليس سلسلة نصية
    const price = Number(config.price);

    const chargeData = {
      recurring_application_charge: {
        name: config.name,
        price: price,
        return_url: returnUrl,
        test: test,
        trial_days: config.trialDays || 0,
        // إزالة capped_amount لأنه غير مطلوب للشحن البسيط
      }
    };

    console.log('Creating charge with data:', JSON.stringify(chargeData, null, 2));

    try {
      const response = await fetch(`https://${shop}/admin/api/2024-01/recurring_application_charges.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify(chargeData),
      });

      const responseText = await response.text();
      console.log('Shopify API Response status:', response.status);
      console.log('Shopify API Response body:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Failed to parse JSON response: ${responseText}`);
      }

      if (result.errors) {
        console.error('REST API Errors:', result.errors);
        throw new Error(`REST API Error: ${JSON.stringify(result.errors)}`);
      }

      // التحقق من وجود confirmation_url
      if (!result.recurring_application_charge?.confirmation_url) {
        throw new Error('No confirmation URL received from Shopify');
      }

      return {
        confirmationUrl: result.recurring_application_charge.confirmation_url,
        chargeId: result.recurring_application_charge.id
      };

    } catch (error) {
      console.error('Shopify REST API Error:', error);
      throw error;
    }
  }

  // طريقة بديلة أبسط للشحن
  async createSimpleCharge(shop: string, config: BillingConfig, accessToken: string) {
    if (!accessToken) {
      throw new Error('Access token is required');
    }

    const shopOnlyName = shop.replace(".myshopify.com", "");

    const returnUrl = `https://admin.shopify.com/store/${shopOnlyName}/apps/formino/app/billing`;
    const test = process.env.NODE_ENV !== 'production';

    // بيانات مبسطة للشحن
    const chargeData = {
      recurring_application_charge: {
        name: config.name.substring(0, 255), // تأكد من أن الاسم ليس طويلاً جداً
        price: Number(config.price).toFixed(2), // تأكد من أن السعر بصيغة صحيحة
        return_url: returnUrl,
        test: test
      }
    };

    console.log('Creating simple charge with data:', JSON.stringify(chargeData, null, 2));

    try {
      const response = await fetch(`https://${shop}/admin/api/2024-01/recurring_application_charges.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify(chargeData),
      });

      const responseText = await response.text();
      console.log('Shopify API Response status:', response.status);
      console.log('Shopify API Response body:', responseText);

      if (!response.ok) {
        // محاولة الحصول على تفاصيل الخطأ
        let errorDetails = responseText;
        try {
          const errorJson = JSON.parse(responseText);
          errorDetails = JSON.stringify(errorJson, null, 2);
        } catch (e) {
          // ابقى مع النص الأصلي
        }
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorDetails}`);
      }

      const result = JSON.parse(responseText);

      if (result.errors) {
        throw new Error(`Shopify API Errors: ${JSON.stringify(result.errors)}`);
      }

      return {
        confirmationUrl: result.recurring_application_charge.confirmation_url,
        chargeId: result.recurring_application_charge.id
      };

    } catch (error) {
      console.error('Shopify API Error:', error);
      throw error;
    }
  }

  // تفعيل الاشتراك بعد الموافقة
  async activateSubscription(shop: string, chargeId: string, accessToken: string) {
    if (!accessToken) {
      throw new Error('Access token is required');
    }

    try {
      const response = await fetch(`https://${shop}/admin/api/2024-01/recurring_application_charges/${chargeId}/activate.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (result.errors) {
        throw new Error(`Activation Error: ${JSON.stringify(result.errors)}`);
      }

      return result.recurring_application_charge;

    } catch (error) {
      console.error('Activation Error:', error);
      throw error;
    }
  }

  async getCurrentCharge(shop: string, accessToken: string) {
    if (!accessToken) {
      throw new Error('Access token is required');
    }

    try {
      // الحصول على جميع الـ charges النشطة
      const response = await fetch(`https://${shop}/admin/api/2024-01/recurring_application_charges.json?status=active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // إرجاع أول charge نشط (يجب أن يكون هناك واحد فقط)
      return result.recurring_application_charges[0] || null;

    } catch (error) {
      console.error('Get current charge error:', error);
      throw error;
    }
  }

  async cancelRecurringCharge(shop: string, chargeId: string, accessToken: string) {
    if (!accessToken) {
      throw new Error('Access token is required');
    }

    try {
      console.log(`🗑️ Deleting Shopify charge: ${chargeId}`);
      const response = await fetch(`https://${shop}/admin/api/2024-01/recurring_application_charges/${chargeId}.json`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
      });

      const responseText = await response.text();
      console.log(`Shopify delete response: ${response.status} - ${responseText}`);

      if (!response.ok) {
        // إذا كان الخطأ 404، يعني الـ charge غير موجود (ربما ألغي مسبقاً)
        if (response.status === 404) {
          console.log(`ℹ️ Charge ${chargeId} already deleted or not found`);
          return true;
        }
        throw new Error(`HTTP error! status: ${response.status}, response: ${responseText}`);
      }

      console.log(`✅ Shopify charge ${chargeId} cancelled successfully`);
      return true;

    } catch (error) {
      console.error('Shopify cancel charge error:', error);
      throw error;
    }
  }

  // الحصول على تفاصيل charge معين
  async getChargeDetails(shop: string, chargeId: string, accessToken: string) {
    if (!accessToken) {
      throw new Error('Access token is required');
    }

    try {
      const response = await fetch(`https://${shop}/admin/api/2024-01/recurring_application_charges/${chargeId}.json`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.log(`Charge ${chargeId} not found or inaccessible: ${response.status}`);
        return null;
      }

      const result = JSON.parse(responseText);
      return result.recurring_application_charge;

    } catch (error) {
      console.error('Error getting charge details:', error);
      return null;
    }
  }

}

export const shopifyBillingService = new ShopifyBillingService();