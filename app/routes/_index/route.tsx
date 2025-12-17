import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    
    await authenticate.admin(request);

    const url = new URL(request.url);

    url.pathname = `${url.pathname.replace(/\/$/, "")}/app`;

    console.log("🔗 Redirecting authenticated user to:", url.toString());

    return redirect(url.toString());
  } catch (error) {
    console.error("❌ Session invalid, redirecting to auth:", error);
    return redirect("/auth");
  }
}
