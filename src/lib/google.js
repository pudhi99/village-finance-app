import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { parseNumber, parsePaymentCell } from './utils.js';

// Helper to convert column index (0-based) to A1 notation column letter (0 -> A, 27 -> AB)
export function colIndexToLetter(colIndex) {
  let temp = colIndex;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

let cachedAuth = null;

// Cache for resolved shortened URLs (e.g. goo.gl/maps, maps.app.goo.gl)
const shortUrlCache = new Map();

export async function resolveShortGpsUrl(rawGps) {
  if (!rawGps || typeof rawGps !== 'string') return rawGps;
  const trimmed = rawGps.trim();
  if (
    trimmed.includes('goo.gl/maps') ||
    trimmed.includes('maps.app.goo.gl') ||
    trimmed.includes('app.goo.gl') ||
    trimmed.includes('bit.ly')
  ) {
    if (shortUrlCache.has(trimmed)) {
      return shortUrlCache.get(trimmed);
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(trimmed, { method: 'GET', redirect: 'follow', signal: controller.signal });
      clearTimeout(timer);
      if (res && res.url) {
        shortUrlCache.set(trimmed, res.url);
        return res.url;
      }
    } catch (e) {
      console.warn('Could not resolve short GPS url:', trimmed, e.message);
    }
  }
  return rawGps;
}

function getAuth() {
  if (cachedAuth) return cachedAuth;

  let clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  // Fallback to local json key if env is missing or incomplete
  if (!clientEmail || !privateKey) {
    try {
      const saPath = path.join(process.cwd(), 'village-collections-app-515404-39e138645a18.json');
      if (fs.existsSync(saPath)) {
        const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
        clientEmail = sa.client_email;
        privateKey = sa.private_key;
      }
    } catch (e) {
      console.warn('Could not load service account JSON file fallback:', e.message);
    }
  }

  if (!clientEmail || !privateKey) {
    throw new Error('Google Service Account credentials missing. Please set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY.');
  }

  cachedAuth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });

  return cachedAuth;
}

export function getSpreadsheetId() {
  return process.env.GOOGLE_SPREADSHEET_ID || '1i02ad4mr42zJ1lYDlOWIGiziobyzI24RwvI6IXOFSUE';
}

export async function getSheetsClient() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

// Fetch metadata to find sheet IDs
let sheetIdsCache = null;
export async function getSheetIdByTitle(title) {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheetIdsCache) {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    sheetIdsCache = {};
    for (const s of meta.data.sheets) {
      sheetIdsCache[s.properties.title] = s.properties.sheetId;
    }
  }
  return sheetIdsCache[title];
}

/**
 * Reads Village Sheet data (Edurlanka or Kothapalli)
 */
