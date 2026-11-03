import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { canAccessPath, useAuth } from './lib/auth';

const Costs = lazy(() => import('./pages/Costs').then(({ Costs }) => ({ default: Costs })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(({ Dashboard }) => ({ default: Dashboard })));
const Debts = lazy(() => import('./pages/Debts').then(({ Debts }) => ({ default: Debts })));
const Home = lazy(() => import('./pages/Home').then(({ Home }) => ({ default: Home })));
const Inventory = lazy(() => import('./pages/Inventory').then(({ Inventory }) => ({ default: Inventory })));
const Login = lazy(() => import('./pages/Login').then(({ Login }) => ({ default: Login })));
const NotFound = lazy(() => import('./pages/NotFound').then(({ NotFound }) => ({ default: NotFound })));
const Pos = lazy(() => import('./pages/Pos').then(({ Pos }) => ({ default: Pos })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(({ ResetPassword }) => ({ default: ResetPassword })));
const SalesHistory = lazy(() => import('./pages/SalesHistory').then(({ SalesHistory }) => ({ default: SalesHistory })));
const Settings = lazy(() => import('./pages/Settings').then(({ Settings }) => ({ default: Settings })));
const Suppliers = lazy(() => import('./pages/Suppliers').then(({ Suppliers }) => ({ default: Suppliers })));

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-40 items-center justify-center bg-slate-50/80 text-sm text-slate-600 dark:bg-slate-900/80 dark:text-slate-300" role="status">
      <span className="mr-3 size-4 animate-spin rounded-full border-2 border-slate-300 border-t-primary dark:border-slate-700 dark:border-t-primary" />
      Cargando módulo...
    </div>
  );
}

function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppLayout />;
}

function RoleProtectedRoute({ element }: { element: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return null;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (!canAccessPath(user.role, location.pathname)) return <Navigate to="/pos" replace />;
  return <Suspense fallback={<RouteLoadingFallback />}>{element}</Suspense>;
}

function PublicOnlyRoute({ element }: { element: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/pos" replace />;
  return <Suspense fallback={<RouteLoadingFallback />}>{element}</Suspense>;
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<RoleProtectedRoute element={<Dashboard />} />} />
            <Route path="/pos" element={<RoleProtectedRoute element={<Pos />} />} />
            <Route path="/sales-history" element={<RoleProtectedRoute element={<SalesHistory />} />} />
            <Route path="/reports" element={<RoleProtectedRoute element={<Navigate to="/?view=reports" replace />} />} />
            <Route path="/cash-closures" element={<RoleProtectedRoute element={<Navigate to="/sales-history?tab=closures" replace />} />} />
            <Route path="/inventory" element={<RoleProtectedRoute element={<Inventory />} />} />
            <Route path="/inventory-import" element={<RoleProtectedRoute element={<Navigate to="/inventory?tab=import" replace />} />} />
            <Route path="/suppliers" element={<RoleProtectedRoute element={<Suppliers />} />} />
            <Route path="/users" element={<RoleProtectedRoute element={<Navigate to="/settings?tab=users" replace />} />} />
            <Route path="/debts" element={<RoleProtectedRoute element={<Debts />} />} />
            <Route path="/costs" element={<RoleProtectedRoute element={<Costs />} />} />
            <Route path="/settings" element={<RoleProtectedRoute element={<Settings />} />} />
          </Route>
          <Route path="/hello" element={<PublicOnlyRoute element={<Home />} />} />
          <Route path="/login" element={<PublicOnlyRoute element={<Login />} />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
