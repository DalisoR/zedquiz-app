import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

function ApplicationReviewPage({ application, setPage }) {
  const [loading, setLoading] = useState(false);

  const handleDecision = async decision => {
    setLoading(true);
    const functionName = decision === 'approve' ? 'approve_application' : 'reject_application';

    const { error } = await supabase.rpc(functionName, {
      application_user_id: application.user_id
    });

    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      alert(`Application has been ${decision}d successfully!`);
      setPage('super-admin'); // Go back to the main admin dashboard
    }
    setLoading(false);
  };

  const viewDocument = async filePath => {
    const { data, error } = await supabase.storage
      .from('tutor_documents')
      .createSignedUrl(filePath, 60); // Create a temporary link valid for 60 seconds

    if (error) {
      alert('Could not generate document link: ' + error.message);
    } else {
      window.open(data.signedUrl, '_blank');
    }
  };

  return (
    <div className='main-container'>
      <header className='main-header super-admin-header'>
        <h2>Review Application</h2>
        <button className='back-button' onClick={() => setPage('super-admin')}>
          Back to List
        </button>
      </header>
      <div className='content-body'>
        <div className='card'>
          <h3>Applicant Details</h3>
          <p>
            <strong>Name:</strong> {application.full_name}
          </p>
          <p>
            <strong>Phone:</strong> {application.phone_number}
          </p>
          <p>
            <strong>Qualifications:</strong> {application.qualifications}
          </p>
          <div className='document-links'>
            <button onClick={() => viewDocument(application.cv_url)}>View CV</button>
            <button onClick={() => viewDocument(application.certificates_url)}>
              View Certificates
            </button>
          </div>
        </div>
        <div className='card decision-card'>
          <h3>Make a Decision</h3>
          <div className='decision-buttons'>
            <button
              className='approve-button'
              onClick={() => handleDecision('approve')}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Approve Application'}
            </button>
            <button
              className='reject-button'
              onClick={() => handleDecision('reject')}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Reject Application'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApplicationReviewPage;
