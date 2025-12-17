// utils/jsonConverter.ts
export function convertToPrismaJson(data: any): any {
    if (data === null || data === undefined) {
        return null;
    }

    if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(item => convertToPrismaJson(item));
    }

    if (typeof data === 'object') {
        const result: { [key: string]: any } = {};
        for (const [key, value] of Object.entries(data)) {
            result[key] = convertToPrismaJson(value);
        }
        return result;
    }

    // لأي نوع آخر، نحوله إلى string
    return String(data);
}

// دالة متخصصة لـ FormConfig
export function convertFormConfigToJson(formConfig: any) {
    return JSON.parse(JSON.stringify(formConfig));
}