import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function SuperAdminDashboard({ setPage, setSelectedApplication }) {
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
                <button className="logout-button" onClick={() => supabase.auth.signOut()}>Log Out</button>
            </header>
            <div className="content-body">
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
                        <p>There are no pending applications.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SuperAdminDashboard;