export async function getVillageData(sheetTitle) {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetTitle}'!A1:Z200`,
    valueRenderOption: 'FORMATTED_VALUE',
  });

  const rows = res.data.values || [];
  if (rows.length === 0) {
    return { headers: [], weekColumns: [], customers: [], totals: null };
  }

  const headerRow = rows[0] || [];
  
  // Find column indices
  let remarksColIdx = headerRow.findIndex(h => (h || '').includes('వివరాలు') || (h || '').toLowerCase().includes('remarks'));
  if (remarksColIdx === -1) remarksColIdx = 14; // Default Col O

  let gpsColIdx = headerRow.findIndex(h => (h || '').includes('GPS'));
  if (gpsColIdx === -1) gpsColIdx = remarksColIdx + 1;

  let cardPhotoColIdx = headerRow.findIndex(h => (h || '').includes('కార్డ్') || (h || '').toLowerCase().includes('card'));
  if (cardPhotoColIdx === -1) cardPhotoColIdx = gpsColIdx + 1;

  let housePhotoColIdx = headerRow.findIndex(h => (h || '').includes('ఇంటి') || (h || '').toLowerCase().includes('house'));
  if (housePhotoColIdx === -1) housePhotoColIdx = cardPhotoColIdx + 1;

  // Week columns are between Col H (index 7: Payment Type) and remarksColIdx
  const weekColumns = [];
  for (let c = 8; c < remarksColIdx; c++) {
    const rawHeader = headerRow[c] || `Week ${c - 7}`;
    weekColumns.push({
      colIndex: c,
      colLetter: colIndexToLetter(c),
      header: rawHeader,
    });
  }

  const customers = [];
  let totalsRow = null;
  let totalRowIndex = -1;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const firstCell = String(row[0] || '').trim();
    const secondCell = String(row[1] || '').trim();

    if (firstCell.includes('మొత్తం') || firstCell.toLowerCase().includes('total') || secondCell.includes('మొత్తం')) {
      totalRowIndex = r + 1; // 1-based index
      totalsRow = {
        rowIndex: totalRowIndex,
        raw: row,
        totalAmount: parseNumber(row[4]),
        weeklyTotals: weekColumns.map((wk, idx) => ({
          header: wk.header,
          amount: parseNumber(row[wk.colIndex]),
        })),
      };
      break;
    }

    // Skip empty filler rows
    if (!firstCell && !secondCell && !row[2]) continue;

    const sNo = row[1] || `${r}`;
    const nameTe = row[2] || '';
    const nameEn = row[3] || '';
    const amount = parseNumber(row[4]);
    const phone = (row[5] || '').toString().trim();
    const colony = (row[6] || '').toString().trim();
    const paymentType = (row[7] || '').toString().trim(); // blank is weekly, or 'నెల (Monthly)'
    const remarks = (row[remarksColIdx] || '').toString().trim();
    const gpsLocation = (row[gpsColIdx] || '').toString().trim();
    const cardPhoto = (row[cardPhotoColIdx] || '').toString().trim();
    const housePhoto = (row[housePhotoColIdx] || '').toString().trim();

    // Parse weekly payments
    let totalPaid = 0;
    const weeklyPayments = weekColumns.map(wk => {
      const cellVal = row[wk.colIndex];
      const parsed = parsePaymentCell(cellVal);
      totalPaid += parsed.amount;
      return {
        colIndex: wk.colIndex,
        colLetter: wk.colLetter,
        weekHeader: wk.header,
        amount: parsed.amount,
        isUPI: parsed.isUPI,
        raw: parsed.raw,
      };
    });

    const isStruckOut = remarks.toLowerCase().includes('struck');
    const hasPhoneReminder = remarks.includes('ఫోన్ చేయాలి');
    const remainingDue = isStruckOut ? 0 : Math.max(0, amount - totalPaid);

    // Extract surety if mentioned
    let surety = '';
    const suretyMatch = remarks.match(/ష్యూరిటీ[:\s]*([^\s,)]+)|Surety[:\s]*([^\s,)]+)/i);
    if (suretyMatch) {
      surety = suretyMatch[1] || suretyMatch[2] || '';
    }

    customers.push({
      rowIndex: r + 1, // 1-based row index in Google Sheets
      date: firstCell,
      sNo,
      nameTe,
      nameEn,
      amount,
      phone,
      colony,
      paymentType: paymentType || 'వారం (Weekly)',
      isMonthly: paymentType.toLowerCase().includes('నెల') || paymentType.toLowerCase().includes('monthly'),
      weeklyPayments,
      totalPaid,
      remainingDue,
      isStruckOut,
      hasPhoneReminder,
      surety,
      remarks,
      gpsLocation,
      cardPhoto,
      housePhoto,
    });
  }

  // Resolve any shortened GPS URLs in parallel (e.g. goo.gl/maps, maps.app.goo.gl)
  await Promise.all(
    customers.map(async (cust) => {
      if (
        cust.gpsLocation &&
        (cust.gpsLocation.includes('goo.gl') ||
          cust.gpsLocation.includes('maps.app') ||
          cust.gpsLocation.includes('bit.ly'))
      ) {
        cust.gpsLocation = await resolveShortGpsUrl(cust.gpsLocation);
      }
    })
  );

  return {
    sheetTitle,
    headerRow,
    weekColumns,
    remarksColIdx,
    gpsColIdx,
    cardPhotoColIdx,
    housePhotoColIdx,
    customers,
    totalsRow,
    totalRowIndex: totalRowIndex > 0 ? totalRowIndex : rows.length + 1,
  };
}

