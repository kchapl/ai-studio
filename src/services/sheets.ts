import { WeatherRecord, MonthlySummaryData, SheetConfig } from '../types/weather';
import { getAccessToken } from './auth';

const DAILY_SHEET_TITLE = 'Daily Weather Log';
const SUMMARY_SHEET_TITLE = 'Monthly Summaries';
const STORAGE_CONFIG_KEY = 'skylog_sheet_config';

export const DAILY_HEADERS = [
  'Date',
  'Time',
  'City',
  'Temperature (°C)',
  'Feels Like (°C)',
  'Min Temp (°C)',
  'Max Temp (°C)',
  'Humidity (%)',
  'Conditions',
  'Description',
  'Wind Speed (m/s)',
  'Pressure (hPa)',
  'Source',
];

export const SUMMARY_HEADERS = [
  'Month',
  'Days Logged',
  'Average Temp (°C)',
  'Min Temp Recorded (°C)',
  'Max Temp Recorded (°C)',
  'Average Humidity (%)',
  'Rain / Storm Days',
  'Dominant Condition',
];

export const loadSheetConfig = (): SheetConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse sheet config', e);
  }
  return {
    spreadsheetId: null,
    spreadsheetTitle: 'SkyLog - Daily Weather Tracker',
    spreadsheetUrl: null,
    dailySheetName: DAILY_SHEET_TITLE,
    summarySheetName: SUMMARY_SHEET_TITLE,
    lastSyncedAt: null,
  };
};

export const saveSheetConfig = (config: SheetConfig): void => {
  try {
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save sheet config', e);
  }
};

const getAuthHeaders = async (): Promise<HeadersInit> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Not authenticated with Google. Please sign in to access Google Sheets.');
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Creates a brand new Google Spreadsheet configured with Daily Weather Log & Monthly Summaries tabs.
 */
