import { authenticate } from "../../shopify.server";
import type { LoaderFunctionArgs } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log("🔹 callback route called");

  // استخدام authenticate.admin مباشرة
  return authenticate.admin(request);
};