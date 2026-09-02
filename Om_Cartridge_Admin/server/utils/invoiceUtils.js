/**
 * Convert number to Indian currency words
 * Supports Crore, Lakh, Thousand, Hundred
 */
const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
];

function convertHundreds(num) {
  if (num === 0) return '';
  let result = '';
  if (num >= 100) {
    result += ones[Math.floor(num / 100)] + ' Hundred ';
    num = num % 100;
  }
  if (num >= 20) {
    result += tens[Math.floor(num / 10)] + ' ';
    num = num % 10;
  }
  if (num > 0) {
    result += ones[num] + ' ';
  }
  return result.trim();
}

function numberToWordsIndian(amount) {
  if (isNaN(amount)) return '';

  const roundedAmount = Math.round(amount * 100) / 100;
  const rupees = Math.floor(roundedAmount);
  const paise = Math.round((roundedAmount - rupees) * 100);

  if (rupees === 0 && paise === 0) return 'INR Zero Only';

  let rupeesWords = '';
  let remaining = rupees;

  if (remaining >= 10000000) {
    rupeesWords += convertHundreds(Math.floor(remaining / 10000000)) + ' Crore ';
    remaining = remaining % 10000000;
  }
  if (remaining >= 100000) {
    rupeesWords += convertHundreds(Math.floor(remaining / 100000)) + ' Lakh ';
    remaining = remaining % 100000;
  }
  if (remaining >= 1000) {
    rupeesWords += convertHundreds(Math.floor(remaining / 1000)) + ' Thousand ';
    remaining = remaining % 1000;
  }
  if (remaining > 0) {
    rupeesWords += convertHundreds(remaining);
  }

  let result = 'INR ' + rupeesWords.trim();

  if (paise > 0) {
    result += ' and ' + convertHundreds(paise) + ' paise';
  }

  result += ' Only';
  return result.replace(/\s+/g, ' ').trim();
}

/**
 * Calculate financial year from a date
 * e.g. if date is in Apr 2026 - Mar 2027, returns "2026-27"
 */
function getFinancialYear(date = new Date()) {
  const month = date.getMonth() + 1; // 1-12
  const year = date.getFullYear();
  if (month >= 4) {
    return `${year}-${String(year + 1).slice(-2)}`;
  } else {
    return `${year - 1}-${String(year).slice(-2)}`;
  }
}

/**
 * Round to 2 decimal places
 */
function roundTo2(num) {
  return Math.round(num * 100) / 100;
}

/**
 * Calculate per-item discount amount
 * discountType: 'none' | 'percent' | 'fixed'
 */
function computeItemDiscount(amount, discountType, discountValue) {
  if (!discountType || discountType === 'none' || !discountValue) return 0;
  if (discountType === 'percent') {
    return roundTo2(amount * (Number(discountValue) / 100));
  }
  if (discountType === 'fixed') {
    // Cannot exceed the amount
    return roundTo2(Math.min(Number(discountValue), amount));
  }
  return 0;
}

/**
 * Calculate invoice totals with optional per-item discount support and tax mode.
 * isInterState: if true, use IGST; else use CGST + SGST
 * taxMode: 'with_tax' | 'without_tax' — when without_tax, all GST = 0
 *
 * Each item may have:
 *   discountType: 'none' | 'percent' | 'fixed'
 *   discountValue: number
 */
function calculateInvoiceTotals(items, isInterState = false, taxMode = 'with_tax') {
  const applyTax = taxMode !== 'without_tax';
  let subtotal = 0;
  let totalDiscount = 0;

  const processedItems = items.map((item) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const amount = roundTo2(qty * rate);
    const gstRate = item.gstRate !== undefined ? Number(item.gstRate) : 18;

    const discountType = item.discountType || 'none';
    const discountValue = Number(item.discountValue) || 0;
    const discountAmount = computeItemDiscount(amount, discountType, discountValue);
    const finalAmount = roundTo2(amount - discountAmount);

    // Tax only applied when taxMode === 'with_tax'
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (applyTax) {
      if (isInterState) {
        igstAmount = roundTo2(finalAmount * (gstRate / 100));
      } else {
        cgstAmount = roundTo2(finalAmount * (gstRate / 2 / 100));
        sgstAmount = roundTo2(finalAmount * (gstRate / 2 / 100));
      }
    }

    subtotal += amount;
    totalDiscount += discountAmount;

    return {
      ...item,
      amount,
      discountType,
      discountValue,
      discountAmount,
      finalAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
    };
  });

  subtotal = roundTo2(subtotal);
  totalDiscount = roundTo2(totalDiscount);
  const taxableValue = roundTo2(subtotal - totalDiscount);

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  processedItems.forEach((item) => {
    cgst += item.cgstAmount;
    sgst += item.sgstAmount;
    igst += item.igstAmount;
  });

  cgst = roundTo2(cgst);
  sgst = roundTo2(sgst);
  igst = roundTo2(igst);
  const totalTax = roundTo2(cgst + sgst + igst); // 0 when without_tax

  const rawTotal = roundTo2(taxableValue + totalTax);
  const grandTotal = Math.round(rawTotal);
  const roundOff = roundTo2(grandTotal - rawTotal);

  const amountInWords = numberToWordsIndian(grandTotal);
  const taxAmountInWords = numberToWordsIndian(totalTax);

  return {
    items: processedItems,
    subtotal,
    totalDiscount,
    taxableValue,
    cgst,
    sgst,
    igst,
    totalTax,
    rawTotal,
    roundOff,
    grandTotal,
    amountInWords,
    taxAmountInWords,
  };
}

/**
 * Simple CSV parser — handles quoted fields and commas within quotes
 */
function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length < 1) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').toLowerCase().trim());
  const rows = lines.slice(1).filter(l => l.trim()).map((line, idx) => {
    const values = parseCSVLine(line);
    const obj = { _rowNumber: idx + 2 }; // 1-indexed, +1 for header row
    headers.forEach((h, i) => { obj[h] = (values[i] || '').replace(/^"|"$/g, '').trim(); });
    return obj;
  });
  return { headers, rows };
}

module.exports = {
  numberToWordsIndian,
  getFinancialYear,
  roundTo2,
  calculateInvoiceTotals,
  parseCSV,
};
