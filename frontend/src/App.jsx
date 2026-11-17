import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DepositPage from './pages/DepositPage.jsx';
import WithdrawPage from './pages/WithdrawPage.jsx';
import TransferPage from './pages/TransferPage.jsx';
import TransactionsPage from './pages/TransactionsPage.jsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import EmployeeDashboardPage from './pages/employee/EmployeeDashboardPage.jsx';
import PortalSelectionPage from './pages/PortalSelectionPage.jsx';

function App() {
  const token = localStorage.getItem('token');

  const getDefaultRedirect = () => {
    if (!token) return '/portals';
    const userStr = localStorage.getItem('user');
    try {
      const user = userStr ? JSON.parse(userStr) : null;
      if (user?.role === 'ADMIN') return '/admin/dashboard';
      if (user?.role === 'EMPLOYEE') return '/employee/dashboard';
    } catch {
      // fallback
    }
    return '/dashboard';
  };

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={token ? <Navigate to={getDefaultRedirect()} replace /> : <PortalSelectionPage />}
            />
            <Route path="/portals" element={<PortalSelectionPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Customer Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER']}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deposit"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER']}>
                  <DepositPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/withdraw"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER']}>
                  <WithdrawPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transfer"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER']}>
                  <TransferPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER']}>
                  <TransactionsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboardPage defaultTab="overview" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/customers"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboardPage defaultTab="customers" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/transactions"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboardPage defaultTab="transactions" />
                </ProtectedRoute>
              }
            />

            {/* Employee Routes */}
            <Route
              path="/employee/dashboard"
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'ADMIN']}>
                  <EmployeeDashboardPage defaultTab="desk" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/desk"
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'ADMIN']}>
                  <EmployeeDashboardPage defaultTab="desk" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/customers"
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'ADMIN']}>
                  <EmployeeDashboardPage defaultTab="customers" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/transactions"
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'ADMIN']}>
                  <EmployeeDashboardPage defaultTab="transactions" />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to={getDefaultRedirect()} replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
