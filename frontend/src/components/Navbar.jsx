import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch {
    user = null;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const role = user?.role || 'CUSTOMER';

  let portalSubtitle = 'Retail Internet Banking';
  let homeLink = '/dashboard';

  if (role === 'ADMIN') {
    portalSubtitle = 'Administration Portal';
    homeLink = '/admin/dashboard';
  } else if (role === 'EMPLOYEE') {
    portalSubtitle = 'Staff Operations Portal';
    homeLink = '/employee/dashboard';
  }

  return (
    <header className="header">
      <div className="header-container">
        <div className="brand">
          <Link to={token ? homeLink : '/portals'} className="brand-title">
            Bank Management System
          </Link>
          <span className="brand-subtitle">{portalSubtitle}</span>
        </div>

        <nav className="nav-links">
          {token ? (
            <>
              {role === 'ADMIN' && (
                <>
                  <Link
                    to="/admin/dashboard"
                    className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/admin/customers"
                    className={`nav-link ${isActive('/admin/customers') ? 'active' : ''}`}
                  >
                    Customers
                  </Link>
                  <Link
                    to="/admin/transactions"
                    className={`nav-link ${isActive('/admin/transactions') ? 'active' : ''}`}
                  >
                    Transactions
                  </Link>
                </>
              )}

              {role === 'EMPLOYEE' && (
                <>
                  <Link
                    to="/employee/dashboard"
                    className={`nav-link ${isActive('/employee/dashboard') ? 'active' : ''}`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/employee/customers"
                    className={`nav-link ${isActive('/employee/customers') ? 'active' : ''}`}
                  >
                    Customer Accounts
                  </Link>
                  <Link
                    to="/employee/desk"
                    className={`nav-link ${isActive('/employee/desk') ? 'active' : ''}`}
                  >
                    Counter Services
                  </Link>
                  <Link
                    to="/employee/transactions"
                    className={`nav-link ${isActive('/employee/transactions') ? 'active' : ''}`}
                  >
                    Transactions
                  </Link>
                </>
              )}

              {role === 'CUSTOMER' && (
                <>
                  <Link
                    to="/dashboard"
                    className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/deposit"
                    className={`nav-link ${isActive('/deposit') ? 'active' : ''}`}
                  >
                    Deposit
                  </Link>
                  <Link
                    to="/withdraw"
                    className={`nav-link ${isActive('/withdraw') ? 'active' : ''}`}
                  >
                    Withdraw
                  </Link>
                  <Link
                    to="/transfer"
                    className={`nav-link ${isActive('/transfer') ? 'active' : ''}`}
                  >
                    Transfer
                  </Link>
                  <Link
                    to="/transactions"
                    className={`nav-link ${isActive('/transactions') ? 'active' : ''}`}
                  >
                    Transactions
                  </Link>
                </>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="btn-logout"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/portals"
                className={`nav-link ${isActive('/portals') || isActive('/') ? 'active' : ''}`}
              >
                Portals
              </Link>
              <Link
                to="/login"
                className={`nav-link ${isActive('/login') ? 'active' : ''}`}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={`nav-link ${isActive('/register') ? 'active' : ''}`}
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