/**
 * Record a collection payment in a specific cell
 */
export async function recordCollection({ sheetTitle, rowIndex, colIndex, amount, paymentMode }) {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const colLetter = colIndexToLetter(colIndex);
  const cellRange = `'${sheetTitle}'!${colLetter}${rowIndex}`;

  let cellValue = '';
  if (amount !== undefined && amount !== null && amount !== '') {
    if (paymentMode === 'UPI') {
      cellValue = `${amount} (UPI)`;
    } else {
      cellValue = `${amount}`;
    }
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: cellRange,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[cellValue]],
    },
  });

  return { success: true, updatedRange: cellRange, cellValue };
}

/**
 * Add a new Week column right before the Remarks column
 */
export async function addNewWeekColumn({ sheetTitle, weekLabel }) {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const sheetId = await getSheetIdByTitle(sheetTitle);

  // First inspect headers to find remarksColIdx
  const villageData = await getVillageData(sheetTitle);
  const insertColIdx = villageData.remarksColIdx; // Insert before remarks

  // Insert column using batchUpdate insertDimension
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          insertDimension: {
            range: {
              sheetId,
              dimension: 'COLUMNS',
              startIndex: insertColIdx,
              endIndex: insertColIdx + 1,
            },
            inheritFromBefore: true,
          },
        },
      ],
    },
  });

  // Write the new header in Row 1
  const colLetter = colIndexToLetter(insertColIdx);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${sheetTitle}'!${colLetter}1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[weekLabel]],
    },
  });

  return { success: true, insertedColIndex: insertColIdx, weekLabel };
}

/**
 * Add a new customer safely right above the Total row, auto-expanding SUM formulas!
 */
