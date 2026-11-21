export const LOAN_SCHEMES = [
  {
    faceValue: 25000,
    disbursed: 19800,
    installment: 1000,
    period: 'Weekly (25 వారాలు)',
    type: 'weekly',
    weeks: 25,
    label: '₹25,000 (ఇచ్చేది ₹19,800 | వారం ₹1,000)',
  },
  {
    faceValue: 18750,
    disbursed: 14850,
    installment: 750,
    period: 'Weekly (25 వారాలు)',
    type: 'weekly',
    weeks: 25,
    label: '₹18,750 (ఇచ్చేది ₹14,850 | వారం ₹750)',
  },
  {
    faceValue: 14000,
    disbursed: 9900,
    installment: 1167,
    period: 'Monthly (12 నెలలు)',
    type: 'monthly',
    months: 12,
    label: '₹14,000 (ఇచ్చేది ₹9,900 | నెల ₹1,167)',
  },
  {
    faceValue: 12500,
    disbursed: 9900,
    installment: 500,
    period: 'Weekly (25 వారాలు)',
    type: 'weekly',
    weeks: 25,
    label: '₹12,500 (ఇచ్చేది ₹9,900 | వారం ₹500)',
  },
  {
    faceValue: 6300,
    disbursed: 5000,
    installment: 250,
    period: 'Weekly (25 వారాలు)',
    type: 'weekly',
    weeks: 25,
    label: '₹6,300 (ఇచ్చేది ₹5,000 | వారం ₹250)',
  },
  {
    faceValue: 5000,
    disbursed: 4000,
    installment: 200,
    period: 'Weekly (25 వారాలు)',
    type: 'weekly',
    weeks: 25,
    label: '₹5,000 (ఇచ్చేది ₹4,000 | వారం ₹200)',
  },
  {
    faceValue: 2500,
    disbursed: 2000,
    installment: 100,
    period: 'Weekly (25 వారాలు)',
    type: 'weekly',
    weeks: 25,
    label: '₹2,500 (ఇచ్చేది ₹2,000 | వారం ₹100)',
  },
  {
    faceValue: 1250,
    disbursed: 1000,
    installment: 50,
    period: 'Weekly (25 వారాలు)',
    type: 'weekly',
    weeks: 25,
    label: '₹1,250 (ఇచ్చేది ₹1,000 | వారం ₹50)',
  },
];

export function getSchemeByFaceValue(amount) {
  const numericAmount = Number(String(amount || '').replace(/[^0-9.]/g, ''));
  return (
    LOAN_SCHEMES.find((s) => s.faceValue === numericAmount) || {
      faceValue: numericAmount,
      disbursed: Math.round(numericAmount * 0.8),
      installment: Math.round(numericAmount / 25),
      period: 'Weekly',
      type: 'weekly',
      weeks: 25,
      label: `₹${numericAmount.toLocaleString('en-IN')}`,
    }
  );
}
