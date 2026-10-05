import { useState } from 'react';
import { LogIn, Mail, Lock, AlertCircle, ShieldCheck, UserCheck, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../api';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onLogin(res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: demoEmail, password: demoPassword });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onLogin(res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card-container">
        <div className="login-glass-box">
          
          <div className="login-header">
            <div className="login-logo">
              <Sparkles size={28} />
            </div>
            <h1>Fundsroom ERP</h1>
            <p>Enterprise Order Fulfillment & Supply Chain Platform</p>
          </div>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#fda4af',
              fontSize: '13px',
              marginBottom: '20px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={13} color="var(--accent-primary)" /> Work Email
              </label>
              <input
                type="email"
                className="form-control"
                placeholder="name@fundsroom.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={13} color="var(--accent-primary)" /> Password
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', marginTop: '10px', padding: '12px' }} 
              disabled={loading}
            >
              <LogIn size={17} /> {loading ? 'Authenticating...' : 'Sign In to Workspace'}
            </button>
          </form>

          {/* 1-Click Demo Logins for instant evaluation */}
          <div className="demo-credentials-box">
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', fontWeight: 700 }}>
              ⚡ 1-Click Evaluator Quick Login
            </div>
            <div className="demo-pills">
              <button 
                type="button" 
                className="demo-pill-btn"
                onClick={() => handleQuickLogin('admin@fundsroom.com', 'admin123')}
                disabled={loading}
              >
                <ShieldCheck size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                Admin Demo
              </button>

              <button 
                type="button" 
                className="demo-pill-btn"
                onClick={() => handleQuickLogin('sales@fundsroom.com', 'sales123')}
                disabled={loading}
              >
                <UserCheck size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                Sales Demo
              </button>
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={13} color="#10b981" /> <strong>Customer Enquiry → Quotation → Sales Order</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={13} color="#10b981" /> <strong>Automated Stock Reservation & Physical Dispatch</strong>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
