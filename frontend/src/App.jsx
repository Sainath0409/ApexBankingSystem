import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import ToastContainer from './components/ToastContainer';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Customer Pages
import CustomerDashboard from './pages/client/CustomerDashboard';
import MyAccounts from './pages/client/MyAccounts';
import TransferMoney from './pages/client/TransferMoney';
import DepositWithdraw from './pages/client/DepositWithdraw';
import Statements from './pages/client/Statements';

// Manager Pages
import ManagerDashboard from './pages/manager/ManagerDashboard';
import AllAccounts from './pages/manager/AllAccounts';
import UserManagement from './pages/manager/UserManagement';
import AuditLogs from './pages/manager/AuditLogs';

function AppLayout({ children }) {
  const { user } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  if (!user) return (
    <>
      {children}
      <ToastContainer />
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar mobileNavOpen={mobileNavOpen} setMobileNavOpen={setMobileNavOpen} />
      <div className="flex flex-1 relative">
        <Sidebar mobileNavOpen={mobileNavOpen} setMobileNavOpen={setMobileNavOpen} />
        <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'manager') return <Navigate to="/manager/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <AppLayout>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<RootRedirect />} />

            {/* Customer Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['customer', 'client']} />}>
              <Route path="/dashboard" element={<CustomerDashboard />} />
              <Route path="/accounts" element={<MyAccounts />} />
              <Route path="/transfer" element={<TransferMoney />} />
              <Route path="/deposit-withdraw" element={<DepositWithdraw />} />
              <Route path="/statements" element={<Statements />} />
            </Route>

            {/* Manager Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
              <Route path="/manager/dashboard" element={<ManagerDashboard />} />
              <Route path="/manager/accounts" element={<AllAccounts />} />
              <Route path="/manager/users" element={<UserManagement />} />
              <Route path="/manager/audit" element={<AuditLogs />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </AppLayout>
      </AuthProvider>
    </BrowserRouter>
  );
}
