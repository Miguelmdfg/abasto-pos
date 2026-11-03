import { describe, expect, it } from 'vitest';
import { parseOfficialBcvRate } from '../../../supabase/functions/_shared/bcv-rate';

const now = new Date('2026-10-19T16:00:00.000Z');
const validHtml = `
  <section>
    <div id="dolar">
      <strong class="strong-tb">881,06640000</strong>
      Fecha Valor:
      <span content="2026-10-19T00:00:00-04:00">Lunes, 19 Octubre 2026</span>
    </div>
  </section>
`;

describe('parseOfficialBcvRate', () => {
  it('parses the published USD rate and its official date', () => {
    expect(parseOfficialBcvRate(validHtml, now)).toEqual({
      value: 881.0664,
      publishedAt: '2026-10-19T04:00:00.000Z',
    });
  });

  it('rejects a missing official USD block', () => {
    expect(() => parseOfficialBcvRate('<section></section>', now)).toThrow('BCV_USD_BLOCK_NOT_FOUND');
  });

  it('rejects malformed rates and dates that are too old', () => {
    expect(() => parseOfficialBcvRate(validHtml.replace('881,06640000', '881.06640000'), now))
      .toThrow('BCV_USD_VALUE_INVALID');
    const staleHtml = validHtml.replace('2026-10-19', '2026-10-01');
    expect(() => parseOfficialBcvRate(staleHtml, now)).toThrow('BCV_PUBLICATION_DATE_OUT_OF_RANGE');
  });
});
