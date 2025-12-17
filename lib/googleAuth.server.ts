// lib/googleAuth.server.ts
import { prisma } from "../app/db.server";

export async function getAccessToken(shop: string) {
    const integration = await prisma.googleSheetsIntegration.findUnique({
        where: { shop },
    });

    if (!integration) {
        throw new Error('Google integration not found');
    }

    // التحقق من انتهاء الصلاحية وتحديث الـ token إذا لزم الأمر
    if (integration.expiresAt && integration.expiresAt < new Date()) {
        return await refreshAccessToken(integration);
    }

    return integration.accessToken;
}

export async function refreshAccessToken(integration: any) {
    if (!integration.refreshToken) {
        throw new Error('No refresh token available');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            refresh_token: integration.refreshToken,
            grant_type: 'refresh_token',
        }),
    });

    const tokens = await response.json();

    if (!response.ok) {
        throw new Error('Failed to refresh token: ' + (tokens.error || 'Unknown error'));
    }

    // تحديث الـ token في قاعدة البيانات
    const updated = await prisma.googleSheetsIntegration.update({
        where: { id: integration.id },
        data: {
            accessToken: tokens.access_token,
            expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
            refreshToken: tokens.refresh_token || integration.refreshToken, // يحتفظ بالقديم إذا لم يُرجع جديد
        },
    });

    return updated.accessToken;
}