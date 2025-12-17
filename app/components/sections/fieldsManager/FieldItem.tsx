import React from "react";
import {
  Box,
  Text,
  Button,
  InlineStack,
  Badge
} from "@shopify/polaris";
import { ChevronUpIcon, ChevronDownIcon, ViewIcon, DeleteIcon, HideIcon, EditIcon, TextIcon } from "@shopify/polaris-icons";
import { FormField } from "../../../types/formTypes";

interface FieldItemProps {
  field: FormField;
  onToggleVisibility: (id: number) => void;
  onMoveField: (id: number, direction: 'up' | 'down') => void;
  onOpenFieldEditor: (field: FormField) => void;
  onOpenSectionEditor: (field: FormField) => void;
  onOpenTotalsEditor: (field: FormField) => void;
  onOpenShippingEditor: (field: FormField) => void;
  onOpenDiscountEditor: (field: FormField) => void;
  onOpenButtonEditor: (field: FormField) => void;
  onOpenSubscribeEditor: (field: FormField) => void;
}

export function FieldItem({
  field,
  onToggleVisibility,
  onMoveField,
  onOpenFieldEditor,
  onOpenSectionEditor,
  onOpenTotalsEditor,
  onOpenShippingEditor,
  onOpenDiscountEditor,
  onOpenButtonEditor,
  onOpenSubscribeEditor
}: FieldItemProps) {
  return (
    <div
      key={field.id}
      style={{
        border: '1px solid #E1E3E5',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '8px',
        opacity: field.visible ? 1 : 0.6,
        backgroundColor: field.visible ? 'white' : '#f9f9f9'
      }}
    >
      <InlineStack align="space-between" blockAlign="center">
        <InlineStack gap="200" blockAlign="center">
          <Button
            variant="plain"
            icon={field.visible ? ViewIcon : HideIcon}
            onClick={() => onToggleVisibility(field.id)}
            tone={field.visible ? "success" : "critical"}
          />

          {field.type === 'input' && (
            <Button
              variant="plain"
              icon={EditIcon}
              onClick={() => onOpenFieldEditor(field)}
            />
          )}

          {field.type === 'section' && field.label === 'TOTALS SUMMARY' && (
            <Button
              variant="plain"
              icon={TextIcon}
              onClick={() => onOpenTotalsEditor(field)}
            />
          )}

          {field.type === 'section' && field.label === 'SHIPPING RATES' && (
            <Button
              variant="plain"
              icon={TextIcon}
              onClick={() => onOpenShippingEditor(field)}
            />
          )}

          {field.type === 'section' && field.label === 'DISCOUNT CODES' && (
            <Button
              variant="plain"
              icon={TextIcon}
              onClick={() => onOpenDiscountEditor(field)}
            />
          )}

          {field.type === 'subscribe' && (
            <Button
              variant="plain"
              icon={TextIcon}
              onClick={() => onOpenSubscribeEditor(field)}
            />
          )}

          {field.type === 'section' &&
            field.label !== 'TOTALS SUMMARY' &&
            field.label !== 'SHIPPING RATES' &&
            field.label !== 'DISCOUNT CODES' && (
              <Button
                variant="plain"
                icon={TextIcon}
                onClick={() => onOpenSectionEditor(field)}
              />
            )}

          {field.type === 'button' && (
            <Button
              variant="plain"
              icon={TextIcon}
              onClick={() => onOpenButtonEditor(field)}
            />
          )}

          <Text as="span" variant="bodyMd">
            {field.label}
            {field.type === 'input' && field.required && (
              <Text as="span" tone="critical"> *</Text>
            )}
          </Text>

          {!field.visible && <Badge tone="critical">Hidden</Badge>}
          {/* {field.type === 'section' && <Badge tone="info">Section</Badge>} */}
          {/* {field.type === 'button' && <Badge tone="success">Submit Button</Badge>} */}
          {field.showIcon && <Badge tone="success">Icon</Badge>}
          {/* {field.displayLabel && field.displayLabel !== field.label && (
            <Badge tone="warning">Custom Label</Badge>
          )} */}
          {/* {field.sectionSettings && (
            <Badge tone="info">Custom Text</Badge>
          )} */}
          {/* {field.totalSettings && (
            <Badge tone="attention">Totals Summary</Badge>
          )} */}
          {/* {field.shippingSettings && (
            <Badge tone="info">Shipping Rates</Badge>
          )} */}
          {/* {field.discountSettings && (
            <Badge tone="success">Discount Codes</Badge>
          )} */}
          {/* {field.buttonSettings && (
            <Badge tone="success">Custom Button</Badge>
          )} */}
        </InlineStack>

        {field.movable && (
          <InlineStack gap="100">
            <Button
              variant="plain"
              icon={ChevronUpIcon}
              onClick={() => onMoveField(field.id, 'up')}
              disabled={!field.visible}
            />
            <Button
              variant="plain"
              icon={ChevronDownIcon}
              onClick={() => onMoveField(field.id, 'down')}
              disabled={!field.visible}
            />
          </InlineStack>
        )}

        {/* {field.type === 'subscribe' && field.subscribeSettings?.description && (
          <Box paddingBlockStart="200">
            <Text as="p" variant="bodySm" tone="subdued">
              {field.subscribeSettings.description}
            </Text>
          </Box>
        )} */}

      </InlineStack>
    </div> 
  );
}