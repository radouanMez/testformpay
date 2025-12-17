// routes/api.google.spreadsheets.ts
import { type LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getAccessToken } from "../../lib/googleAuth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  try {
    const accessToken = await getAccessToken(session.shop);

    const response = await fetch('https://www.googleapis.com/drive/v3/files?q=mimeType="application/vnd.google-apps.spreadsheet"', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch spreadsheets');
    }

    return ({ 
      success: true, 
      spreadsheets: data.files.map((file: any) => ({
        id: file.id,
        name: file.name,
      })) || [] 
    });
  } catch (error: any) {
    console.error('Error fetching spreadsheets:', error);
    return ({ 
      success: false, 
      error: error.message 
    });
  }
}