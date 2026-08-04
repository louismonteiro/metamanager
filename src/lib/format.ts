/**
 * Presentation formatters. The product presents every monetary value in EUR,
 * with Portuguese locale conventions.
 */

const LOCALE = "pt-PT";

const eur = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "EUR",
});

const eurCompact = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

const integer = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

const decimal = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatEur(amount: number): string {
  return eur.format(amount);
}

export function formatEurCompact(amount: number): string {
  return eurCompact.format(amount);
}

export function formatNumber(value: number): string {
  return integer.format(value);
}

export function formatDecimal(value: number): string {
  return decimal.format(value);
}

/** `value` is already a percentage (0-100), not a ratio. */
export function formatPercent(value: number): string {
  return `${decimal.format(value)}%`;
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}
