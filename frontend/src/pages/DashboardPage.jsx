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
  AlertTriangle,
  Activity,
  Users,
  BarChart3,
  Target,
  Briefcase,
  XCircle,
  Eye,
  Zap
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
    reservedStock: 0,
    // Additional stats
    acceptedQuotations: 0,
    rejectedQuotations: 0,
    confirmedOrders: 0,
    reservedOrders: 0,
    dispatchedOrders: 0,
    cancelledOrders: 0,
    createdOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [quotationList, setQuotationList] = useState([]);
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

      const acceptedQ = Array.isArray(quotes) ? quotes.filter(q => q.status === 'ACCEPTED').length : 0;
      const rejectedQ = Array.isArray(quotes) ? quotes.filter(q => q.status === 'REJECTED').length : 0;
      const confirmedO = Array.isArray(orders) ? orders.filter(o => o.status === 'CONFIRMED').length : 0;
      const reservedO = Array.isArray(orders) ? orders.filter(o => o.status === 'RESERVED').length : 0;
      const dispatchedO = Array.isArray(orders) ? orders.filter(o => o.status === 'DISPATCHED').length : 0;
      const cancelledO = Array.isArray(orders) ? orders.filter(o => o.status === 'CANCELLED').length : 0;
      const createdO = Array.isArray(orders) ? orders.filter(o => o.status === 'CREATED').length : 0;

      setStats({
        enquiries: enq.length,
        quotations: quotes.length,
        orders: orders.length,
        dispatches: disp.length,
        products: inv.length,
        totalStock,
        reservedStock: totalReserved,
        acceptedQuotations: acceptedQ,
        rejectedQuotations: rejectedQ,
        confirmedOrders: confirmedO,
        reservedOrders: reservedO,
        dispatchedOrders: dispatchedO,
        cancelledOrders: cancelledO,
        createdOrders: createdO,
      });

      setRecentOrders(Array.isArray(orders) ? orders.slice(0, 6) : []);
      setInventoryList(Array.isArray(inv) ? inv : []);
      setQuotationList(Array.isArray(quotes) ? quotes.slice(0, 5) : []);
    } catch (e) {
      console.error('Failed to fetch dashboard metrics', e);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user.role === 'ADMIN';
  const availableStock = Math.max(0, stats.totalStock - stats.reservedStock);
  const stockUtilization = stats.totalStock > 0 ? Math.round((stats.reservedStock / stats.totalStock) * 100) : 0;
  const conversionRate = stats.quotations > 0 ? Math.round((stats.acceptedQuotations / stats.quotations) * 100) : 0;

  const lowStockItems = inventoryList.filter(i => Number(i.available_stock || 0) < 20);
  const pendingConfirmation = stats.createdOrders;
  const readyToReserve = stats.confirmedOrders;
  const readyToDispatch = stats.reservedOrders;

  // ─── STATUS BADGE HELPER ───
  const StatusBadge = ({ status }) => {
    const colors = {
      CREATED: { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
      CONFIRMED: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
      RESERVED: { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' },
      DISPATCHED: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
      CANCELLED: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
      ACCEPTED: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
      REJECTED: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
      DRAFT: { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
    };
    const c = colors[status] || colors.DRAFT;
    return (
      <span style={{ 
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
        background: c.bg, color: c.color, border: `1px solid ${c.border}`, letterSpacing: '0.3px'
      }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.color }} />
        {status}
      </span>
    );
  };

  // ─── KPI CARD COMPONENT ───
  const KpiCard = ({ icon: Icon, label, value, subtitle, iconBg, iconColor, accentColor }) => (
    <div className="kpi-card">
      <div className="kpi-header">
        <span className="kpi-title">{label}</span>
        <div className="kpi-icon-wrap" style={{ background: iconBg || '#eff6ff', color: iconColor || '#2563eb' }}>
          <Icon size={18} />
        </div>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-subtitle" style={{ color: accentColor || 'var(--text-muted)' }}>
        {subtitle}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  //  ADMIN DASHBOARD — System Management & Operations Control
  // ═══════════════════════════════════════════════════════════
  if (isAdmin) {
    return (
      <div>
        {/* Admin Welcome Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)',
          border: '1px solid #bfdbfe',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 28px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              <ShieldCheck size={16} /> 🛡️ SYSTEM ADMINISTRATION CONSOLE
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              Operations Command Center
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '4px' }}>
              Manage orders, inventory stock, dispatches, and monitor system health. Everything after quotation acceptance.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={() => onNavigate('orders', 'orders')}>
              <ShieldCheck size={16} /> Confirm Orders
            </button>
            <button className="btn btn-emerald" onClick={() => onNavigate('orders', 'dispatches')}>
              <Truck size={16} /> Dispatch Center
            </button>
          </div>
        </div>

        {/* ─── ADMIN OPERATIONAL ALERTS ─── */}
        {(pendingConfirmation > 0 || readyToReserve > 0 || readyToDispatch > 0 || lowStockItems.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {pendingConfirmation > 0 && (
              <div onClick={() => onNavigate('orders', 'orders')} style={{
                padding: '16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                background: '#fffbeb', border: '1px solid #fde68a',
                transition: 'var(--transition)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <AlertTriangle size={16} color="#d97706" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>Pending Confirmation</span>
                </div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#92400e', fontFamily: 'var(--font-mono)' }}>{pendingConfirmation}</div>
                <div style={{ fontSize: '11px', color: '#78350f', marginTop: '2px' }}>Orders awaiting admin approval</div>
              </div>
            )}
            {readyToReserve > 0 && (
              <div onClick={() => onNavigate('orders', 'inventory')} style={{
                padding: '16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                background: '#eff6ff', border: '1px solid #bfdbfe',
                transition: 'var(--transition)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Package size={16} color="#2563eb" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase' }}>Ready to Reserve</span>
                </div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#1e40af', fontFamily: 'var(--font-mono)' }}>{readyToReserve}</div>
                <div style={{ fontSize: '11px', color: '#1e3a8a', marginTop: '2px' }}>Confirmed orders need stock allocation</div>
              </div>
            )}
            {readyToDispatch > 0 && (
              <div onClick={() => onNavigate('orders', 'dispatches')} style={{
                padding: '16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                background: '#ecfdf5', border: '1px solid #a7f3d0',
                transition: 'var(--transition)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Truck size={16} color="#059669" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>Ready to Dispatch</span>
                </div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#065f46', fontFamily: 'var(--font-mono)' }}>{readyToDispatch}</div>
                <div style={{ fontSize: '11px', color: '#064e3b', marginTop: '2px' }}>Reserved orders ready for shipment</div>
              </div>
            )}
            {lowStockItems.length > 0 && (
              <div onClick={() => onNavigate('orders', 'inventory')} style={{
                padding: '16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                background: '#fef2f2', border: '1px solid #fecaca',
                transition: 'var(--transition)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <AlertTriangle size={16} color="#dc2626" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase' }}>Low Stock Alert</span>
                </div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#991b1b', fontFamily: 'var(--font-mono)' }}>{lowStockItems.length}</div>
                <div style={{ fontSize: '11px', color: '#7f1d1d', marginTop: '2px' }}>Products below threshold (&lt;20 units)</div>
              </div>
            )}
          </div>
        )}

        {/* ─── ADMIN KPI CARDS — Operations Focus ─── */}
        <div className="kpi-grid">
          <KpiCard icon={ShieldCheck} label="Total Orders" value={stats.orders} subtitle={`${stats.confirmedOrders} confirmed · ${stats.cancelledOrders} cancelled`} iconBg="#eff6ff" iconColor="#2563eb" accentColor="#1d4ed8" />
          <KpiCard icon={Package} label="Stock Reserved" value={stats.reservedStock} subtitle={`${stockUtilization}% of total physical stock`} iconBg="#fffbeb" iconColor="#d97706" accentColor="#b45309" />
          <KpiCard icon={Truck} label="Dispatches" value={stats.dispatches} subtitle={`${stats.dispatchedOrders} orders fulfilled`} iconBg="#ecfdf5" iconColor="#059669" accentColor="#047857" />
          <KpiCard icon={Activity} label="Available Stock" value={availableStock} subtitle={`${stats.products} products tracked`} iconBg="#f5f3ff" iconColor="#7c3aed" accentColor="#6d28d9" />
        </div>

        {/* ─── ADMIN BOTTOM GRID: Inventory Health + Order Queue ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>

          {/* Inventory Health Monitor */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={18} color="#059669" /> Inventory Health Monitor
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Physical vs Reserved stock levels across all products
            </p>

            {/* Utilization Bar */}
            <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Stock Utilization</span>
                <span style={{ fontWeight: 700, color: stockUtilization > 75 ? '#dc2626' : '#059669' }}>
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
                  <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{stats.totalStock}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Reserved: </span>
                  <strong style={{ color: '#d97706', fontFamily: 'var(--font-mono)' }}>{stats.reservedStock}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Available: </span>
                  <strong style={{ color: '#059669', fontFamily: 'var(--font-mono)' }}>{availableStock}</strong>
                </div>
              </div>
            </div>

            {/* Product Inventory List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
              {inventoryList.slice(0, 6).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: 'var(--radius-xs)', border: Number(item.available_stock || 0) < 20 ? '1px solid #fecaca' : '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.product_name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{item.sku}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: Number(item.available_stock || 0) < 20 ? '#dc2626' : '#059669', fontFamily: 'var(--font-mono)' }}>
                      {item.available_stock} avail
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {item.physical_stock} phys · {item.reserved_stock} rsv
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn btn-secondary" style={{ width: '100%', marginTop: '16px', justifyContent: 'center' }} onClick={() => onNavigate('orders', 'inventory')}>
              Full Inventory View <ArrowRight size={14} />
            </button>
          </div>

          {/* Order Processing Queue */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#2563eb" /> Order Processing Queue
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Recent orders requiring admin action
            </p>

            {/* Status Summary Bar */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {[
                { label: 'Created', count: stats.createdOrders, color: '#d97706' },
                { label: 'Confirmed', count: stats.confirmedOrders, color: '#2563eb' },
                { label: 'Reserved', count: stats.reservedOrders, color: '#7c3aed' },
                { label: 'Dispatched', count: stats.dispatchedOrders, color: '#059669' },
                { label: 'Cancelled', count: stats.cancelledOrders, color: '#dc2626' },
              ].map((s, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px',
                  background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: '20px', fontSize: '11.5px', fontWeight: 600
                }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: s.color }} />
                  <span style={{ color: 'var(--text-muted)' }}>{s.label}:</span>
                  <span style={{ color: s.color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{s.count}</span>
                </div>
              ))}
            </div>

            {/* Recent Orders List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
              {recentOrders.map((order, idx) => (
                <div key={idx} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)'
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {order.order_number}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {order.customer_name || 'Customer'} · ₹{Number(order.total_amount || 0).toLocaleString()}
                    </div>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              ))}
              {recentOrders.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No orders in queue
                </div>
              )}
            </div>

            <button className="btn btn-primary" style={{ width: '100%', marginTop: '16px', justifyContent: 'center' }} onClick={() => onNavigate('orders', 'orders')}>
              Manage All Orders <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* ─── ADMIN WORKFLOW PIPELINE ─── */}
        <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid #2563eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} color="#2563eb" /> Admin Workflow Pipeline
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { step: '1. Confirm Orders', desc: 'Review new sales orders from Sales team, validate line items, and approve for stock reservation.', icon: ShieldCheck, route: 'orders', tab: 'orders', color: '#2563eb' },
              { step: '2. Reserve Inventory', desc: 'Allocate physical stock to confirmed orders. Check availability (Physical - Reserved) before locking.', icon: Package, route: 'orders', tab: 'inventory', color: '#7c3aed' },
              { step: '3. Process Dispatch', desc: 'Execute final shipment. Deducts both physical and reserved stock. Generate dispatch confirmation.', icon: Truck, route: 'orders', tab: 'dispatches', color: '#059669' },
            ].map((item, idx) => (
              <div key={idx} onClick={() => onNavigate(item.route, item.tab)} style={{
                padding: '18px', background: '#f8fafc', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'var(--transition)',
                borderTop: `3px solid ${item.color}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <item.icon size={18} color={item.color} />
                  <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>{item.step}</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  SALES DASHBOARD — Customer Sales & Conversion Tracking
  // ═══════════════════════════════════════════════════════════
  return (
    <div>
      {/* Sales Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #ecfdf5 0%, #f8fafc 100%)',
        border: '1px solid #a7f3d0',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            <Target size={16} /> 💼 SALES REPRESENTATIVE WORKSPACE
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            Sales Pipeline Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '4px' }}>
            Capture enquiries, build winning quotations, and convert deals into sales orders. Track your pipeline performance.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-emerald" onClick={() => onNavigate('enquiries')}>
            <FileText size={16} /> New Enquiry
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('quotations')}>
            <Receipt size={16} /> Build Quote
          </button>
        </div>
      </div>

      {/* ─── SALES KPI CARDS — Pipeline Focus ─── */}
      <div className="kpi-grid">
        <KpiCard icon={FileText} label="Enquiries Captured" value={stats.enquiries} subtitle="Active prospect requests" iconBg="#eff6ff" iconColor="#2563eb" accentColor="#1d4ed8" />
        <KpiCard icon={Receipt} label="Quotations Sent" value={stats.quotations} subtitle={`${stats.acceptedQuotations} accepted · ${stats.rejectedQuotations} rejected`} iconBg="#f0f9ff" iconColor="#0284c7" accentColor="#0369a1" />
        <KpiCard icon={Target} label="Conversion Rate" value={`${conversionRate}%`} subtitle={`${stats.acceptedQuotations} of ${stats.quotations} quotes won`} iconBg="#ecfdf5" iconColor="#059669" accentColor="#047857" />
        <KpiCard icon={Briefcase} label="Orders Created" value={stats.orders} subtitle={`${stats.dispatchedOrders} shipped · ${stats.cancelledOrders} lost`} iconBg="#fffbeb" iconColor="#d97706" accentColor="#b45309" />
      </div>

      {/* ─── SALES BOTTOM GRID: Pipeline + Recent Quotes ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>

        {/* Conversion Funnel */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="#059669" /> Sales Conversion Funnel
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Your enquiry-to-order pipeline progression
          </p>

          {/* Funnel Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Enquiries Received', value: stats.enquiries, max: Math.max(stats.enquiries, 1), color: '#2563eb', icon: FileText },
              { label: 'Quotations Generated', value: stats.quotations, max: Math.max(stats.enquiries, 1), color: '#0284c7', icon: Receipt },
              { label: 'Quotations Accepted', value: stats.acceptedQuotations, max: Math.max(stats.enquiries, 1), color: '#059669', icon: CheckCircle2 },
              { label: 'Orders Converted', value: stats.orders, max: Math.max(stats.enquiries, 1), color: '#d97706', icon: Briefcase },
            ].map((item, idx) => {
              const pct = item.max > 0 ? Math.round((item.value / item.max) * 100) : 0;
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <item.icon size={14} color={item.color} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{item.label}</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: item.color, fontFamily: 'var(--font-mono)' }}>{item.value}</span>
                  </div>
                  <div style={{ height: '7px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '4px', background: item.color,
                      width: `${Math.max(pct, 3)}%`, transition: 'width 0.8s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conversion Summary */}
          <div style={{
            marginTop: '20px', padding: '16px', background: '#ecfdf5',
            border: '1px solid #a7f3d0', borderRadius: 'var(--radius-sm)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>Quote-to-Order Rate</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#065f46', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {conversionRate}%
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 700, textTransform: 'uppercase' }}>Deals Won</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#92400e', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {stats.acceptedQuotations}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Quotations */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={18} color="#0284c7" /> Recent Quotations
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Latest quotations you've created and their statuses
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '310px', overflowY: 'auto' }}>
            {quotationList.map((q, idx) => (
              <div key={idx} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '11px 14px', background: '#f8fafc', borderRadius: 'var(--radius-xs)',
                border: q.status === 'ACCEPTED' ? '1px solid #a7f3d0' : '1px solid var(--border-subtle)'
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {q.quotation_number}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {q.customer_name || 'Customer'} · ₹{Number(q.total_amount || 0).toLocaleString()}
                  </div>
                </div>
                <StatusBadge status={q.status} />
              </div>
            ))}
            {quotationList.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No quotations yet. Create your first one!
              </div>
            )}
          </div>

          <button className="btn btn-secondary" style={{ width: '100%', marginTop: '16px', justifyContent: 'center' }} onClick={() => onNavigate('quotations')}>
            View All Quotations <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* ─── SALES WORKFLOW PIPELINE ─── */}
      <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid #059669' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} color="#059669" /> Your Sales Workflow
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { step: '1. Capture Enquiry', desc: 'Log customer product requirements, pricing expectations, and contact information. Start the sales journey.', icon: FileText, route: 'enquiries', tab: null, color: '#2563eb' },
            { step: '2. Build Quotation', desc: 'Create itemized quotes with product pricing, tax calculations, and discounts. Send for customer acceptance.', icon: Receipt, route: 'quotations', tab: null, color: '#0284c7' },
            { step: '3. Convert to Order', desc: 'Once the customer accepts your quotation, convert it into a formal Sales Order for Admin fulfillment.', icon: Briefcase, route: 'orders', tab: 'orders', color: '#059669' },
          ].map((item, idx) => (
            <div key={idx} onClick={() => onNavigate(item.route, item.tab)} style={{
              padding: '18px', background: '#f8fafc', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'var(--transition)',
              borderTop: `3px solid ${item.color}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <item.icon size={18} color={item.color} />
                <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>{item.step}</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
