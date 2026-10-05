import { useState, useEffect } from 'react';
import { 
  Eye, 
  X, 
  CheckCircle, 
  Package, 
  Truck, 
  ShieldCheck, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle,
  FileCheck,
  Send,
  Layers,
  ArrowRight
} from 'lucide-react';
import api from '../api';

export default function OrdersPage({ user }) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'inventory' | 'dispatches'
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDispatchModal, setShowDispatchModal] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => { 
    fetchAllData(); 
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [ordRes, invRes, dispRes] = await Promise.all([
        api.get('/sales-orders'),
        api.get('/inventory'),
        api.get('/dispatches'),
      ]);
      setOrders(ordRes.data.data || []);
      setInventory(invRes.data.data || []);
      setDispatches(dispRes.data.data || []);
    } catch (err) {
      setAlert({ type: 'error', msg: 'Failed to fetch sales order and inventory data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async (id) => {
    try {
      await api.patch(`/sales-orders/${id}/status`, { status: 'CONFIRMED' });
      setAlert({ type: 'success', msg: 'Sales Order confirmed successfully!' });
      fetchAllData();
      if (selectedOrder && selectedOrder.id === id) viewOrderDetail(id);
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.message || 'Failed to confirm order.' });
    }
  };

  const handleReserveStock = async (id) => {
    try {
      await api.post(`/sales-orders/${id}/reserve-stock`);
      setAlert({ type: 'success', msg: 'Stock reserved successfully for this order!' });
      fetchAllData();
      if (selectedOrder && selectedOrder.id === id) viewOrderDetail(id);
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.message || 'Failed to reserve stock. Check available quantity.' });
    }
  };

  const handleProcessDispatch = async (e) => {
    e.preventDefault();
    if (!showDispatchModal) return;
    try {
      await api.post('/dispatches', {
        sales_order_id: showDispatchModal.id,
        tracking_number: trackingNumber,
        notes: dispatchNotes,
      });
      setAlert({ type: 'success', msg: `Order #${showDispatchModal.order_number} successfully dispatched!` });
      setShowDispatchModal(null);
      setTrackingNumber('');
      setDispatchNotes('');
      fetchAllData();
      if (selectedOrder && selectedOrder.id === showDispatchModal.id) viewOrderDetail(showDispatchModal.id);
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.message || 'Dispatch failed. Insufficient physical stock.' });
    }
  };

  const viewOrderDetail = async (id) => {
    try {
      const res = await api.get(`/sales-orders/${id}`);
      setSelectedOrder(res.data.data);
    } catch (err) {
      setAlert({ type: 'error', msg: 'Failed to load order details.' });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="badge badge-blue"><span className="badge-dot" /> CONFIRMED</span>;
      case 'DISPATCHED':
        return <span className="badge badge-green"><span className="badge-dot" /> DISPATCHED</span>;
      case 'CANCELLED':
        return <span className="badge badge-red"><span className="badge-dot" /> CANCELLED</span>;
      default:
        return <span className="badge badge-amber"><span className="badge-dot" /> {status || 'PENDING'}</span>;
    }
  };

  const isAdmin = user.role === 'ADMIN';

  const filteredOrders = orders.filter(o => 
    (o.order_number && o.order_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (o.customer_name && o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredInventory = inventory.filter(i =>
    (i.product_name && i.product_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (i.sku && i.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      {alert && (
        <div style={{
          padding: '12px 20px',
          marginBottom: '20px',
          borderRadius: 'var(--radius-md)',
          background: alert.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
          border: `1px solid ${alert.type === 'success' ? '#10b981' : '#f43f5e'}`,
          color: alert.type === 'success' ? '#6ee7b7' : '#fda4af',
          fontSize: '13.5px',
          fontWeight: 600,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {alert.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{alert.msg}</span>
          </div>
          <X size={16} style={{ cursor: 'pointer' }} onClick={() => setAlert(null)} />
        </div>
      )}

      {/* Page Header with Tabs */}
      <div className="page-header">
        <div>
          <h1>
            <ShieldCheck size={24} color="#818cf8" /> Order Execution & Supply Chain
          </h1>
          <p>Fulfill confirmed orders, manage inventory allocations, and process dispatches.</p>
        </div>

        <div className="page-actions">
          <div className="filter-pills">
            <button 
              className={`filter-pill ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              Sales Orders ({orders.length})
            </button>
            <button 
              className={`filter-pill ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              Inventory Stock ({inventory.length})
            </button>
            <button 
              className={`filter-pill ${activeTab === 'dispatches' ? 'active' : ''}`}
              onClick={() => setActiveTab('dispatches')}
            >
              Dispatch Log ({dispatches.length})
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: Sales Orders */}
      {activeTab === 'orders' && (
        <div className="glass-panel">
          <div className="filter-bar">
            <div className="search-input-group">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search orders or customers..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Quote Ref</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No sales orders found. Convert an ACCEPTED quotation to create one.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(o => (
                    <tr key={o.id}>
                      <td className="code-cell">{o.order_number}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#ffffff' }}>{o.customer_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{o.customer_email || 'Verified Client'}</div>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{o.quotation_number}</td>
                      <td className="price-cell">₹{Number(o.total_amount).toLocaleString()}</td>
                      <td>{getStatusBadge(o.status)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => viewOrderDetail(o.id)}>
                            <Eye size={13} /> View
                          </button>

                          {isAdmin && o.status === 'PENDING' && (
                            <button className="btn btn-primary btn-sm" onClick={() => handleConfirmOrder(o.id)}>
                              <CheckCircle size={13} /> Confirm
                            </button>
                          )}

                          {isAdmin && (o.status === 'PENDING' || o.status === 'CONFIRMED') && (
                            <button className="btn btn-secondary btn-sm" onClick={() => handleReserveStock(o.id)} title="Reserve Stock in Inventory">
                              <Package size={13} /> Reserve Stock
                            </button>
                          )}

                          {isAdmin && (o.status === 'CONFIRMED' || o.status === 'PENDING') && (
                            <button 
                              className="btn btn-emerald btn-sm" 
                              onClick={() => {
                                setShowDispatchModal(o);
                                setTrackingNumber(`TRK-${Math.floor(100000 + Math.random() * 900000)}`);
                              }}
                            >
                              <Truck size={13} /> Dispatch
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Live Inventory Monitoring */}
      {activeTab === 'inventory' && (
        <div className="glass-panel">
          <div className="filter-bar">
            <div className="search-input-group">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search products by SKU or Name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Physical Stock</th>
                  <th>Reserved Stock</th>
                  <th>Available Stock</th>
                  <th>Stock Health Bar</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map(inv => {
                  const physical = Number(inv.physical_stock);
                  const reserved = Number(inv.reserved_stock);
                  const available = Number(inv.available_stock);
                  const pctReserved = physical > 0 ? Math.round((reserved / physical) * 100) : 0;

                  return (
                    <tr key={inv.product_id}>
                      <td style={{ fontWeight: 600, color: '#ffffff' }}>{inv.product_name}</td>
                      <td className="code-cell">{inv.sku}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{physical} units</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#f59e0b', fontWeight: 700 }}>{reserved} units</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#10b981', fontWeight: 800 }}>
                        {available} units
                      </td>
                      <td style={{ minWidth: '160px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{pctReserved}% Reserved</span>
                          <span>{100 - pctReserved}% Free</span>
                        </div>
                        <div className="stock-bar-wrap">
                          <div 
                            className={`stock-bar-fill ${pctReserved > 80 ? 'danger' : pctReserved > 50 ? 'warning' : ''}`}
                            style={{ width: `${Math.min(pctReserved, 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Dispatch Logs */}
      {activeTab === 'dispatches' && (
        <div className="glass-panel">
          <div className="table-responsive">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Dispatch ID</th>
                  <th>Order Ref</th>
                  <th>Tracking Number</th>
                  <th>Dispatched By</th>
                  <th>Dispatched At</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {dispatches.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No dispatches executed yet. Dispatches will deduct physical & reserved stock in real-time.
                    </td>
                  </tr>
                ) : (
                  dispatches.map(d => (
                    <tr key={d.id}>
                      <td className="code-cell">{d.dispatch_number}</td>
                      <td style={{ fontWeight: 600, color: '#a5b4fc' }}>{d.order_number}</td>
                      <td>
                        <span className="badge badge-purple" style={{ fontFamily: 'var(--font-mono)' }}>
                          {d.tracking_number || 'N/A'}
                        </span>
                      </td>
                      <td>{d.dispatched_by_name || 'Admin'}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                        {new Date(d.dispatched_at).toLocaleString()}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{d.notes || 'Standard Delivery'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Process Dispatch Modal */}
      {showDispatchModal && (
        <div className="modal-overlay" onClick={() => setShowDispatchModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Truck size={18} color="#10b981" /> Execute Dispatch #{showDispatchModal.order_number}</h3>
              <button className="btn-close" onClick={() => setShowDispatchModal(null)}><X size={18} /></button>
            </div>

            <form onSubmit={handleProcessDispatch}>
              <div className="modal-body">
                <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '12.5px', color: '#6ee7b7' }}>
                  ℹ️ Executing this dispatch will permanently deduct physical stock and reserved stock for all line items and mark order as <strong>DISPATCHED</strong>.
                </div>

                <div className="form-group">
                  <label className="form-label">Tracking / Consignment Number</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. TRK-9831248" 
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Dispatch / Logistics Notes</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Express Courier, Box 1/2" 
                    value={dispatchNotes}
                    onChange={(e) => setDispatchNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDispatchModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-emerald">Confirm & Dispatch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sales Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><ShieldCheck size={18} color="#818cf8" /> Order #{selectedOrder.order_number}</h3>
              <button className="btn-close" onClick={() => setSelectedOrder(null)}><X size={18} /></button>
            </div>

            <div className="modal-body">
              <div className="invoice-slip">
                <div className="slip-header">
                  <div>
                    <div className="slip-title">Official Sales Order Document</div>
                    <div className="slip-id">Order ID: {selectedOrder.order_number} | Quote Ref: {selectedOrder.quotation_number}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {getStatusBadge(selectedOrder.status)}
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Date: {new Date(selectedOrder.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>{selectedOrder.customer_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{selectedOrder.customer_email}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Order Net Value</div>
                    <div className="price-cell" style={{ fontSize: '20px', color: '#818cf8' }}>
                      ₹{Number(selectedOrder.total_amount).toLocaleString()}
                    </div>
                  </div>
                </div>

                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map((it, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, color: '#ffffff' }}>{it.product_name}</td>
                        <td className="code-cell">{it.sku}</td>
                        <td>{it.quantity}</td>
                        <td className="price-cell">₹{Number(it.unit_price).toLocaleString()}</td>
                        <td className="price-cell" style={{ textAlign: 'right' }}>₹{Number(it.total_price).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              {isAdmin && selectedOrder.status === 'PENDING' && (
                <button className="btn btn-primary" onClick={() => handleConfirmOrder(selectedOrder.id)}>
                  Confirm Order
                </button>
              )}
              {isAdmin && (selectedOrder.status === 'CONFIRMED' || selectedOrder.status === 'PENDING') && (
                <button 
                  className="btn btn-emerald"
                  onClick={() => {
                    setSelectedOrder(null);
                    setShowDispatchModal(selectedOrder);
                    setTrackingNumber(`TRK-${Math.floor(100000 + Math.random() * 900000)}`);
                  }}
                >
                  <Truck size={15} /> Process Dispatch
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
