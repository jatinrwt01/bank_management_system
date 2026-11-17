import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTransactionHistory } from '../services/api.js';

const TransactionsPage = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    let isMounted = true;

    const fetchHistory = async () => {
      setLoading(true);
      setError('');

      const result = await getTransactionHistory(token, {
        type: typeFilter,
        sort: sortOrder
      });

      if (!isMounted) return;

      if (result.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      if (!result.ok) {
        setError(result.data?.message || 'Unable to load transaction records from the server.');
        setLoading(false);
        return;
      }

      setTransactions(result.data?.data?.transactions || []);
      setLoading(false);
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [navigate, typeFilter, sortOrder]);

  const formatCurrency = (val) => {
    const num = parseFloat(val || 0);
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header-panel">
        <div>
          <h2>Transaction History</h2>
          <p className="dashboard-subtitle">
            Complete audit trail and statement of account transactions
          </p>
        </div>
        <Link to="/dashboard" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      <div className="account-card filter-toolbar">
        <div className="filter-group">
          <label htmlFor="typeFilter">Filter by Type</label>
          <select
            id="typeFilter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All Transactions</option>
            <option value="DEPOSIT">Deposits</option>
            <option value="WITHDRAWAL">Withdrawals</option>
            <option value="TRANSFER">Transfers</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="sortOrder">Sort Order</label>
          <select
            id="sortOrder"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="filter-select"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
        </div>
      )}

      <div className="transactions-section">
        <div className="transactions-header">
          <h3>
            Account Statement
            {!loading && <span className="tx-count">({transactions.length} records)</span>}
          </h3>
        </div>

        {loading ? (
          <div className="empty-transactions-box">
            <p>Loading transactions...</p>
          </div>
        ) : transactions.length > 0 ? (
          <div className="table-responsive">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Date &amp; Time</th>
                  <th>Type &amp; Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isIncoming = tx.transaction_type === 'DEPOSIT' || tx.direction === 'IN';
                  return (
                    <tr key={tx.id}>
                      <td className="tx-id-cell">#TXN-{String(tx.id).padStart(5, '0')}</td>
                      <td>{formatDate(tx.created_at)}</td>
                      <td>
                        {tx.transaction_type === 'DEPOSIT' && (
                          <span className="badge-type badge-deposit">DEPOSIT</span>
                        )}
                        {tx.transaction_type === 'WITHDRAWAL' && (
                          <span className="badge-type badge-withdrawal">WITHDRAWAL</span>
                        )}
                        {tx.transaction_type === 'TRANSFER' && (
                          <span className={`badge-type ${tx.direction === 'IN' ? 'badge-transfer-in' : 'badge-transfer-out'}`}>
                            {tx.direction === 'IN' ? 'TRANSFER IN' : 'TRANSFER OUT'}
                          </span>
                        )}
                        {tx.description && (
                          <div className="tx-desc-subtext">{tx.description}</div>
                        )}
                      </td>
                      <td className={`tx-amount ${isIncoming ? 'amount-credit' : 'amount-debit'}`}>
                        {isIncoming ? '+' : '-'} {formatCurrency(tx.amount)}
                      </td>
                      <td>
                        <span className={`status-tag status-${tx.status?.toLowerCase()}`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-transactions-box">
            <p>
              {typeFilter !== 'ALL'
                ? `No ${typeFilter.toLowerCase()} transactions found.`
                : 'No transaction records found on this account.'}
            </p>
            {typeFilter === 'ALL' && (
              <div className="empty-actions">
                <Link to="/deposit" className="btn btn-action">
                  Make a Deposit
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;
