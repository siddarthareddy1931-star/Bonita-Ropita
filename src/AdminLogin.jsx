import { useState } from 'react';
import './AdminDashboard.css';

export default function AdminLogin({ onLoginSuccess, onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        onLoginSuccess(data.token);
      } else {
        setError(data.error || 'Invalid credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection to auth server failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-overlay-container">
      <div className="login-card hand-drawn-border">
        <div className="login-header">
          <h2>Boutique Management Login</h2>
          <span className="brand-subtitle">Jyothi Reddy Boutique portal</span>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error-badge">⚠️ {error}</div>}

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Username</label>
            <input
              type="text"
              className="form-input"
              style={{ border: '2px solid var(--text-primary)', borderRadius: '8px' }}
              placeholder="Enter admin username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Password</label>
            <input
              type="password"
              className="form-input"
              style={{ border: '2px solid var(--text-primary)', borderRadius: '8px' }}
              placeholder="Enter security password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '1.05rem' }}
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : '🔑 Access Management System'}
          </button>

          <div className="login-hint-box">
            <span style={{ fontSize: '0.82rem', fontWeight: 'bold' }}>💡 Development Hint:</span>
            <span style={{ fontSize: '0.8rem', marginTop: '2px' }}>
              Use username <code style={{ background: '#fff', padding: '2px 4px', border: '1px solid #ddd', borderRadius: '4px' }}>admin</code> and password <code style={{ background: '#fff', padding: '2px 4px', border: '1px solid #ddd', borderRadius: '4px' }}>admin123</code>.
            </span>
          </div>

          <button 
            type="button" 
            className="btn-secondary" 
            style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}
            onClick={onClose}
            disabled={isLoading}
          >
            ◀ Cancel & Go Back
          </button>
        </form>
      </div>
    </div>
  );
}
