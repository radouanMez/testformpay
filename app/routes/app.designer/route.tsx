import { Page, Layout, Spinner, Frame, Toast } from "@shopify/polaris";
import { useState } from "react";

import { FormTypeSelector } from "../../components/form-designer/FormTypeSelector";
import { CountrySettings } from "../../components/form-designer/CountrySettings";
import { FieldsManager } from "../../components/form-designer/FieldsManager";
import { StylingSettings } from "../../components/form-designer/StylingSettings";
import { TextCustomization } from "../../components/form-designer/TextCustomization";
import { LivePreview } from "../../components/form-designer/LivePreview";
import { BuyButtonSettings } from "../../components/form-designer/BuyButtonSettings";

import { useFormConfig } from "../../hooks/useFormConfig";
import { logFormConfiguration } from "../../utils/formLogger";

import styles from "./styles.module.css";

export default function FormDesigner() {
  const {
    formConfig,
    isLoading,
    updateFormType,
    updateCountrySettings,
    updateFields,
    updateStyleSettings,
    updateTextSettings,
    updatePartialConfig,
    saveConfig
  } = useFormConfig();

  const [showMobilePreview, setShowMobilePreview] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ content: string; error?: boolean } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await saveConfig();
      if (success) {
        logFormConfiguration(formConfig);
        setToast({ content: "✅ Form configuration saved successfully" });
        console.log("✅ Changes saved to database");
      } else {
        setToast({ content: "❌ Failed to save form configuration", error: true });
        console.error("❌ Failed to save changes");
      }
    } catch (error) {
      console.error("❌ Error saving changes:", error);
      setToast({ content: "❌ Error saving form configuration", error: true });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    console.log("❌ Changes cancelled - Form configuration not saved");
    setToast({ content: "❌ Changes cancelled - Form configuration not saved", error: true });
  };

  if (isLoading) {
    return (
      <Frame>
        <Page title="Form Designer">
          <Layout>
            <Layout.Section>
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spinner size="large" />
                <p>Loading form configuration...</p>
              </div>
            </Layout.Section>
          </Layout>
        </Page>
      </Frame>
    );
  }

  return (
    <Frame>
      <Page
        title="Form Designer"
        primaryAction={{
          content: isSaving ? "Saving..." : "Save Changes",
          onAction: handleSave,
          disabled: isSaving
        }}
        secondaryActions={[{ content: "Cancel", onAction: handleCancel }]}
      >
        <Layout>
          <div className={styles.gridContainer}>
            <div className={styles.gridSettings}>
              <Layout.Section>
                <FormTypeSelector
                  selectedFormType={formConfig.formType}
                  setSelectedFormType={updateFormType}
                />
              </Layout.Section>

              <Layout.Section>
                <BuyButtonSettings
                  formConfig={formConfig}
                  updatePartialConfig={updatePartialConfig}
                />
              </Layout.Section>

              <Layout.Section>
                <CountrySettings
                  selectedCountry={formConfig.selectedCountry}
                  setSelectedCountry={(country: any) => updatePartialConfig({ selectedCountry: country })}
                  websiteContained={formConfig.websiteContained}
                  setWebsiteContained={(contained: any) => updatePartialConfig({ websiteContained: contained })}
                />
              </Layout.Section>

              <Layout.Section>
                <FieldsManager
                  formFields={formConfig.fields}
                  setFormFields={updateFields}
                />
              </Layout.Section>

              <Layout.Section>
                <StylingSettings
                  style={{
                    primaryColor: formConfig.primaryColor,
                    backgroundColor: formConfig.backgroundColor,
                    textColor: formConfig.textColor,
                    borderColor: formConfig.borderColor,
                    borderWidth: formConfig.borderWidth,
                    borderRadius: formConfig.borderRadius,
                    textSize: formConfig.textSize,
                    shadow: formConfig.shadow,
                    stickyButton: formConfig.stickyButton,
                    mobileFullscreen: formConfig.mobileFullscreen,
                    formStyle: formConfig.formStyle,
                    fontFamily: formConfig.fontFamily,
                    hideCloseButton: formConfig.hideCloseButton ?? false,
                    hideFieldLabels: formConfig.hideFieldLabels ?? false,
                    rtlSupport: formConfig.rtlSupport ?? false
                  }}
                  setStyle={updateStyleSettings}
                />
              </Layout.Section>

              <Layout.Section>
                <TextCustomization
                  textSettings={{
                    title: formConfig.title,
                    successMessage: formConfig.successMessage,
                    errorMessage: formConfig.errorMessage
                  }}
                  setTextSettings={updateTextSettings}
                />
              </Layout.Section>
            </div>

            <div className={`${styles.fixedPreview} ${!showMobilePreview ? styles.mobileHidden : ''}`}>
              <Layout.Section>
                <div className={styles.livePreviewStyle}>
                  <LivePreview formConfig={formConfig} />
                </div>
              </Layout.Section>
            </div>
          </div>
        </Layout>

        {/* Toast Notification */}
        {toast && (
          <Toast
            content={toast.content}
            error={toast.error}
            onDismiss={() => setToast(null)}
          />
        )}
      </Page>
    </Frame>
  );
}