// routes/api.google.disconnect.ts
import { type ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);

  try {
    await prisma.googleSheetsIntegration.delete({
      where: { shop: session.shop },
    });

    return ({ success: true });
  } catch (error) {
    console.error('Error disconnecting:', error);
    return ({ 
      success: false, 
      error: 'Failed to disconnect' 
    });
  }
}