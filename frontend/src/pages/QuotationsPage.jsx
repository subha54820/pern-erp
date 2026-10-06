import { useState, useEffect } from 'react';
import { 
  Plus, 
  Eye, 
  X, 
  Trash2, 
  Check, 
  XCircle, 
  ArrowRight, 
  Receipt, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  DollarSign
} from 'lucide-react';
import api from '../api';

export default function QuotationsPage({ user }) {
  const [quotations, setQuotations] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Create form state
  const [enquiryId, setEnquiryId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [taxPercent, setTaxPercent] = useState(18);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [items, setItems] = useState([{ product_id: '', quantity: 1, unit_price: 0, discount_percent: 0 }]);

  useEffect(() => { 
    fetchData(); 
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [quoteRes, enqRes, custRes, prodRes] = await Promise.all([
        api.get('/quotations'),
        api.get('/enquiries'),
        api.get('/customers'),
        api.get('/products'),
      ]);
      setQuotations(quoteRes.data.data || []);
      setEnquiries(enqRes.data.data || []);
      setCustomers(custRes.data.data || []);
      setProducts(prodRes.data.data || []);
    } catch (err) {
      setAlert({ type: 'error', msg: 'Failed to fetch quotation records.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEnquirySelect = async (eId) => {
    setEnquiryId(eId);
    if (!eId) return;
    try {
      const res = await api.get(`/enquiries/${eId}`);
      const enq = res.data.data;
      if (enq) {
        setCustomerId(enq.customer_id);
        if (enq.items && enq.items.length > 0) {
          setItems(enq.items.map(it => {
            const prod = products.find(p => p.id === it.product_id);
            return {
              product_id: it.product_id,
              quantity: it.quantity,
              unit_price: Number(it.target_price) || Number(prod?.base_price) || 0,
              discount_percent: 0,
            };
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleProductSelect = (idx, pId) => {
    const prod = products.find(p => p.id === parseInt(pId));
    const updated = [...items];
    updated[idx].product_id = pId;
    if (prod) updated[idx].unit_price = Number(prod.base_price);
    setItems(updated);
  };

  const addItem = () => setItems([...items, { product_id: '', quantity: 1, unit_price: 0, discount_percent: 0 }]);
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx, field, value) => {
    const updated = [...items];
    updated[idx][field] = field === 'product_id' ? value : Number(value);
    setItems(updated);
  };

  // Live total calculations
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, it) => sum + ((Number(it.quantity) || 0) * (Number(it.unit_price) || 0)), 0);
    const discountAmount = (subtotal * (Number(discountPercent) || 0)) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * (Number(taxPercent) || 0)) / 100;
    const grandTotal = taxableAmount + taxAmount;
    return { subtotal, discountAmount, taxableAmount, taxAmount, grandTotal };
  };

  const totals = calculateTotals();

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const validItems = items.filter(i => i.product_id && i.quantity > 0);
      if (!customerId || validItems.length === 0) {
        setAlert({ type: 'error', msg: 'Select a customer and add at least one line item.' });
        return;
      }
      await api.post('/quotations', {
        enquiry_id: enquiryId ? parseInt(enquiryId) : null,
        customer_id: parseInt(customerId),
        valid_until: validUntil || null,
        tax_percent: Number(taxPercent),
        discount_percent: Number(discountPercent),
        items: validItems,
      });
      setAlert({ type: 'success', msg: 'Quotation created successfully!' });
      setShowCreate(false);
      fetchData();
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.message || 'Failed to create quotation.' });
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/quotations/${id}/status`, { status });
      setAlert({ type: 'success', msg: `Quotation status updated to ${status}` });
      fetchData();
      if (showDetail && showDetail.id === id) {
        viewDetail(id);
      }
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.message || 'Failed to update status.' });
    }
  };

  const handleConvertToOrder = async (id) => {
    try {
      const res = await api.post(`/quotations/${id}/convert-to-order`);
      setAlert({ type: 'success', msg: `Sales Order created successfully! (Order #${res.data.data.order_number})` });
      fetchData();
      if (showDetail && showDetail.id === id) {
        viewDetail(id);
      }
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.message || 'Failed to convert quotation.' });
    }
  };

  const viewDetail = async (id) => {
    try {
      const res = await api.get(`/quotations/${id}`);
      setShowDetail(res.data.data);
    } catch (err) {
      setAlert({ type: 'error', msg: 'Failed to fetch quotation details.' });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return <span className="badge badge-green"><span className="badge-dot" /> ACCEPTED</span>;
      case 'REJECTED':
        return <span className="badge badge-red"><span className="badge-dot" /> REJECTED</span>;
      case 'CONVERTED':
        return <span className="badge badge-purple"><span className="badge-dot" /> CONVERTED</span>;
      case 'PENDING':
        return <span className="badge badge-amber"><span className="badge-dot" /> PENDING</span>;
      default:
        return <span className="badge badge-gray"><span className="badge-dot" /> {status}</span>;
    }
  };

  const filteredQuotes = quotations.filter(q => {
    const matchesSearch = 
      (q.quotation_number && q.quotation_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (q.customer_name && q.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === 'ALL' || q.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      {alert && (
        <div style={{
          padding: '12px 18px',
          marginBottom: '20px',
          borderRadius: 'var(--radius-sm)',
          background: alert.type === 'success' ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${alert.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          color: alert.type === 'success' ? '#065f46' : '#991b1b',
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
            <Receipt size={24} color="#2563eb" /> Quotation Management
          </h1>
          <p>Generate formal quotes with tax/discounts and convert accepted quotes to Sales Orders.</p>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => { setEnquiryId(''); setShowCreate(true); }}>
            <Plus size={16} /> New Quotation
          </button>
        </div>
      </div>

      {/* Main Glass Table */}
      <div className="glass-panel">
        <div className="filter-bar">
          <div className="search-input-group">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search by quote # or customer..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-pills">
            {['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'CONVERTED'].map((st) => (
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
                <th>Quote Number</th>
                <th>Customer</th>
                <th>Enquiry Link</th>
                <th>Grand Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No quotations found matching selected filter.
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((q) => (
                  <tr key={q.id}>
                    <td className="code-cell">{q.quotation_number}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>{q.customer_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{q.customer_city || 'HQ'}</div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {q.enquiry_number || 'Direct Quote'}
                    </td>
                    <td className="price-cell">₹{Number(q.total_amount).toLocaleString()}</td>
                    <td>{getStatusBadge(q.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => viewDetail(q.id)}>
                          <Eye size={13} /> View
                        </button>

                        {q.status === 'PENDING' && (
                          <>
                            <button 
                              className="btn btn-emerald btn-sm" 
                              title="Accept Quote"
                              onClick={() => handleStatusChange(q.id, 'ACCEPTED')}
                            >
                              <Check size={13} /> Accept
                            </button>
                            <button 
                              className="btn btn-danger btn-sm" 
                              title="Reject Quote"
                              onClick={() => handleStatusChange(q.id, 'REJECTED')}
                            >
                              <XCircle size={13} />
                            </button>
                          </>
                        )}

                        {q.status === 'ACCEPTED' && (
                          <button 
                            className="btn btn-primary btn-sm" 
                            onClick={() => handleConvertToOrder(q.id)}
                            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                          >
                            <ArrowRight size={13} /> Convert to Order
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

      {/* Create Quotation Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Receipt size={18} color="#06b6d4" /> Create Quotation</h3>
              <button className="btn-close" onClick={() => setShowCreate(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Link Enquiry (Optional)</label>
                    <select 
                      className="form-control" 
                      value={enquiryId} 
                      onChange={(e) => handleEnquirySelect(e.target.value)}
                    >
                      <option value="">Direct Quotation (No enquiry)</option>
                      {enquiries.map(enq => (
                        <option key={enq.id} value={enq.id}>
                          {enq.enquiry_number} - {enq.customer_name} ({enq.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Customer *</label>
                    <select 
                      className="form-control" 
                      value={customerId} 
                      onChange={(e) => setCustomerId(e.target.value)}
                      required
                    >
                      <option value="">Select customer...</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.company_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Valid Until</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">GST Tax (%)</label>
                    <input 
                      type="number" 
                      min="0" 
                      className="form-control" 
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Discount (%)</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="100" 
                      className="form-control" 
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                    />
                  </div>
                </div>

                {/* Line Items */}
                <div className="item-builder-header">
                  <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Itemized Pricing
                  </span>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>
                    <Plus size={14} /> Add Line Item
                  </button>
                </div>

                {items.map((it, idx) => (
                  <div key={idx} className="item-row">
                    <div>
                      <select 
                        className="form-control"
                        value={it.product_id}
                        onChange={(e) => handleProductSelect(idx, e.target.value)}
                        required
                      >
                        <option value="">Select product...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku}) - MRP ₹{p.base_price}</option>
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
                        placeholder="Unit Price ₹" 
                        value={it.unit_price}
                        onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                        required
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

                {/* Real-time Calculation Breakdown Slip */}
                <div className="quote-summary-card">
                  <div className="quote-summary-row">
                    <span>Subtotal</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>₹{totals.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="quote-summary-row">
                    <span>Discount ({discountPercent}%)</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#dc2626' }}>-₹{totals.discountAmount.toLocaleString()}</span>
                  </div>
                  <div className="quote-summary-row">
                    <span>Taxable Base</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>₹{totals.taxableAmount.toLocaleString()}</span>
                  </div>
                  <div className="quote-summary-row">
                    <span>GST ({taxPercent}%)</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#059669' }}>+₹{totals.taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="quote-summary-row total">
                    <span>Net Grand Total</span>
                    <span className="price">₹{totals.grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Generate Quotation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Receipt size={18} color="#2563eb" /> Quotation #{showDetail.quotation_number}</h3>
              <button className="btn-close" onClick={() => setShowDetail(null)}><X size={18} /></button>
            </div>

            <div className="modal-body">
              <div className="invoice-slip">
                <div className="slip-header">
                  <div>
                    <div className="slip-title">Fundsroom ERP Commercial Quote</div>
                    <div className="slip-id">Reference: {showDetail.quotation_number}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {getStatusBadge(showDetail.status)}
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Date: {new Date(showDetail.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Billed To</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{showDetail.customer_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{showDetail.customer_email}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{showDetail.customer_address}</div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Issued By</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{showDetail.created_by_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Valid Until: {showDetail.valid_until ? new Date(showDetail.valid_until).toLocaleDateString() : '30 Days'}</div>
                  </div>
                </div>

                <table className="erp-table" style={{ marginBottom: '16px' }}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(showDetail.items || []).map((it, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{it.product_name}</td>
                        <td className="code-cell">{it.sku}</td>
                        <td>{it.quantity}</td>
                        <td className="price-cell">₹{Number(it.unit_price).toLocaleString()}</td>
                        <td className="price-cell" style={{ textAlign: 'right' }}>₹{Number(it.total_price).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: '280px' }}>
                    <div className="quote-summary-row">
                      <span>Subtotal</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>₹{Number(showDetail.subtotal).toLocaleString()}</span>
                    </div>
                    <div className="quote-summary-row">
                      <span>Tax (GST)</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>₹{Number(showDetail.tax_amount).toLocaleString()}</span>
                    </div>
                    <div className="quote-summary-row total">
                      <span>Total Amount</span>
                      <span className="price">₹{Number(showDetail.total_amount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {showDetail.status === 'PENDING' && (
                <>
                  <button className="btn btn-danger" onClick={() => handleStatusChange(showDetail.id, 'REJECTED')}>
                    <XCircle size={15} /> Reject
                  </button>
                  <button className="btn btn-emerald" onClick={() => handleStatusChange(showDetail.id, 'ACCEPTED')}>
                    <Check size={15} /> Accept Quote
                  </button>
                </>
              )}

              {showDetail.status === 'ACCEPTED' && (
                <button className="btn btn-primary" onClick={() => handleConvertToOrder(showDetail.id)}>
                  <ArrowRight size={15} /> Convert to Sales Order
                </button>
              )}

              <button className="btn btn-secondary" onClick={() => setShowDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
