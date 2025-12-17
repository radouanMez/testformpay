// routes/api.google.save-settings.ts
import { type ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);

  try {
    const body = await request.json();

    await prisma.googleSheetsIntegration.update({
      where: { shop: session.shop },
      data: {
        spreadsheetId: body.spreadsheetId,
        sheetName: body.sheetName,
        abandonedSheetName: body.abandonedSheetName,
        enabled: body.enabled,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error saving settings:', error);
    return { 
      success: false, 
      error: 'Failed to save settings' 
    };
  }
}