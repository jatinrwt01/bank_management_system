const API_BASE_URL = 'http://localhost:5000/api';

export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { message: 'Unable to connect to the server. Please check if the backend is running.' }
    };
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { message: 'Unable to connect to the server. Please check if the backend is running.' }
    };
  }
};

export const getProfile = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/account/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { message: 'Unable to connect to the server. Please check if the backend is running.' }
    };
  }
};

export const getDashboardData = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/account/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { message: 'Unable to connect to the server. Please check if the backend is running.' }
    };
  }
};

export const depositFunds = async (amount, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/transactions/deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount })
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { message: 'Unable to connect to the server. Please check if the backend is running.' }
    };
  }
};

export const withdrawFunds = async (amount, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/transactions/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount })
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { message: 'Unable to connect to the server. Please check if the backend is running.' }
    };
  }
};

export const transferFunds = async (transferData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/transactions/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(transferData)
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { message: 'Unable to connect to the server. Please check if the backend is running.' }
    };
  }
};

export const getTransactionHistory = async (token, { type = 'ALL', sort = 'desc' } = {}) => {
  try {
    const params = new URLSearchParams();
    if (type && type !== 'ALL') params.append('type', type);
    if (sort) params.append('sort', sort);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/transactions${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { message: 'Unable to connect to the server. Please check if the backend is running.' }
    };
  }
};

/* Admin Services */
export const getAdminCustomers = async (token, { search = '', status = '' } = {}) => {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'ALL') params.append('status', status);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/admin/customers${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { message: 'Unable to connect to the server.' }
    };
  }
};

export const getAdminCustomerDetails = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/customers/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { message: 'Unable to connect to the server.' }
    };
  }
};

export const updateCustomerStatus = async (id, status, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/customers/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { message: 'Unable to connect to the server.' }
    };
  }
};

export const getAdminTransactions = async (token, { type = 'ALL', search = '', sort = 'desc' } = {}) => {
  try {
    const params = new URLSearchParams();
    if (type && type !== 'ALL') params.append('type', type);
    if (search) params.append('search', search);
    if (sort) params.append('sort', sort);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/admin/transactions${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { message: 'Unable to connect to the server.' }
    };
  }
};

/* Employee Services */
export const getEmployeeCustomers = async (token, { search = '' } = {}) => {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/employee/customers${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { message: 'Unable to connect to the server.' }
    };
  }
};

export const getEmployeeCustomerDetails = async (accountNumber, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/employee/customers/${accountNumber}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { message: 'Unable to connect to the server.' }
    };
  }
};

export const employeeDeposit = async ({ accountNumber, amount, description }, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/employee/deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ account_number: accountNumber, amount, description })
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { message: 'Unable to connect to the server.' }
    };
  }
};

export const employeeWithdraw = async ({ accountNumber, amount, description }, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/employee/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ account_number: accountNumber, amount, description })
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { message: 'Unable to connect to the server.' }
    };
  }
};

export const getEmployeeTransactions = async (token, { type = 'ALL', search = '', sort = 'desc' } = {}) => {
  try {
    const params = new URLSearchParams();
    if (type && type !== 'ALL') params.append('type', type);
    if (search) params.append('search', search);
    if (sort) params.append('sort', sort);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/employee/transactions${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { message: 'Unable to connect to the server.' }
    };
  }
};
