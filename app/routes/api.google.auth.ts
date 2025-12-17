// routes/api.google.auth.tsx
import { type LoaderFunctionArgs, redirect } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    
    // الحصول على shop من query parameters
    let shop = url.searchParams.get('shop');
    
    // إذا لم يكن في query، حاول استخراجه من Referer header
    if (!shop) {
      const referer = request.headers.get('referer');
      if (referer) {
        const refererUrl = new URL(referer);
        shop = refererUrl.searchParams.get('shop');
      }
    }

    console.log("🔍 Extracted shop:", shop);

    if (!shop) {
      console.error('❌ No shop found in URL or Referer');
      // إعادة التوجيه إلى auth مع shop مطلوب
      return redirect('/auth?shop=required');
    }

    // التأكد من أن الـ shop يحتوي على .myshopify.com
    if (!shop.includes('.myshopify.com')) {
      shop = `${shop}.myshopify.com`;
    }

    console.log("🔐 Google Auth for shop:", shop);

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
    authUrl.searchParams.set('redirect_uri', `${process.env.SHOPIFY_APP_URL}/api/google/callback`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', shop);

    return redirect(authUrl.toString());
  } catch (error) {
    console.error('❌ Error in Google Auth:', error);
    return redirect('/app/settings?tab=google-sheets&error=auth_failed');
  }
}

export default function GoogleAuthRoute() {
  return null;
}