export async function addCustomer({ sheetTitle, customerData }) {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const sheetId = await getSheetIdByTitle(sheetTitle);

  const villageData = await getVillageData(sheetTitle);
  const totalRowIndex = villageData.totalRowIndex; // 1-based index of Total row

  // 0-based insert index in Google Sheets API:
  // Inserting at startIndex = totalRowIndex - 1 inserts a new row right ABOVE the total row!
  const insertRowIdx0 = totalRowIndex - 1;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          insertDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: insertRowIdx0,
              endIndex: insertRowIdx0 + 1,
            },
            inheritFromBefore: true,
          },
        },
      ],
    },
  });

  // Now the new row is at 1-based index totalRowIndex
  const newRowIndex = totalRowIndex;
  const numCols = Math.max(villageData.housePhotoColIdx + 1, 18);
  const rowValues = new Array(numCols).fill('');

  rowValues[0] = customerData.date || '';
  rowValues[1] = customerData.sNo || '';
  rowValues[2] = customerData.nameTe || '';
  rowValues[3] = customerData.nameEn || '';
  rowValues[4] = customerData.amount || '';
  rowValues[5] = customerData.phone || '';
  rowValues[6] = customerData.colony || '';
  rowValues[7] = customerData.paymentType || '';

  // If initial payment given
  if (customerData.initialPayment && customerData.initialWeekColIndex) {
    const wkVal = customerData.initialPaymentMode === 'UPI' 
      ? `${customerData.initialPayment} (UPI)` 
      : `${customerData.initialPayment}`;
    rowValues[customerData.initialWeekColIndex] = wkVal;
  }

  let resolvedGps = customerData.gpsLocation || '';
  if (
    resolvedGps &&
    (resolvedGps.includes('goo.gl') ||
      resolvedGps.includes('maps.app') ||
      resolvedGps.includes('bit.ly'))
  ) {
    resolvedGps = await resolveShortGpsUrl(resolvedGps);
  }

  rowValues[villageData.remarksColIdx] = customerData.remarks || '';
  rowValues[villageData.gpsColIdx] = resolvedGps;
  rowValues[villageData.cardPhotoColIdx] = customerData.cardPhoto || '';
  rowValues[villageData.housePhotoColIdx] = customerData.housePhoto || '';

  const endColLetter = colIndexToLetter(numCols - 1);
  const targetRange = `'${sheetTitle}'!A${newRowIndex}:${endColLetter}${newRowIndex}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: targetRange,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [rowValues],
    },
  });

  return { success: true, newRowIndex };
}

/**
 * Update existing customer fields (phone, colony, remarks, GPS, photos, etc.)
 */
export async function updateCustomer({ sheetTitle, rowIndex, updates }) {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const villageData = await getVillageData(sheetTitle);

  const updatesList = [];

  if (updates.phone !== undefined) {
    updatesList.push({ range: `'${sheetTitle}'!F${rowIndex}`, values: [[updates.phone]] });
  }
  if (updates.colony !== undefined) {
    updatesList.push({ range: `'${sheetTitle}'!G${rowIndex}`, values: [[updates.colony]] });
  }
  if (updates.paymentType !== undefined) {
    updatesList.push({ range: `'${sheetTitle}'!H${rowIndex}`, values: [[updates.paymentType]] });
  }
  if (updates.remarks !== undefined) {
    const colLetter = colIndexToLetter(villageData.remarksColIdx);
    updatesList.push({ range: `'${sheetTitle}'!${colLetter}${rowIndex}`, values: [[updates.remarks]] });
  }
  if (updates.gpsLocation !== undefined) {
    let resolvedGps = updates.gpsLocation;
    if (
      resolvedGps &&
      (resolvedGps.includes('goo.gl') ||
        resolvedGps.includes('maps.app') ||
        resolvedGps.includes('bit.ly'))
    ) {
      resolvedGps = await resolveShortGpsUrl(resolvedGps);
    }
    const colLetter = colIndexToLetter(villageData.gpsColIdx);
    updatesList.push({ range: `'${sheetTitle}'!${colLetter}${rowIndex}`, values: [[resolvedGps]] });
  }
  if (updates.cardPhoto !== undefined) {
    const colLetter = colIndexToLetter(villageData.cardPhotoColIdx);
    updatesList.push({ range: `'${sheetTitle}'!${colLetter}${rowIndex}`, values: [[updates.cardPhoto]] });
  }
  if (updates.housePhoto !== undefined) {
    const colLetter = colIndexToLetter(villageData.housePhotoColIdx);
    updatesList.push({ range: `'${sheetTitle}'!${colLetter}${rowIndex}`, values: [[updates.housePhoto]] });
  }

  if (updatesList.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: updatesList,
      },
    });
  }

  return { success: true };
}

/**
 * Reads Tab 4: 'ఖాతా లెక్కలు (Ledger Reconciliation)'
 */
export async function getLedgerData() {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const sheetTitle = 'ఖాతా లెక్కలు (Ledger Reconciliation)';

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetTitle}'!A1:E60`,
    valueRenderOption: 'FORMATTED_VALUE',
  });

  const rows = res.data.values || [];
  const transactions = [];
  const summary = {
    totalCapitalAdded: 0,
    safetyFundInflow: 0,
    totalCollections: 0,
    totalExpensesAndReturns: 0,
    closingBagBalance: 0,
  };

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const colB = String(row[1] || '').trim();
    const colC = String(row[2] || '').trim();

    if (colB.includes('మొత్తం పెట్టుబడి') || colB.includes('Total Capital Added')) {
      summary.totalCapitalAdded = parseNumber(colC);
    } else if (colB.includes('సేఫ్టీ డిపాజిట్') || colB.includes('Safety Fund Inflow')) {
      summary.safetyFundInflow = parseNumber(colC);
    } else if (colB.includes('మొత్తం వసూళ్లు') || colB.includes('Total Collections')) {
      summary.totalCollections = parseNumber(colC);
    } else if (colB.includes('మొత్తం ఖర్చులు') || colB.includes('Total Expenses')) {
      summary.totalExpensesAndReturns = parseNumber(colC);
    } else if (colB.includes('బ్యాగ్ నిల్వ') || colB.includes('Closing Bag Balance')) {
      summary.closingBagBalance = parseNumber(colC);
    }

    // Transactions table begins after row 1 (header row) and before summary rows
    if (r >= 1 && row[0] && (row[1] || row[2] || row[3])) {
      if (colB && !colB.includes('Total') && !colB.includes('మొత్తం') && !colB.includes('బ్యాగ్ నిల్వ')) {
        transactions.push({
          rowIndex: r + 1,
          date: row[0] || '',
          particulars: row[1] || '',
          credit: parseNumber(row[2]),
          debit: parseNumber(row[3]),
          balance: parseNumber(row[4]),
        });
      }
    }
  }

  return { summary, transactions };
}

