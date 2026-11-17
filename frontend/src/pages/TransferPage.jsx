import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProfile, transferFunds } from '../services/api.js';

const TransferPage = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(null);
  const [userAccount, setUserAccount] = useState('');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
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
        setUserAccount(result.data.data.user.account_number);
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

    const cleanRecipient = recipientAccount.trim();
    const parsedAmount = parseFloat(amount);
    const cleanDescription = description.trim();

    if (!cleanRecipient) {
      setErrorMessage('Please enter the recipient account number.');
      setSuccessMessage('');
      return;
    }

    if (cleanRecipient === userAccount) {
      setErrorMessage('Transfers to your own account are not allowed.');
      setSuccessMessage('');
      return;
    }

    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid positive transfer amount.');
      setSuccessMessage('');
      return;
    }

    const currentBalanceNum = parseFloat(balance || 0);
    if (parsedAmount > currentBalanceNum) {
      setErrorMessage(
        `Transfer amount exceeds your available balance (${formatCurrency(balance)}).`
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

    const result = await transferFunds(
      {
        recipient_account: cleanRecipient,
        amount: parsedAmount,
        description: cleanDescription
      },
      token
    );

    setIsSubmitting(false);

    if (result.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
      return;
    }

    if (!result.ok) {
      setErrorMessage(result.data?.message || 'Transfer failed. Please check the recipient account and try again.');
      return;
    }

    const newBalance = result.data.data.balance;
    const recipientName = result.data.data.recipient?.full_name || 'recipient';
    setBalance(newBalance);
    setSuccessMessage(
      `Transfer of ${formatCurrency(parsedAmount)} to ${recipientName} (Acc: ${cleanRecipient}) was completed successfully.`
    );
    setRecipientAccount('');
    setAmount('');
    setDescription('');

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
          <h2>Transfer Money</h2>
          <p className="dashboard-subtitle">
            Instantly send money to another retail banking account holder
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
          <span className="account-card-meta">
            From Account: {userAccount ? userAccount : 'Loading...'}
          </span>
        </div>

        <div className="account-card">
          <div className="account-card-title">Transfer Details</div>

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
              <label htmlFor="recipientAccount">Recipient Account Number</label>
              <input
                type="text"
                id="recipientAccount"
                name="recipientAccount"
                value={recipientAccount}
                onChange={(e) => {
                  setRecipientAccount(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Enter recipient's 10-digit account number"
                required
              />
              <span className="field-hint">
                Funds will be transferred directly to this account
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="amount">Transfer Amount (₹)</label>
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
                placeholder="e.g. 1500.00"
                required
              />
              <span className="field-hint">
                Amount cannot exceed your current available balance
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="description">Remarks / Purpose (Optional)</label>
              <input
                type="text"
                id="description"
                name="description"
                maxLength="100"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Rent, College Fees, Personal"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing Transfer...' : 'Confirm Transfer'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransferPage;
