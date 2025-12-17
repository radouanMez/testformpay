import React from "react";
import {
    Card,
    Box,
    BlockStack,
    Text,
    InlineStack
} from "@shopify/polaris";

import { FieldsManagerProps, FormField } from "../../types/formTypes";

import { useFieldsManager } from "../sections/hooks/useFieldsManager";
import { useFieldEditor } from "../sections/hooks/useFieldEditor";
import { useSectionEditor } from "../sections/hooks/useSectionEditor";
import { useTotalsEditor } from "../sections/hooks/useTotalsEditor";
import { useShippingEditor } from "../sections/hooks/useShippingEditor";
import { useDiscountEditor } from "../sections/hooks/useDiscountEditor";
import { FieldItem } from "../sections/fieldsManager/FieldItem";
import { FieldEditorModal } from "../sections/fieldsManager/FieldEditorModal";
import { SectionEditorModal } from "../sections/fieldsManager/SectionEditorModal";
import { TotalsEditorModal } from "../sections/fieldsManager/TotalsEditorModal";
import { ShippingEditorModal } from "../sections/fieldsManager/ShippingEditorModal";
import { DiscountEditorModal } from "../sections/fieldsManager/DiscountEditorModal";
import { ButtonSettingsPanel } from "../sections/fieldsManager/ButtonSettingsPanel";
import { useButtonEditor } from "../sections/hooks/useButtonEditor";
import { ButtonEditorModal } from "../sections/fieldsManager/ButtonEditorModal";
import { useSubscribeEditor } from "../sections/hooks/useSubscribeEditor";
import { SubscribeEditorModal } from "../sections/fieldsManager/SubscribeEditorModal";


