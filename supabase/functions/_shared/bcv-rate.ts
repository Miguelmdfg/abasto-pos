export type OfficialBcvRate = {
  value: number;
  publishedAt: string;
};

export function parseOfficialBcvRate(html: string, now = new Date()): OfficialBcvRate {
  const dollarBlock = html.match(
    /<div\b(?=[^>]*\bid\s*=\s*["']dolar["'])[^>]*>([\s\S]*?)<\/section>/i,
  )?.[1];
  if (!dollarBlock) throw new Error('BCV_USD_BLOCK_NOT_FOUND');

  const rawValue = dollarBlock.match(/<strong\b[^>]*>\s*([\d.,]+)\s*<\/strong>/i)?.[1];
  if (!rawValue || !/^\d{1,12},\d{1,10}$/.test(rawValue)) {
    throw new Error('BCV_USD_VALUE_INVALID');
  }

  const value = Number(rawValue.replace(',', '.'));
  if (!Number.isFinite(value) || value <= 0) throw new Error('BCV_USD_VALUE_INVALID');

  const publishedAt = dollarBlock.match(
    /<span\b(?=[^>]*\bcontent\s*=\s*["']([^"']+)["'])[^>]*>/i,
  )?.[1];
  const publishedDate = publishedAt ? new Date(publishedAt) : null;
  if (!publishedDate || !Number.isFinite(publishedDate.getTime())) {
    throw new Error('BCV_PUBLICATION_DATE_INVALID');
  }

  const age = now.getTime() - publishedDate.getTime();
  if (age < -24 * 60 * 60 * 1000 || age > 7 * 24 * 60 * 60 * 1000) {
    throw new Error('BCV_PUBLICATION_DATE_OUT_OF_RANGE');
  }

  return { value, publishedAt: publishedDate.toISOString() };
}
