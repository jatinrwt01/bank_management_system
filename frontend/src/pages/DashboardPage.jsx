import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDashboardData } from '../services/api.js';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError('');

      const result = await getDashboardData(token);

      if (!isMounted) return;

      if (result.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      if (!result.ok) {
        setError(result.data?.message || 'Unable to load account information from server.');
        setLoading(false);
        return;
      }

      setData(result.data.data);
      if (result.data.data?.user) {
        localStorage.setItem('user', JSON.stringify(result.data.data.user));
      }
      setLoading(false);
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [navigate, reloadCount]);

  const handleRetry = () => {
    setReloadCount((prev) => prev + 1);
  };

  const formatCurrency = (val) => {
    const num = parseFloat(val || 0);
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="account-card loading-card">
          <p>Loading account details from server...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="dashboard-container">
        <div className="alert alert-error">
          <p>{error}</p>
          <button type="button" onClick={handleRetry} className="btn btn-secondary btn-retry">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { user, summary, recent_transactions: recentTransactions } = data || {};

  return (
    <div className="dashboard-container">
      <div className="dashboard-header-panel">
        <div>
          <h2>Customer Account Dashboard</h2>
          <p className="dashboard-subtitle">
            Welcome, <strong>{user?.full_name || 'Customer'}</strong> &bull; Account: {user?.account_number || 'N/A'}
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="account-details-grid">
        <div className="account-card primary-card">
          <div className="account-card-title">Available Balance</div>
          <div className="account-balance">{formatCurrency(user?.balance)}</div>
          <div className="account-card-meta">Savings Account &bull; Active</div>
        </div>

        <div className="account-card">
          <div className="account-card-title">Total Deposits</div>
          <div className="account-stat positive">{formatCurrency(summary?.total_deposits)}</div>
          <div className="account-card-meta">All completed credit transactions</div>
        </div>

        <div className="account-card">
          <div className="account-card-title">Total Withdrawals</div>
          <div className="account-stat negative">{formatCurrency(summary?.total_withdrawals)}</div>
          <div className="account-card-meta">All completed debit transactions</div>
        </div>
      </div>

      <div className="dashboard-actions-panel">
        <div className="actions-header">Quick Banking Actions</div>
        <div className="action-buttons-row">
          <Link to="/deposit" className="btn btn-action">
            Deposit Funds
          </Link>
          <Link to="/withdraw" className="btn btn-action">
            Withdraw Funds
          </Link>
          <Link to="/transactions" className="btn btn-action">
            Transaction History
          </Link>
        </div>
      </div>

      <div className="transactions-section">
        <div className="transactions-header">
          <h3>Recent Transactions</h3>
          <Link to="/transactions" className="view-all-link">
            View All Transactions &rarr;
          </Link>
        </div>

        {recentTransactions && recentTransactions.length > 0 ? (
          <div className="table-responsive">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>Transaction Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{formatDate(tx.created_at)}</td>
                    <td>
                      <span className={`badge-type badge-${tx.transaction_type?.toLowerCase()}`}>
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className={`tx-amount ${tx.transaction_type === 'DEPOSIT' ? 'amount-credit' : 'amount-debit'}`}>
                      {tx.transaction_type === 'DEPOSIT' ? '+' : '-'} {formatCurrency(tx.amount)}
                    </td>
                    <td>
                      <span className={`status-tag status-${tx.status?.toLowerCase()}`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-transactions-box">
            <p>No recent transactions recorded on this account.</p>
          </div>
        )}
      </div>

      <div className="account-card profile-card">
        <div className="account-card-title">Customer Profile Information</div>
        <div className="profile-details-table">
          <div className="profile-row">
            <span className="profile-label">Customer Name</span>
            <span className="profile-value">{user?.full_name || '-'}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Account Number</span>
            <span className="profile-value">{user?.account_number || '-'}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Email Address</span>
            <span className="profile-value">{user?.email || '-'}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Contact Phone</span>
            <span className="profile-value">{user?.phone || '-'}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Registration Date</span>
            <span className="profile-value">{formatDate(user?.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
