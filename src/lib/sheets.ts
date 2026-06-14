import { getAccessToken } from './auth';

export async function createSpreadsheet(title: string): Promise<string> {
  const token = await getAccessToken();
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        { properties: { title: 'Employees' } },
        { properties: { title: 'Finances' } },
        { properties: { title: 'Inventory' } },
        { properties: { title: 'Requests' } },
        { properties: { title: 'Schedules' } },
        { properties: { title: 'Invoices' } },
      ],
    }),
  });
  const data = await res.json();
  return data.spreadsheetId;
}

export async function readSheetLines(spreadsheetId: string, range: string): Promise<any[][] | undefined> {
  const token = await getAccessToken();
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?majorDimension=ROWS`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.values;
}

export async function writeSheetLines(spreadsheetId: string, range: string, values: any[][]) {
  const token = await getAccessToken();
  const sheetName = range.split('!')[0];

  // Try to clear the sheet first to prevent trailing stale rows after deletion
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}:clear`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (clearErr) {
    console.warn(`Could not clear sheet ${sheetName}:`, clearErr);
  }

  let res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    const errText = await res.text();
    // If sheet tab doesn't exist, create it and retry
    if (res.status === 400 || errText.includes('range') || errText.includes('not found')) {
      try {
        const createTabRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                addSheet: {
                  properties: { title: sheetName },
                },
              },
            ],
          }),
        });

        if (createTabRes.ok) {
          // Retry clear and write
          try {
            await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}:clear`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          } catch (e) {}

          await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values }),
          });
        }
      } catch (tabErr) {
        console.error('Failed to create missing sheet tab:', tabErr);
      }
    }
  }
}
