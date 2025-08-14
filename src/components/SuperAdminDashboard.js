import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import BadgeManager from './admin/BadgeManager';

function SuperAdminDashboard({ setPage, setSelectedApplication }) {
    const [activeTab, setActiveTab] = useState('applications');
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApplications = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('tutor_applications')
                .select('*')
                .eq('status', 'pending');
            
            if (error) {
                console.error("Error fetching applications:", error);
                alert("Could not fetch applications.");
            } else {
                setApplications(data);
            }
            setLoading(false);
        };
        fetchApplications();
    }, []);

    const handleReview = (application) => {
        setSelectedApplication(application);
        setPage('review-application');
    };

    return (
        <div className="main-container">
            <header className="main-header super-admin-header">
                <h2>Super Admin Panel</h2>
                <div className="tabs">
                    <button 
                        className={`tab-button ${activeTab === 'applications' ? 'active' : ''}`}
                        onClick={() => setActiveTab('applications')}
                    >
                        Applications
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'badges' ? 'active' : ''}`}
                        onClick={() => setActiveTab('badges')}
                    >
                        Manage Badges
                    </button>
                </div>
                <button className="logout-button" onClick={() => supabase.auth.signOut()}>Log Out</button>
            </header>
            <div className="content-body">
                {activeTab === 'applications' ? (
                <div className="card">
                    <h3>Pending Teacher Applications</h3>
                    {loading ? (
                        <p>Loading applications...</p>
                    ) : applications.length > 0 ? (
                        <ul className="application-list">
                            {applications.map(app => (
                                <li key={app.id}>
                                    <div className="app-info">
                                        <strong>{app.full_name}</strong>
                                        <span>Applied on: {new Date(app.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <button className="review-button" onClick={() => handleReview(app)}>Review</button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No pending applications.</p>
                    )}
                </div>
                ) : (
                    <div className="card">
                        <BadgeManager />
                    </div>
                )}
            </div>
        </div>
    );
}

export default SuperAdminDashboard;