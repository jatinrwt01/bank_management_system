import { useState, useEffect } from 'react';
import {
  getEmployeeCustomers,
  getEmployeeCustomerDetails,
  employeeDeposit,
  employeeWithdraw,
  getEmployeeTransactions
} from '../../services/api.js';

const EmployeeDashboardPage = ({ defaultTab = 'desk' }) => {
  const token = localStorage.getItem('token');
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Desk Operations State
  const [deskAction, setDeskAction] = useState('DEPOSIT');
  const [accountLookupInput, setAccountLookupInput] = useState('');
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const [operationAmount, setOperationAmount] = useState('');
  const [operationDescription, setOperationDescription] = useState('');
  const [operationLoading, setOperationLoading] = useState(false);

  // Customer List / Search State
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customersLoading, setCustomersLoading] = useState(false);

  // Transactions State
  const [transactions, setTransactions] = useState([]);
  const [txTypeFilter, setTxTypeFilter] = useState('ALL');
  const [txSearch, setTxSearch] = useState('');
  const [txLoading, setTxLoading] = useState(false);

  // Feedback Messages
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchCustomerList = async (searchVal = customerSearch) => {
    setCustomersLoading(true);
    const result = await getEmployeeCustomers(token, { search: searchVal });
    setCustomersLoading(false);

    if (result.ok && result.data?.data?.customers) {
      setCustomers(result.data.data.customers);
    } else {
      setMessage({ type: 'error', text: result.data?.message || 'Failed to search customers.' });
    }
  };

  const fetchTransactions = async (typeVal = txTypeFilter, searchVal = txSearch) => {
    setTxLoading(true);
    const result = await getEmployeeTransactions(token, { type: typeVal, search: searchVal });
    setTxLoading(false);

    if (result.ok && result.data?.data?.transactions) {
      setTransactions(result.data.data.transactions);
    } else {
      setMessage({ type: 'error', text: result.data?.message || 'Failed to fetch transactions.' });
    }
  };

  useEffect(() => {
    fetchCustomerList('');
    fetchTransactions('ALL', '');
  }, []);

  const handleLookup = async (e) => {
    if (e) e.preventDefault();
    const acc = accountLookupInput.trim();
    if (!acc) {
      setMessage({ type: 'error', text: 'Please enter a customer account number to look up.' });
      return;
    }

    setLookupLoading(true);
    setMessage({ type: '', text: '' });
    setActiveCustomer(null);

    const result = await getEmployeeCustomerDetails(acc, token);
    setLookupLoading(false);

    if (result.ok && result.data?.data?.customer) {
      setActiveCustomer(result.data.data.customer);
      setMessage({ type: 'success', text: `Loaded customer: ${result.data.data.customer.full_name}` });
    } else {
      setMessage({ type: 'error', text: result.data?.message || 'Customer account not found.' });
    }
  };

  const selectCustomerFromList = (customer) => {
    setActiveCustomer(customer);
    setAccountLookupInput(customer.account_number);
    setActiveTab('desk');
    setMessage({ type: 'success', text: `Selected customer account: ${customer.account_number} (${customer.full_name})` });
  };

  const handleProcessDeskOperation = async (e) => {
    e.preventDefault();

    if (!activeCustomer) {
      setMessage({ type: 'error', text: 'Please look up and select an active customer account first.' });
      return;
    }

    if (activeCustomer.account_status === 'BLOCKED') {
      setMessage({ type: 'error', text: 'Cannot perform operations: This customer account is blocked.' });
      return;
    }

    const amt = parseFloat(operationAmount);
    if (isNaN(amt) || amt <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid positive amount.' });
      return;
    }

    if (deskAction === 'WITHDRAWAL' && parseFloat(activeCustomer.balance) < amt) {
      setMessage({
        type: 'error',
        text: `Insufficient balance! Customer has ₹${parseFloat(activeCustomer.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })} available.`
      });
      return;
    }

    setOperationLoading(true);
    setMessage({ type: '', text: '' });

    let result;
    if (deskAction === 'DEPOSIT') {
      result = await employeeDeposit(
        {
          accountNumber: activeCustomer.account_number,
          amount: amt,
          description: operationDescription
        },
        token
      );
    } else {
      result = await employeeWithdraw(
        {
          accountNumber: activeCustomer.account_number,
          amount: amt,
          description: operationDescription
        },
        token
      );
    }

    setOperationLoading(false);

    if (result.ok) {
      setMessage({ type: 'success', text: result.data.message });
      setActiveCustomer((prev) => ({
        ...prev,
        balance: result.data.data.customer.balance
      }));
      setOperationAmount('');
      setOperationDescription('');
      fetchTransactions(txTypeFilter, txSearch);
      fetchCustomerList(customerSearch);
    } else {
      setMessage({ type: 'error', text: result.data?.message || 'Operation failed.' });
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header-card">
        <div>
          <h2>Bank Staff Desk Operations</h2>
          <p className="welcome-subtext">Customer service counter: deposit and withdraw on behalf of customers, account lookup, and audit records.</p>
        </div>
      </div>

      {message.text && (
        <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {message.text}
          <button
            type="button"
            onClick={() => setMessage({ type: '', text: '' })}
            style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'desk' ? 'active' : ''}`}
          onClick={() => setActiveTab('desk')}
        >
          Counter Operations (Deposit / Withdraw)
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          Customer Directory & Search
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Transaction Records
        </button>
      </div>

      {/* TAB 1: COUNTER DESK OPERATIONS */}
      {activeTab === 'desk' && (
        <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
          {/* Customer Lookup & Verification Panel */}
          <div className="dashboard-section">
            <div className="section-header">
              <h3>1. Customer Account Lookup</h3>
            </div>
            <form onSubmit={handleLookup} style={{ marginBottom: '16px' }}>
              <div className="form-group">
                <label htmlFor="accountLookupInput">Customer Account Number</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    id="accountLookupInput"
                    placeholder="Enter 10-digit account number"
                    value={accountLookupInput}
                    onChange={(e) => setAccountLookupInput(e.target.value)}
                    style={{ flex: 1, padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  />
                  <button type="submit" className="btn btn-primary" disabled={lookupLoading}>
                    {lookupLoading ? 'Verifying...' : 'Find Account'}
                  </button>
                </div>
              </div>
            </form>

            {activeCustomer ? (
              <div className="card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px' }}>
                <h4 style={{ color: '#003366', marginBottom: '12px' }}>Verified Customer Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Customer Name</span>
                    <strong>{activeCustomer.full_name}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Account Number</span>
                    <strong style={{ fontFamily: 'monospace' }}>{activeCustomer.account_number}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Available Balance</span>
                    <strong style={{ color: '#003366', fontSize: '16px' }}>
                      ₹{parseFloat(activeCustomer.balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Account Status</span>
                    <span className={`badge ${activeCustomer.account_status === 'ACTIVE' ? 'badge-active' : 'badge-blocked'}`}>
                      {activeCustomer.account_status}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Email</span>
                    <span>{activeCustomer.email}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Phone</span>
                    <span>{activeCustomer.phone}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#f1f5f9', padding: '24px', textAlign: 'center', borderRadius: '4px', color: '#64748b' }}>
                <p>Enter an account number above or pick a customer from the <strong>Customer Directory</strong> tab to begin a transaction.</p>
              </div>
            )}
          </div>

          {/* Transaction Processing Form */}
          <div className="dashboard-section">
            <div className="section-header">
              <h3>2. Process Transaction</h3>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className={`btn-action-small ${deskAction === 'DEPOSIT' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setDeskAction('DEPOSIT')}
                >
                  Deposit (Cash In)
                </button>
                <button
                  type="button"
                  className={`btn-action-small ${deskAction === 'WITHDRAWAL' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setDeskAction('WITHDRAWAL')}
                >
                  Withdrawal (Cash Out)
                </button>
              </div>
            </div>

            <form onSubmit={handleProcessDeskOperation}>
              <div className="form-group">
                <label>Operation Type</label>
                <input
                  type="text"
                  disabled
                  value={deskAction === 'DEPOSIT' ? 'CASH DEPOSIT (Credit)' : 'CASH WITHDRAWAL (Debit)'}
                  style={{ background: '#e2e8f0', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="operationAmount">Amount (₹)</label>
                <input
                  type="number"
                  id="operationAmount"
                  min="1"
                  step="0.01"
                  placeholder="Enter amount in ₹ (e.g. 5000)"
                  value={operationAmount}
                  onChange={(e) => setOperationAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="operationDescription">Counter Reference / Remarks (Optional)</label>
                <input
                  type="text"
                  id="operationDescription"
                  placeholder="e.g. Counter slip #104, cash verified"
                  value={operationDescription}
                  onChange={(e) => setOperationDescription(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '8px' }}
                disabled={operationLoading || !activeCustomer || activeCustomer.account_status === 'BLOCKED'}
              >
                {operationLoading
                  ? 'Processing Transaction...'
                  : `Execute ${deskAction === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'} on Account`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMER DIRECTORY */}
      {activeTab === 'customers' && (
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Customer Accounts Directory</h3>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchCustomerList(customerSearch);
            }}
            className="search-bar-form"
          >
            <input
              type="text"
              placeholder="Search customers by name, account number, or email..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn btn-primary" disabled={customersLoading}>
              {customersLoading ? 'Searching...' : 'Search'}
            </button>
            {customerSearch && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setCustomerSearch('');
                  fetchCustomerList('');
                }}
              >
                Clear
              </button>
            )}
          </form>

          <div className="table-responsive">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Account No.</th>
                  <th>Customer Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Current Balance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.account_number}</td>
                    <td>{c.full_name}</td>
                    <td>{c.email}</td>
                    <td>{c.phone}</td>
                    <td style={{ fontWeight: 600, color: '#003366' }}>
                      ₹{parseFloat(c.balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={`badge ${c.account_status === 'ACTIVE' ? 'badge-active' : 'badge-blocked'}`}>
                        {c.account_status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-action-small"
                        onClick={() => selectCustomerFromList(c)}
                      >
                        Select for Counter Action
                      </button>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && !customersLoading && (
                  <tr>
                    <td colSpan="7" className="text-center" style={{ padding: '24px' }}>
                      No customers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TRANSACTION RECORDS */}
      {activeTab === 'transactions' && (
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Transaction Records</h3>
            <select
              value={txTypeFilter}
              onChange={(e) => {
                setTxTypeFilter(e.target.value);
                fetchTransactions(e.target.value, txSearch);
              }}
              className="filter-select"
            >
              <option value="ALL">All Types</option>
              <option value="DEPOSIT">Deposits</option>
              <option value="WITHDRAWAL">Withdrawals</option>
              <option value="TRANSFER">Transfers</option>
            </select>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchTransactions(txTypeFilter, txSearch);
            }}
            className="search-bar-form"
          >
            <input
              type="text"
              placeholder="Search by customer, account number, or transaction ID..."
              value={txSearch}
              onChange={(e) => setTxSearch(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn btn-primary" disabled={txLoading}>
              {txLoading ? 'Searching...' : 'Search'}
            </button>
            {txSearch && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setTxSearch('');
                  fetchTransactions(txTypeFilter, '');
                }}
              >
                Clear
              </button>
            )}
          </form>

          <div className="table-responsive">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Tx ID</th>
                  <th>Customer</th>
                  <th>Account No.</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Direction</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ fontFamily: 'monospace' }}>#{tx.id}</td>
                    <td>{tx.customer_name}</td>
                    <td style={{ fontFamily: 'monospace' }}>{tx.customer_account}</td>
                    <td>
                      <span className={`badge badge-${tx.transaction_type.toLowerCase()}`}>
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      ₹{parseFloat(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td>
                      {tx.direction === 'IN' ? (
                        <span style={{ color: '#059669', fontWeight: 600 }}>+ Credit</span>
                      ) : (
                        <span style={{ color: '#dc2626', fontWeight: 600 }}>- Debit</span>
                      )}
                    </td>
                    <td>{tx.description || '-'}</td>
                    <td>
                      <span className="badge badge-active">{tx.status}</span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(tx.created_at).toLocaleString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && !txLoading && (
                  <tr>
                    <td colSpan="9" className="text-center" style={{ padding: '24px' }}>
                      No transaction records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboardPage;
