import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Eye, 
  X, 
  Trash2, 
  FileText, 
  User, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  ChevronRight
} from 'lucide-react';
import api from '../api';

export default function EnquiriesPage({ user }) {
  const [enquiries, setEnquiries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity: 1, target_price: 0 }]);

  useEffect(() => { 
    fetchData(); 
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [enqRes, custRes, prodRes] = await Promise.all([
        api.get('/enquiries'),
        api.get('/customers'),
        api.get('/products'),
      ]);
      setEnquiries(enqRes.data.data || []);
      setCustomers(custRes.data.data || []);
      setProducts(prodRes.data.data || []);
    } catch (err) {
      setAlert({ type: 'error', msg: 'Failed to fetch enquiries data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const validItems = items.filter(i => i.product_id && i.quantity > 0);
      if (!customerId || validItems.length === 0) {
        setAlert({ type: 'error', msg: 'Please select a customer and add at least one product.' });
        return;
      }
      await api.post('/enquiries', { customer_id: parseInt(customerId), notes, items: validItems });
      setAlert({ type: 'success', msg: 'Enquiry created successfully!' });
      setShowCreate(false);
      resetForm();
      fetchData();
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.message || 'Failed to create enquiry.' });
    }
  };

  const viewDetail = async (id) => {
    try {
      const res = await api.get(`/enquiries/${id}`);
      setShowDetail(res.data.data);
    } catch (err) {
      setAlert({ type: 'error', msg: 'Failed to fetch enquiry details.' });
    }
  };

  const resetForm = () => {
    setCustomerId('');
    setNotes('');
    setItems([{ product_id: '', quantity: 1, target_price: 0 }]);
  };

  const addItem = () => setItems([...items, { product_id: '', quantity: 1, target_price: 0 }]);
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx, field, value) => {
    const updated = [...items];
    updated[idx][field] = field === 'product_id' ? value : Number(value);
    setItems(updated);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'QUOTED':
        return <span className="badge badge-green"><span className="badge-dot" /> QUOTED</span>;
      case 'SUBMITTED':
        return <span className="badge badge-blue"><span className="badge-dot" /> SUBMITTED</span>;
      case 'CANCELLED':
        return <span className="badge badge-red"><span className="badge-dot" /> CANCELLED</span>;
      default:
        return <span className="badge badge-gray"><span className="badge-dot" /> {status || 'DRAFT'}</span>;
    }
  };

  const filteredEnquiries = enquiries.filter(enq => {
    const matchesSearch = 
      (enq.enquiry_number && enq.enquiry_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (enq.customer_name && enq.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === 'ALL' || enq.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

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

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>
            <FileText size={24} color="#818cf8" /> Customer Enquiries
          </h1>
          <p>Initiate customer requirements and generate line-item specifications.</p>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreate(true); }}>
            <Plus size={16} /> New Enquiry
          </button>
        </div>
      </div>

      {/* Table Container with Filter Bar */}
      <div className="glass-panel">
        <div className="filter-bar">
          <div className="search-input-group">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search by enquiry # or customer name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-pills">
            {['ALL', 'SUBMITTED', 'QUOTED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                className={`filter-pill ${filterStatus === st ? 'active' : ''}`}
                onClick={() => setFilterStatus(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Enquiry ID</th>
                <th>Customer</th>
                <th>Created By</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnquiries.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No customer enquiries found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredEnquiries.map((enq) => (
                  <tr key={enq.id}>
                    <td className="code-cell">{enq.enquiry_number}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>{enq.customer_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{enq.customer_email || 'Direct Contact'}</div>
                    </td>
                    <td>{enq.created_by_name || 'Sales Rep'}</td>
                    <td>{getStatusBadge(enq.status)}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {new Date(enq.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => viewDetail(enq.id)}>
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Enquiry Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Plus size={18} color="#818cf8" /> Create New Customer Enquiry</h3>
              <button className="btn-close" onClick={() => setShowCreate(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Select Customer *</label>
                    <select 
                      className="form-control" 
                      value={customerId} 
                      onChange={(e) => setCustomerId(e.target.value)}
                      required
                    >
                      <option value="">Choose registered customer...</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.company_name} ({c.contact_person})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notes & Specifications</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Urgent Q4 requirement..." 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="item-builder-header">
                  <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Requested Products
                  </span>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>
                    <Plus size={14} /> Add Item Row
                  </button>
                </div>

                {items.map((it, idx) => (
                  <div key={idx} className="item-row">
                    <div>
                      <select 
                        className="form-control"
                        value={it.product_id}
                        onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
                        required
                      >
                        <option value="">Select product...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku}) - Base ₹{p.base_price}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input 
                        type="number" 
                        min="1" 
                        className="form-control" 
                        placeholder="Qty" 
                        value={it.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <input 
                        type="number" 
                        min="0" 
                        className="form-control" 
                        placeholder="Target Price ₹" 
                        value={it.target_price}
                        onChange={(e) => updateItem(idx, 'target_price', e.target.value)}
                      />
                    </div>
                    <div>
                      {items.length > 1 && (
                        <button 
                          type="button" 
                          className="btn btn-danger btn-sm" 
                          style={{ padding: '8px' }} 
                          onClick={() => removeItem(idx)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Enquiry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail View Modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FileText size={18} color="#818cf8" /> Enquiry #{showDetail.enquiry_number}</h3>
              <button className="btn-close" onClick={() => setShowDetail(null)}><X size={18} /></button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>{showDetail.customer_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{showDetail.customer_email}</div>
                </div>

                <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</div>
                  <div style={{ marginTop: '4px' }}>{getStatusBadge(showDetail.status)}</div>
                </div>

                <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Created Date</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginTop: '4px' }}>
                    {new Date(showDetail.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {showDetail.notes && (
                <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '13px' }}>
                  <strong style={{ color: '#a5b4fc' }}>Notes: </strong>{showDetail.notes}
                </div>
              )}

              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Quantity</th>
                    <th style={{ textAlign: 'right' }}>Target Price</th>
                  </tr>
                </thead>
                <tbody>
                  {(showDetail.items || []).map((it, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, color: '#ffffff' }}>{it.product_name}</td>
                      <td className="code-cell">{it.sku}</td>
                      <td>{it.quantity}</td>
                      <td className="price-cell" style={{ textAlign: 'right' }}>₹{Number(it.target_price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
