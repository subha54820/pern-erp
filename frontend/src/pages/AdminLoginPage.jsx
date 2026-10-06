import { useState } from 'react';
import { 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  AlertCircle, 
  ShieldCheck, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  ArrowLeft 
} from 'lucide-react';
import api from '../api';

export default function AdminLoginPage({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  
  // Sign In State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Create Account State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // ─── ADMIN SIGN IN SUBMIT ───
  const handleAdminLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { 
        email: loginEmail.trim(), 
        password: loginPassword 
      });

      if (res.data.success) {
        const userData = res.data.user;
        // Strict role validation: Ensure only ADMIN accounts access Admin portal
        if (userData.role !== 'ADMIN') {
          setError('Access Denied: This account is registered as Sales Rep, not Administrator. Please return to the Sales portal.');
          return;
        }
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        onLogin(userData);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Admin authentication failed. Verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // ─── ADMIN CREATE ACCOUNT SUBMIT ───
  const handleAdminSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: signupName.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        role: 'ADMIN', // Strictly register as ADMIN
      });

      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onLogin(res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Admin registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── 1-CLICK DEMO ADMIN LAUNCH ───
  const handleQuickAdminDemo = async () => {
    setLoginEmail('admin@fundsroom.com');
    setLoginPassword('admin123');
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { 
        email: 'admin@fundsroom.com', 
        password: 'admin123' 
      });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onLogin(res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Demo admin login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="auth-card-container">
        

        <div className="auth-glass-card" style={{ borderTop: '4px solid #2563eb' }}>
          
          {/* Brand Header */}
          <div className="auth-header">
            <div className="auth-logo" style={{ background: '#2563eb' }}>
              <ShieldCheck size={24} />
            </div>
            <h2>Admin Authentication</h2>
            <p>Operations Command & Logistics Management</p>
          </div>

          {/* Mode Tabs: Admin Sign In / Admin Create Account */}
          <div className="auth-tabs">
            <button 
              type="button"
              className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
            >
              <LogIn size={15} /> Admin Sign In
            </button>
            <button 
              type="button"
              className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }}
            >
              <UserPlus size={15} /> Admin Register
            </button>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-sm)',
              color: '#dc2626',
              fontSize: '13px',
              marginBottom: '18px'
            }}>
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 'var(--radius-sm)',
              color: '#059669',
              fontSize: '13px',
              marginBottom: '18px'
            }}>
              <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/*  FORM 1: ADMIN SIGN IN                                    */}
          {/* ═════════════════════════════════════════════════════════ */}
          {mode === 'login' && (
            <div>
              {/* 1-Click Fast Admin Demo */}
              <div style={{ marginBottom: '20px' }}>
                <div 
                  onClick={handleQuickAdminDemo}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#bfdbfe'}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1d4ed8', fontWeight: 700, fontSize: '13px' }}>
                      <ShieldCheck size={16} color="#2563eb" /> Quick 1-Click Admin Demo
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      admin@fundsroom.com · Instant Access
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', background: '#2563eb', color: '#ffffff', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                    Auto-fill
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>or sign in with admin email</span>
                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              </div>

              <form onSubmit={handleAdminLogin}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={13} color="#2563eb" /> Administrator Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="admin@fundsroom.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={13} color="#2563eb" /> Password
                  </label>
                  <div className="password-input-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                    <button 
                      type="button" 
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', justifyContent: 'center', marginTop: '10px', padding: '12px' }} 
                  disabled={loading}
                >
                  <LogIn size={16} /> {loading ? 'Authenticating Admin...' : 'Sign In to Admin Dashboard'}
                </button>
              </form>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/*  FORM 2: ADMIN CREATE ACCOUNT                             */}
          {/* ═════════════════════════════════════════════════════════ */}
          {mode === 'signup' && (
            <form onSubmit={handleAdminSignup}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={13} color="#2563eb" /> Administrator Full Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Operations Manager"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={13} color="#2563eb" /> Official Admin Email
                </label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="admin@company.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={13} color="#2563eb" /> Secure Password
                </label>
                <div className="password-input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder="Min 6 characters"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Automatic Role Notice */}
              <div style={{
                padding: '10px 12px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '16px',
                fontSize: '12px',
                color: '#1d4ed8',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <ShieldCheck size={16} style={{ flexShrink: 0 }} />
                <span>Account will be provisioned with <strong>ADMINISTRATOR</strong> authority.</span>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', justifyContent: 'center', marginTop: '6px', padding: '12px' }} 
                disabled={loading}
              >
                <UserPlus size={16} /> {loading ? 'Registering Admin...' : 'Create Admin Account & Launch'}
              </button>
            </form>
          )}

          {/* Switch Prompt */}
          <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
            {mode === 'login' ? (
              <span>
                Need new administrator access?{' '}
                <strong 
                  style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => { setMode('signup'); setError(''); }}
                >
                  Create Admin Account
                </strong>
              </span>
            ) : (
              <span>
                Already an administrator?{' '}
                <strong 
                  style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => { setMode('login'); setError(''); }}
                >
                  Sign In
                </strong>
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
