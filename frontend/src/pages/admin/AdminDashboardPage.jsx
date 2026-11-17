import { useState, useEffect } from 'react';
import {
  getAdminCustomers,
  getAdminCustomerDetails,
  updateCustomerStatus,
  getAdminTransactions
} from '../../services/api.js';

const AdminDashboardPage = ({ defaultTab = 'overview' }) => {
  const token = localStorage.getItem('token');
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Customers state
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Selected customer for modal/details
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetailsLoading, setCustomerDetailsLoading] = useState(false);
  const [selectedCustomerTx, setSelectedCustomerTx] = useState([]);

  // Transactions state
  const [transactions, setTransactions] = useState([]);
  const [txTypeFilter, setTxTypeFilter] = useState('ALL');
  const [txSearch, setTxSearch] = useState('');
  const [loadingTx, setLoadingTx] = useState(false);

  // Status message
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchCustomers = async (searchVal = customerSearch, filterVal = statusFilter) => {
    setLoadingCustomers(true);
    const result = await getAdminCustomers(token, {
      search: searchVal,
      status: filterVal
    });
    setLoadingCustomers(false);

    if (result.ok && result.data?.data?.customers) {
      setCustomers(result.data.data.customers);
    } else {
      setMessage({ type: 'error', text: result.data?.message || 'Failed to fetch customers.' });
    }
  };

  const fetchTransactions = async (typeVal = txTypeFilter, searchVal = txSearch) => {
    setLoadingTx(true);
    const result = await getAdminTransactions(token, {
      type: typeVal,
      search: searchVal
    });
    setLoadingTx(false);

    if (result.ok && result.data?.data?.transactions) {
      setTransactions(result.data.data.transactions);
    } else {
      setMessage({ type: 'error', text: result.data?.message || 'Failed to fetch transactions.' });
    }
  };

  useEffect(() => {
    fetchCustomers(customerSearch, statusFilter);
    fetchTransactions(txTypeFilter, txSearch);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers(customerSearch, statusFilter);
  };

  const handleTxSearchSubmit = (e) => {
    e.preventDefault();
    fetchTransactions(txTypeFilter, txSearch);
  };

  const handleStatusToggle = async (customer) => {
    const newStatus = customer.account_status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    const actionLabel = newStatus === 'BLOCKED' ? 'block' : 'unblock';

    if (!window.confirm(`Are you sure you want to ${actionLabel} account #${customer.account_number} (${customer.full_name})?`)) {
      return;
    }

    const result = await updateCustomerStatus(customer.id, newStatus, token);
    if (result.ok) {
      setMessage({ type: 'success', text: `Account for ${customer.full_name} is now ${newStatus}.` });
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, account_status: newStatus } : c))
      );
      if (selectedCustomer && selectedCustomer.id === customer.id) {
        setSelectedCustomer((prev) => ({ ...prev, account_status: newStatus }));
      }
    } else {
      setMessage({ type: 'error', text: result.data?.message || `Failed to update status.` });
    }
  };

  const handleViewCustomer = async (id) => {
    setCustomerDetailsLoading(true);
    setSelectedCustomer(null);
    setSelectedCustomerTx([]);

    const result = await getAdminCustomerDetails(id, token);
    setCustomerDetailsLoading(false);

    if (result.ok && result.data?.data) {
      setSelectedCustomer(result.data.data.customer);
      setSelectedCustomerTx(result.data.data.transactions || []);
    } else {
      setMessage({ type: 'error', text: result.data?.message || 'Failed to load customer details.' });
    }
  };

  // Metrics
  const totalCustomers = customers.length;
  const activeCount = customers.filter((c) => c.account_status === 'ACTIVE').length;
  const blockedCount = customers.filter((c) => c.account_status === 'BLOCKED').length;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header-card">
        <div>
          <h2>System Administration Dashboard</h2>
          <p className="welcome-subtext">Manage bank customers, account statuses, and monitor system transactions.</p>
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

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview & Metrics
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          Customer Management ({totalCustomers})
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          All Transactions ({transactions.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div>
          <div className="summary-grid">
            <div className="summary-card">
              <span className="summary-label">Total Customers</span>
              <span className="summary-value" style={{ color: '#003366' }}>{totalCustomers}</span>
              <span className="summary-subtext">Registered retail accounts</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Active Accounts</span>
              <span className="summary-value" style={{ color: '#059669' }}>{activeCount}</span>
              <span className="summary-subtext">Permitted to transact</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Blocked Accounts</span>
              <span className="summary-value" style={{ color: '#dc2626' }}>{blockedCount}</span>
              <span className="summary-subtext">Restricted from operations</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Logged Transactions</span>
              <span className="summary-value" style={{ color: '#2563eb' }}>{transactions.length}</span>
              <span className="summary-subtext">System audit records</span>
            </div>
          </div>

          <div className="dashboard-section" style={{ marginTop: '24px' }}>
            <div className="section-header">
              <h3>Quick Customer Directory</h3>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveTab('customers')}
              >
                View Full Customer Manager
              </button>
            </div>
            <div className="table-responsive">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Account No.</th>
                    <th>Customer Name</th>
                    <th>Email Address</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.slice(0, 5).map((customer) => (
                    <tr key={customer.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{customer.account_number}</td>
                      <td>{customer.full_name}</td>
                      <td>{customer.email}</td>
                      <td>₹{parseFloat(customer.balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td>
                        <span className={`badge ${customer.account_status === 'ACTIVE' ? 'badge-active' : 'badge-blocked'}`}>
                          {customer.account_status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-action-small"
                          onClick={() => {
                            setActiveTab('customers');
                            handleViewCustomer(customer.id);
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center" style={{ padding: '24px' }}>
                        No registered customers found in database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMER MANAGEMENT */}
      {activeTab === 'customers' && (
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Registered Customers</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  fetchCustomers(customerSearch, e.target.value);
                }}
                className="filter-select"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Accounts</option>
                <option value="BLOCKED">Blocked Accounts</option>
              </select>
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="search-bar-form">
            <input
              type="text"
              placeholder="Search by name, email, phone or account number..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn btn-primary" disabled={loadingCustomers}>
              {loadingCustomers ? 'Searching...' : 'Search'}
            </button>
            {customerSearch && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setCustomerSearch('');
                  fetchCustomers('', statusFilter);
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
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Registration Date</th>
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
                    <td>₹{parseFloat(c.balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>
                      <span className={`badge ${c.account_status === 'ACTIVE' ? 'badge-active' : 'badge-blocked'}`}>
                        {c.account_status}
                      </span>
                    </td>
                    <td>{new Date(c.created_at).toLocaleDateString('en-IN')}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className="btn-action-small"
                        onClick={() => handleViewCustomer(c.id)}
                        style={{ marginRight: '6px' }}
                      >
                        Inspect
                      </button>
                      <button
                        type="button"
                        className={`btn-action-small ${c.account_status === 'ACTIVE' ? 'btn-status-block' : 'btn-status-unblock'}`}
                        onClick={() => handleStatusToggle(c)}
                      >
                        {c.account_status === 'ACTIVE' ? 'Block' : 'Unblock'}
                      </button>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && !loadingCustomers && (
                  <tr>
                    <td colSpan="8" className="text-center" style={{ padding: '24px' }}>
                      No customers matching search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ALL TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="dashboard-section">
          <div className="section-header">
            <h3>System Transactions Audit Log</h3>
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

          <form onSubmit={handleTxSearchSubmit} className="search-bar-form">
            <input
              type="text"
              placeholder="Search by customer, account number, or transaction ID..."
              value={txSearch}
              onChange={(e) => setTxSearch(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn btn-primary" disabled={loadingTx}>
              {loadingTx ? 'Searching...' : 'Search'}
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
                        <span style={{ color: '#059669', fontWeight: 600 }}>+ Credit (IN)</span>
                      ) : (
                        <span style={{ color: '#dc2626', fontWeight: 600 }}>- Debit (OUT)</span>
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
                {transactions.length === 0 && !loadingTx && (
                  <tr>
                    <td colSpan="9" className="text-center" style={{ padding: '24px' }}>
                      No transaction records found matching the criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CUSTOMER DETAILS MODAL / INSPECTION DIALOG */}
      {selectedCustomer && (
        <div className="modal-backdrop" onClick={() => setSelectedCustomer(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Customer Account Inspection</h3>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setSelectedCustomer(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="profile-details-grid" style={{ marginBottom: '20px' }}>
                <div className="profile-item">
                  <span className="profile-label">Full Name</span>
                  <span className="profile-value">{selectedCustomer.full_name}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Email Address</span>
                  <span className="profile-value">{selectedCustomer.email}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Phone</span>
                  <span className="profile-value">{selectedCustomer.phone}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Account Number</span>
                  <span className="profile-value" style={{ fontFamily: 'monospace' }}>
                    {selectedCustomer.account_number}
                  </span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Current Balance</span>
                  <span className="profile-value" style={{ color: '#003366', fontWeight: 700 }}>
                    ₹{parseFloat(selectedCustomer.balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Account Status</span>
                  <span className="profile-value">
                    <span className={`badge ${selectedCustomer.account_status === 'ACTIVE' ? 'badge-active' : 'badge-blocked'}`}>
                      {selectedCustomer.account_status}
                    </span>
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <button
                  type="button"
                  className={`btn ${selectedCustomer.account_status === 'ACTIVE' ? 'btn-danger' : 'btn-primary'}`}
                  onClick={() => handleStatusToggle(selectedCustomer)}
                >
                  {selectedCustomer.account_status === 'ACTIVE' ? 'Block This Customer' : 'Unblock This Customer'}
                </button>
              </div>

              <h4 style={{ marginBottom: '10px', color: '#003366' }}>Recent Transactions for Customer</h4>
              <div className="table-responsive" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Direction</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCustomerTx.map((tx) => (
                      <tr key={tx.id}>
                        <td>#{tx.id}</td>
                        <td>{tx.transaction_type}</td>
                        <td>₹{parseFloat(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>{tx.direction === 'IN' ? '+ Inflow' : '- Outflow'}</td>
                        <td>{new Date(tx.created_at).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                    {selectedCustomerTx.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center">No transactions recorded for this customer.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
