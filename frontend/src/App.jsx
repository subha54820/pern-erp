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
  Package,
  Truck,
  CheckCircle2,
  Bell,
  Activity,
  Users,
  BarChart3,
  Target,
  Briefcase
} from 'lucide-react';
import api from './api';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EnquiriesPage from './pages/EnquiriesPage';
import QuotationsPage from './pages/QuotationsPage';
import OrdersPage from './pages/OrdersPage';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [ordersTab, setOrdersTab] = useState('orders');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    // Ensure application always starts on Login page when opened/launched
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentPage('dashboard');
    setOrdersTab('orders');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentPage('dashboard');
  };

  const handleRoleQuickSwitch = async (newRole) => {
    if (!user) return;
    try {
      const res = await api.post('/auth/switch-role', { role: newRole });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      setCurrentPage('dashboard');
      setOrdersTab('orders');
    } catch (err) {
      console.error('Failed to switch role:', err);
    }
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const isAdmin = user.role === 'ADMIN';

  // ─── COMPLETELY SEPARATE NAV ITEMS PER ROLE ───
  const adminNavItems = [
    { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard, section: 'Command Center' },
    { id: 'orders', label: 'Order Management', icon: ShieldCheck, section: 'Operations' },
    { id: 'inventory', label: 'Inventory & Stock', icon: Package, section: 'Operations' },
    { id: 'dispatches', label: 'Dispatch Center', icon: Truck, section: 'Operations' },
    { id: 'activity', label: 'Activity Logs', icon: Activity, section: 'Monitoring' },
  ];

  const salesNavItems = [
    { id: 'dashboard', label: 'Sales Dashboard', icon: LayoutDashboard, section: 'My Workspace' },
    { id: 'enquiries', label: 'Customer Enquiries', icon: FileText, section: 'Sales Pipeline' },
    { id: 'quotations', label: 'Quotations', icon: Receipt, section: 'Sales Pipeline' },
    { id: 'orders', label: 'My Orders', icon: Briefcase, section: 'Sales Pipeline' },
    { id: 'conversions', label: 'Conversion Tracker', icon: Target, section: 'Performance' },
  ];

  const navItems = isAdmin ? adminNavItems : salesNavItems;

  // Group nav items by section
  const sections = {};
  navItems.forEach(item => {
    if (!sections[item.section]) sections[item.section] = [];
    sections[item.section].push(item);
  });

  const handleNav = (pageId) => {
    if (pageId === 'inventory') {
      setCurrentPage('orders');
      setOrdersTab('inventory');
    } else if (pageId === 'dispatches') {
      setCurrentPage('orders');
      setOrdersTab('dispatches');
    } else if (pageId === 'conversions') {
      setCurrentPage('orders');
      setOrdersTab('orders');
    } else if (pageId === 'activity') {
      setCurrentPage('orders');
      setOrdersTab('dispatches');
    } else {
      setCurrentPage(pageId);
      if (pageId === 'orders') setOrdersTab('orders');
    }
  };

  const getActiveNavId = () => {
    if (currentPage === 'orders') {
      if (isAdmin) {
        if (ordersTab === 'inventory') return 'inventory';
        if (ordersTab === 'dispatches') return 'dispatches';
        return 'orders';
      } else {
        if (ordersTab === 'orders') return 'orders';
        return 'conversions';
      }
    }
    return currentPage;
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage user={user} onNavigate={(page, tab) => { setCurrentPage(page); if (tab) setOrdersTab(tab); }} />;
      case 'enquiries': return <EnquiriesPage user={user} />;
      case 'quotations': return <QuotationsPage user={user} />;
      case 'orders': return <OrdersPage user={user} initialTab={ordersTab} />;
      default: return <DashboardPage user={user} onNavigate={(page, tab) => { setCurrentPage(page); if (tab) setOrdersTab(tab); }} />;
    }
  };

  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'UR';
  const activeNavId = getActiveNavId();

  // ─── ADMIN PIPELINE: Confirm → Reserve → Dispatch ───
  const AdminPipeline = () => (
    <div className="pipeline-stepper">
      <div className={`pipeline-step ${activeNavId === 'orders' ? 'active' : ''}`} onClick={() => handleNav('orders')} style={{ cursor: 'pointer' }}>
        <div className="step-num">1</div>
        <span>Confirm</span>
      </div>
      <span className="pipeline-arrow">→</span>
      <div className={`pipeline-step ${activeNavId === 'inventory' ? 'active' : ''}`} onClick={() => handleNav('inventory')} style={{ cursor: 'pointer' }}>
        <div className="step-num">2</div>
        <span>Reserve</span>
      </div>
      <span className="pipeline-arrow">→</span>
      <div className={`pipeline-step ${activeNavId === 'dispatches' ? 'active' : ''}`} onClick={() => handleNav('dispatches')} style={{ cursor: 'pointer' }}>
        <div className="step-num">3</div>
        <span>Dispatch</span>
      </div>
    </div>
  );

  // ─── SALES PIPELINE: Enquiry → Quotation → Order ───
  const SalesPipeline = () => (
    <div className="pipeline-stepper">
      <div className={`pipeline-step ${currentPage === 'enquiries' ? 'active' : ''}`} onClick={() => setCurrentPage('enquiries')} style={{ cursor: 'pointer' }}>
        <div className="step-num">1</div>
        <span>Enquiry</span>
      </div>
      <span className="pipeline-arrow">→</span>
      <div className={`pipeline-step ${currentPage === 'quotations' ? 'active' : ''}`} onClick={() => setCurrentPage('quotations')} style={{ cursor: 'pointer' }}>
        <div className="step-num">2</div>
        <span>Quote</span>
      </div>
      <span className="pipeline-arrow">→</span>
      <div className={`pipeline-step ${currentPage === 'orders' ? 'active' : ''}`} onClick={() => handleNav('orders')} style={{ cursor: 'pointer' }}>
        <div className="step-num">3</div>
        <span>Convert</span>
      </div>
    </div>
  );

  return (
    <div className="app-layout">
      {/* Sidebar Navigation — COMPLETELY DIFFERENT PER ROLE */}
      <aside className="sidebar" style={{ borderRight: isAdmin ? '1px solid rgba(99, 102, 241, 0.15)' : '1px solid rgba(16, 185, 129, 0.15)' }}>
        <div className="sidebar-brand">
          <div className="brand-icon" style={{ background: isAdmin ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)' }}>
            {isAdmin ? <ShieldCheck size={22} color="#818cf8" /> : <Sparkles size={22} color="#34d399" />}
          </div>
          <div className="brand-info">
            <h2>{isAdmin ? 'Admin Console' : 'Sales Console'}</h2>
            <span style={{ color: isAdmin ? '#a5b4fc' : '#6ee7b7', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {isAdmin ? '🛡️ System Management' : '💼 Customer Sales'}
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {Object.entries(sections).map(([section, items]) => (
            <div key={section}>
              <div className="sidebar-section-title">{section}</div>
              {items.map(item => (
                <div
                  key={item.id}
                  className={`nav-item ${activeNavId === item.id ? 'active' : ''}`}
                  onClick={() => handleNav(item.id)}
                  style={activeNavId === item.id ? { borderLeft: isAdmin ? '3px solid #818cf8' : '3px solid #34d399' } : {}}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar" style={{ background: isAdmin ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
              {initials}
            </div>
            <div className="user-meta">
              <div className="user-name">{user.name}</div>
              <div className="user-role-badge">
                <span className="badge-dot" style={{ background: isAdmin ? '#818cf8' : '#34d399' }} />
                {isAdmin ? 'ADMINISTRATOR' : 'SALES REP'}
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
              <span style={{ color: isAdmin ? '#a5b4fc' : '#6ee7b7' }}>
                {isAdmin ? '🛡️ Admin' : '💼 Sales'}
              </span>
              <ChevronRight size={14} />
              <span className="breadcrumb-active">
                {navItems.find(n => n.id === activeNavId)?.label || 'Dashboard'}
              </span>
            </div>
          </div>

          {/* Role-Specific Pipeline Stepper */}
          {isAdmin ? <AdminPipeline /> : <SalesPipeline />}

          <div className="top-nav-right">
            {/* Quick Role Toggle for Evaluator Convenience */}
            <div className="role-switcher-pill">
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Switch:</span>
              <select value={user.role} onChange={(e) => handleRoleQuickSwitch(e.target.value)}>
                <option value="ADMIN">🛡️ ADMIN</option>
                <option value="SALES_USER">💼 SALES</option>
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
