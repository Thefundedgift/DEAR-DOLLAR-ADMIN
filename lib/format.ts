export const formatMoney = (n?: number | null): string =>
  `\u20B9${Number(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export const formatDollar = (n?: number | null): string =>
  `${Number(n ?? 0).toLocaleString('en-IN')} $D`;

export const formatNumber = (n?: number | null): string =>
  Number(n ?? 0).toLocaleString('en-IN');

export const formatDate = (iso?: string | null): string => {
  if (!iso) return '\u2014';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

export const formatDateOnly = (iso?: string | null): string => {
  if (!iso) return '\u2014';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('en-IN', { dateStyle: 'medium' });
};
