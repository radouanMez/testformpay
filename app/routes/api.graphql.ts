import { safeAuthenticateAdmin } from "../shopify.server";

export async function action({ request }: { request: Request }) {
  try {
    console.error("GraphQL proxy انت هنا");

    const auth = await safeAuthenticateAdmin(request);

    if (!auth || !auth.session || !auth.admin) {
      console.error("❌ No valid Shopify session in GraphQL proxy");
      return new Response(
        JSON.stringify({ error: "Not authenticated with Shopify" }),
        { status: 401 }
      );
    }

    const { admin } = auth;

    const body = await request.json();
    const response = await admin.graphql(body.query);

    return new Response(await response.text(), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("❌ GraphQL proxy error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
