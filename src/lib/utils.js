import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatINR(val) {
  if (val === null || val === undefined || isNaN(Number(val))) return "₹0";
  const num = Math.round(Number(val));
  return "₹" + num.toLocaleString("en-IN");
}

export function parseNumber(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/[^0-9.-]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function parsePaymentCell(cell) {
  if (!cell) return { amount: 0, isUPI: false, raw: "" };
  const raw = String(cell).trim();
  const isUPI = raw.toLowerCase().includes("upi") || raw.toLowerCase().includes("phonepe");
  const amount = parseNumber(raw);
  return { amount, isUPI, raw };
}

export function getTodayDateStr() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

/**
 * Parses dates like "03-10-26", "14/11/2026", or "1 (10/10/26)" into comparable number YYYYMMDD
 */
export function parseDateToComparable(dateStr) {
  if (!dateStr) return 0;
  const m = String(dateStr).match(/\(([^)]+)\)/);
  const target = m ? m[1] : String(dateStr);
  const parts = target.replace(/[./\s]/g, "-").split("-").filter(Boolean);
  if (parts.length < 3) return 0;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  let year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return 0;

  if (year < 100) {
    year = year >= 70 ? 1900 + year : 2000 + year;
  }
  return year * 10000 + month * 100 + day;
}

/**
 * Determines whether a weekly collection column is applicable to a customer.
 * A collection week is due/applicable ONLY if the week date is strictly AFTER customer join date,
 * or if a payment was already recorded in that week.
 */
export function isWeekApplicableForCustomer(weekHeaderOrDate, customerJoinDate, hasPaidInWeek = false) {
  if (hasPaidInWeek) return true;
  const joinComp = parseDateToComparable(customerJoinDate);
  const weekComp = parseDateToComparable(weekHeaderOrDate);
  if (!joinComp || !weekComp) return true;

  return weekComp > joinComp;
}

export function getAllSaturdaysInMonth(year, month) {
  // month is 0-indexed (0 = Jan, 11 = Dec)
  const saturdays = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    if (d.getDay() === 6) {
      saturdays.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
  }
  return saturdays;
}

/**
 * Calculates the exact N-th Saturday date of the target month based on join date.
 * (e.g., if a borrower took loan on the 3rd Saturday of October, Month 1 is due on
 * the 3rd Saturday of November, Month 2 on the 3rd Saturday of December, etc.)
 */
export function getMonthlyDueSaturday(joinDateStr, monthIndex = 1) {
  if (!joinDateStr) return null;
  const parts = String(joinDateStr).replace(/[./\s]/g, "-").split("-").filter(Boolean);
  if (parts.length < 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  let year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

  if (year < 100) {
    year = year >= 70 ? 1900 + year : 2000 + year;
  }

  // Find all Saturdays in join month
  const joinMonthSats = getAllSaturdaysInMonth(year, month);
  let satIndex = -1;
  for (let i = 0; i < joinMonthSats.length; i++) {
    if (joinMonthSats[i].getDate() === day) {
      satIndex = i + 1; // 1-based (1st Sat, 2nd Sat, 3rd Sat...)
      break;
    }
  }

  // If joinDate wasn't an exact Saturday, match the closest Saturday
  if (satIndex === -1) {
    let closestDist = 99;
    for (let i = 0; i < joinMonthSats.length; i++) {
      const diff = Math.abs(joinMonthSats[i].getDate() - day);
      if (diff < closestDist) {
        closestDist = diff;
        satIndex = i + 1;
      }
    }
  }

  // Target month
  const targetDate = new Date(year, month + monthIndex, 1);
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();
  const targetMonthSats = getAllSaturdaysInMonth(targetYear, targetMonth);

  // Pick the same N-th Saturday (or last Saturday if target month has fewer)
  const chosenIndex = Math.min(satIndex - 1, targetMonthSats.length - 1);
  const chosenSat = targetMonthSats[chosenIndex];

  const resDay = String(chosenSat.getDate()).padStart(2, "0");
  const resMonth = String(chosenSat.getMonth() + 1).padStart(2, "0");
  const resYear = String(chosenSat.getFullYear()).slice(-2);

  return {
    satOccurrence: satIndex, // e.g. 3 (3rd Saturday)
    formatted: `${resDay}-${resMonth}-${resYear}`,
    short: `${resDay}/${resMonth}`,
    comparable: chosenSat.getFullYear() * 10000 + (chosenSat.getMonth() + 1) * 100 + chosenSat.getDate(),
  };
}

/**
 * Determines whether this monthly customer is due for collection this Saturday or can be skipped.
 */
export function getMonthlyCustomerStatus(customer, currentSaturdayComparable = 20261121) {
  if (!customer || !customer.isMonthly) return null;

  if (customer.remainingDue <= 0) {
    return {
      type: "completed",
      badgeTe: "పూర్తయింది (Loan Completed)",
      badgeEn: "Completed",
      color: "emerald",
      isDueThisSaturday: false,
    };
  }

  const paidCount = (customer.weeklyPayments || []).filter((p) => p.amount > 0).length;
  const nextMonthIndex = paidCount + 1;
  const due = getMonthlyDueSaturday(customer.date, nextMonthIndex);

  if (!due) {
    return {
      type: "unknown",
      badgeTe: "నెల స్కీమ్",
      badgeEn: "Monthly",
      color: "purple",
      isDueThisSaturday: false,
    };
  }

  if (due.comparable === currentSaturdayComparable) {
    return {
      type: "due_this_saturday",
      monthNumber: nextMonthIndex,
      dueDate: due.formatted,
      badgeTe: `🔔 ఈ శనివారం వసూలు చేయాలి (${due.formatted})`,
      badgeEn: `Due This Saturday (${due.short})`,
      color: "amber",
      isDueThisSaturday: true,
      buttonText: `ఈ శనివారం వసూలు (M${nextMonthIndex}) ➔`,
    };
  } else if (due.comparable < currentSaturdayComparable) {
    return {
      type: "overdue",
      monthNumber: nextMonthIndex,
      dueDate: due.formatted,
      badgeTe: `⚠️ ${nextMonthIndex}వ నెల ఆలస్యం (డ్యూ: ${due.formatted})`,
      badgeEn: `Overdue (${due.short})`,
      color: "rose",
      isDueThisSaturday: true,
      buttonText: `ఆలస్య వాయిదా వసూలు (M${nextMonthIndex}) ➔`,
    };
  } else {
    return {
      type: "not_due",
      monthNumber: nextMonthIndex,
      dueDate: due.formatted,
      badgeTe: `ఈ వారం అవసరం లేదు (నెక్స్ట్ శనివారం: ${due.formatted})`,
      badgeEn: `Next Due: ${due.short}`,
      color: "slate",
      isDueThisSaturday: false,
      buttonText: `ముందస్తు వసూలు (M${nextMonthIndex}) ➔`,
    };
  }
}
