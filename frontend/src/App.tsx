import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { canAccessPath, useAuth } from './lib/auth';
import { CashClosures } from './pages/CashClosures';
import { Costs } from './pages/Costs';
import { Dashboard } from './pages/Dashboard';
import { Debts } from './pages/Debts';
import { Home } from './pages/Home';
import { Inventory } from './pages/Inventory';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';
import { Pos } from './pages/Pos';
import { SalesHistory } from './pages/SalesHistory';
import { Settings } from './pages/Settings';

function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppLayout />;
}

function RoleProtectedRoute({ element }: { element: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (!canAccessPath(user.role, location.pathname)) return <Navigate to="/pos" replace />;
  return <>{element}</>;
}

function PublicOnlyRoute({ element }: { element: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/pos" replace />;
  return <>{element}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<RoleProtectedRoute element={<Dashboard />} />} />
          <Route path="/pos" element={<RoleProtectedRoute element={<Pos />} />} />
          <Route path="/sales-history" element={<RoleProtectedRoute element={<SalesHistory />} />} />
          <Route path="/cash-closures" element={<RoleProtectedRoute element={<CashClosures />} />} />
          <Route path="/inventory" element={<RoleProtectedRoute element={<Inventory />} />} />
          <Route path="/debts" element={<RoleProtectedRoute element={<Debts />} />} />
          <Route path="/costs" element={<RoleProtectedRoute element={<Costs />} />} />
          <Route path="/settings" element={<RoleProtectedRoute element={<Settings />} />} />
        </Route>
        <Route path="/hello" element={<PublicOnlyRoute element={<Home />} />} />
        <Route path="/login" element={<PublicOnlyRoute element={<Login />} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
