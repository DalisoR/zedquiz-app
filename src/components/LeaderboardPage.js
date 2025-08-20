import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useGamification } from '../contexts/GamificationContext';

function LeaderboardPage({ currentUser, setPage }) {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradeFilter, setGradeFilter] = useState(currentUser?.grade_level || 'All Grades');
  const [provinceFilter, setProvinceFilter] = useState(currentUser?.province || 'All Provinces');
  const [timeRange, setTimeRange] = useState('all');
  const { points: userPoints } = useGamification();
  const [userRank, setUserRank] = useState(null);

  const gradeLevels = [
    'All Grades',
    'Grade 1',
    'Grade 2',
    'Grade 3',
    'Grade 4',
    'Grade 5',
    'Grade 6',
    'Form 1',
    'Form 2',
    'Form 3',
    'Form 4',
    'Form 5',
    'A Levels'
  ];
  const provinces = [
    'All Provinces',
    'Central',
    'Copperbelt',
    'Eastern',
    'Luapula',
    'Lusaka',
    'Muchinga',
    'Northern',
    'North-Western',
    'Southern',
    'Western'
  ];
  const timeRanges = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Time' }
  ];

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);

      try {
        // Calculate date range based on selection
        let fromDate = new Date('2023-01-01').toISOString(); // Default to all time
        const now = new Date();

        if (timeRange === 'week') {
          const lastWeek = new Date(now);
          lastWeek.setDate(now.getDate() - 7);
          fromDate = lastWeek.toISOString();
        } else if (timeRange === 'month') {
          const lastMonth = new Date(now);
          lastMonth.setMonth(now.getMonth() - 1);
          fromDate = lastMonth.toISOString();
        }

        // Fetch leaderboard data
        let { data, error } = await supabase.rpc('get_leaderboard', {
          grade_filter: gradeFilter === 'All Grades' ? null : gradeFilter,
          province_filter: provinceFilter === 'All Provinces' ? null : provinceFilter,
          from_date: fromDate,
          limit_count: 10
        });

        if (error) throw error;
        setRanking(data || []);

        // Fetch current user's rank if logged in
        if (currentUser?.id) {
          const { data: rankData, error: rankError } = await supabase.rpc('get_user_rank', {
            user_id: currentUser.id,
            from_date: fromDate,
            grade_filter: gradeFilter === 'All Grades' ? null : gradeFilter,
            province_filter: provinceFilter === 'All Provinces' ? null : provinceFilter
          });

          if (!rankError && rankData?.length > 0) {
            setUserRank(rankData[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        alert('Could not fetch leaderboard data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [gradeFilter, provinceFilter, timeRange, currentUser?.id]);

  const getMedal = index => {
    switch (index) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return `${index + 1}.`;
    }
  };

  return (
    <div className='main-container' style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header
        className='main-header'
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '2rem', color: '#2d3748' }}>🏆 Leaderboard</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {timeRanges.map(range => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '9999px',
                  border: 'none',
                  background: timeRange === range.value ? '#4299e1' : '#edf2f7',
                  color: timeRange === range.value ? 'white' : '#4a5568',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                {range.label}
              </button>
            ))}
            <button
              onClick={() => setPage('dashboard')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                border: '1px solid #cbd5e0',
                background: 'white',
                color: '#4a5568',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </header>
      <div className='content-body' style={{ padding: '0 1rem' }}>
        <div
          className='card'
          style={{
            padding: '1.5rem',
            marginBottom: '2rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem',
              marginBottom: '1rem'
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  color: '#4a5568'
                }}
              >
                Grade Level
              </label>
              <select
                value={gradeFilter}
                onChange={e => setGradeFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: 'white',
                  fontSize: '0.95rem',
                  color: '#2d3748',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  cursor: 'pointer'
                }}
              >
                {gradeLevels.map(g => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  color: '#4a5568'
                }}
              >
                Province
              </label>
              <select
                value={provinceFilter}
                onChange={e => setProvinceFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: 'white',
                  fontSize: '0.95rem',
                  color: '#2d3748',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  cursor: 'pointer'
                }}
              >
                {provinces.map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div
          className='card'
          style={{
            padding: '1.5rem',
            borderRadius: '12px',
            background: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          {loading ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '2rem',
                color: '#718096'
              }}
            >
              Loading rankings...
            </div>
          ) : ranking.length > 0 ? (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '50px 1fr 120px',
                  padding: '0.75rem 1rem',
                  fontWeight: '600',
                  color: '#718096',
                  borderBottom: '1px solid #e2e8f0',
                  marginBottom: '0.5rem'
                }}
              >
                <div>Rank</div>
                <div>Student</div>
                <div style={{ textAlign: 'right' }}>Points</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {ranking.map((player, index) => (
                  <div
                    key={player.user_id}
                    className={player.user_id === currentUser?.id ? 'current-user' : ''}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '50px 1fr 120px',
                      alignItems: 'center',
                      padding: '1rem',
                      borderRadius: '8px',
                      background: player.user_id === currentUser?.id ? '#ebf8ff' : 'white',
                      border:
                        player.user_id === currentUser?.id
                          ? '1px solid #90cdf4'
                          : '1px solid #edf2f7',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div
                      style={{
                        fontWeight: '600',
                        color: index < 3 ? '#2b6cb0' : '#4a5568',
                        fontSize: index < 3 ? '1.25rem' : '1rem',
                        textAlign: 'center'
                      }}
                    >
                      {getMedal(index)}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontWeight: '500',
                        color: player.user_id === currentUser?.id ? '#2b6cb0' : '#2d3748'
                      }}
                    >
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '9999px',
                          background: player.user_id === currentUser?.id ? '#bee3f8' : '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: player.user_id === currentUser?.id ? '#2b6cb0' : '#4a5568',
                          fontWeight: '600',
                          fontSize: '0.9rem'
                        }}
                      >
                        {player.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: '500' }}>{player.full_name || 'Anonymous'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#718096' }}>
                          {player.school_name || 'No school'}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        textAlign: 'right',
                        fontWeight: '600',
                        color: player.user_id === currentUser?.id ? '#2b6cb0' : '#4a5568',
                        fontSize: '1rem'
                      }}
                    >
                      {player.points?.toLocaleString() || '0'} pts
                    </div>
                  </div>
                ))}
              </div>

              {userRank && (
                <div
                  style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    background: '#f7fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: '#4a5568' }}>Your Rank</div>
                    <div style={{ fontSize: '0.9rem', color: '#718096' }}>
                      {userRank.rank
                        ? `#${userRank.rank} out of ${userRank.total_players}`
                        : 'Not ranked yet'}
                    </div>
                  </div>
                  <div
                    style={{
                      background: '#4299e1',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '9999px',
                      fontWeight: '600',
                      fontSize: '0.9rem'
                    }}
                  >
                    {userRank.points?.toLocaleString() || '0'} points
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3rem 1rem',
                textAlign: 'center',
                color: '#718096'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '9999px',
                  background: '#f7fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  fontSize: '1.5rem'
                }}
              >
                📊
              </div>
              <h3
                style={{
                  margin: '0 0 0.5rem',
                  color: '#4a5568',
                  fontWeight: '600'
                }}
              >
                No rankings yet
              </h3>
              <p style={{ margin: '0', maxWidth: '400px' }}>
                Be the first to complete a quiz with these filters to appear on the leaderboard!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LeaderboardPage;
