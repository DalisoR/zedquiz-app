import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useToastNotification } from '../../hooks/useToastNotification';

function ReferralProgramManager({ currentUser, setPage }) {
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [activeTab, setActiveTab] = useState('programs'); // programs, referrals, analytics

  const { showSuccess, showError } = useToastNotification();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    referrer_reward_type: 'percentage',
    referrer_reward_value: '',
    referee_reward_type: 'percentage',
    referee_reward_value: '',
    minimum_referee_payment: '',
    reward_cap: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: ''
  });

  useEffect(() => {
    if (currentUser?.role === 'super-admin' || currentUser?.role === 'admin') {
      fetchData();
    }
  }, [currentUser, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch referral programs
      const { data: programsData, error: programsError } = await supabase
        .from('referral_program')
        .select('*')
        .order('created_at', { ascending: false });

      if (programsError) throw programsError;
      setPrograms(programsData || []);

      // Fetch referrals if on referrals tab
      if (activeTab === 'referrals') {
        const { data: referralsData, error: referralsError } = await supabase
          .from('referrals')
          .select(`
            *,
            referrer:referrer_id(full_name, email),
            referee:referee_id(full_name, email),
            referral_program(name)
          `)
          .order('referred_at', { ascending: false })
          .limit(100);

        if (referralsError) throw referralsError;
        setReferrals(referralsData || []);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      showError('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const programData = {
        ...formData,
        referrer_reward_value: parseFloat(formData.referrer_reward_value),
        referee_reward_value: parseFloat(formData.referee_reward_value),
        minimum_referee_payment: formData.minimum_referee_payment ? parseFloat(formData.minimum_referee_payment) : 0,
        reward_cap: formData.reward_cap ? parseFloat(formData.reward_cap) : null,
        valid_until: formData.valid_until || null
      };

      let result;
      if (editingProgram) {
        const { error } = await supabase
          .from('referral_program')
          .update(programData)
          .eq('id', editingProgram.id);
        
        if (error) throw error;
        result = 'updated';
      } else {
        const { error } = await supabase
          .from('referral_program')
          .insert([programData]);
        
        if (error) throw error;
        result = 'created';
      }

      showSuccess(`Referral program ${result} successfully!`);
      setShowCreateModal(false);
      setEditingProgram(null);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Error saving referral program:', err);
      showError(`Failed to ${editingProgram ? 'update' : 'create'} referral program`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      referrer_reward_type: 'percentage',
      referrer_reward_value: '',
      referee_reward_type: 'percentage',
      referee_reward_value: '',
      minimum_referee_payment: '',
      reward_cap: '',
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: ''
    });
  };

  const handleEdit = (program) => {
    setEditingProgram(program);
    setFormData({
      name: program.name,
      description: program.description || '',
      referrer_reward_type: program.referrer_reward_type,
      referrer_reward_value: program.referrer_reward_value.toString(),
      referee_reward_type: program.referee_reward_type,
      referee_reward_value: program.referee_reward_value.toString(),
      minimum_referee_payment: program.minimum_referee_payment?.toString() || '',
      reward_cap: program.reward_cap?.toString() || '',
      valid_from: program.valid_from?.split('T')[0] || '',
      valid_until: program.valid_until?.split('T')[0] || ''
    });
    setShowCreateModal(true);
  };

  const handleToggleActive = async (program) => {
    try {
      const { error } = await supabase
        .from('referral_program')
        .update({ is_active: !program.is_active })
        .eq('id', program.id);

      if (error) throw error;

      showSuccess(`Referral program ${!program.is_active ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (err) {
      console.error('Error toggling referral program:', err);
      showError('Failed to update referral program status');
    }
  };

  const formatReward = (type, value) => {
    switch (type) {
      case 'percentage':
        return `${value}%`;
      case 'fixed_amount':
        return `K${value}`;
      case 'free_months':
        return `${value} month${value !== 1 ? 's' : ''} free`;
      case 'points':
        return `${value} points`;
      default:
        return value;
    }
  };

  const getStatusColor = (program) => {
    if (!program.is_active) return '#6b7280';
    
    const now = new Date();
    const validFrom = new Date(program.valid_from);
    const validUntil = program.valid_until ? new Date(program.valid_until) : null;
    
    if (now < validFrom) return '#f59e0b';
    if (validUntil && now > validUntil) return '#ef4444';
    
    return '#10b981';
  };

  const getStatusText = (program) => {
    if (!program.is_active) return 'Inactive';
    
    const now = new Date();
    const validFrom = new Date(program.valid_from);
    const validUntil = program.valid_until ? new Date(program.valid_until) : null;
    
    if (now < validFrom) return 'Scheduled';
    if (validUntil && now > validUntil) return 'Expired';
    
    return 'Active';
  };

  const renderProgramsTab = () => (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>Referral Programs ({programs.length})</h3>
        <button
          onClick={() => {
            resetForm();
            setEditingProgram(null);
            setShowCreateModal(true);
          }}
          style={{ width: 'auto', padding: '0.75rem 1.5rem', background: '#10b981' }}
        >
          Create Program
        </button>
      </div>
      
      {programs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤝</div>
          <p>No referral programs found.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{ width: 'auto', padding: '0.75rem 1.5rem', background: '#10b981' }}
          >
            Create Your First Program
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {programs.map((program) => (
            <div
              key={program.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '1.5rem',
                background: 'white'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>
                    {program.name}
                  </h4>
                  {program.description && (
                    <p style={{ margin: '0 0 1rem 0', color: '#666' }}>
                      {program.description}
                    </p>
                  )}
                </div>
                <span
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: getStatusColor(program),
                    color: 'white'
                  }}
                >
                  {getStatusText(program)}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                    Referrer Reward
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>
                    {formatReward(program.referrer_reward_type, program.referrer_reward_value)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                    Referee Reward
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>
                    {formatReward(program.referee_reward_type, program.referee_reward_value)}
                  </div>
                </div>
                {program.minimum_referee_payment > 0 && (
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                      Minimum Payment
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>
                      K{program.minimum_referee_payment}
                    </div>
                  </div>
                )}
                {program.reward_cap && (
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                      Reward Cap
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>
                      K{program.reward_cap}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => handleEdit(program)}
                  style={{
                    width: 'auto',
                    padding: '0.5rem 1rem',
                    background: '#3b82f6',
                    fontSize: '0.875rem'
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggleActive(program)}
                  style={{
                    width: 'auto',
                    padding: '0.5rem 1rem',
                    background: program.is_active ? '#ef4444' : '#10b981',
                    fontSize: '0.875rem'
                  }}
                >
                  {program.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderReferralsTab = () => (
    <div className="card">
      <h3>Recent Referrals ({referrals.length})</h3>
      
      {referrals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
          <p>No referrals found.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Referrer</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Referee</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Program</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Rewards</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((referral) => (
                <tr key={referral.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ fontWeight: 600 }}>
                      {referral.referrer?.full_name || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      {referral.referrer?.email}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ fontWeight: 600 }}>
                      {referral.referee?.full_name || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      {referral.referee?.email}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ fontWeight: 600 }}>
                      {referral.referral_program?.name || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#666', fontFamily: 'monospace' }}>
                      {referral.referral_code}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: referral.status === 'completed' ? '#10b981' : 
                                   referral.status === 'rewarded' ? '#3b82f6' : '#f59e0b',
                        color: 'white'
                      }}
                    >
                      {referral.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {referral.status === 'rewarded' ? (
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                          K{referral.referrer_reward_amount}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                          K{referral.referee_reward_amount}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: '#666' }}>Pending</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem' }}>
                      {new Date(referral.referred_at).toLocaleDateString()}
                    </div>
                    {referral.completed_at && (
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>
                        Completed: {new Date(referral.completed_at).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  if (!currentUser || (currentUser.role !== 'super-admin' && currentUser.role !== 'admin')) {
    return (
      <div className="main-container">
        <div className="card">
          <h3>Access Denied</h3>
          <p>You don't have permission to manage referral programs.</p>
          <button onClick={() => setPage('dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <header className="main-header">
        <h2>Referral Program Manager</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="tabs">
            <button 
              className={`tab-button ${activeTab === 'programs' ? 'active' : ''}`}
              onClick={() => setActiveTab('programs')}
            >
              Programs
            </button>
            <button 
              className={`tab-button ${activeTab === 'referrals' ? 'active' : ''}`}
              onClick={() => setActiveTab('referrals')}
            >
              Referrals
            </button>
          </div>
          <button className="back-button" onClick={() => setPage('super-admin')}>
            Back to Admin
          </button>
        </div>
      </header>

      <div className="content-body">
        {loading ? (
          <div className="card">
            <p>Loading referral data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'programs' && renderProgramsTab()}
            {activeTab === 'referrals' && renderReferralsTab()}
          </>
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
              {editingProgram ? 'Edit Referral Program' : 'Create Referral Program'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Program Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Student Referral Program"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Refer friends and earn rewards when they subscribe"
                  rows={2}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#3b82f6' }}>Referrer Reward</h4>
                  <div className="form-group">
                    <label>Reward Type</label>
                    <select
                      value={formData.referrer_reward_type}
                      onChange={(e) => setFormData({...formData, referrer_reward_type: e.target.value})}
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed_amount">Fixed Amount</option>
                      <option value="free_months">Free Months</option>
                      <option value="points">Points</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Reward Value *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.referrer_reward_value}
                      onChange={(e) => setFormData({...formData, referrer_reward_value: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#10b981' }}>Referee Reward</h4>
                  <div className="form-group">
                    <label>Reward Type</label>
                    <select
                      value={formData.referee_reward_type}
                      onChange={(e) => setFormData({...formData, referee_reward_type: e.target.value})}
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed_amount">Fixed Amount</option>
                      <option value="free_months">Free Months</option>
                      <option value="points">Points</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Reward Value *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.referee_reward_value}
                      onChange={(e) => setFormData({...formData, referee_reward_value: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Minimum Referee Payment (ZMW)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.minimum_referee_payment}
                    onChange={(e) => setFormData({...formData, minimum_referee_payment: e.target.value})}
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label>Reward Cap (ZMW)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.reward_cap}
                    onChange={(e) => setFormData({...formData, reward_cap: e.target.value})}
                    placeholder="No cap"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
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

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingProgram(null);
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
                  {editingProgram ? 'Update Program' : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReferralProgramManager;