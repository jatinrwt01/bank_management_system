import { Link, Navigate } from 'react-router-dom';

const PortalSelectionPage = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
      if (user.role === 'EMPLOYEE') return <Navigate to="/employee/dashboard" replace />;
      return <Navigate to="/dashboard" replace />;
    } catch {
      // ignore parsing error and continue
    }
  }

  return (
    <div className="portal-selection-container">
      <div className="portal-header">
        <h2>Online Banking Portal Selection</h2>
        <p>Please select your authorized portal to proceed to login</p>
      </div>

      <div className="portal-cards-grid">
        {/* 1. Customer Portal */}
        <div className="portal-card">
          <div className="portal-card-top">
            <span className="portal-tag portal-tag-customer">Retail Banking</span>
            <h3 className="portal-title">Customer Portal</h3>
          </div>
          <p className="portal-desc">
            Personal internet banking for registered account holders. Check account balances, transfer funds, process deposits and withdrawals, and review transaction history.
          </p>
          <div className="portal-action">
            <Link to="/login?portal=customer" className="btn btn-primary portal-btn">
              Access Customer Portal
            </Link>
          </div>
          <div className="portal-footer-note">
            New customer? <Link to="/register" className="auth-link">Register for Internet Banking</Link>
          </div>
        </div>

        {/* 2. Admin Portal */}
        <div className="portal-card">
          <div className="portal-card-top">
            <span className="portal-tag portal-tag-admin">System Admin</span>
            <h3 className="portal-title">Admin Portal</h3>
          </div>
          <p className="portal-desc">
            System administration and management console. Manage registered customers, monitor real-time banking metrics, block or unblock customer accounts, and audit all system transactions.
          </p>
          <div className="portal-action">
            <Link to="/login?portal=admin" className="btn btn-primary portal-btn">
              Access Admin Portal
            </Link>
          </div>
          <div className="portal-footer-note">
            Restricted access. Internal administrative personnel only.
          </div>
        </div>

        {/* 3. Employee Portal */}
        <div className="portal-card">
          <div className="portal-card-top">
            <span className="portal-tag portal-tag-employee">Branch Staff</span>
            <h3 className="portal-title">Employee Portal</h3>
          </div>
          <p className="portal-desc">
            Branch operations and customer counter services. Search and verify customer accounts, process over-the-counter cash deposits and withdrawals, and review operational records.
          </p>
          <div className="portal-action">
            <Link to="/login?portal=employee" className="btn btn-primary portal-btn">
              Access Employee Portal
            </Link>
          </div>
          <div className="portal-footer-note">
            Restricted access. Authorized branch staff personnel only.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalSelectionPage;