/**
 * Add a ledger transaction entry
 */
export async function addLedgerTransaction({ date, particulars, credit, debit }) {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const sheetTitle = 'ఖాతా లెక్కలు (Ledger Reconciliation)';

  // Find the last transaction row before summary table
  const ledgerData = await getLedgerData();
  const lastTxn = ledgerData.transactions[ledgerData.transactions.length - 1];
  const lastBalance = lastTxn ? lastTxn.balance : ledgerData.summary.closingBagBalance;
  
  const numCredit = parseNumber(credit);
  const numDebit = parseNumber(debit);
  const newBalance = lastBalance + numCredit - numDebit;

  const targetRowIndex = lastTxn ? lastTxn.rowIndex + 1 : 2;

  // Insert row in Ledger tab using insertDimension
  const sheetId = await getSheetIdByTitle(sheetTitle);
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          insertDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: targetRowIndex - 1,
              endIndex: targetRowIndex,
            },
            inheritFromBefore: true,
          },
        },
      ],
    },
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${sheetTitle}'!A${targetRowIndex}:E${targetRowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[date, particulars, numCredit ? `${numCredit}` : '', numDebit ? `${numDebit}` : '', `${newBalance}`]],
    },
  });

  return { success: true, targetRowIndex, newBalance };
}

/**
 * Reads Tab 3: 'పెట్టుబడులు (Investments)'
 */
export async function getInvestmentsData() {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const sheetTitle = 'పెట్టుబడులు (Investments)';

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetTitle}'!A1:E40`,
    valueRenderOption: 'FORMATTED_VALUE',
  });

  const rows = res.data.values || [];
  const permanentInvestments = [];
  const partnerSummary = [];
  const safetyFundLog = [];

  let section = 'permanent'; // 'permanent' | 'partner_summary' | 'safety_funds'

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const rowStr = row.join(' ');
    if (rowStr.includes('భాగస్వామి సారాంశం') || rowStr.includes('Partner Summary')) {
      section = 'partner_summary';
      continue;
    } else if (rowStr.includes('తాత్కాలిక భద్రతా నిధి') || rowStr.includes('Temporary Safety')) {
      section = 'safety_funds';
      continue;
    }

    if (section === 'permanent') {
      if (r >= 1 && row[0] && row[1]) {
        if (row[0].includes('మొత్తం') || row[0].includes('Total')) {
          // Total row of permanent investments
          continue;
        }
        permanentInvestments.push({
          rowIndex: r + 1,
          date: row[0] || '',
          partnerName: row[1] || '',
          amount: parseNumber(row[2]),
        });
      }
    } else if (section === 'partner_summary') {
      if (row[1] && row[2]) {
        if (row[1].includes('మొత్తం') || row[1].includes('Grand Total')) {
          continue;
        }
        partnerSummary.push({
          partnerName: row[1] || '',
          totalInvestment: parseNumber(row[2]),
          sharePercentage: row[3] || '',
        });
      }
    } else if (section === 'safety_funds') {
      if (row[0] && row[1] && !row[0].includes('తేదీ') && !row[0].includes('Date')) {
        safetyFundLog.push({
          date: row[0] || '',
          particulars: row[1] || '',
          inflow: parseNumber(row[2]),
          outflow: parseNumber(row[3]),
          netStatus: row[4] || '',
        });
      }
    }
  }

  return { permanentInvestments, partnerSummary, safetyFundLog };
}

