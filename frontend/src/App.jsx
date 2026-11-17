import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PlaceholderPage from './pages/PlaceholderPage.jsx';

function App() {
  const token = localStorage.getItem('token');

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={<Navigate to={token ? '/dashboard' : '/login'} replace />}
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deposit"
              element={
                <ProtectedRoute>
                  <PlaceholderPage
                    title="Deposit Funds"
                    description="Deposit money securely into your savings account"
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/withdraw"
              element={
                <ProtectedRoute>
                  <PlaceholderPage
                    title="Withdraw Funds"
                    description="Withdraw money from your available savings balance"
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <PlaceholderPage
                    title="Transaction History"
                    description="Complete log and account statement of all transactions"
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="*"
              element={<Navigate to={token ? '/dashboard' : '/login'} replace />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
