// routes/api.google.sheets.ts
import { type LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getAccessToken } from "../../lib/googleAuth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const spreadsheetId = url.searchParams.get('spreadsheetId');

  if (!spreadsheetId) {
    return ({ success: false, error: 'Spreadsheet ID required' });
  }

  try {
    const accessToken = await getAccessToken(session.shop);

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch sheets');
    }

    const sheets = data.sheets?.map((sheet: any) => ({
      id: sheet.properties.sheetId,
      title: sheet.properties.title,
    })) || [];

    return ({ 
      success: true, 
      sheets 
    });
  } catch (error: any) {
    console.error('Error fetching sheets:', error);
    return ({ 
      success: false, 
      error: error.message 
    });
  }
}