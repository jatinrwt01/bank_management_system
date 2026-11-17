import { Link } from 'react-router-dom';

const PlaceholderPage = ({ title, description }) => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header-panel">
        <div>
          <h2>{title}</h2>
          <p className="dashboard-subtitle">{description}</p>
        </div>
        <Link to="/dashboard" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      <div className="account-card placeholder-box">
        <p className="placeholder-text">
          This banking module is currently under development.
        </p>
        <Link to="/dashboard" className="btn btn-primary btn-inline">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default PlaceholderPage;
