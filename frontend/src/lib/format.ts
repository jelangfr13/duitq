/**
 * Format nominal angka ke format mata uang Rupiah Indonesia (Rp 1.500.000)
 */
export const formatRupiah = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rp 0';
  }
  const isNegative = amount < 0;
  const absoluteAmount = Math.abs(Math.round(amount));
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(absoluteAmount);

  // Ganti Rp1.500.000 menjadi Rp 1.500.000 (dengan spasi rapi)
  const withSpace = formatted.replace(/^Rp\s?/, 'Rp ');
  return isNegative ? `-${withSpace}` : withSpace;
};

/**
 * Format ringkas nominal Rupiah (misal Rp 1,5 jt atau Rp 250 rb) untuk grafik/badge
 */
export const formatCompactRupiah = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rp 0';
  }
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1).replace('.0', '')} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${(abs / 1_000_000).toFixed(1).replace('.0', '')} jt`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp ${(abs / 1_000).toFixed(0)} rb`;
  }
  return formatRupiah(amount);
};

/**
 * Format tanggal Indonesia standar (misal: 15 Okt 2026)
 */
export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
};

/**
 * Format tanggal & jam Indonesia (misal: 15 Okt 2026, 09:30)
 */
export const formatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
};
