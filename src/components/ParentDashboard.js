import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useToastNotification } from '../hooks/useToastNotification';
import ParentReportsViewer from './ParentReportsViewer';
import './ParentDashboard.css';

function ParentDashboard({ user, setPage }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [childEmail, setChildEmail] = useState('');
  const [linkedChildren, setLinkedChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useToastNotification();

  useEffect(() => {
    const fetchLinkedChildren = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('parent_child_relationships')
          .select(
            `
                        id,
                        status,
                        child:profiles!child_id ( id, full_name, email )
                    `
          )
          .eq('parent_id', user.id);

        if (error) throw error;
        setLinkedChildren(data || []);
      } catch (error) {
        showError('Could not fetch linked children. The database schema might be missing.');
        console.error('Error fetching linked children:', error);
      }
      setLoading(false);
    };

    fetchLinkedChildren();
  }, [user.id, showError]);

  const handleLinkChild = async e => {
    e.preventDefault();
    if (!childEmail.trim()) {
      showError('Please enter the email of your child.');
      return;
    }

    try {
      // 1. Find the child's user ID from their email
      const { data: childProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', childEmail.trim())
        .single();

      if (profileError || !childProfile) {
        showError('No user found with that email address.');
        return;
      }

      const childId = childProfile.id;

      if (childId === user.id) {
        showError('You cannot link to your own account.');
        return;
      }

      // 2. Create a pending relationship
      const { error: linkError } = await supabase
        .from('parent_child_relationships')
        .insert({ parent_id: user.id, child_id: childId, status: 'pending' });

      if (linkError) {
        if (linkError.code === '23505') {
          // unique_violation
          showError('A link request already exists for this child.');
        } else {
          throw linkError;
        }
      } else {
        showSuccess('Link request sent! Your child must approve it.');
        setChildEmail('');
        // Refresh list
        const { data: refreshedData } = await supabase
          .from('parent_child_relationships')
          .select('id, status, child:profiles!child_id ( id, full_name, email )')
          .eq('parent_id', user.id);
        setLinkedChildren(refreshedData || []);
      }
    } catch (error) {
      showError('Failed to send link request. Ensure the database migration has been run.');
      console.error('Error linking child:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className='parent-dashboard-container'>
      <div className='dashboard-header'>
        <h2>Parent Dashboard</h2>
        <div className='tabs'>
          <button
            className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            Performance Reports
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <>
          <div className='card link-child-form'>
            <h3>Link a Child's Account</h3>
            <form onSubmit={handleLinkChild}>
              <input
                type='email'
                placeholder="Enter your child's email address"
                value={childEmail}
                onChange={e => setChildEmail(e.target.value)}
              />
              <button type='submit'>Send Link Request</button>
            </form>
          </div>

          <div className='card linked-children-list'>
            <h3>Linked Children</h3>
            {linkedChildren.length > 0 ? (
              <ul>
                {linkedChildren.map(link => (
                  <li key={link.id} className={`status-${link.status}`}>
                    {link.child.full_name || link.child.email}
                    <span className='link-status'>{link.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>You have not linked any children's accounts yet.</p>
            )}
          </div>
        </>
      )}

      {activeTab === 'reports' && (
        <div className='reports-tab'>
          <ParentReportsViewer user={user} />
        </div>
      )}
    </div>
  );
}

export default ParentDashboard;
