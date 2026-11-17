import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { loginUser } from '../services/api.js';

const PORTAL_CONFIG = {
  customer: {
    role: 'CUSTOMER',
    name: 'Customer Portal',
    title: 'Customer Portal Login',
    subtitle: 'Retail Internet Banking & Account Access',
    tag: 'Retail Banking',
    tagClass: 'portal-tag-customer',
    redirectPath: '/dashboard'
  },
  admin: {
    role: 'ADMIN',
    name: 'Admin Portal',
    title: 'Admin Portal Login',
    subtitle: 'System Administration & Management Console',
    tag: 'System Admin',
    tagClass: 'portal-tag-admin',
    redirectPath: '/admin/dashboard'
  },
  employee: {
    role: 'EMPLOYEE',
    name: 'Employee Portal',
    title: 'Employee Portal Login',
    subtitle: 'Bank Staff Operations & Counter Desk Access',
    tag: 'Branch Staff',
    tagClass: 'portal-tag-employee',
    redirectPath: '/employee/dashboard'
  }
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawPortal = (searchParams.get('portal') || 'customer').toLowerCase();
  const currentPortalKey = PORTAL_CONFIG[rawPortal] ? rawPortal : 'customer';
  const currentPortal = PORTAL_CONFIG[currentPortalKey];

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear error message when switching portals
  useEffect(() => {
    setErrorMessage('');
  }, [currentPortalKey]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errorMessage) setErrorMessage('');
  };

  const handlePortalSwitch = (portalKey) => {
    setSearchParams({ portal: portalKey });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password) {
      setErrorMessage('Please enter both email address and password.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const result = await loginUser({
      email: formData.email.trim(),
      password: formData.password
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.data.message || 'Login failed. Please check your credentials.');
      return;
    }

    const authenticatedUser = result.data.data.user;

    // Verify role against selected portal context
    if (authenticatedUser.role !== currentPortal.role) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      const userRoleDisplay =
        authenticatedUser.role.charAt(0) + authenticatedUser.role.slice(1).toLowerCase();

      setErrorMessage(
        `Access Denied: Your account role is "${userRoleDisplay}". You cannot log into the ${currentPortal.name}. Please select the ${userRoleDisplay} Portal.`
      );
      return;
    }

    // Role matches: persist session
    localStorage.setItem('token', result.data.data.token);
    localStorage.setItem('user', JSON.stringify(authenticatedUser));

    // Redirect to corresponding dashboard
    navigate(currentPortal.redirectPath);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Portal Context Selector Header */}
        <div className="portal-context-bar">
          <span className="context-label">Selected Portal:</span>
          <div className="context-tabs">
            <button
              type="button"
              className={`context-tab ${currentPortalKey === 'customer' ? 'active' : ''}`}
              onClick={() => handlePortalSwitch('customer')}
            >
              Customer
            </button>
            <button
              type="button"
              className={`context-tab ${currentPortalKey === 'admin' ? 'active' : ''}`}
              onClick={() => handlePortalSwitch('admin')}
            >
              Admin
            </button>
            <button
              type="button"
              className={`context-tab ${currentPortalKey === 'employee' ? 'active' : ''}`}
              onClick={() => handlePortalSwitch('employee')}
            >
              Employee
            </button>
          </div>
        </div>

        <div className="auth-header">
          <div style={{ marginBottom: '8px' }}>
            <span className={`portal-tag ${currentPortal.tagClass}`}>{currentPortal.tag}</span>
          </div>
          <h2>{currentPortal.title}</h2>
          <p>{currentPortal.subtitle}</p>
        </div>

        {errorMessage && (
          <div className="alert alert-error">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Verifying Credentials...' : `Sign In to ${currentPortal.name}`}
          </button>
        </form>

        <div className="auth-footer">
          {currentPortalKey === 'customer' ? (
            <p>
              Do not have an account?{' '}
              <Link to="/register" className="auth-link">Register for Internet Banking</Link>
            </p>
          ) : (
            <p className="auth-restricted-notice">
              {currentPortalKey === 'admin' ? 'Administrative' : 'Staff'} accounts are managed internally. Public registration is not permitted.
            </p>
          )}

          <div style={{ marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
            <Link to="/portals" className="auth-link" style={{ fontSize: '12px' }}>
              ← Return to Portal Selection
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
