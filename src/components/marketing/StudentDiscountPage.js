import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useToastNotification } from '../../hooks/useToastNotification';

function StudentDiscountPage({ currentUser, setPage }) {
  const [loading, setLoading] = useState(true);
  const [studentDiscount, setStudentDiscount] = useState(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { showSuccess, showError, showWarning } = useToastNotification();

  const [formData, setFormData] = useState({
    student_email: '',
    institution_name: '',
    student_id: '',
    verification_document: null
  });

  useEffect(() => {
    if (currentUser) {
      fetchStudentDiscount();
    }
  }, [currentUser]);

  const fetchStudentDiscount = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('student_discounts')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setStudentDiscount(data);
    } catch (err) {
      console.error('Error fetching student discount:', err);
      showError('Failed to load student discount information');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async file => {
    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
      const filePath = `student-verifications/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl }
      } = supabase.storage.from('documents').getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Error uploading file:', err);
      showError('Failed to upload verification document');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      let documentUrl = null;

      if (formData.verification_document) {
        documentUrl = await handleFileUpload(formData.verification_document);
        if (!documentUrl) return; // Upload failed
      }

      const discountData = {
        user_id: currentUser.id,
        student_email: formData.student_email,
        institution_name: formData.institution_name,
        student_id: formData.student_id,
        verification_document_url: documentUrl,
        verification_status: 'pending'
      };

      const { error } = await supabase.from('student_discounts').insert([discountData]);

      if (error) throw error;

      showSuccess(
        'Student discount application submitted! We will review it within 2-3 business days.'
      );
      setShowApplicationForm(false);
      setFormData({
        student_email: '',
        institution_name: '',
        student_id: '',
        verification_document: null
      });
      fetchStudentDiscount();
    } catch (err) {
      console.error('Error submitting student discount application:', err);
      showError('Failed to submit student discount application');
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      case 'expired':
        return '#6b7280';
      default:
        return '#f59e0b'; // pending
    }
  };

  const getStatusText = status => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'expired':
        return 'Expired';
      default:
        return 'Under Review';
    }
  };

  const isEduEmail = email => {
    return (
      email.endsWith('.edu') ||
      email.endsWith('.ac.zm') ||
      email.endsWith('.edu.zm') ||
      email.includes('unza.zm') ||
      email.includes('cbu.ac.zm') ||
      email.includes('mu.ac.zm')
    );
  };

  if (loading) {
    return (
      <div className='main-container'>
        <div className='card'>
          <p>Loading student discount information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='main-container'>
      <header className='main-header'>
        <h2>Student Discount</h2>
        <button className='back-button' onClick={() => setPage('subscriptions')}>
          Back to Plans
        </button>
      </header>

      <div className='content-body'>
        {/* Student Discount Info */}
        <div className='card'>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎓</div>
            <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Student Discount Program</h3>
            <p style={{ fontSize: '1.125rem', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
              Get 50% off Premium and Pro plans with valid student verification. Perfect for
              students who want to excel in their studies!
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}
          >
            <div
              style={{
                textAlign: 'center',
                padding: '1.5rem',
                background: '#f0f9ff',
                borderRadius: '8px'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>50% Discount</h4>
              <p style={{ margin: 0, color: '#666' }}>On Premium and Pro plans</p>
            </div>
            <div
              style={{
                textAlign: 'center',
                padding: '1.5rem',
                background: '#f0fdf4',
                borderRadius: '8px'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Quick Verification</h4>
              <p style={{ margin: 0, color: '#666' }}>2-3 business days</p>
            </div>
            <div
              style={{
                textAlign: 'center',
                padding: '1.5rem',
                background: '#fefce8',
                borderRadius: '8px'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📚</div>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Full Access</h4>
              <p style={{ margin: 0, color: '#666' }}>All premium features</p>
            </div>
          </div>

          {/* Current Status */}
          {studentDiscount ? (
            <div
              style={{
                padding: '1.5rem',
                border: `2px solid ${getStatusColor(studentDiscount.verification_status)}`,
                borderRadius: '8px',
                background: `${getStatusColor(studentDiscount.verification_status)}10`
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}
              >
                <h4 style={{ margin: 0 }}>Your Student Discount Status</h4>
                <span
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    background: getStatusColor(studentDiscount.verification_status),
                    color: 'white'
                  }}
                >
                  {getStatusText(studentDiscount.verification_status)}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                    Student Email
                  </div>
                  <div style={{ fontWeight: 600 }}>{studentDiscount.student_email}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                    Institution
                  </div>
                  <div style={{ fontWeight: 600 }}>{studentDiscount.institution_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                    Applied On
                  </div>
                  <div style={{ fontWeight: 600 }}>
                    {new Date(studentDiscount.created_at).toLocaleDateString()}
                  </div>
                </div>
                {studentDiscount.verified_at && (
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                      Verified On
                    </div>
                    <div style={{ fontWeight: 600 }}>
                      {new Date(studentDiscount.verified_at).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>

              {studentDiscount.verification_status === 'approved' && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: '#10b981',
                    color: 'white',
                    borderRadius: '6px'
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                    🎉 Congratulations! Your student discount is active.
                  </div>
                  <div>
                    You can now get 50% off Premium and Pro plans. The discount will be
                    automatically applied at checkout.
                  </div>
                  <button
                    onClick={() => setPage('subscriptions')}
                    style={{
                      marginTop: '1rem',
                      width: 'auto',
                      padding: '0.75rem 1.5rem',
                      background: 'white',
                      color: '#10b981',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    View Plans
                  </button>
                </div>
              )}

              {studentDiscount.verification_status === 'rejected' && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px'
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#dc2626' }}>
                    Application Rejected
                  </div>
                  <div style={{ color: '#666' }}>
                    Unfortunately, we couldn't verify your student status. Please ensure you're
                    using a valid institutional email and have provided proper documentation. You
                    can reapply with updated information.
                  </div>
                </div>
              )}

              {studentDiscount.verification_status === 'pending' && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: '#fffbeb',
                    border: '1px solid #fed7aa',
                    borderRadius: '6px'
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#d97706' }}>
                    Under Review
                  </div>
                  <div style={{ color: '#666' }}>
                    We're currently reviewing your student discount application. This typically
                    takes 2-3 business days. We'll notify you via email once the review is complete.
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 1rem 0' }}>Ready to Apply?</h4>
              <p style={{ margin: '0 0 1.5rem 0', color: '#666' }}>
                Apply for student discount with your institutional email and student verification.
              </p>
              <button
                onClick={() => setShowApplicationForm(true)}
                style={{
                  width: 'auto',
                  padding: '1rem 2rem',
                  background: '#3b82f6',
                  fontSize: '1.125rem',
                  fontWeight: 600
                }}
              >
                Apply for Student Discount
              </button>
            </div>
          )}
        </div>

        {/* Requirements */}
        <div className='card'>
          <h3>Requirements</h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ fontSize: '1.5rem' }}>����</div>
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>Valid Student Email</h4>
                <p style={{ margin: 0, color: '#666' }}>
                  Use your official institutional email address (.edu, .ac.zm, .edu.zm, or
                  university-specific domains)
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ fontSize: '1.5rem' }}>🆔</div>
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>Student ID</h4>
                <p style={{ margin: 0, color: '#666' }}>
                  Your current student identification number from your institution
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ fontSize: '1.5rem' }}>📄</div>
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>Verification Document</h4>
                <p style={{ margin: 0, color: '#666' }}>
                  Upload a clear photo of your student ID, enrollment letter, or current transcript
                  (PDF, JPG, PNG)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Form Modal */}
      {showApplicationForm && (
        <div
          style={{
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
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Apply for Student Discount</h3>

            <form onSubmit={handleSubmit}>
              <div className='form-group'>
                <label>Student Email Address *</label>
                <input
                  type='email'
                  value={formData.student_email}
                  onChange={e => setFormData({ ...formData, student_email: e.target.value })}
                  placeholder='your.name@university.edu.zm'
                  required
                />
                {formData.student_email && !isEduEmail(formData.student_email) && (
                  <div style={{ fontSize: '0.875rem', color: '#f59e0b', marginTop: '0.25rem' }}>
                    ⚠️ Please use your official institutional email address
                  </div>
                )}
              </div>

              <div className='form-group'>
                <label>Institution Name *</label>
                <input
                  type='text'
                  value={formData.institution_name}
                  onChange={e => setFormData({ ...formData, institution_name: e.target.value })}
                  placeholder='University of Zambia'
                  required
                />
              </div>

              <div className='form-group'>
                <label>Student ID *</label>
                <input
                  type='text'
                  value={formData.student_id}
                  onChange={e => setFormData({ ...formData, student_id: e.target.value })}
                  placeholder='Your student identification number'
                  required
                />
              </div>

              <div className='form-group'>
                <label>Verification Document *</label>
                <input
                  type='file'
                  accept='.pdf,.jpg,.jpeg,.png'
                  onChange={e =>
                    setFormData({ ...formData, verification_document: e.target.files[0] })
                  }
                  required
                />
                <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                  Upload your student ID, enrollment letter, or transcript (PDF, JPG, PNG - max 5MB)
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'flex-end',
                  marginTop: '2rem'
                }}
              >
                <button
                  type='button'
                  onClick={() => {
                    setShowApplicationForm(false);
                    setFormData({
                      student_email: '',
                      institution_name: '',
                      student_id: '',
                      verification_document: null
                    });
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
                  type='submit'
                  disabled={uploading}
                  style={{
                    width: 'auto',
                    padding: '0.75rem 1.5rem',
                    background: uploading ? '#9ca3af' : '#10b981'
                  }}
                >
                  {uploading ? 'Uploading...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDiscountPage;
