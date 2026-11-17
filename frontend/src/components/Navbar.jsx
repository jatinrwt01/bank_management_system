import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

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
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <button type="button" onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
