// ─── Seed de datos demo ───────────────────────────────────────────────────────
// Sobreescribe localStorage con los datos demo frescos en cada visita de demo

import { DEMO_SALES } from '../mocks/demo-data';
import { DEMO_DEBTS } from '../mocks/demo-data';
import { readLocalStorage, writeLocalStorage } from './storage';

const SEED_VERSION = '3'; // incrementa para forzar re-seed
const SEEDED_KEY = 'abasto.demo.seeded.v';

export function seedDemoDataIfEmpty(): void {
  const seeded = readLocalStorage(SEEDED_KEY);
  if (seeded === SEED_VERSION) return;

  // Siempre reemplaza con datos demo frescos
  writeLocalStorage('abasto.salesHistory', JSON.stringify(DEMO_SALES));
  writeLocalStorage('abasto.debts', JSON.stringify(DEMO_DEBTS));
  writeLocalStorage(SEEDED_KEY, SEED_VERSION);
}
