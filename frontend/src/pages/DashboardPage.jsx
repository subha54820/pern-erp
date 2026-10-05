import { useState, useEffect } from 'react';
import { 
  FileText, 
  Receipt, 
  ShieldCheck, 
  Truck, 
  Package, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import api from '../api';

export default function DashboardPage({ user, onNavigate }) {
  const [stats, setStats] = useState({
    enquiries: 0,
    quotations: 0,
    orders: 0,
    dispatches: 0,
    products: 0,
    totalStock: 0,
    reservedStock: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [enqRes, quoteRes, orderRes, invRes, dispRes] = await Promise.allSettled([
        api.get('/enquiries'),
        api.get('/quotations'),
        api.get('/sales-orders'),
        api.get('/inventory'),
        api.get('/dispatches')
      ]);

      const enq = enqRes.status === 'fulfilled' ? enqRes.value.data.data : [];
      const quotes = quoteRes.status === 'fulfilled' ? quoteRes.value.data.data : [];
      const orders = orderRes.status === 'fulfilled' ? orderRes.value.data.data : [];
      const inv = invRes.status === 'fulfilled' ? invRes.value.data.data : [];
      const disp = dispRes.status === 'fulfilled' ? dispRes.value.data.data : [];

      let totalStock = 0;
      let totalReserved = 0;
      if (Array.isArray(inv)) {
        inv.forEach(i => {
          totalStock += Number(i.physical_stock || 0);
          totalReserved += Number(i.reserved_stock || 0);
        });
      }

      setStats({
        enquiries: enq.length,
        quotations: quotes.length,
        orders: orders.length,
        dispatches: disp.length,
        products: inv.length,
        totalStock,
        reservedStock: totalReserved
      });

      setRecentOrders(Array.isArray(orders) ? orders.slice(0, 5) : []);
      setInventoryList(Array.isArray(inv) ? inv.slice(0, 4) : []);
    } catch (e) {
      console.error('Failed to fetch dashboard metrics', e);
    } finally {
      setLoading(false);
    }
  };

  const availableStock = Math.max(0, stats.totalStock - stats.reservedStock);
  const stockUtilization = stats.totalStock > 0 ? Math.round((stats.reservedStock / stats.totalStock) * 100) : 0;

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.1))',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 32px',
        marginBottom: '28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <Sparkles size={16} /> Fundsroom Enterprise ERP Hub
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>
            Welcome back, {user.name} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Role: <strong style={{ color: '#a5b4fc' }}>{user.role.replace('_', ' ')}</strong> — Real-time order fulfillment & supply chain operations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={() => onNavigate('enquiries')}>
            <FileText size={16} /> Create Enquiry
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('quotations')}>
            <Receipt size={16} /> View Quotes
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Customer Enquiries</span>
            <div className="kpi-icon-wrap"><FileText size={18} /></div>
          </div>
          <div className="kpi-value">{stats.enquiries}</div>
          <div className="kpi-subtitle">
            <Clock size={13} /> Active pipeline requests
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Quotations</span>
            <div className="kpi-icon-wrap" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
              <Receipt size={18} />
            </div>
          </div>
          <div className="kpi-value">{stats.quotations}</div>
          <div className="kpi-subtitle" style={{ color: '#67e8f9' }}>
            <TrendingUp size={13} /> Issued & pending deals
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Sales Orders</span>
            <div className="kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="kpi-value">{stats.orders}</div>
          <div className="kpi-subtitle" style={{ color: '#6ee7b7' }}>
            <CheckCircle2 size={13} /> Confirmed for fulfillment
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Dispatched Orders</span>
            <div className="kpi-icon-wrap" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
              <Truck size={18} />
            </div>
          </div>
          <div className="kpi-value">{stats.dispatches}</div>
          <div className="kpi-subtitle" style={{ color: '#c4b5fd' }}>
            <Package size={13} /> Shipped to customers
          </div>
        </div>
      </div>

      {/* Workflow Visualizer & Inventory Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', marginBottom: '28px' }}>
        
        {/* Interactive Order Fulfillment Pipeline Visualizer */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="#818cf8" /> Order Fulfillment Lifecycle
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Full 5-stage PERN ERP process model
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { step: '1. Customer Enquiry', desc: 'Log customer product requirements and target pricing', route: 'enquiries', badge: 'Sales User' },
              { step: '2. Quotation Generation', desc: 'Create official itemized quote with tax/discounts, accept/reject', route: 'quotations', badge: 'Sales User' },
              { step: '3. Sales Order Conversion', desc: 'Convert ONLY accepted quotations to formal Sales Orders', route: 'orders', badge: 'Sales User' },
              { step: '4. Inventory Reservation', desc: 'Verify physical vs reserved stock; reserve stock securely', route: 'orders', badge: 'Admin' },
              { step: '5. Dispatch Execution', desc: 'Deduct physical and reserved inventory, generate dispatch slips', route: 'orders', badge: 'Admin' },
            ].map((item, index) => (
              <div 
                key={index}
                onClick={() => onNavigate(item.route)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#ffffff' }}>{item.step}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.desc}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-blue">{item.badge}</span>
                  <ArrowRight size={14} color="var(--text-muted)" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Inventory Health Widget */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={18} color="#34d399" /> Inventory Stock Levels
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Real-time physical vs reserved stock
          </p>

          <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(0, 0, 0, 0.25)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Stock Utilization</span>
              <span style={{ fontWeight: 700, color: stockUtilization > 75 ? '#f43f5e' : '#34d399' }}>
                {stockUtilization}% Reserved
              </span>
            </div>
            <div className="stock-bar-wrap">
              <div 
                className={`stock-bar-fill ${stockUtilization > 80 ? 'danger' : stockUtilization > 50 ? 'warning' : ''}`}
                style={{ width: `${Math.min(stockUtilization, 100)}%` }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Physical: </span>
                <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{stats.totalStock}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Reserved: </span>
                <strong style={{ color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>{stats.reservedStock}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Available: </span>
                <strong style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>{availableStock}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {inventoryList.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>{item.product_name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{item.sku}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                    {item.available_stock} Avail
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Total: {item.physical_stock}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button 
            className="btn btn-secondary" 
            style={{ width: '100%', marginTop: '16px', justifyContent: 'center' }}
            onClick={() => onNavigate('orders')}
          >
            Manage Full Inventory <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
