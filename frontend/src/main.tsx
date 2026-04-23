import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { ExchangeRateProvider } from './lib/exchange-rate';
import { I18nProvider } from './lib/i18n';
import { RateHistoryProvider } from './lib/rate-history';
import { SalesHistoryProvider } from './lib/sales-history';
import { SettingsProvider } from './lib/settings-context';
import { applyTheme, getInitialTheme } from './lib/theme';
import { DebtsProvider } from './lib/debts-context';
import { CashierShiftProvider } from './lib/cashier-shift';
import { seedDemoDataIfEmpty } from './lib/demo-seed';
import { AuthProvider } from './lib/auth';

applyTheme(getInitialTheme());
seedDemoDataIfEmpty();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <AuthProvider>
        <SettingsProvider>
          <RateHistoryProvider>
            <ExchangeRateProvider>
              <SalesHistoryProvider>
                <DebtsProvider>
                  <CashierShiftProvider>
                    <App />
                  </CashierShiftProvider>
                </DebtsProvider>
              </SalesHistoryProvider>
            </ExchangeRateProvider>
          </RateHistoryProvider>
        </SettingsProvider>
      </AuthProvider>
    </I18nProvider>
  </StrictMode>
);
