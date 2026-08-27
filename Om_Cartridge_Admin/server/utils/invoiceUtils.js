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
 * Calculate invoice totals
 * isInterState: if true, use IGST; else use CGST + SGST
 */
function calculateInvoiceTotals(items, isInterState = false) {
  let subtotal = 0;
  const processedItems = items.map((item) => {
    const amount = roundTo2(item.quantity * item.rate);
    const gstRate = item.gstRate || 18;

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (isInterState) {
      igstAmount = roundTo2(amount * (gstRate / 100));
    } else {
      cgstAmount = roundTo2(amount * (gstRate / 2 / 100));
      sgstAmount = roundTo2(amount * (gstRate / 2 / 100));
    }

    subtotal += amount;

    return {
      ...item,
      amount,
      cgstAmount,
      sgstAmount,
      igstAmount,
    };
  });

  subtotal = roundTo2(subtotal);
  const taxableValue = subtotal;

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
  const totalTax = roundTo2(cgst + sgst + igst);

  const rawTotal = roundTo2(taxableValue + totalTax);
  const grandTotal = Math.round(rawTotal);
  const roundOff = roundTo2(grandTotal - rawTotal);

  const amountInWords = numberToWordsIndian(grandTotal);
  const taxAmountInWords = numberToWordsIndian(totalTax);

  return {
    items: processedItems,
    subtotal,
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

module.exports = {
  numberToWordsIndian,
  getFinancialYear,
  roundTo2,
  calculateInvoiceTotals,
};
