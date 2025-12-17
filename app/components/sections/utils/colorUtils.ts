export function hexToHsb(hex: string) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    let s = max === 0 ? 0 : delta / max;
    let v = max;

    if (max !== min) {
        switch (max) {
            case r: h = (g - b) / delta + (g < b ? 6 : 0); break;
            case g: h = (b - r) / delta + 2; break;
            case b: h = (r - g) / delta + 4; break;
        }
        h /= 6;
    }

    return {
        hue: Math.round(h * 360),
        saturation: parseFloat(s.toFixed(2)),
        brightness: parseFloat(v.toFixed(2))
    };
}

export function rgbToHsb(rgb: string) {
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return { hue: 0, saturation: 0, brightness: 0 };

    const r = parseInt(match[1]) / 255;
    const g = parseInt(match[2]) / 255;
    const b = parseInt(match[3]) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    let s = max === 0 ? 0 : delta / max;
    let v = max;

    if (max !== min) {
        switch (max) {
            case r: h = (g - b) / delta + (g < b ? 6 : 0); break;
            case g: h = (b - r) / delta + 2; break;
            case b: h = (r - g) / delta + 4; break;
        }
        h /= 6;
    }

    return {
        hue: Math.round(h * 360),
        saturation: parseFloat(s.toFixed(2)),
        brightness: parseFloat(v.toFixed(2))
    };
}