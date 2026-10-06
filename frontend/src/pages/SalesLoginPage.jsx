import { useState } from 'react';
import { 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  AlertCircle, 
  Briefcase, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  ArrowLeft 
} from 'lucide-react';
import api from '../api';

export default function SalesLoginPage({ onLogin }) {
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

  // ─── SALES SIGN IN SUBMIT ───
  const handleSalesLogin = async (e) => {
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
        // Strict role validation: Ensure only SALES_USER accounts access Sales portal
        if (userData.role !== 'SALES_USER') {
          setError('Access Denied: This account is registered as Administrator, not Sales Representative. Please return to the Admin portal.');
          return;
        }
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        onLogin(userData);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Sales authentication failed. Verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // ─── SALES CREATE ACCOUNT SUBMIT ───
  const handleSalesSignup = async (e) => {
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
        role: 'SALES_USER', // Strictly register as SALES_USER
      });

      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onLogin(res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Sales registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── 1-CLICK DEMO SALES LAUNCH ───
  const handleQuickSalesDemo = async () => {
    setLoginEmail('sales@fundsroom.com');
    setLoginPassword('sales123');
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { 
        email: 'sales@fundsroom.com', 
        password: 'sales123' 
      });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onLogin(res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Demo sales login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="auth-card-container">
        

        <div className="auth-glass-card" style={{ borderTop: '4px solid #059669' }}>
          
          {/* Brand Header */}
          <div className="auth-header">
            <div className="auth-logo" style={{ background: '#059669' }}>
              <Briefcase size={24} />
            </div>
            <h2>Sales Representative Authentication</h2>
            <p>Lead Capture, Quotations & Customer Deals</p>
          </div>

          {/* Mode Tabs: Sales Sign In / Sales Create Account */}
          <div className="auth-tabs">
            <button 
              type="button"
              className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
            >
              <LogIn size={15} /> Sales Sign In
            </button>
            <button 
              type="button"
              className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }}
            >
              <UserPlus size={15} /> Sales Register
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
          {/*  FORM 1: SALES SIGN IN                                    */}
          {/* ═════════════════════════════════════════════════════════ */}
          {mode === 'login' && (
            <div>
              {/* 1-Click Fast Sales Demo */}
              <div style={{ marginBottom: '20px' }}>
                <div 
                  onClick={handleQuickSalesDemo}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#059669'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#a7f3d0'}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#047857', fontWeight: 700, fontSize: '13px' }}>
                      <Briefcase size={16} color="#059669" /> Quick 1-Click Sales Demo
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      sales@fundsroom.com · Instant Access
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', background: '#059669', color: '#ffffff', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                    Auto-fill
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>or sign in with sales email</span>
                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              </div>

              <form onSubmit={handleSalesLogin}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={13} color="#059669" /> Sales Representative Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="sales@fundsroom.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={13} color="#059669" /> Password
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
                  className="btn btn-emerald" 
                  style={{ width: '100%', justifyContent: 'center', marginTop: '10px', padding: '12px' }} 
                  disabled={loading}
                >
                  <LogIn size={16} /> {loading ? 'Authenticating Sales...' : 'Sign In to Sales Dashboard'}
                </button>
              </form>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/*  FORM 2: SALES CREATE ACCOUNT                             */}
          {/* ═════════════════════════════════════════════════════════ */}
          {mode === 'signup' && (
            <form onSubmit={handleSalesSignup}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={13} color="#059669" /> Representative Full Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Sales Executive"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={13} color="#059669" /> Official Sales Email
                </label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="sales@company.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={13} color="#059669" /> Secure Password
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
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '16px',
                fontSize: '12px',
                color: '#065f46',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Briefcase size={16} style={{ flexShrink: 0 }} />
                <span>Account will be provisioned with <strong>SALES REPRESENTATIVE</strong> permissions.</span>
              </div>

              <button 
                type="submit" 
                className="btn btn-emerald" 
                style={{ width: '100%', justifyContent: 'center', marginTop: '6px', padding: '12px' }} 
                disabled={loading}
              >
                <UserPlus size={16} /> {loading ? 'Registering Sales Rep...' : 'Create Sales Account & Launch'}
              </button>
            </form>
          )}

          {/* Switch Prompt */}
          <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
            {mode === 'login' ? (
              <span>
                Need new sales team access?{' '}
                <strong 
                  style={{ color: '#059669', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => { setMode('signup'); setError(''); }}
                >
                  Create Sales Account
                </strong>
              </span>
            ) : (
              <span>
                Already a sales representative?{' '}
                <strong 
                  style={{ color: '#059669', cursor: 'pointer', textDecoration: 'underline' }}
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
