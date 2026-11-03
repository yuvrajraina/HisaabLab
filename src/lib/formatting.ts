export const formatINR = (value: number, maximumFractionDigits = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits
  }).format(Number.isFinite(value) ? value : 0);

export const formatNumber = (value: number, digits = 0) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0);

export const formatCompactINR = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1e7) return `${value < 0 ? '-' : ''}₹${(abs / 1e7).toFixed(1)} crore`;
  if (abs >= 1e5) return `${value < 0 ? '-' : ''}₹${(abs / 1e5).toFixed(1)} lakh`;
  return formatINR(value);
};
