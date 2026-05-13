import { useState, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { DataProvider, useData } from './hooks/useData';
import Sidebar from './components/Sidebar';
import './styles/global.css';

const LoginPage      = lazy(() => import('./pages/LoginPage'));
const DashboardPage  = lazy(() => import('./pages/DashboardPage'));
const PropertiesPage = lazy(() => import('./pages/PropertiesPage'));
const DocumentsPage  = lazy(() => import('./pages/DocumentsPage'));
const RemindersPage  = lazy(() => import('./pages/RemindersPage'));

function PageLoader() {
  return (
    <div className="loading-screen" style={{ height: '100%' }}>
      <div className="spinner" style={{ width: '28px', height: '28px' }} />
    </div>
  );
}

function AppInner() {
  const { user, loading: authLoading } = useAuth();
  const [page, setPage] = useState('dashboard');

  if (authLoading) return (
    <div className="loading-screen" style={{ height: '100vh' }}>
      <div className="spinner" style={{ width: '36px', height: '36px' }} />
    </div>
  );

  if (!user) return (
    <Suspense fallback={<PageLoader />}>
      <LoginPage />
    </Suspense>
  );

  return (
    <DataProvider>
      <AppWithData page={page} setPage={setPage} />
    </DataProvider>
  );
}

function AppWithData({ page, setPage }) {
  const { alertCount } = useData();
  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={setPage} alertCount={alertCount} />
      <main className="main-content">
        <Suspense fallback={<PageLoader />}>
          {page === 'dashboard'  && <DashboardPage  setPage={setPage} />}
          {page === 'properties' && <PropertiesPage />}
          {page === 'documents'  && <DocumentsPage />}
          {page === 'reminders'  && <RemindersPage />}
        </Suspense>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
