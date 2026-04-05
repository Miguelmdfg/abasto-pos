import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { Costs } from './pages/Costs';
import { Dashboard } from './pages/Dashboard';
import { Debts } from './pages/Debts';
import { Home } from './pages/Home';
import { Inventory } from './pages/Inventory';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';
import { Pos } from './pages/Pos';
import { Reports } from './pages/Reports';
import { SalesHistory } from './pages/SalesHistory';
import { Settings } from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pos" element={<Pos />} />
          <Route path="/sales-history" element={<SalesHistory />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/debts" element={<Debts />} />
          <Route path="/costs" element={<Costs />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="/hello" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
