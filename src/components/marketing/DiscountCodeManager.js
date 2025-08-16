import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useToastNotification } from '../../hooks/useToastNotification';

function DiscountCodeManager({ currentUser, setPage }) {
  const [loading, setLoading] = useState(true);
  const [discountCodes, setDiscountCodes] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, expired, used_up

  const { showSuccess, showError } = useToastNotification();

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    applicable_plans: ['premium', 'pro'],
    minimum_amount: '',
    maximum_discount: '',
    usage_limit: '',
    usage_limit_per_user: 1,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    campaign_name: ''
  });

  useEffect(() => {
    if (currentUser?.role === 'super-admin' || currentUser?.role === 'admin') {
      fetchDiscountCodes();
    }
  }, [currentUser, filter]);

  const fetchDiscountCodes = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('discount_codes')
        .select(`
          *,
          discount_code_usage(count)
        `)
        .order('created_at', { ascending: false });

      if (filter === 'active') {
        query = query
          .eq('is_active', true)
          .lte('valid_from', new Date().toISOString())
          .or('valid_until.is.null,valid_until.gte.' + new Date().toISOString());
      } else if (filter === 'expired') {
        query = query.lt('valid_until', new Date().toISOString());
      } else if (filter === 'used_up') {
        query = query.not('usage_limit', 'is', null);
        // Will filter used up codes in the component
      }

      const { data, error } = await query;

      if (error) throw error;
      
      let filteredData = data || [];
      if (filter === 'used_up') {
        filteredData = filteredData.filter(code => 
          code.usage_limit && code.current_usage >= code.usage_limit
        );
      }

      setDiscountCodes(filteredData);
    } catch (err) {
      console.error('Error fetching discount codes:', err);
      showError('Failed to load discount codes');
    } finally {
      setLoading(false);
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const codeData = {
        ...formData,
        discount_value: parseFloat(formData.discount_value),
        minimum_amount: formData.minimum_amount ? parseFloat(formData.minimum_amount) : 0,
        maximum_discount: formData.maximum_discount ? parseFloat(formData.maximum_discount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        usage_limit_per_user: parseInt(formData.usage_limit_per_user),
        created_by: currentUser.id,
        valid_until: formData.valid_until || null
      };

      let result;
      if (editingCode) {
        const { error } = await supabase
          .from('discount_codes')
          .update(codeData)
          .eq('id', editingCode.id);
        
        if (error) throw error;
        result = 'updated';
      } else {
        const { error } = await supabase
          .from('discount_codes')
          .insert([codeData]);
        
        if (error) throw error;
        result = 'created';
      }

      showSuccess(`Discount code ${result} successfully!`);
      setShowCreateModal(false);
      setEditingCode(null);
      resetForm();
      fetchDiscountCodes();
    } catch (err) {
      console.error('Error saving discount code:', err);
      showError(`Failed to ${editingCode ? 'update' : 'create'} discount code`);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      applicable_plans: ['premium', 'pro'],
      minimum_amount: '',
      maximum_discount: '',
      usage_limit: '',
      usage_limit_per_user: 1,
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: '',
      campaign_name: ''
    });
  };

  const handleEdit = (code) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      name: code.name,
      description: code.description || '',
      discount_type: code.discount_type,
      discount_value: code.discount_value.toString(),
      applicable_plans: code.applicable_plans,
      minimum_amount: code.minimum_amount?.toString() || '',
      maximum_discount: code.maximum_discount?.toString() || '',
      usage_limit: code.usage_limit?.toString() || '',
      usage_limit_per_user: code.usage_limit_per_user,
      valid_from: code.valid_from?.split('T')[0] || '',
      valid_until: code.valid_until?.split('T')[0] || '',
      campaign_name: code.campaign_name || ''
    });
    setShowCreateModal(true);
  };

  const handleToggleActive = async (code) => {
    try {
      const { error } = await supabase
        .from('discount_codes')
        .update({ is_active: !code.is_active })
        .eq('id', code.id);

      if (error) throw error;

      showSuccess(`Discount code ${!code.is_active ? 'activated' : 'deactivated'}`);
      fetchDiscountCodes();
    } catch (err) {
      console.error('Error toggling discount code:', err);
      showError('Failed to update discount code status');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZM', {
      style: 'currency',
      currency: 'ZMW'
    }).format(amount || 0);
  };

  const getStatusColor = (code) => {
    if (!code.is_active) return '#6b7280';
    
    const now = new Date();
    const validFrom = new Date(code.valid_from);
    const validUntil = code.valid_until ? new Date(code.valid_until) : null;
    
    if (now < validFrom) return '#f59e0b'; // Not yet active
    if (validUntil && now > validUntil) return '#ef4444'; // Expired
    if (code.usage_limit && code.current_usage >= code.usage_limit) return '#ef4444'; // Used up
    
    return '#10b981'; // Active
  };

  const getStatusText = (code) => {
    if (!code.is_active) return 'Inactive';
    
    const now = new Date();
    const validFrom = new Date(code.valid_from);
    const validUntil = code.valid_until ? new Date(code.valid_until) : null;
    
    if (now < validFrom) return 'Scheduled';
    if (validUntil && now > validUntil) return 'Expired';
    if (code.usage_limit && code.current_usage >= code.usage_limit) return 'Used Up';
    
    return 'Active';
  };

  if (!currentUser || (currentUser.role !== 'super-admin' && currentUser.role !== 'admin')) {
    return (
      <div className="main-container">
        <div className="card">
          <h3>Access Denied</h3>
          <p>You don't have permission to manage discount codes.</p>
          <button onClick={() => setPage('dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <header className="main-header">
        <h2>Discount Code Manager</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}
          >
            <option value="all">All Codes</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="used_up">Used Up</option>
          </select>
          <button
            onClick={() => {
              resetForm();
              setEditingCode(null);
              setShowCreateModal(true);
            }}
            style={{ width: 'auto', padding: '0.75rem 1.5rem', background: '#10b981' }}
          >
            Create Code
          </button>
          <button className="back-button" onClick={() => setPage('super-admin')}>
            Back to Admin
          </button>
        </div>
      </header>

      <div className="content-body">
        {loading ? (
          <div className="card">
            <p>Loading discount codes...</p>
          </div>
        ) : (
          <div className="card">
            <h3>Discount Codes ({discountCodes.length})</h3>
            
            {discountCodes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎫</div>
                <p>No discount codes found.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  style={{ width: 'auto', padding: '0.75rem 1.5rem', background: '#10b981' }}
                >
                  Create Your First Code
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Code</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Discount</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Usage</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Valid Until</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discountCodes.map((code) => (
                      <tr key={code.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '1rem' }}>
                            {code.code}
                          </div>
                          {code.campaign_name && (
                            <div style={{ fontSize: '0.75rem', color: '#666' }}>
                              Campaign: {code.campaign_name}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: 600 }}>{code.name}</div>
                          {code.description && (
                            <div style={{ fontSize: '0.875rem', color: '#666' }}>
                              {code.description}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <div style={{ fontWeight: 600 }}>
                            {code.discount_type === 'percentage' 
                              ? `${code.discount_value}%`
                              : formatCurrency(code.discount_value)
                            }
                          </div>
                          {code.minimum_amount > 0 && (
                            <div style={{ fontSize: '0.75rem', color: '#666' }}>
                              Min: {formatCurrency(code.minimum_amount)}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <div style={{ fontWeight: 600 }}>
                            {code.current_usage || 0}
                            {code.usage_limit && ` / ${code.usage_limit}`}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#666' }}>
                            {code.usage_limit ? 'Limited' : 'Unlimited'}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          {code.valid_until ? (
                            <div>
                              <div style={{ fontWeight: 600 }}>
                                {new Date(code.valid_until).toLocaleDateString()}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                {Math.ceil((new Date(code.valid_until) - new Date()) / (1000 * 60 * 60 * 24))} days
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: '#666' }}>No expiry</span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: getStatusColor(code),
                              color: 'white'
                            }}
                          >
                            {getStatusText(code)}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleEdit(code)}
                              style={{
                                width: 'auto',
                                padding: '0.5rem 1rem',
                                background: '#3b82f6',
                                fontSize: '0.75rem'
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleActive(code)}
                              style={{
                                width: 'auto',
                                padding: '0.5rem 1rem',
                                background: code.is_active ? '#ef4444' : '#10b981',
                                fontSize: '0.75rem'
                              }}
                            >
                              {code.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>
              {editingCode ? 'Edit Discount Code' : 'Create Discount Code'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Code *</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      placeholder="DISCOUNT20"
                      required
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, code: generateRandomCode()})}
                      style={{
                        width: 'auto',
                        padding: '0.5rem 1rem',
                        background: '#6b7280',
                        fontSize: '0.875rem'
                      }}
                    >
                      Generate
                    </button>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Discount Type *</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({...formData, discount_type: e.target.value})}
                    required
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed_amount">Fixed Amount</option>
                    <option value="free_trial">Free Trial</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="20% Off Premium Plans"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Limited time offer for new users"
                  rows={2}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>
                    Discount Value * 
                    {formData.discount_type === 'percentage' ? '(%)' : '(ZMW)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={formData.discount_type === 'percentage' ? '100' : undefined}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
                    required
                  />
                </div>

                {formData.discount_type === 'percentage' && (
                  <div className="form-group">
                    <label>Maximum Discount (ZMW)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.maximum_discount}
                      onChange={(e) => setFormData({...formData, maximum_discount: e.target.value})}
                      placeholder="Optional cap"
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Minimum Amount (ZMW)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.minimum_amount}
                    onChange={(e) => setFormData({...formData, minimum_amount: e.target.value})}
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label>Usage Limit Per User</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usage_limit_per_user}
                    onChange={(e) => setFormData({...formData, usage_limit_per_user: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Total Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({...formData, usage_limit: e.target.value})}
                    placeholder="Unlimited"
                  />
                </div>

                <div className="form-group">
                  <label>Valid From *</label>
                  <input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Valid Until</label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                    min={formData.valid_from}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Campaign Name</label>
                <input
                  type="text"
                  value={formData.campaign_name}
                  onChange={(e) => setFormData({...formData, campaign_name: e.target.value})}
                  placeholder="Black Friday 2024"
                />
              </div>

              <div className="form-group">
                <label>Applicable Plans</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {['premium', 'pro'].map(plan => (
                    <label key={plan} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={formData.applicable_plans.includes(plan)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              applicable_plans: [...formData.applicable_plans, plan]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              applicable_plans: formData.applicable_plans.filter(p => p !== plan)
                            });
                          }
                        }}
                      />
                      {plan.charAt(0).toUpperCase() + plan.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingCode(null);
                    resetForm();
                  }}
                  style={{
                    width: 'auto',
                    padding: '0.75rem 1.5rem',
                    background: '#6b7280'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    width: 'auto',
                    padding: '0.75rem 1.5rem',
                    background: '#10b981'
                  }}
                >
                  {editingCode ? 'Update Code' : 'Create Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DiscountCodeManager;