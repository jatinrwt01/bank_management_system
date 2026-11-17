import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile } from '../services/api.js';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchAccountData = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          // ignore parsing error
        }
      }

      const result = await getProfile(token);
      if (result.ok && result.data?.data?.user) {
        setUser(result.data.data.user);
        localStorage.setItem('user', JSON.stringify(result.data.data.user));
      } else if (result.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      } else if (!result.ok) {
        setError('Could not refresh latest account balance from the server.');
      }
      setLoading(false);
    };

    fetchAccountData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading && !user) {
    return (
      <div className="dashboard-container">
        <div className="card loading-card">Loading account details...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header-panel">
        <div>
          <h2>Account Overview</h2>
          <p className="dashboard-subtitle">Welcome, {user?.full_name || 'Customer'}</p>
        </div>
        <button type="button" onClick={handleLogout} className="btn btn-secondary">
          Logout
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="account-details-grid">
        <div className="account-card primary-card">
          <div className="account-card-title">Available Balance</div>
          <div className="account-balance">
            ${parseFloat(user?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="account-card-meta">Primary Savings Account</div>
        </div>

        <div className="account-card">
          <div className="account-card-title">Account Number</div>
          <div className="account-info-value">{user?.account_number || 'N/A'}</div>
          <div className="account-card-meta">Status: Active &bull; Verified</div>
        </div>

        <div className="account-card">
          <div className="account-card-title">Account Holder Details</div>
          <div className="account-details-list">
            <p><strong>Name:</strong> {user?.full_name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Phone:</strong> {user?.phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
