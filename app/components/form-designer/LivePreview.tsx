import React from "react";
import {
  Card,
  Box,
  BlockStack,
  Text,
  Button,
  InlineStack
} from "@shopify/polaris";
import { ViewIcon } from "@shopify/polaris-icons";

import { LivePreviewProps } from "../../types/formTypes";
import { usePreviewData } from "../sections/hooks/usePreviewData";
import {
  getSectionSettings,
  getTotalsSettings,
  getShippingSettings,
  getDiscountSettings
} from "../sections/utils/fieldSettings";
import { TotalsSummary } from "../sections/livepreview/TotalsSummary";
import { ShippingRates } from "../sections/livepreview/ShippingRates";
import { DiscountCodes } from "../sections/livepreview/DiscountCodes";
import { AddressSection } from "../sections/livepreview/AddressSection";

import styles from '../../routes/app.designer/styles.module.css';

export function LivePreview({ formConfig }: LivePreviewProps) {
  const {
    previewData,
    subscribeChecked,
    setSubscribeChecked,
    updatePreviewData
  } = usePreviewData();

  // دالة لعرض جميع الحقول المرئية
  const renderAllFields = () => {
    const visibleFields = formConfig.fields.filter(field => field.visible);

    return visibleFields.map((field) => {
      switch (field.id) {
        case 15: // TOTALS SUMMARY
          const totalsSettings = getTotalsSettings(formConfig.fields, 15);
          return <TotalsSummary key={field.id} settings={totalsSettings} />;

        case 2: // SHIPPING RATES
          const shippingSettings = getShippingSettings(formConfig.fields, 2);
          return (
            <ShippingRates
              key={field.id}
              settings={shippingSettings}
              formConfig={formConfig}
            />
          );

        case 4: // DISCOUNT CODES
          const discountSettings = getDiscountSettings(formConfig.fields, 4);
          return (
            <DiscountCodes
              key={field.id}
              settings={discountSettings}
              formConfig={formConfig}
              previewData={previewData}
              onUpdateData={updatePreviewData}
            />
          );

        case 3: // UPSELL AREAS
          return <div key={field.id}></div>;

        case 5: // Enter your shipping address
          const sectionSettings = getSectionSettings(formConfig.fields, 5);
          return (
            <AddressSection
              key={field.id}
              settings={sectionSettings}
              formConfig={formConfig}
              previewData={previewData}
              subscribeChecked={subscribeChecked}
              onUpdateData={updatePreviewData}
              onSubscribeChange={setSubscribeChecked}
            />
          );

        case 16: // SUBMIT BUTTON
          const buttonSettings = field.buttonSettings;
          if (!buttonSettings) return null;
          return (
            <div key={field.id} style={{ marginTop: '16px' }}>
              <button
                style={{
                  backgroundColor: buttonSettings.backgroundColor,
                  color: buttonSettings.textColor,
                  fontSize: `${buttonSettings.fontSize}px`,
                  borderRadius: `${buttonSettings.borderRadius}px`,
                  border: `${buttonSettings.borderWidth}px solid ${buttonSettings.borderColor}`,
                  boxShadow: buttonSettings.shadow ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none',
                  padding: '12px 24px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  width: '100%',
                  marginBottom: '8px',
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  alignItems: "center",
                  animation: buttonSettings.buttonAnimation !== 'none' ?
                    `${buttonSettings.buttonAnimation} 2s infinite` : 'none'
                }}
              >
                {buttonSettings.buttonIcon && buttonSettings.buttonIcon !== 'none' && (
                  <span style={{ display: 'flex', alignItems: 'center', marginRight: "10px" }}>
                    {getIconSvg(buttonSettings.buttonIcon)}
                  </span>
                )}
                {buttonSettings.buttonText
                  .replace(/\{order_total\}/g, '15.00 db')
                  .replace(/\{order_subtotal\}/g, '12.00 db')
                }
                {buttonSettings.buttonSubtitle && (
                  <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                    {buttonSettings.buttonSubtitle}
                  </Text>
                )}
              </button>
            </div>
          );
        default:
          // تجاهل الحقول المدخلة - سيتم عرضها في AddressSection
          return null;
      }
    });

  };

  // البحث عن زر الإرسال
  const submitButtonField = formConfig.fields.find(field =>
    field.type === 'button' && field.visible
  );

  return (
    <div className={styles.Previewdisplay}>
      <InlineStack align="space-between" blockAlign="center">
        <Text variant="headingSm" as="h4">Live Preview</Text>
        <Button variant="plain" icon={ViewIcon} size="slim">
          Full
        </Button>
      </InlineStack>
      <div className={formConfig.formType === 'POPUP' ? styles.cardPreviewShow : ''}>
        <Box padding="300">
          <BlockStack gap="300">
            <div
              style={{
                border: `${formConfig.borderWidth}px solid ${formConfig.borderColor}`,
                borderRadius: `${formConfig.borderRadius}px`,
                backgroundColor: formConfig.backgroundColor,
                boxShadow: formConfig.shadow ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none',
                padding: '12px',
                fontSize: `${formConfig.textSize}px`,
                fontFamily: formConfig.fontFamily,
                color: formConfig.textColor,
                direction: formConfig.rtlSupport ? 'rtl' : 'ltr'
              }}
              id="formino-cod-form"
            >
              <BlockStack gap="300">
                <Text variant="headingMd" as="h3" alignment="center">
                  {formConfig.title}
                </Text>

                {/* عرض جميع الحقول مرة واحدة فقط */}
                {renderAllFields()}

                {/* إذا لم يكن هناك زر إرسال في الحقول، نعرض زر افتراضي */}
                {!submitButtonField && (
                  <div style={{ marginTop: '16px' }}>
                    <button
                      style={{
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        fontSize: '16px',
                        borderRadius: '8px',
                        border: '1px solid #000000',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        padding: '12px 24px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      COMPLETE ORDER - 15.00 db
                    </button>
                  </div>
                )}
              </BlockStack>
            </div>
          </BlockStack>
          <Box padding="300">
            <Text as="p" variant="bodySm" alignment="center" tone="subdued">
              © 2025 My Store. Secure COD Form
            </Text>
          </Box>
        </Box>
      </div>
      <div>
        <Box paddingBlockStart="300">
          <Text as="p" variant="bodySm" tone="subdued">
            Form Type: <strong>{formConfig.formType}</strong> |
            Visible Fields: <strong>{formConfig.fields.filter(f => f.visible).length}</strong> |
            Hide Labels: <strong>{formConfig.hideFieldLabels ? 'Yes' : 'No'}</strong> |
            Submit Button: <strong>{submitButtonField ? 'Custom' : 'Default'}</strong>
          </Text>
        </Box>
      </div>

      {/* إضافة أنماط CSS للأنيميشن */}
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          @keyframes bounce {
            0%, 20%, 53%, 80%, 100% { 
              transform: translate3d(0,0,0); 
            }
            40%, 43% { 
              transform: translate3d(0,-8px,0); 
            }
            70% { 
              transform: translate3d(0,-4px,0); 
            }
            90% { 
              transform: translate3d(0,-2px,0); 
            }
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
            20%, 40%, 60%, 80% { transform: translateX(2px); }
          }
        `}
      </style>
    </div>
  );
}


function getIconSvg(icon: string) {
  // console.log(icon)
  switch (icon) {
    case 'cart':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="24" height="24" fill="currentColor">
          <path d="M6.25 11.25a.75.75 0 0 0 0 1.5h2.75a.75.75 0 0 0 0-1.5h-2.75Z" />
          <path fillRule="evenodd" d="M2.5 7.25a2.75 2.75 0 0 1 2.75-2.75h9.5a2.75 2.75 0 0 1 2.75 2.75v5.5a2.75 2.75 0 0 1-2.75 2.75h-9.5a2.75 2.75 0 0 1-2.75-2.75v-5.5Zm12.25-1.25c.69 0 1.25.56 1.25 1.25h-12c0-.69.56-1.25 1.25-1.25h9.5Zm1.25 3.25h-12v3.5c0 .69.56 1.25 1.25 1.25h9.5c.69 0 1.25-.56 1.25-1.25v-3.5Z" />
        </svg>
      );
    case 'star':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="24" height="24" fill="currentColor">
          <path d="M11.128 4.123c-.453-.95-1.803-.95-2.256 0l-1.39 2.912-3.199.421c-1.042.138-1.46 1.422-.697 2.146l2.34 2.222-.587 3.172c-.192 1.034.901 1.828 1.825 1.327l2.836-1.54 2.836 1.54c.924.501 2.017-.293 1.825-1.327l-.587-3.172 2.34-2.222c.762-.724.345-2.008-.697-2.146l-3.2-.421-1.389-2.912Z" />
        </svg>
      );
    case 'truck':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="24" height="24" fill="currentColor">
          <path fillRule="evenodd" d="M4 5.25a.75.75 0 0 1 .75-.75h6.991a2.75 2.75 0 0 1 2.645 1.995l.427 1.494a.25.25 0 0 0 .18.173l1.681.421a1.75 1.75 0 0 1 1.326 1.698v1.219a1.75 1.75 0 0 1-1.032 1.597 2.5 2.5 0 1 1-4.955.153h-3.025a2.5 2.5 0 1 1-4.78-.75h-.458a.75.75 0 0 1 0-1.5h2.5c.03 0 .06.002.088.005a2.493 2.493 0 0 1 1.947.745h4.43a2.493 2.493 0 0 1 1.785-.75c.698 0 1.33.286 1.783.748a.25.25 0 0 0 .217-.248v-1.22a.25.25 0 0 0-.19-.242l-1.682-.42a1.75 1.75 0 0 1-1.258-1.217l-.427-1.494a1.25 1.25 0 0 0-1.202-.907h-6.991a.75.75 0 0 1-.75-.75Zm2.5 9.25a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
          <path d="M3.25 8a.75.75 0 0 0 0 1.5h5a.75.75 0 0 0 0-1.5h-5Z" />
        </svg>
      );
    case 'bag':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="24" height="24" fill="currentColor">
          <path fillRule="evenodd" d="M2.5 3.75a.75.75 0 0 1 .75-.75h1.612a1.75 1.75 0 0 1 1.732 1.5h9.656a.75.75 0 0 1 .748.808l-.358 4.653a2.75 2.75 0 0 1-2.742 2.539h-6.351l.093.78a.25.25 0 0 0 .248.22h6.362a.75.75 0 0 1 0 1.5h-6.362a1.75 1.75 0 0 1-1.738-1.543l-1.04-8.737a.25.25 0 0 0-.248-.22h-1.612a.75.75 0 0 1-.75-.75Zm4.868 7.25h6.53a1.25 1.25 0 0 0 1.246-1.154l.296-3.846h-8.667l.595 5Z" />
          <path d="M10 17a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
          <path d="M15 17a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
        </svg>
      );
    case 'heart':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="24" height="24" fill="currentColor">
          <path fill-rule="evenodd" d="M8.469 5.785c-.966-1.047-2.505-1.047-3.47 0-.998 1.081-.998 2.857 0 3.939l5.001 5.42 5.002-5.42c.997-1.082.997-2.858 0-3.939-.966-1.047-2.505-1.047-3.47 0l-.98 1.062a.75.75 0 0 1-1.103 0l-.98-1.062Zm-4.573-1.017c1.56-1.69 4.115-1.69 5.675 0l.429.464.429-.464c1.56-1.69 4.115-1.69 5.675 0 1.528 1.656 1.528 4.317 0 5.973l-5.185 5.62a1.25 1.25 0 0 1-1.838 0l-5.185-5.62c-1.528-1.656-1.528-4.317 0-5.973Z" />
        </svg>
      );
    default:
      return null;
  }
}
