import { useState } from 'react';
import { 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Target, 
  Briefcase, 
  Eye, 
  EyeOff
} from 'lucide-react';
import api from '../api';

export default function LoginPage({ onLogin }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState('SALES_USER'); // 'ADMIN' | 'SALES_USER'
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // ─── HANDLE LOGIN SUBMIT ───
  const handleLoginSubmit = async (e) => {
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
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onLogin(res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // ─── HANDLE SIGNUP SUBMIT ───
  const handleSignupSubmit = async (e) => {
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
        role: signupRole,
      });

      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onLogin(res.data.user);
      }
    } catch (err) {
      console.error('Registration error detail:', err);
      const serverMsg = err.response?.data?.message;
      if (serverMsg) {
        setError(serverMsg);
      } else if (err.response?.status === 404) {
        setError('Registration endpoint not found. Please restart the backend server (node src/server.js).');
      } else {
        setError(err.message || 'Registration failed. Please check your network and server.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── 1-CLICK DEMO LOGIN ───
  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setLoginEmail(demoEmail);
    setLoginPassword(demoPassword);
    setError('');
    setSuccessMsg('');
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
      <div className="auth-card-container">
        <div className="auth-glass-card">
          
          {/* Brand Header */}
          <div className="auth-header">
            <div className="auth-logo">
              <Sparkles size={24} />
            </div>
            <h2>Fundsroom ERP</h2>
            <p>Role-Separated Enterprise Management Platform</p>
          </div>

          {/* Mode Tabs: Sign In / Create Account */}
          <div className="auth-tabs">
            <button 
              type="button"
              className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => { setAuthMode('login'); setError(''); setSuccessMsg(''); }}
            >
              <LogIn size={15} /> Sign In
            </button>
            <button 
              type="button"
              className={`auth-tab-btn ${authMode === 'signup' ? 'active' : ''}`}
              onClick={() => { setAuthMode('signup'); setError(''); setSuccessMsg(''); }}
            >
              <UserPlus size={15} /> Create Account
            </button>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              borderRadius: 'var(--radius-md)',
              color: '#fda4af',
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
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: 'var(--radius-md)',
              color: '#6ee7b7',
              fontSize: '13px',
              marginBottom: '18px'
            }}>
              <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/*  FORM 1: SIGN IN                                          */}
          {/* ═════════════════════════════════════════════════════════ */}
          {authMode === 'login' && (
            <div>
              {/* 1-Click Fast Demo Launchers */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '10px' }}>
                  ⚡ Quick Demo Launchers (1-Click)
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {/* Admin Demo Button */}
                  <div 
                    onClick={() => handleQuickLogin('admin@fundsroom.com', 'admin123')}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(99, 102, 241, 0.12)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      cursor: 'pointer',
                      transition: 'var(--transition)',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#818cf8'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#818cf8', fontWeight: 700, fontSize: '12.5px' }}>
                      <ShieldCheck size={16} /> Admin Demo
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Inventory & Dispatches
                    </div>
                  </div>

                  {/* Sales Demo Button */}
                  <div 
                    onClick={() => handleQuickLogin('sales@fundsroom.com', 'sales123')}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      cursor: 'pointer',
                      transition: 'var(--transition)',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#34d399'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: 700, fontSize: '12.5px' }}>
                      <Target size={16} /> Sales Demo
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Leads, Quotes & Deals
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>or sign in with credentials</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
              </div>

              <form onSubmit={handleLoginSubmit}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={13} color="var(--accent-primary)" /> Email Address
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
                    <Lock size={13} color="var(--accent-primary)" /> Password
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
                  style={{ width: '100%', justifyContent: 'center', marginTop: '10px', padding: '13px' }} 
                  disabled={loading}
                >
                  <LogIn size={17} /> {loading ? 'Signing In...' : 'Sign In to Workspace'}
                </button>
              </form>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/*  FORM 2: CREATE ACCOUNT (SIGN UP)                        */}
          {/* ═════════════════════════════════════════════════════════ */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignupSubmit}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={13} color="var(--accent-primary)" /> Full Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. John Doe"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={13} color="var(--accent-primary)" /> Work Email
                </label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="name@company.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={13} color="var(--accent-primary)" /> Password
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

              {/* Role Selection Cards */}
              <div className="form-group">
                <label className="form-label">Select Workspace Role</label>
                <div className="role-radio-group">
                  <div 
                    className={`role-radio-card ${signupRole === 'ADMIN' ? 'selected-admin' : ''}`}
                    onClick={() => setSignupRole('ADMIN')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px', color: signupRole === 'ADMIN' ? '#818cf8' : '#e2e8f0' }}>
                      <ShieldCheck size={16} color="#818cf8" /> Administrator
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      Inventory & dispatch execution
                    </div>
                  </div>

                  <div 
                    className={`role-radio-card ${signupRole === 'SALES_USER' ? 'selected-sales' : ''}`}
                    onClick={() => setSignupRole('SALES_USER')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px', color: signupRole === 'SALES_USER' ? '#34d399' : '#e2e8f0' }}>
                      <Briefcase size={16} color="#34d399" /> Sales Rep
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      Enquiry & quote management
                    </div>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', justifyContent: 'center', marginTop: '6px', padding: '13px' }} 
                disabled={loading}
              >
                <UserPlus size={17} /> {loading ? 'Creating Account...' : 'Create My Account'}
              </button>
            </form>
          )}

          {/* Switch Prompt */}
          <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '12px', color: 'var(--text-muted)' }}>
            {authMode === 'login' ? (
              <span>
                Don't have an account?{' '}
                <strong 
                  style={{ color: '#818cf8', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => { setAuthMode('signup'); setError(''); }}
                >
                  Create one now
                </strong>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <strong 
                  style={{ color: '#818cf8', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => { setAuthMode('login'); setError(''); }}
                >
                  Sign in
                </strong>
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
