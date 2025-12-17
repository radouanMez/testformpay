import { type LoaderFunctionArgs, redirect } from "react-router";
import { saveGoogleTokens } from "../services/googleIntegration.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const shop = url.searchParams.get("state");

  if (error) {
    return redirect(
      `https://${shop}/admin/apps/formino?tab=google-sheets&error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !shop) {
    return redirect(`/auth/login`);
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri:
          "https://blessed-prizes-anne-cleanup.trycloudflare.com/api/google/callback",
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("❌ Token exchange failed:", tokens);
      throw new Error(tokens.error_description || tokens.error);
    }

    // ✅ حفظ التوكنات في قاعدة البيانات
    await saveGoogleTokens(shop, tokens);

    // ✅ إعادة المستخدم إلى التطبيق داخل Shopify Admin
    return redirect(
      `https://${shop}/admin/apps/formino?tab=google-sheets&success=connected`
    );
  } catch (err) {
    console.error("❌ Error in Google callback:", err);
    return redirect(
      `https://${shop}/admin/apps/formino?tab=google-sheets&error=auth_failed`
    );
  }
}

export default function GoogleCallbackRoute() {
  return null;
}
