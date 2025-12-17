import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";

import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

export async function loader({ request }: LoaderFunctionArgs) { 
    try {
        const { session } = await authenticate.admin(request);
        const shop = session.shop;

        console.log('🔍 Loading settings for shop:', shop);

        const user = await prisma.user.findUnique({
            where: { shop },
            include: { userBlockingSettings: true }
        });

        console.log('📋 User found:', user ? 'yes' : 'no');

        if (!user || !user.userBlockingSettings) {
            console.log('ℹ️ No settings found, returning empty object');
            return new Response(JSON.stringify({}), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log('✅ Settings loaded successfully');
        return new Response(JSON.stringify(user.userBlockingSettings), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('💥 Error in loader:', error);
        return new Response(JSON.stringify({ error: 'Failed to load settings' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function action({ request }: ActionFunctionArgs) {
    try {
        const { session } = await authenticate.admin(request);
        const shop = session.shop;

        console.log('💾 Saving settings for shop:', shop);

        const data = await request.json();
        console.log('📦 Received data:', data);

        // البحث عن المستخدم
        const user = await prisma.user.findUnique({
            where: { shop }
        });

        if (!user) {
            console.error('❌ User not found for shop:', shop);
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log('✅ User found:', user.id);

        // حفظ أو تحديث الإعدادات
        const settings = await prisma.userBlockingSettings.upsert({
            where: { shop },
            update: {
                ...data,
                userId: user.id
            },
            create: {
                ...data,
                shop,
                userId: user.id
            }
        });

        console.log('✅ Settings saved successfully:', settings.id);

        return new Response(JSON.stringify({ success: true, settings }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('💥 Error in action:', error);
        return new Response(JSON.stringify({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}