export const createWeatherSpreadsheet = async (
  title: string = 'SkyLog - Daily Weather Tracker'
): Promise<SheetConfig> => {
  const headers = await getAuthHeaders();

  const spreadsheetBody = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: DAILY_SHEET_TITLE,
          gridProperties: {
            frozenRowCount: 1,
            rowCount: 1000,
            columnCount: 15,
          },
        },
      },
      {
        properties: {
          title: SUMMARY_SHEET_TITLE,
          gridProperties: {
            frozenRowCount: 1,
            rowCount: 200,
            columnCount: 12,
          },
        },
      },
    ],
  };

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers,
    body: JSON.stringify(spreadsheetBody),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create spreadsheet (${response.status})`);
  }

  const sheetData = await response.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Write header rows to both sheets
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: `'${DAILY_SHEET_TITLE}'!A1:M1`,
            values: [DAILY_HEADERS],
          },
          {
            range: `'${SUMMARY_SHEET_TITLE}'!A1:H1`,
            values: [SUMMARY_HEADERS],
          },
        ],
      }),
    }
  );

  // Format header styling (dark indigo/slate background, bold white text)
  const dailySheetId = sheetData.sheets?.[0]?.properties?.sheetId ?? 0;
  const summarySheetId = sheetData.sheets?.[1]?.properties?.sheetId ?? 1;

  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: dailySheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: DAILY_HEADERS.length,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.08, green: 0.15, blue: 0.28 },
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                  horizontalAlignment: 'CENTER',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
            },
          },
          {
            repeatCell: {
              range: {
                sheetId: summarySheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: SUMMARY_HEADERS.length,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.06, green: 0.22, blue: 0.35 },
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                  horizontalAlignment: 'CENTER',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: dailySheetId,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: DAILY_HEADERS.length,
              },
            },
          },
        ],
      }),
    });
  } catch (formatErr) {
    console.warn('Optional header styling warning:', formatErr);
  }

  const config: SheetConfig = {
    spreadsheetId,
    spreadsheetTitle: title,
    spreadsheetUrl,
    dailySheetName: DAILY_SHEET_TITLE,
    summarySheetName: SUMMARY_SHEET_TITLE,
    lastSyncedAt: Date.now(),
  };

  saveSheetConfig(config);
  return config;
};

/**
 * Validates and connects an existing Google Sheet by ID or URL
 */
export const connectExistingSpreadsheet = async (sheetIdOrUrl: string): Promise<SheetConfig> => {
  let spreadsheetId = sheetIdOrUrl.trim();
  // Extract ID from full URL if provided (e.g. https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit)
  const match = spreadsheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    spreadsheetId = match[1];
  }

  const headers = await getAuthHeaders();
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.error?.message ||
        `Could not access spreadsheet (${res.status}). Verify spreadsheet ID and permissions.`
    );
  }

  const data = await res.json();
  const title = data.properties?.title || 'Connected Weather Spreadsheet';
  const existingSheets: string[] = (data.sheets || []).map((s: any) => s.properties?.title);

  // Ensure daily sheet tab exists
  let dailySheetName = DAILY_SHEET_TITLE;
  let summarySheetName = SUMMARY_SHEET_TITLE;

  const requests: any[] = [];
  if (!existingSheets.includes(DAILY_SHEET_TITLE)) {
    // If there's a sheet with 0 or user's default, check if we need to add DAILY_SHEET_TITLE
    requests.push({
      addSheet: {
        properties: {
          title: DAILY_SHEET_TITLE,
          gridProperties: { frozenRowCount: 1 },
        },
      },
    });
  }

  if (!existingSheets.includes(SUMMARY_SHEET_TITLE)) {
    requests.push({
      addSheet: {
        properties: {
          title: SUMMARY_SHEET_TITLE,
          gridProperties: { frozenRowCount: 1 },
        },
      },
    });
  }

  if (requests.length > 0) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ requests }),
    });

    // Write header rows if newly created
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: [
            {
              range: `'${DAILY_SHEET_TITLE}'!A1:M1`,
              values: [DAILY_HEADERS],
            },
            {
              range: `'${SUMMARY_SHEET_TITLE}'!A1:H1`,
              values: [SUMMARY_HEADERS],
            },
          ],
        }),
      }
    );
  }

  const config: SheetConfig = {
    spreadsheetId,
    spreadsheetTitle: title,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    dailySheetName,
    summarySheetName,
    lastSyncedAt: Date.now(),
  };

  saveSheetConfig(config);
  return config;
};

/**
 * Fetches all daily weather records from the Google Sheet
 */
export const fetchWeatherRecordsFromSheet = async (
  spreadsheetId: string,
  sheetName: string = DAILY_SHEET_TITLE
): Promise<WeatherRecord[]> => {
  const headers = await getAuthHeaders();
  const range = `'${sheetName}'!A2:M`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch sheet rows (${res.status})`);
  }

  const data = await res.json();
  const rows: any[][] = data.values || [];

  const records: WeatherRecord[] = rows
    .map((row, index) => {
      if (!row || !row[0]) return null;
      const date = String(row[0] || '').trim();
      const time = String(row[1] || '12:00:00').trim();
      const city = String(row[2] || 'Unknown').trim();
      const temp = parseFloat(row[3]) || 0;
      const feelsLike = parseFloat(row[4]) || temp;
      const tempMin = parseFloat(row[5]) || temp;
      const tempMax = parseFloat(row[6]) || temp;
      const humidity = parseInt(row[7], 10) || 0;
      const conditions = String(row[8] || 'Clear').trim();
      const description = String(row[9] || conditions.toLowerCase()).trim();
      const windSpeed = parseFloat(row[10]) || 0;
      const pressure = parseInt(row[11], 10) || 1013;
      const source = (row[12] as any) || 'OpenWeatherMap';

      let parsedTs = new Date(`${date}T${time}`).getTime();
      if (isNaN(parsedTs)) {
        parsedTs = new Date(date).getTime() || Date.now();
      }

      // Determine simple icon from conditions
      let icon = '01d';
      const condLower = conditions.toLowerCase();
      if (condLower.includes('rain')) icon = '10d';
      else if (condLower.includes('drizzle')) icon = '09d';
      else if (condLower.includes('cloud')) icon = '03d';
      else if (condLower.includes('thunder')) icon = '11d';
      else if (condLower.includes('snow')) icon = '13d';
      else if (condLower.includes('fog') || condLower.includes('mist')) icon = '50d';

      return {
        id: `${date}_${index + 2}`,
        date,
        time,
        timestamp: parsedTs,
        city,
        temp,
        feelsLike,
        tempMin,
        tempMax,
        humidity,
        pressure,
        conditions,
        description,
        icon,
        windSpeed,
        source,
        rowNumber: index + 2,
      } as WeatherRecord;
    })
    .filter((r): r is WeatherRecord => r !== null);

  return records;
};

/**
 * Appends a single daily weather record to the Google Sheet.
 * If replaceExistingDate is true, updates the existing row for that date.
 */
