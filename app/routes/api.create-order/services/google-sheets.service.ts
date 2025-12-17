import { prisma } from "../../../db.server";

export async function sendToGoogleSheets({
  formData,
  integration,
  config
}: {
  formData: any;
  integration: any;
  config: any;
}) {
  const { accessToken, refreshToken, spreadsheetId, sheetName, config: sheetsConfig } = integration;

  const targetSheetName = sheetName || "Orders";

  let dataToSend = [];
  let headers = [];

  if (sheetsConfig?.columns && Array.isArray(sheetsConfig.columns)) {
    console.log("📊 Using custom columns configuration:", sheetsConfig.columns);
    dataToSend = prepareDataForCustomColumns(formData, sheetsConfig.columns);
    headers = sheetsConfig.columns.map((col: any) => col.field);
  } else {
    console.log("📊 No custom columns config, sending all data");
    dataToSend = [Object.values(formData)];
    headers = Object.keys(formData);
  }

  const requestBody = {
    values: [dataToSend]
  };

  console.log("📊 Prepared data for Google Sheets:", {
    headers,
    data: dataToSend,
    sheetName: targetSheetName
  });

  let currentAccessToken = accessToken;

  let response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${targetSheetName}!A1:append?valueInputOption=RAW`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${currentAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (response.status === 401) {
    console.log("🔄 Access token expired, refreshing...");
    try {
      currentAccessToken = await refreshGoogleAccessToken(integration);
      
      response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${targetSheetName}!A1:append?valueInputOption=RAW`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${currentAccessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );
    } catch (refreshError: any) {
      throw new Error(`Failed to refresh access token: ${refreshError.message}`);
    }
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Google Sheets API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  return await response.json();
}

function prepareDataForCustomColumns(formData: any, columnsConfig: any[]) {
  const rowData = [];

  for (const column of columnsConfig) {
    const fieldValue = getFieldValue(formData, column.field);
    rowData.push(fieldValue);
  }

  return rowData;
}

function getFieldValue(formData: any, field: string) {
  switch (field) {
    case 'order_id':
      return formData.order_number || `ORD-${Date.now()}`;
    case 'created_at_simple':
      return new Date().toLocaleDateString('ar-MA');
    case 'full_name':
      return `${formData.first_name || ''} ${formData.last_name || ''}`.trim();
    case 'phone':
      return formData.phone || '';
    case 'address1':
      return formData.address || '';
    case 'city':
      return formData.city || '';
    case 'product_name_alone':
      return formData.product_title || '';
    case 'variant_name':
      return formData.variant_id || '';
    case 'product_sku':
      return '';
    case 'total_price':
      return formData.total || '0';
    default:
      if (formData[field] !== undefined) {
        return formData[field];
      }
      return '';
  }
}

async function refreshGoogleAccessToken(integration: any) {
  const { refreshToken } = integration;

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.json();
    throw new Error(`Failed to refresh token: ${errorData.error}`);
  }

  const tokens = await tokenResponse.json();

  await prisma.googleSheetsIntegration.update({
    where: { shop: integration.shop },
    data: {
      accessToken: tokens.access_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
  });

  return tokens.access_token;
}