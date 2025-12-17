import React from "react";
import { InlineStack, TextField, Box, Checkbox } from "@shopify/polaris";
import { FormConfig, PreviewData } from "../../../types/formTypes";

interface InputFieldsRendererProps {
  formConfig: FormConfig;
  previewData: PreviewData;
  onUpdateData: (field: string, value: string) => void;
}

export function InputFieldsRenderer({ formConfig, previewData, onUpdateData }: InputFieldsRendererProps) {
  const getFieldById = (id: number) => formConfig.fields.find((f) => f.id === id);
  const isHidden = (id: number) => !getFieldById(id)?.visible;

  const renderTextField = (
    field: any,
    valueKey: string,
    autoComplete: string,
    value: string,
    onChange: (value: string) => void
  ) => {
    const fieldLabel = field.displayLabel || field.label;
    const fieldPlaceholder = field.placeholder || field.displayLabel || field.label;

    const showAsterisk = field.required && !formConfig.hideFieldLabels;

    const iconElement = field.showIcon ? getIconForField(valueKey) : null;

    return (
      <div>
        <label>
          {formConfig.hideFieldLabels ? undefined : (showAsterisk ? `${fieldLabel} *` : fieldLabel)}
        </label>
        <div
          key={field.id}
          style={{
            display: "flex",
            alignItems: "stretch",
            width: "100%",
            border: "1px solid #e0e0e0",
            borderRadius: "6px",
            overflow: "hidden",
            height: "47px",
            background: "#fff",
          }}
        >
          {iconElement && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f4f4f4",
                width: "44px",
                borderRight: "1px solid #e0e0e0",
              }}
            >
              {iconElement}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <TextField
              label=""
              placeholder={formConfig.hideFieldLabels ? fieldPlaceholder : fieldPlaceholder}
              value={value}
              onChange={(value: string) => onChange(value)}
              autoComplete={autoComplete}
              labelHidden={formConfig.hideFieldLabels}
              autoFocus={false}
            />
          </div>
        </div>
      </div>
    );
  };

  // ... باقي الكود بدون تغيير
  return (
    <>
      {formConfig.fields.map((field) => {

        if (field.visible && field.label == "Enter your shipping address") {

          return (
            <div className="titleAdresseShipping">
              <h4
                style={{
                  textAlign: field.sectionSettings?.alignment,
                  fontSize: field.sectionSettings?.fontSize,
                  fontWeight: field.sectionSettings?.fontWeight,
                  color: field.sectionSettings?.textColor,
                }}
              >
                {field.sectionSettings?.customText}
              </h4>
            </div>
          );

        }

        if (field.visible && field.type == "subscribe") {

          return (
            <div className="titleSubscribeFormino">
              <Checkbox
                label={field.subscribeSettings?.label}
                checked={field.subscribeSettings?.checkedByDefault}
              />
              <div className="descriptionSubscribeFormino">
                <p>{field.subscribeSettings?.description}</p>
                <p>{field.subscribeSettings?.privacyText}</p>
              </div>
            </div>
          );

        }

        if (!field.visible || field.type !== "input") return null;

        switch (field.id) {

          case 6: {
            const first = getFieldById(6);
            const last = getFieldById(7);
            const bothVisible = first?.visible && last?.visible;

            if (bothVisible) {
              return (
                <InlineStack gap="200" key="first-last">
                  <Box width="100%">
                    {renderTextField(
                      first,
                      "firstName",
                      "given-name",
                      previewData.firstName,
                      (value: string) => onUpdateData("firstName", value)
                    )}
                  </Box>
                  <Box width="100%">
                    {renderTextField(
                      last,
                      "lastName",
                      "family-name",
                      previewData.lastName,
                      (value: string) => onUpdateData("lastName", value)
                    )}
                  </Box>
                </InlineStack>
              );
            }

            return renderTextField(
              first,
              "firstName",
              "given-name",
              previewData.firstName,
              (value: string) => onUpdateData("firstName", value)
            );
          }

          case 7: {
            if (!isHidden(6)) return null;
            const last = getFieldById(7);
            return renderTextField(
              last,
              "lastName",
              "family-name",
              previewData.lastName,
              (value: string) => onUpdateData("lastName", value)
            );
          }

          case 11: {
            const province = getFieldById(11);
            const city = getFieldById(12);
            const bothVisible = province?.visible && city?.visible;

            if (bothVisible) {
              return (
                <InlineStack gap="200" key="province-city">
                  <Box width="100%">
                    {renderTextField(
                      province,
                      "province",
                      "address-level1",
                      previewData.province,
                      (value: string) => onUpdateData("province", value)
                    )}
                  </Box>
                  <Box width="100%">
                    {renderTextField(
                      city,
                      "city",
                      "address-level2",
                      previewData.city,
                      (value: string) => onUpdateData("city", value)
                    )}
                  </Box>
                </InlineStack>
              );
            }

            return renderTextField(
              province,
              "province",
              "address-level1",
              previewData.province,
              (value: string) => onUpdateData("province", value)
            );
          }

          case 12: {
            if (!isHidden(11)) return null;
            const city = getFieldById(12);
            return renderTextField(
              city,
              "city",
              "address-level2",
              previewData.city,
              (value: string) => onUpdateData("city", value)
            );
          }

          case 8:
            return renderTextField(
              field,
              "phone",
              "tel",
              previewData.phone,
              (value: string) => onUpdateData("phone", value)
            );

          case 9:
            return renderTextField(
              field,
              "address",
              "street-address",
              previewData.address,
              (value: string) => onUpdateData("address", value)
            );

          case 10:
            return renderTextField(
              field,
              "address2",
              "address-line2",
              previewData.address2,
              (value: string) => onUpdateData("address2", value)
            );

          case 13:
            return renderTextField(
              field,
              "zipCode",
              "postal-code",
              previewData.zipCode,
              (value: string) => onUpdateData("zipCode", value)
            );

          case 14:
            return renderTextField(
              field,
              "email",
              "email",
              previewData.email,
              (value: string) => onUpdateData("email", value)
            );

          default:
            return null;
        }
      })}
    </>
  );

}