export function FieldsManager({ formFields, setFormFields }: FieldsManagerProps) {
    const {
        editingField,
        setEditingField,
        editingSection,
        setEditingSection,
        editingTotals,
        setEditingTotals,
        editingShipping,
        setEditingShipping,
        editingDiscount,
        setEditingDiscount,
        editingButton,
        setEditingButton,
        editingSubscribe, // تأكد من وجود هذا
        setEditingSubscribe, // تأكد من وجود هذا
        moveField,
        toggleFieldVisibility
    } = useFieldsManager();

    const {
        fieldSettings,
        setFieldSettings,
        openFieldEditor,
        saveFieldSettings
    } = useFieldEditor();

    const {
        sectionSettings,
        setSectionSettings,
        colorPickerState,
        setColorPickerState,
        openSectionEditor,
        saveSectionSettings
    } = useSectionEditor();

    const {
        totalsSettings,
        setTotalsSettings,
        totalsColorState,
        setTotalsColorState,
        openTotalsEditor,
        saveTotalsSettings
    } = useTotalsEditor();

    const {
        shippingSettings,
        setShippingSettings,
        openShippingEditor,
        saveShippingSettings
    } = useShippingEditor();

    const {
        discountSettings,
        setDiscountSettings,
        discountColorState,
        setDiscountColorState,
        openDiscountEditor,
        saveDiscountSettings
    } = useDiscountEditor();

    const {
        buttonSettings,
        setButtonSettings,
        bgColorState,
        setBgColorState,
        textColorState,
        setTextColorState,
        borderColorState,
        setBorderColorState,
        openButtonEditor,
        saveButtonSettings
    } = useButtonEditor();

    const {
        subscribeSettings,
        setSubscribeSettings,
        subscribeColorState,
        setSubscribeColorState,
        openSubscribeEditor,
        saveSubscribeSettings
    } = useSubscribeEditor();

    const handleOpenFieldEditor = (field: FormField) => {
        const editingField = openFieldEditor(field);
        setEditingField(editingField);
    };

    const handleOpenSectionEditor = (field: FormField) => {
        const editingSection = openSectionEditor(field);
        setEditingSection(editingSection);
    };

    const handleOpenTotalsEditor = (field: FormField) => {
        const editingTotals = openTotalsEditor(field);
        setEditingTotals(editingTotals);
    };

    const handleOpenShippingEditor = (field: FormField) => {
        const editingShipping = openShippingEditor(field);
        setEditingShipping(editingShipping);
    };

    const handleOpenDiscountEditor = (field: FormField) => {
        const editingDiscount = openDiscountEditor(field);
        setEditingDiscount(editingDiscount);
    };

    const handleOpenButtonEditor = (field: FormField) => {
        const editingButton = openButtonEditor(field);
        setEditingButton(editingButton);
    };

    // أضف هذه الدالة الجديدة
    const handleOpenSubscribeEditor = (field: FormField) => {
        const editingSubscribe = openSubscribeEditor(field);
        setEditingSubscribe(editingSubscribe);
    };

    const visibleFieldsCount = formFields.filter(field => field.visible).length;
    const totalFieldsCount = formFields.length;

    console.log(formFields);

    return (
        <Card>
            <Box padding="400">
                <BlockStack gap="400">
                    <Text variant="headingLg" as="h2">3. Customize your form fields</Text>

                    <Text as="p" variant="bodyMd" tone="subdued">
                        Manage which fields appear in your form and their order. Use the eye icon to show/hide fields and the edit icon to customize field settings.
                    </Text>

                    <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                        <InlineStack align="space-between">
                            <Text as="span" variant="bodySm">Visible: <strong>{visibleFieldsCount}</strong></Text>
                            <Text as="span" variant="bodySm">Hidden: <strong>{totalFieldsCount - visibleFieldsCount}</strong></Text>
                            <Text as="span" variant="bodySm">Total: <strong>{totalFieldsCount}</strong></Text>
                        </InlineStack>
                    </Box>

                    <Box paddingBlockStart="400">
                        <Text as="p" variant="bodyMd" fontWeight="bold">Form Fields Configuration</Text>
                        <BlockStack gap="200">
                            
                            {formFields.map((field) => (
                                <FieldItem
                                    key={field.id}
                                    field={field}
                                    onToggleVisibility={(id) => toggleFieldVisibility(formFields, setFormFields, id)}
                                    onMoveField={(id, direction) => moveField(formFields, setFormFields, id, direction)}
                                    onOpenFieldEditor={handleOpenFieldEditor}
                                    onOpenSectionEditor={handleOpenSectionEditor}
                                    onOpenTotalsEditor={handleOpenTotalsEditor}
                                    onOpenShippingEditor={handleOpenShippingEditor}
                                    onOpenDiscountEditor={handleOpenDiscountEditor}
                                    onOpenButtonEditor={handleOpenButtonEditor}
                                    onOpenSubscribeEditor={handleOpenSubscribeEditor}
                                />
                            ))}
                            
                        </BlockStack>
                    </Box>
                </BlockStack>
            </Box>

            {/* Modals */}
            <FieldEditorModal
                editingField={editingField}
                fieldSettings={fieldSettings}
                setFieldSettings={setFieldSettings}
                onClose={() => setEditingField(null)}
                onSave={() => saveFieldSettings(editingField, setFormFields, () => setEditingField(null))}
            />

            <SectionEditorModal
                editingSection={editingSection}
                sectionSettings={sectionSettings}
                setSectionSettings={setSectionSettings}
                colorPickerState={colorPickerState}
                setColorPickerState={setColorPickerState}
                onClose={() => setEditingSection(null)}
                onSave={() => saveSectionSettings(editingSection, setFormFields, () => setEditingSection(null))}
            />

            <TotalsEditorModal
                editingTotals={editingTotals}
                totalsSettings={totalsSettings}
                setTotalsSettings={setTotalsSettings}
                totalsColorState={totalsColorState}
                setTotalsColorState={setTotalsColorState}
                onClose={() => setEditingTotals(null)}
                onSave={() => saveTotalsSettings(editingTotals, setFormFields, () => setEditingTotals(null))}
            />

            <ShippingEditorModal
                editingShipping={editingShipping}
                shippingSettings={shippingSettings}
                setShippingSettings={setShippingSettings}
                onClose={() => setEditingShipping(null)}
                onSave={() => saveShippingSettings(editingShipping, setFormFields, () => setEditingShipping(null))}
            />

            <DiscountEditorModal
                editingDiscount={editingDiscount}
                discountSettings={discountSettings}
                setDiscountSettings={setDiscountSettings}
                discountColorState={discountColorState}
                setDiscountColorState={setDiscountColorState}
                onClose={() => setEditingDiscount(null)}
                onSave={() => saveDiscountSettings(editingDiscount, setFormFields, () => setEditingDiscount(null))}
            />

            <ButtonEditorModal
                editingButton={editingButton}
                buttonSettings={buttonSettings}
                setButtonSettings={setButtonSettings}
                bgColorState={bgColorState}
                setBgColorState={setBgColorState}
                textColorState={textColorState}
                setTextColorState={setTextColorState}
                borderColorState={borderColorState}
                setBorderColorState={setBorderColorState}
                onClose={() => setEditingButton(null)}
                onSave={() => saveButtonSettings(editingButton, setFormFields, () => setEditingButton(null))}
            />

            <SubscribeEditorModal
                editingSubscribe={editingSubscribe} // تأكد من وجود هذا المتغير
                subscribeSettings={subscribeSettings}
                setSubscribeSettings={setSubscribeSettings}
                subscribeColorState={subscribeColorState}
                setSubscribeColorState={setSubscribeColorState}
                onClose={() => setEditingSubscribe(null)}
                onSave={() => saveSubscribeSettings(editingSubscribe, setFormFields, () => setEditingSubscribe(null))}
            />

        </Card>
    );
}