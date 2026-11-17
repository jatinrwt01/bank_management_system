import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="header">
      <div className="header-container">
        <div className="brand">
          <Link to="/" className="brand-title">Bank Management System</Link>
          <span className="brand-subtitle">Retail Internet Banking</span>
        </div>
        <nav className="nav-links">
          {token ? (
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
