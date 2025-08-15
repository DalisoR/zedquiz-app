import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../../supabaseClient';
import { AuthContext } from '../../contexts/AuthContext';
import './TeacherEarningsDashboard.css';

const TeacherEarningsDashboard = () => {
  const { user } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        // Fetch tutor's profile data which includes new rewards system fields
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('contribution_score, average_rating, followers_count, total_earnings')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // Fetch recent contributions
        const { data: contributions, error: contributionsError } = await supabase
          .from('tutor_contribution_log')
          .select('*, content_ratings(rating)')
          .eq('tutor_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (contributionsError) throw contributionsError;

        setDashboardData({
          profile,
          contributions,
        });

      } catch (err) {
        setError('Could not fetch dashboard data.');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return <div className="loading-spinner"></div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!dashboardData) {
    return <div>No data available.</div>;
  }

  const { profile, contributions } = dashboardData;

  return (
    <div className="teacher-earnings-dashboard">
      <h1>Your Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h2>Total Earnings</h2>
          <p>${(profile.total_earnings || 0).toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h2>Contribution Score</h2>
          <p>{profile.contribution_score || 0}</p>
        </div>
        <div className="stat-card">
          <h2>Followers</h2>
          <p>{profile.followers_count || 0}</p>
        </div>
        <div className="stat-card">
          <h2>Average Rating</h2>
          <p>{(profile.average_rating || 0).toFixed(1)} / 5.0</p>
        </div>
      </div>

      <div className="recent-contributions">
        <h2>Recent Contributions</h2>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Description</th>
              <th>Date</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {contributions && contributions.map(c => (
              <tr key={c.id}>
                <td>{c.contribution_type}</td>
                <td>{c.description}</td>
                <td>{new Date(c.created_at).toLocaleDateString()}</td>
                <td>{c.points_awarded}</td>
              </tr>
            ))}
             {(!contributions || contributions.length === 0) && (
                <tr>
                    <td colSpan="4">No recent contributions found.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherEarningsDashboard;
