import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function LeaderboardPage({ currentUser, setPage }) {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradeFilter, setGradeFilter] = useState(currentUser.grade_level);
  const [provinceFilter, setProvinceFilter] = useState(currentUser.province);

  const gradeLevels = ['All Grades', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'A Levels'];
  const provinces = ['All Provinces', 'Central', 'Copperbelt', 'Eastern', 'Luapula', 'Lusaka', 'Muchinga', 'Northern', 'North-Western', 'Southern', 'Western'];

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);

      // 'rpc' calls a remote procedure, or a database function.
      // We will create this 'get_leaderboard' function in the next step.
      let { data, error } = await supabase.rpc('get_leaderboard', {
        grade_filter: gradeFilter === 'All Grades' ? null : gradeFilter,
        province_filter: provinceFilter === 'All Provinces' ? null : provinceFilter
      });

      if (error) {
        console.error('Error fetching leaderboard:', error);
        alert('Could not fetch leaderboard data.');
      } else {
        setRanking(data);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, [gradeFilter, provinceFilter]);

  return (
    <div className="main-container">
      <header className="main-header">
        <h2>Leaderboard</h2>
        <button className="back-button" onClick={() => setPage('dashboard')}>Back to Dashboard</button>
      </header>
      <div className="content-body">
        <div className="card filter-card">
          <div className="form-group">
            <label>Filter by Grade</label>
            <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
              {gradeLevels.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Filter by Province</label>
            <select value={provinceFilter} onChange={(e) => setProvinceFilter(e.target.value)}>
              {provinces.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="card leaderboard-card">
          {loading ? (
            <p>Loading rankings...</p>
          ) : ranking.length > 0 ? (
            <ol className="leaderboard-list">
              {ranking.map((player, index) => (
                <li key={player.user_id} className={player.user_id === currentUser.id ? 'current-user' : ''}>
                  <span className="rank">{index + 1}</span>
                  <span className="name">{player.full_name}</span>
                  <span className="score">{player.total_score} pts</span>
                </li>
              ))}
            </ol>
          ) : (
            <p>No scores recorded for this filter yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default LeaderboardPage;