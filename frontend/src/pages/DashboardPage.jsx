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
      CREATED: { bg: 'rgba(250, 204, 21, 0.15)', color: '#facc15' },
      CONFIRMED: { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' },
      RESERVED: { bg: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' },
      DISPATCHED: { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399' },
      CANCELLED: { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171' },
      ACCEPTED: { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399' },
      REJECTED: { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171' },
      DRAFT: { bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' },
    };
    const c = colors[status] || colors.DRAFT;
    return (
      <span style={{ 
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
        background: c.bg, color: c.color, letterSpacing: '0.3px'
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
        <div className="kpi-icon-wrap" style={{ background: iconBg || 'rgba(99, 102, 241, 0.15)', color: iconColor || '#818cf8' }}>
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
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.15))',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 32px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <ShieldCheck size={16} /> 🛡️ SYSTEM ADMINISTRATION CONSOLE
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>
              Operations Command Center
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              Manage orders, inventory stock, dispatches, and monitor system health. Your responsibility: everything after quotation acceptance.
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
                padding: '16px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                background: 'rgba(250, 204, 21, 0.08)', border: '1px solid rgba(250, 204, 21, 0.3)',
                transition: 'var(--transition)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <AlertTriangle size={16} color="#facc15" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#facc15', textTransform: 'uppercase' }}>Pending Confirmation</span>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>{pendingConfirmation}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Orders awaiting admin approval</div>
              </div>
            )}
            {readyToReserve > 0 && (
              <div onClick={() => onNavigate('orders', 'inventory')} style={{
                padding: '16px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.3)',
                transition: 'var(--transition)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Package size={16} color="#60a5fa" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase' }}>Ready to Reserve</span>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>{readyToReserve}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Confirmed orders need stock allocation</div>
              </div>
            )}
            {readyToDispatch > 0 && (
              <div onClick={() => onNavigate('orders', 'dispatches')} style={{
                padding: '16px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)',
                transition: 'var(--transition)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Truck size={16} color="#34d399" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>Ready to Dispatch</span>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>{readyToDispatch}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Reserved orders ready for shipment</div>
              </div>
            )}
            {lowStockItems.length > 0 && (
              <div onClick={() => onNavigate('orders', 'inventory')} style={{
                padding: '16px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)',
                transition: 'var(--transition)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <AlertTriangle size={16} color="#f87171" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#f87171', textTransform: 'uppercase' }}>Low Stock Alert</span>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#f87171', fontFamily: 'var(--font-mono)' }}>{lowStockItems.length}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Products below threshold (&lt;20 units)</div>
              </div>
            )}
          </div>
        )}

        {/* ─── ADMIN KPI CARDS — Operations Focus ─── */}
        <div className="kpi-grid">
          <KpiCard icon={ShieldCheck} label="Total Orders" value={stats.orders} subtitle={`${stats.confirmedOrders} confirmed · ${stats.cancelledOrders} cancelled`} iconBg="rgba(99, 102, 241, 0.15)" iconColor="#818cf8" accentColor="#a5b4fc" />
          <KpiCard icon={Package} label="Stock Reserved" value={stats.reservedStock} subtitle={`${stockUtilization}% of total physical stock`} iconBg="rgba(245, 158, 11, 0.15)" iconColor="#f59e0b" accentColor="#fbbf24" />
          <KpiCard icon={Truck} label="Dispatches" value={stats.dispatches} subtitle={`${stats.dispatchedOrders} orders fulfilled`} iconBg="rgba(16, 185, 129, 0.15)" iconColor="#34d399" accentColor="#6ee7b7" />
          <KpiCard icon={Activity} label="Available Stock" value={availableStock} subtitle={`${stats.products} products tracked`} iconBg="rgba(139, 92, 246, 0.15)" iconColor="#a78bfa" accentColor="#c4b5fd" />
        </div>

        {/* ─── ADMIN BOTTOM GRID: Inventory Health + Order Queue ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>

          {/* Inventory Health Monitor */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={18} color="#34d399" /> Inventory Health Monitor
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Physical vs Reserved stock levels across all products
            </p>

            {/* Utilization Bar */}
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

            {/* Product Inventory List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
              {inventoryList.slice(0, 6).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: Number(item.available_stock || 0) < 20 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid transparent' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>{item.product_name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{item.sku}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: Number(item.available_stock || 0) < 20 ? '#f87171' : '#34d399', fontFamily: 'var(--font-mono)' }}>
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
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#818cf8" /> Order Processing Queue
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Recent orders requiring admin action
            </p>

            {/* Status Summary Bar */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {[
                { label: 'Created', count: stats.createdOrders, color: '#facc15' },
                { label: 'Confirmed', count: stats.confirmedOrders, color: '#60a5fa' },
                { label: 'Reserved', count: stats.reservedOrders, color: '#a78bfa' },
                { label: 'Dispatched', count: stats.dispatchedOrders, color: '#34d399' },
                { label: 'Cancelled', count: stats.cancelledOrders, color: '#f87171' },
              ].map((s, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px',
                  background: 'rgba(255, 255, 255, 0.03)', borderRadius: '20px', fontSize: '11px', fontWeight: 600
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
                  padding: '10px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)'
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', fontFamily: 'var(--font-mono)' }}>
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
        <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid #818cf8' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} color="#818cf8" /> Admin Workflow Pipeline
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { step: '1. Confirm Orders', desc: 'Review new sales orders from Sales team, validate line items, and approve for stock reservation.', icon: ShieldCheck, route: 'orders', tab: 'orders', color: '#60a5fa' },
              { step: '2. Reserve Inventory', desc: 'Allocate physical stock to confirmed orders. Check availability (Physical - Reserved) before locking.', icon: Package, route: 'orders', tab: 'inventory', color: '#a78bfa' },
              { step: '3. Process Dispatch', desc: 'Execute final shipment. Deducts both physical and reserved stock. Generate dispatch confirmation.', icon: Truck, route: 'orders', tab: 'dispatches', color: '#34d399' },
            ].map((item, idx) => (
              <div key={idx} onClick={() => onNavigate(item.route, item.tab)} style={{
                padding: '20px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'var(--transition)',
                borderTop: `3px solid ${item.color}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <item.icon size={20} color={item.color} />
                  <span style={{ fontWeight: 700, fontSize: '14px', color: '#ffffff' }}>{item.step}</span>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{item.desc}</p>
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
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 182, 212, 0.15))',
        border: '1px solid rgba(16, 185, 129, 0.4)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 32px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <Target size={16} /> 💼 SALES REPRESENTATIVE WORKSPACE
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>
            Sales Pipeline Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
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
        <KpiCard icon={FileText} label="Enquiries Captured" value={stats.enquiries} subtitle="Active prospect requests" iconBg="rgba(99, 102, 241, 0.15)" iconColor="#818cf8" accentColor="#a5b4fc" />
        <KpiCard icon={Receipt} label="Quotations Sent" value={stats.quotations} subtitle={`${stats.acceptedQuotations} accepted · ${stats.rejectedQuotations} rejected`} iconBg="rgba(6, 182, 212, 0.15)" iconColor="#22d3ee" accentColor="#67e8f9" />
        <KpiCard icon={Target} label="Conversion Rate" value={`${conversionRate}%`} subtitle={`${stats.acceptedQuotations} of ${stats.quotations} quotes won`} iconBg="rgba(16, 185, 129, 0.15)" iconColor="#34d399" accentColor="#6ee7b7" />
        <KpiCard icon={Briefcase} label="Orders Created" value={stats.orders} subtitle={`${stats.dispatchedOrders} shipped · ${stats.cancelledOrders} lost`} iconBg="rgba(245, 158, 11, 0.15)" iconColor="#f59e0b" accentColor="#fbbf24" />
      </div>

      {/* ─── SALES BOTTOM GRID: Pipeline + Recent Quotes ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>

        {/* Conversion Funnel */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="#34d399" /> Sales Conversion Funnel
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Your enquiry-to-order pipeline progression
          </p>

          {/* Funnel Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Enquiries Received', value: stats.enquiries, max: Math.max(stats.enquiries, 1), color: '#818cf8', icon: FileText },
              { label: 'Quotations Generated', value: stats.quotations, max: Math.max(stats.enquiries, 1), color: '#22d3ee', icon: Receipt },
              { label: 'Quotations Accepted', value: stats.acceptedQuotations, max: Math.max(stats.enquiries, 1), color: '#34d399', icon: CheckCircle2 },
              { label: 'Orders Converted', value: stats.orders, max: Math.max(stats.enquiries, 1), color: '#f59e0b', icon: Briefcase },
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
                  <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
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
            marginTop: '20px', padding: '16px', background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-md)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>QUOTE-TO-ORDER RATE</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {conversionRate}%
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>DEALS WON</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {stats.acceptedQuotations}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Quotations */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={18} color="#22d3ee" /> Recent Quotations
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Latest quotations you've created and their statuses
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '310px', overflowY: 'auto' }}>
            {quotationList.map((q, idx) => (
              <div key={idx} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)',
                border: q.status === 'ACCEPTED' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid transparent'
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', fontFamily: 'var(--font-mono)' }}>
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
      <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid #34d399' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} color="#34d399" /> Your Sales Workflow
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { step: '1. Capture Enquiry', desc: 'Log customer product requirements, pricing expectations, and contact information. Start the sales journey.', icon: FileText, route: 'enquiries', tab: null, color: '#818cf8' },
            { step: '2. Build Quotation', desc: 'Create itemized quotes with product pricing, tax calculations, and discounts. Send for customer acceptance.', icon: Receipt, route: 'quotations', tab: null, color: '#22d3ee' },
            { step: '3. Convert to Order', desc: 'Once the customer accepts your quotation, convert it into a formal Sales Order for Admin fulfillment.', icon: Briefcase, route: 'orders', tab: 'orders', color: '#34d399' },
          ].map((item, idx) => (
            <div key={idx} onClick={() => onNavigate(item.route, item.tab)} style={{
              padding: '20px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'var(--transition)',
              borderTop: `3px solid ${item.color}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <item.icon size={20} color={item.color} />
                <span style={{ fontWeight: 700, fontSize: '14px', color: '#ffffff' }}>{item.step}</span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
