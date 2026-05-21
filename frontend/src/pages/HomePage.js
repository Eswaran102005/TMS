import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const HomePage = () => {
  const { user, isAuthenticated } = useContext(AuthContext);

  return (
    <div className="home-container">
      <div className="home-content glass">
        <div className="hero-section">
          <h1>TMS <span className="dot">.</span></h1>
          <p className="subtitle">THE NEXT GENERATION OF COMPLAINT MANAGEMENT</p>
        </div>

        {isAuthenticated ? (
          <div className="dashboard-preview">
            <div className="welcome-card">
              <h2>Welcome back, <span className="highlight">{user?.username}</span></h2>
              <p className="role-tag">{user?.role}</p>
            </div>

            {user?.role === 'SuperAdmin' && (
              <div className="admin-grid">
                <div className="admin-card">
                  <h3>SYSTEM CONTROL CENTER</h3>
                  <p className="description">Manage the entire ecosystem from a single unique interface.</p>
                  <div className="quick-links">
                    <span>DEPARTMENTS</span>
                    <span>PROGRAMMES</span>
                    <span>BLOCKS</span>
                    <span>ROOMS</span>
                    <span>USERS</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="auth-prompt">
            <p className="prompt-text">Access is restricted to authorized personnel. Please authenticate to proceed into the ecosystem.</p>
            <button className="unique-login-btn" onClick={() => window.location.href = '/login'}>
              ENTER SYSTEM
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .home-container {
          width: 100%;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6rem 2rem;
          background: transparent;
        }

        .home-content {
          width: 100%;
          max-width: 1000px;
          padding: 6rem;
          border-radius: 4px 100px 4px 100px; /* Unique asymmetrical design */
          text-align: left;
          animation: entrance 1s cubic-bezier(0.23, 1, 0.32, 1);
        }

        @keyframes entrance {
          from { opacity: 0; transform: scale(0.95) translateY(30px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .hero-section h1 {
          font-size: 5rem;
          line-height: 1;
          margin-bottom: 1rem;
          font-weight: 900;
          letter-spacing: -0.05em;
          background: linear-gradient(135deg, #fff 0%, var(--color-silver) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          display: flex;
          align-items: flex-end;
          gap: 0.2rem;
        }

        .dot {
          color: var(--color-coral);
          -webkit-text-fill-color: var(--color-coral);
          font-size: 6rem;
        }

        .subtitle {
          font-size: 0.85rem;
          color: var(--color-coral);
          margin-bottom: 4rem;
          letter-spacing: 0.4em;
          font-weight: 800;
        }

        .welcome-card {
          margin-bottom: 4rem;
        }

        .welcome-card h2 {
          font-size: 2.5rem;
          font-weight: 300;
          color: #fff;
        }

        .highlight {
          color: var(--color-coral);
          font-weight: 900;
        }

        .role-tag {
          display: inline-block;
          margin-top: 15px;
          padding: 6px 16px;
          background: rgba(242, 196, 206, 0.1);
          border: 1px solid rgba(242, 196, 206, 0.2);
          color: var(--color-pink);
          border-radius: 2px;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .admin-card {
          background: rgba(255, 255, 255, 0.02);
          border-left: 4px solid var(--color-coral);
          padding: 3rem;
          border-radius: 4px;
          text-align: left;
          margin-top: 3rem;
          transition: var(--transition);
        }

        .admin-card:hover {
          background: rgba(255, 255, 255, 0.04);
          transform: translateX(10px);
        }

        .admin-card h3 {
          font-size: 1rem;
          margin-bottom: 1rem;
          color: #fff;
          letter-spacing: 0.2em;
        }

        .description {
          color: var(--color-silver);
          font-size: 1rem;
          margin-bottom: 2rem;
          opacity: 0.7;
        }

        .quick-links {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .quick-links span {
          background: transparent;
          padding: 8px 16px;
          border-radius: 2px;
          font-size: 0.7rem;
          color: var(--color-silver);
          border: 1px solid var(--border-light);
          font-weight: 700;
          letter-spacing: 0.1em;
          transition: var(--transition);
        }

        .quick-links span:hover {
          border-color: var(--color-pink);
          color: var(--color-pink);
        }

        .prompt-text {
          margin-bottom: 3rem;
          color: var(--color-silver);
          font-size: 1.1rem;
          max-width: 500px;
          line-height: 1.8;
          opacity: 0.8;
        }

        .unique-login-btn {
          background: var(--color-coral);
          color: #000;
          padding: 20px 40px;
          font-weight: 900;
          letter-spacing: 0.2em;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: var(--transition);
          box-shadow: 0 10px 40px rgba(245, 143, 124, 0.3);
        }

        .unique-login-btn:hover {
          background: #fff;
          box-shadow: 0 15px 50px rgba(255, 255, 255, 0.2);
          transform: translateY(-5px);
        }

        @media (max-width: 768px) {
          .hero-section h1 { font-size: 3rem; }
          .home-content { padding: 3rem; border-radius: 20px; }
          .dot { font-size: 3.5rem; }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