// ... دالة getIconForField تبقى كما هي
const getIconForField = (fieldName: string) => {
  switch (fieldName) {
    case "firstName":
    case "lastName":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="22" height="22">
          <path fill-rule="evenodd" d="M7 8.25a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm3-1.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
          <path fill-rule="evenodd" d="M15.168 15.435a7.5 7.5 0 1 1-10.336-10.87 7.5 7.5 0 0 1 10.336 10.87Zm-9.83-1.659a6 6 0 1 1 9.326 0 7.03 7.03 0 0 0-4.664-1.776 7.03 7.03 0 0 0-4.663 1.776Zm1.086 1.043a5.973 5.973 0 0 0 3.576 1.181c1.34 0 2.577-.44 3.576-1.181a5.53 5.53 0 0 0-3.576-1.319 5.53 5.53 0 0 0-3.576 1.319Z" />
        </svg>
      );

    case "province":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="22" height="22">
          <path fill-rule="evenodd" d="M14.239 4.379a.75.75 0 1 0-1.478-.257l-.457 2.628h-3.478l.413-2.371a.75.75 0 0 0-1.478-.257l-.457 2.628h-2.804a.75.75 0 0 0 0 1.5h2.543l-.609 3.5h-2.434a.75.75 0 0 0 0 1.5h2.174l-.413 2.372a.75.75 0 1 0 1.478.257l.457-2.629h3.478l-.413 2.372a.75.75 0 1 0 1.478.257l.457-2.629h2.804a.75.75 0 0 0 0-1.5h-2.543l.609-3.5h2.434a.75.75 0 0 0 0-1.5h-2.174l.413-2.371Zm-6.282 7.371h3.477l.61-3.5h-3.478l-.61 3.5Z" />
        </svg>
      );

    case "address":
    case "address2":
    case "city":
    case "zipCode":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="22" height="22">
          <path fillRule="evenodd" d="M14.25 16h-3.077l.07-.061a17.427 17.427 0 0 0 1.707-1.758c1.224-1.46 2.55-3.574 2.55-5.954 0-3.167-2.328-5.477-5.5-5.477s-5.5 2.31-5.5 5.477c0 2.38 1.326 4.495 2.55 5.954a17.426 17.426 0 0 0 1.708 1.758l.069.061h-3.077a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5Zm-4.25-5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        </svg>
      );

    case "phone":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="22" height="22">
          <path d="M7.75 13.75a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.75-.75Z" />
          <path fillRule="evenodd" d="M4.75 5.75a2.75 2.75 0 0 1 2.75-2.75h5a2.75 2.75 0 0 1 2.75 2.75v8.5a2.75 2.75 0 0 1-2.75 2.75h-5a2.75 2.75 0 0 1-2.75-2.75v-8.5Zm2.75-1.25c-.69 0-1.25.56-1.25 1.25v8.5c0 .69.56 1.25 1.25 1.25h5c.69 0 1.25-.56 1.25-1.25v-8.5c0-.69-.56-1.25-1.25-1.25h-.531a1 1 0 0 1-.969.75h-2a1 1 0 0 1-.969-.75h-.531Z" />
        </svg>
      );

    case "email":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="22" height="22">
          <path fill-rule="evenodd" d="M5.75 4.5c-1.519 0-2.75 1.231-2.75 2.75v5.5c0 1.519 1.231 2.75 2.75 2.75h8.5c1.519 0 2.75-1.231 2.75-2.75v-5.5c0-1.519-1.231-2.75-2.75-2.75h-8.5Zm-1.25 2.75c0-.69.56-1.25 1.25-1.25h8.5c.69 0 1.25.56 1.25 1.25v5.5c0 .69-.56 1.25-1.25 1.25h-8.5c-.69 0-1.25-.56-1.25-1.25v-5.5Zm2.067.32c-.375-.175-.821-.013-.997.363-.175.375-.013.821.363.997l3.538 1.651c.335.156.723.156 1.058 0l3.538-1.651c.376-.176.538-.622.363-.997-.175-.376-.622-.538-.997-.363l-3.433 1.602-3.433-1.602Z" />
        </svg>
      );

    default:
      return undefined;
  }
};