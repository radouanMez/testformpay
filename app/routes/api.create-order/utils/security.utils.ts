// 🔒 دالة مساعدة لتحويل أي قيمة إلى boolean
export function convertToBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
    }
    if (typeof value === 'number') return value === 1;
    return Boolean(value);
}

// 🔒 دالة للحصول على IP العميل
export function getClientIP(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");
    const connectionIP = request.headers.get("cf-connecting-ip");

    return realIP || (forwarded?.split(',')[0]?.trim()) || connectionIP || "unknown";
}

// 🔒 دالة مساعدة لمعالجة القيم undefined/null
export function cleanValue(value: any): string {
    if (value === undefined || value === null || value === "undefined" || value === "null") {
        return "";
    }
    return String(value).trim();
}