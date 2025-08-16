import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import BadgeManager from './admin/BadgeManager';

function SuperAdminDashboard({ setPage, setSelectedApplication }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dashboardStats, setDashboardStats] = useState({
        totalUsers: 0,
        totalRevenue: 0,
        activeSubscriptions: 0,
        pendingApplications: 0
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        
        try {
            // Fetch pending applications
            const { data: appsData, error: appsError } = await supabase
                .from('tutor_applications')
                .select('*')
                .eq('status', 'pending');
            
            if (appsError) throw appsError;
            setApplications(appsData || []);

            // Fetch basic stats
            const { data: usersCount } = await supabase
                .from('profiles')
                .select('id', { count: 'exact' });

            const { data: subscriptionsCount } = await supabase
                .from('subscriptions')
                .select('id', { count: 'exact' })
                .eq('status', 'active');

            // Try to get revenue data
            const { data: revenueData } = await supabase
                .rpc('get_revenue_dashboard')
                .single();

            setDashboardStats({
                totalUsers: usersCount?.length || 0,
                totalRevenue: revenueData?.total_revenue || 0,
                activeSubscriptions: subscriptionsCount?.length || 0,
                pendingApplications: appsData?.length || 0
            });

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = (application) => {
        setSelectedApplication(application);
        setPage('review-application');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-ZM', {
            style: 'currency',
            currency: 'ZMW',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const renderOverviewTab = () => (
        <div>
            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', color: '#3b82f6' }}>
                        {dashboardStats.totalUsers}
                    </h3>
                    <p style={{ margin: 0, color: '#666' }}>Total Users</p>
                </div>

                <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', color: '#10b981' }}>
                        {formatCurrency(dashboardStats.totalRevenue)}
                    </h3>
                    <p style={{ margin: 0, color: '#666' }}>Total Revenue</p>
                </div>

                <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', color: '#8b5cf6' }}>
                        {dashboardStats.activeSubscriptions}
                    </h3>
                    <p style={{ margin: 0, color: '#666' }}>Active Subscriptions</p>
                </div>

                <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</div>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', color: '#f59e0b' }}>
                        {dashboardStats.pendingApplications}
                    </h3>
                    <p style={{ margin: 0, color: '#666' }}>Pending Applications</p>
                </div>
            </div>

            {/* Analytics & Reports */}
            <div className="card">
                <h3>Analytics & Reports</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                    <button
                        onClick={() => setPage('revenue-analytics')}
                        style={{
                            padding: '1.5rem',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <span style={{ fontSize: '1.5rem' }}>📈</span>
                        <div style={{ textAlign: 'left' }}>
                            <div>Revenue Analytics</div>
                            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                                View revenue trends, MRR, and financial metrics
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => setPage('subscription-metrics')}
                        style={{
                            padding: '1.5rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <span style={{ fontSize: '1.5rem' }}>👥</span>
                        <div style={{ textAlign: 'left' }}>
                            <div>Subscription Metrics</div>
                            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                                Analyze customer lifetime value and churn
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Marketing & Growth Tools */}
            <div className="card">
                <h3>Marketing & Growth Tools</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                    <button
                        onClick={() => setPage('discount-codes')}
                        style={{
                            padding: '1.5rem',
                            background: '#8b5cf6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <span style={{ fontSize: '1.5rem' }}>🎫</span>
                        <div style={{ textAlign: 'left' }}>
                            <div>Discount Codes</div>
                            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                                Create and manage promotional discount codes
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => setPage('referral-programs')}
                        style={{
                            padding: '1.5rem',
                            background: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <span style={{ fontSize: '1.5rem' }}>🤝</span>
                        <div style={{ textAlign: 'left' }}>
                            <div>Referral Programs</div>
                            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                                Manage referral campaigns and rewards
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Recent Applications */}
            {applications.length > 0 && (
                <div className="card">
                    <h3>Recent Applications ({applications.length} pending)</h3>
                    <div style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
                        {applications.slice(0, 5).map(app => (
                            <div
                                key={app.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '1rem',
                                    background: '#f9fafb',
                                    borderRadius: '6px'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 600 }}>{app.full_name}</div>
                                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                                        Applied {new Date(app.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleReview(app)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '0.875rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Review
                                </button>
                            </div>
                        ))}
                    </div>
                    {applications.length > 5 && (
                        <button
                            onClick={() => setActiveTab('applications')}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'none',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                marginTop: '1rem',
                                cursor: 'pointer'
                            }}
                        >
                            View All Applications
                        </button>
                    )}
                </div>
            )}
        </div>
    );

    const renderApplicationsTab = () => (
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
    );

    return (
        <div className="main-container">
            <header className="main-header super-admin-header">
                <h2>Super Admin Panel</h2>
                <div className="tabs">
                    <button 
                        className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'applications' ? 'active' : ''}`}
                        onClick={() => setActiveTab('applications')}
                    >
                        Applications ({applications.length})
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
                {activeTab === 'overview' && renderOverviewTab()}
                {activeTab === 'applications' && renderApplicationsTab()}
                {activeTab === 'badges' && (
                    <div className="card">
                        <BadgeManager />
                    </div>
                )}
            </div>
        </div>
    );
}

export default SuperAdminDashboard;