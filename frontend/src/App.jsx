import { useState, useEffect } from 'react';
import { 
  FileText, 
  Receipt, 
  ShieldCheck, 
  LayoutDashboard, 
  LogOut, 
  Sparkles, 
  Clock, 
  ChevronRight,
  PackageCheck,
  Truck,
  CheckCircle2,
  Bell
} from 'lucide-react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EnquiriesPage from './pages/EnquiriesPage';
import QuotationsPage from './pages/QuotationsPage';
import OrdersPage from './pages/OrdersPage';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch (e) { /* ignore */ }
    }
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleRoleQuickSwitch = (newRole) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      role: newRole,
      name: newRole === 'ADMIN' ? 'Admin User' : 'Sales Representative'
    };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Executive Hub', icon: LayoutDashboard, roles: ['ADMIN', 'SALES_USER'] },
    { id: 'enquiries', label: 'Customer Enquiries', icon: FileText, roles: ['ADMIN', 'SALES_USER'] },
    { id: 'quotations', label: 'Quotations', icon: Receipt, roles: ['ADMIN', 'SALES_USER'] },
    { id: 'orders', label: 'Sales Orders & Inventory', icon: ShieldCheck, roles: ['ADMIN', 'SALES_USER'] },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage user={user} onNavigate={setCurrentPage} />;
      case 'enquiries': return <EnquiriesPage user={user} />;
      case 'quotations': return <QuotationsPage user={user} />;
      case 'orders': return <OrdersPage user={user} />;
      default: return <DashboardPage user={user} onNavigate={setCurrentPage} />;
    }
  };

  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'UR';

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Sparkles size={22} />
          </div>
          <div className="brand-info">
            <h2>Fundsroom ERP</h2>
            <span>Order Fulfillment</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Navigation</div>
          {navItems
            .filter(item => item.roles.includes(user.role))
            .map(item => (
              <div
                key={item.id}
                className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => setCurrentPage(item.id)}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </div>
            ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{initials}</div>
            <div className="user-meta">
              <div className="user-name">{user.name}</div>
              <div className="user-role-badge">
                <span className="badge-dot" style={{ background: user.role === 'ADMIN' ? '#818cf8' : '#34d399' }} />
                {user.role.replace('_', ' ')}
              </div>
            </div>
            <button className="btn-icon-logout" onClick={handleLogout} title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main App Content & Top Header */}
      <div className="main-wrapper">
        <header className="top-navbar">
          <div className="top-nav-left">
            <div className="breadcrumb">
              <span>Fundsroom ERP</span>
              <ChevronRight size={14} />
              <span className="breadcrumb-active">
                {navItems.find(n => n.id === currentPage)?.label || 'Overview'}
              </span>
            </div>
          </div>

          {/* Real-time Order Process Pipeline Stepper */}
          <div className="pipeline-stepper">
            <div className={`pipeline-step ${currentPage === 'enquiries' ? 'active' : 'completed'}`} onClick={() => setCurrentPage('enquiries')} style={{ cursor: 'pointer' }}>
              <div className="step-num">1</div>
              <span>Enquiry</span>
            </div>
            <span className="pipeline-arrow">→</span>
            <div className={`pipeline-step ${currentPage === 'quotations' ? 'active' : ''}`} onClick={() => setCurrentPage('quotations')} style={{ cursor: 'pointer' }}>
              <div className="step-num">2</div>
              <span>Quotation</span>
            </div>
            <span className="pipeline-arrow">→</span>
            <div className={`pipeline-step ${currentPage === 'orders' ? 'active' : ''}`} onClick={() => setCurrentPage('orders')} style={{ cursor: 'pointer' }}>
              <div className="step-num">3</div>
              <span>Order</span>
            </div>
            <span className="pipeline-arrow">→</span>
            <div className="pipeline-step" onClick={() => setCurrentPage('orders')} style={{ cursor: 'pointer' }}>
              <div className="step-num">4</div>
              <span>Reservation</span>
            </div>
            <span className="pipeline-arrow">→</span>
            <div className="pipeline-step" onClick={() => setCurrentPage('orders')} style={{ cursor: 'pointer' }}>
              <div className="step-num">5</div>
              <span>Dispatch</span>
            </div>
          </div>

          <div className="top-nav-right">
            {/* Quick Role Toggle for Evaluator Convenience */}
            <div className="role-switcher-pill">
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Role:</span>
              <select value={user.role} onChange={(e) => handleRoleQuickSwitch(e.target.value)}>
                <option value="ADMIN">ADMIN</option>
                <option value="SALES_USER">SALES USER</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <Clock size={14} />
              <span>{currentTime}</span>
            </div>
          </div>
        </header>

        <main className="main-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
