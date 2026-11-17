import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProfile, withdrawFunds } from '../services/api.js';

const WithdrawPage = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    let isMounted = true;

    const loadProfile = async () => {
      const result = await getProfile(token);

      if (!isMounted) return;

      if (result.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      if (result.ok && result.data?.data?.user) {
        setBalance(result.data.data.user.balance);
      }
      setLoading(false);
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const formatCurrency = (val) => {
    const num = parseFloat(val || 0);
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid positive withdrawal amount (greater than ₹0.00).');
      setSuccessMessage('');
      return;
    }

    const currentBalanceNum = parseFloat(balance || 0);
    if (parsedAmount > currentBalanceNum) {
      setErrorMessage(
        `Withdrawal amount exceeds your available balance (${formatCurrency(balance)}).`
      );
      setSuccessMessage('');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    const result = await withdrawFunds(parsedAmount, token);
    setIsSubmitting(false);

    if (result.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
      return;
    }

    if (!result.ok) {
      setErrorMessage(result.data?.message || 'Withdrawal transaction failed. Please try again.');
      return;
    }

    const newBalance = result.data.data.balance;
    setBalance(newBalance);
    setSuccessMessage(result.data.message || 'Withdrawal successful.');
    setAmount('');

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        userObj.balance = newBalance;
        localStorage.setItem('user', JSON.stringify(userObj));
      } catch {
        // ignore parse error
      }
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header-panel">
        <div>
          <h2>Withdraw Funds</h2>
          <p className="dashboard-subtitle">
            Withdraw funds from your active savings account balance
          </p>
        </div>
        <Link to="/dashboard" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      <div className="transaction-form-wrapper">
        <div className="account-card current-balance-card">
          <span className="info-label">Available Balance</span>
          <div className="account-balance">
            {loading ? 'Loading...' : formatCurrency(balance)}
          </div>
          <span className="account-card-meta">Primary Savings Account</span>
        </div>

        <div className="account-card">
          <div className="account-card-title">Enter Withdrawal Details</div>

          {errorMessage && (
            <div className="alert alert-error">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="transaction-form" noValidate>
            <div className="form-group">
              <label htmlFor="amount">Withdrawal Amount (₹)</label>
              <input
                type="number"
                id="amount"
                name="amount"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="e.g. 2000.00"
                required
              />
              <span className="field-hint">
                Amount cannot exceed your current available balance
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing Withdrawal...' : 'Confirm Withdrawal'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WithdrawPage;
