// helpers.ts
import React, { useState, useCallback, useEffect } from "react";
import { Popover, Button, Box, BlockStack, ColorPicker, InlineStack } from "@shopify/polaris";

export type ColorPickerColor = {
    hue: number;
    saturation: number;
    brightness: number;
    alpha?: number;
};

export interface SmallColorPickerProps {
    color: ColorPickerColor;
    onChange: (color: ColorPickerColor) => void;
    label: string;
}

export const colorToRgba = (color: ColorPickerColor): string => {
    const { hue, saturation, brightness, alpha = 1 } = color;
    const chroma = brightness * saturation;
    const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = brightness - chroma;
    let r = 0, g = 0, b = 0;
    if (hue < 60) [r, g, b] = [chroma, x, 0];
    else if (hue < 120) [r, g, b] = [x, chroma, 0];
    else if (hue < 180) [r, g, b] = [0, chroma, x];
    else if (hue < 240) [r, g, b] = [0, x, chroma];
    else if (hue < 300) [r, g, b] = [x, 0, chroma];
    else[r, g, b] = [chroma, 0, x];
    return `rgba(${Math.round((r + m) * 255)}, ${Math.round((g + m) * 255)}, ${Math.round((b + m) * 255)}, ${alpha})`;
};

export const parseRgbaToColor = (rgbaString: string): ColorPickerColor => {
    const match = rgbaString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);

    if (!match) {
        console.warn("Failed to parse color:", rgbaString);
        return { hue: 0, saturation: 0, brightness: 0, alpha: 1 };
    }

    const r = parseInt(match[1]) / 255;
    const g = parseInt(match[2]) / 255;
    const b = parseInt(match[3]) / 255;
    const alpha = match[4] ? parseFloat(match[4]) : 1;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let hue = 0;
    if (delta !== 0) {
        if (max === r) {
            hue = ((g - b) / delta) % 6;
        } else if (max === g) {
            hue = (b - r) / delta + 2;
        } else {
            hue = (r - g) / delta + 4;
        }

        hue = Math.round(hue * 60);
        if (hue < 0) hue += 360;
    }

    const saturation = max === 0 ? 0 : delta / max;
    const brightness = max;

    return {
        hue,
        saturation,
        brightness,
        alpha
    };
};

export const SmallColorPicker = ({ color, onChange, label }: SmallColorPickerProps) => {
    const [popoverActive, setPopoverActive] = useState(false);
    const [tempColor, setTempColor] = useState(color);

    useEffect(() => {
        setTempColor(color);
    }, [color]);

    const togglePopover = useCallback(() => {
        if (!popoverActive) setTempColor(color);
        setPopoverActive((active) => !active);
    }, [popoverActive, color]);

    const handleSave = useCallback(() => {
        onChange(tempColor);
        setPopoverActive(false);
    }, [onChange, tempColor]);

    const handleCancel = useCallback(() => {
        setTempColor(color);
        setPopoverActive(false);
    }, [color]);

    return (
        <Popover
            active={popoverActive}
            activator={
                <Button
                    size="micro"
                    onClick={togglePopover}
                    icon={
                        <div style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '3px',
                            backgroundColor: colorToRgba(color),
                            border: "1px solid rgba(0,0,0,0.1)"
                        }} />
                    }
                >
                    Select
                </Button>
            }
            onClose={handleCancel}
        >
            <Box padding="400" minWidth="200px">
                <BlockStack gap="300">
                    <div style={{ fontSize: '12px', color: 'gray', fontWeight: 'bold' }}>{label}</div>
                    <ColorPicker color={tempColor} onChange={setTempColor} allowAlpha />
                    <InlineStack align="end" gap="200">
                        <Button size="micro" onClick={handleCancel}>Cancel</Button>
                        <Button size="micro" variant="primary" onClick={handleSave}>Save</Button>
                    </InlineStack>
                </BlockStack>
            </Box>
        </Popover>
    );
};