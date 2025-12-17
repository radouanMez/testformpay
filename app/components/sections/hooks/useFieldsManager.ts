import { useState } from "react";
import { FormField } from "../../../types/formTypes";

export function useFieldsManager() {
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [editingSection, setEditingSection] = useState<FormField | null>(null);
  const [editingTotals, setEditingTotals] = useState<FormField | null>(null);
  const [editingShipping, setEditingShipping] = useState<FormField | null>(null);
  const [editingDiscount, setEditingDiscount] = useState<FormField | null>(null);
  const [editingButton, setEditingButton] = useState<FormField | null>(null);
  const [editingSubscribe, setEditingSubscribe] = useState<FormField | null>(null);

  const moveField = (formFields: FormField[], setFormFields: any, id: number, direction: 'up' | 'down') => {
    setFormFields((prevFields: FormField[]) => {
      const index = prevFields.findIndex(field => field.id === id);
      if (index === -1) return prevFields;

      const newFields = [...prevFields];
      if (direction === 'up' && index > 0) {
        [newFields[index], newFields[index - 1]] = [newFields[index - 1], newFields[index]];
      } else if (direction === 'down' && index < newFields.length - 1) {
        [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
      }
      return newFields;
    });
  };

  const toggleFieldVisibility = (formFields: FormField[], setFormFields: any, id: number) => {
    setFormFields((prevFields: FormField[]) =>
      prevFields.map(field =>
        field.id === id ? { ...field, visible: !field.visible } : field
      )
    );
  };

  return {
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
    moveField,
    toggleFieldVisibility,
    editingSubscribe,
    setEditingSubscribe,
  };
}