export const appendWeatherRecordToSheet = async (
  spreadsheetId: string,
  record: WeatherRecord,
  sheetName: string = DAILY_SHEET_TITLE
): Promise<void> => {
  const headers = await getAuthHeaders();

  const rowValues = [
    record.date,
    record.time,
    record.city,
    record.temp,
    record.feelsLike,
    record.tempMin,
    record.tempMax,
    record.humidity,
    record.conditions,
    record.description,
    record.windSpeed,
    record.pressure,
    record.source,
  ];

  const range = `'${sheetName}'!A:M`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      values: [rowValues],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to append weather record to Google Sheet (${res.status})`);
  }
};

/**
 * Batch appends multiple records to the Google Sheet (useful for backfilling)
 */
export const batchAppendRecordsToSheet = async (
  spreadsheetId: string,
  records: WeatherRecord[],
  sheetName: string = DAILY_SHEET_TITLE
): Promise<void> => {
  if (records.length === 0) return;
  const headers = await getAuthHeaders();

  const rows = records.map((r) => [
    r.date,
    r.time,
    r.city,
    r.temp,
    r.feelsLike,
    r.tempMin,
    r.tempMax,
    r.humidity,
    r.conditions,
    r.description,
    r.windSpeed,
    r.pressure,
    r.source,
  ]);

  const range = `'${sheetName}'!A:M`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      values: rows,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to batch append records (${res.status})`);
  }
};

/**
 * Calculates monthly summary metrics from daily records
 */
export const calculateMonthlySummaries = (records: WeatherRecord[]): MonthlySummaryData[] => {
  const groups: { [monthKey: string]: WeatherRecord[] } = {};

  records.forEach((r) => {
    const monthKey = r.date.slice(0, 7); // "YYYY-MM"
    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    groups[monthKey].push(r);
  });

  const summaries: MonthlySummaryData[] = Object.keys(groups)
    .sort()
    .reverse()
    .map((monthKey) => {
      const monthRecords = groups[monthKey];
      const [yearStr, monthStr] = monthKey.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);

      const dateObj = new Date(year, month - 1, 1);
      const monthName = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      const temps = monthRecords.map((r) => r.temp);
      const humidities = monthRecords.map((r) => r.humidity);

      const avgTemp = Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10;
      const minTemp = Math.min(...monthRecords.map((r) => r.tempMin));
      const maxTemp = Math.max(...monthRecords.map((r) => r.tempMax));
      const avgHumidity = Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length);

      let rainyDays = 0;
      let snowDays = 0;
      let clearDays = 0;
      let cloudyDays = 0;
      const condCounts: { [k: string]: number } = {};

      monthRecords.forEach((r) => {
        const c = r.conditions.toLowerCase();
        if (c.includes('rain') || c.includes('drizzle') || c.includes('thunder')) rainyDays++;
        if (c.includes('snow')) snowDays++;
        if (c.includes('clear')) clearDays++;
        if (c.includes('cloud')) cloudyDays++;

        condCounts[r.conditions] = (condCounts[r.conditions] || 0) + 1;
      });

      let dominantCondition = 'Clear';
      let maxCount = 0;
      Object.entries(condCounts).forEach(([cond, count]) => {
        if (count > maxCount) {
          maxCount = count;
          dominantCondition = cond;
        }
      });

      return {
        monthKey,
        monthName,
        year,
        month,
        totalDays: monthRecords.length,
        avgTemp,
        minTemp: isFinite(minTemp) ? minTemp : avgTemp,
        maxTemp: isFinite(maxTemp) ? maxTemp : avgTemp,
        avgHumidity,
        rainyDays,
        snowDays,
        clearDays,
        cloudyDays,
        dominantCondition,
        records: monthRecords.sort((a, b) => b.date.localeCompare(a.date)),
      };
    });

  return summaries;
};

/**
 * Synchronizes and updates the "Monthly Summaries" tab in Google Sheets with fresh aggregated statistics and formulas.
 */
export const syncMonthlySummariesToSheet = async (
  spreadsheetId: string,
  summaries: MonthlySummaryData[],
  sheetName: string = SUMMARY_SHEET_TITLE
): Promise<void> => {
  const headers = await getAuthHeaders();

  // Clear existing summary rows (A2:H100)
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${sheetName}'!A2:H100:clear`,
    {
      method: 'POST',
      headers,
    }
  );

  if (summaries.length === 0) return;

  const rows = summaries.map((s) => [
    s.monthName,
    s.totalDays,
    s.avgTemp,
    s.minTemp,
    s.maxTemp,
    `${s.avgHumidity}%`,
    s.rainyDays,
    s.dominantCondition,
  ]);

  const range = `'${sheetName}'!A2:H${rows.length + 1}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      values: rows,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to update Monthly Summaries tab (${res.status})`);
  }
};

/**
 * Destructive operation: Clears daily logs from the spreadsheet (A2:M).
 * Protected by explicit user confirmation modal in UI.
 */
export const clearSheetDailyLogs = async (
  spreadsheetId: string,
  sheetName: string = DAILY_SHEET_TITLE
): Promise<void> => {
  const headers = await getAuthHeaders();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${sheetName}'!A2:M:clear`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to clear spreadsheet rows (${res.status})`);
  }
};