/**
 * Add a permanent investment entry
 */
export async function addInvestmentEntry({ date, partnerName, amount }) {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const sheetTitle = 'పెట్టుబడులు (Investments)';

  const invData = await getInvestmentsData();
  const lastEntry = invData.permanentInvestments[invData.permanentInvestments.length - 1];
  const targetRowIndex = lastEntry ? lastEntry.rowIndex + 1 : 2;

  const sheetId = await getSheetIdByTitle(sheetTitle);
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          insertDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: targetRowIndex - 1,
              endIndex: targetRowIndex,
            },
            inheritFromBefore: true,
          },
        },
      ],
    },
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${sheetTitle}'!A${targetRowIndex}:C${targetRowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[date, partnerName, `${parseNumber(amount)}`]],
    },
  });

  return { success: true, targetRowIndex };
}

/**
 * Reads Tab 5: 'లాభ-నష్టాలు (P&L Analytics)' and synthesizes complete dashboard data
 */
export async function getPnLAndDashboardData() {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const sheetTitle = 'లాభ-నష్టాలు (P&L Analytics)';

  let pnlRows = [];
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetTitle}'!A1:G50`,
      valueRenderOption: 'FORMATTED_VALUE',
    });
    pnlRows = res.data.values || [];
  } catch (err) {
    console.warn('Could not read P&L tab directly:', err.message);
  }

  // Also fetch live data from both villages to have 100% verified live metrics
  const [edurlanka, kothapalli, ledger] = await Promise.all([
    getVillageData('ఎదుర్లంక (Edurlanka)'),
    getVillageData('కొత్తపల్లి (Kothapalli)'),
    getLedgerData(),
  ]);

  // Edurlanka stats
  const activeEdurlanka = edurlanka.customers.filter(c => !c.isStruckOut);
  const edurlankaPortfolio = activeEdurlanka.reduce((acc, c) => acc + c.amount, 0);
  const edurlankaCollected = activeEdurlanka.reduce((acc, c) => acc + c.totalPaid, 0);
  const edurlankaDues = activeEdurlanka.reduce((acc, c) => acc + c.remainingDue, 0);

  // Kothapalli stats
  const activeKothapalli = kothapalli.customers.filter(c => !c.isStruckOut);
  const kothapalliPortfolio = activeKothapalli.reduce((acc, c) => acc + c.amount, 0);
  const kothapalliCollected = activeKothapalli.reduce((acc, c) => acc + c.totalPaid, 0);
  const kothapalliDues = activeKothapalli.reduce((acc, c) => acc + c.remainingDue, 0);

  const totalPortfolio = edurlankaPortfolio + kothapalliPortfolio;
  const totalCollected = edurlankaCollected + kothapalliCollected;
  const totalDues = edurlankaDues + kothapalliDues;
  const bagBalance = ledger.summary.closingBagBalance || 5500;

  // Expected gross profit calculation from loan schemes:
  // Each customer face value minus disbursed gives expected gross profit
  let expectedGrossProfit = 0;
  [...activeEdurlanka, ...activeKothapalli].forEach(c => {
    // Typical profit is Face Value - Disbursed. e.g.:
    // 25k -> 19.8k (5.2k profit)
    // 12.5k -> 9.9k (2.6k profit)
    // 6.3k -> 5.0k (1.3k profit)
    // 18.75k -> 14.85k (3.9k profit)
    // Roughly ~20.8% of Face Value
    if (c.amount === 25000) expectedGrossProfit += (25000 - 19800);
    else if (c.amount === 18750) expectedGrossProfit += (18750 - 14850);
    else if (c.amount === 14000) expectedGrossProfit += (14000 - 9900);
    else if (c.amount === 12500) expectedGrossProfit += (12500 - 9900);
    else if (c.amount === 6300) expectedGrossProfit += (6300 - 5000);
    else if (c.amount === 5000) expectedGrossProfit += (5000 - 4000);
    else if (c.amount === 2500) expectedGrossProfit += (2500 - 2000);
    else if (c.amount === 1250) expectedGrossProfit += (1250 - 1000);
    else expectedGrossProfit += Math.round(c.amount * 0.208);
  });

  // Partner equity
  const sattibabuInvested = 400000;
  const prudhviInvested = 250000;
  const totalCapital = sattibabuInvested + prudhviInvested;
  const sattibabuSharePct = (sattibabuInvested / totalCapital) * 100;
  const prudhviSharePct = (prudhviInvested / totalCapital) * 100;

  const partnerEquity = [
    {
      name: 'సత్తిబాబు (Sattibabu)',
      invested: sattibabuInvested,
      sharePct: sattibabuSharePct.toFixed(2) + '%',
      expectedProfitShare: Math.round(expectedGrossProfit * (sattibabuSharePct / 100)),
      totalValue: sattibabuInvested + Math.round(expectedGrossProfit * (sattibabuSharePct / 100)),
    },
    {
      name: 'పృధ్వి (Prudhvi)',
      invested: prudhviInvested,
      sharePct: prudhviSharePct.toFixed(2) + '%',
      expectedProfitShare: Math.round(expectedGrossProfit * (prudhviSharePct / 100)),
      totalValue: prudhviInvested + Math.round(expectedGrossProfit * (prudhviSharePct / 100)),
    },
  ];

  // Weekly collection trends across both villages
  const weekCollectionsMap = {};
  edurlanka.weekColumns.forEach(wk => {
    weekCollectionsMap[wk.header] = {
      header: wk.header,
      edurlanka: 0,
      kothapalli: 0,
      total: 0,
    };
  });
  kothapalli.weekColumns.forEach(wk => {
    if (!weekCollectionsMap[wk.header]) {
      weekCollectionsMap[wk.header] = {
        header: wk.header,
        edurlanka: 0,
        kothapalli: 0,
        total: 0,
      };
    }
  });

  edurlanka.customers.forEach(c => {
    c.weeklyPayments.forEach(p => {
      if (weekCollectionsMap[p.weekHeader]) {
        weekCollectionsMap[p.weekHeader].edurlanka += p.amount;
        weekCollectionsMap[p.weekHeader].total += p.amount;
      }
    });
  });

  kothapalli.customers.forEach(c => {
    c.weeklyPayments.forEach(p => {
      if (weekCollectionsMap[p.weekHeader]) {
        weekCollectionsMap[p.weekHeader].kothapalli += p.amount;
        weekCollectionsMap[p.weekHeader].total += p.amount;
      }
    });
  });

  const weeklyTrends = Object.values(weekCollectionsMap);

  return {
    kpis: {
      bagBalance,
      totalDues,
      totalCollected,
      totalPortfolio,
      expectedGrossProfit,
      activeBorrowersCount: activeEdurlanka.length + activeKothapalli.length,
    },
    villages: {
      edurlanka: {
        title: 'ఎదుర్లంక (Edurlanka)',
        count: activeEdurlanka.length,
        portfolio: edurlankaPortfolio,
        collected: edurlankaCollected,
        dues: edurlankaDues,
        recoveryRate: edurlankaPortfolio > 0 ? ((edurlankaCollected / edurlankaPortfolio) * 100).toFixed(1) : 0,
      },
      kothapalli: {
        title: 'కొత్తపల్లి (Kothapalli)',
        count: activeKothapalli.length,
        portfolio: kothapalliPortfolio,
        collected: kothapalliCollected,
        dues: kothapalliDues,
        recoveryRate: kothapalliPortfolio > 0 ? ((kothapalliCollected / kothapalliPortfolio) * 100).toFixed(1) : 0,
      },
    },
    partnerEquity,
    weeklyTrends,
  };
}
