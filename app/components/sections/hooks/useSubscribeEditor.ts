// في sections/hooks/useSubscribeEditor.ts
import { useState } from "react";
import { FormField, SubscribeSettings } from "../../../types/formTypes";

export function useSubscribeEditor() {
    const [subscribeSettings, setSubscribeSettings] = useState<SubscribeSettings>({
        label: "Subscribe to stay updated with new products and offers!",
        description: "Get the latest updates on new products and special offers",
        checkedByDefault: true,
        privacyText: "I agree to the privacy policy",
        textColor: "#000000",
        backgroundColor: "#ffffff"
    });

    const [subscribeColorState, setSubscribeColorState] = useState({
        hue: 0,
        saturation: 0,
        brightness: 0
    });

    const openSubscribeEditor = (field: FormField | null) => {
        if (field?.subscribeSettings) {
            setSubscribeSettings(field.subscribeSettings);
        }
        return field;
    };

    const saveSubscribeSettings = (
        field: FormField | null,
        setFormFields: React.Dispatch<React.SetStateAction<FormField[]>>,
        onClose: () => void
    ) => {
        if (field) {
            setFormFields(prev => prev.map(f =>
                f.id === field.id
                    ? { ...f, subscribeSettings: { ...subscribeSettings } }
                    : f
            ));
        }
        onClose();
    };

    return {
        subscribeSettings,
        setSubscribeSettings,
        subscribeColorState,
        setSubscribeColorState,
        openSubscribeEditor,
        saveSubscribeSettings
    };
}