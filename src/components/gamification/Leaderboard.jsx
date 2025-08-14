import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useGamification } from '../../contexts/GamificationContext';
import { Skeleton } from '../ui/Skeleton';

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [timeRange, setTimeRange] = useState('all'); // 'week', 'month', 'all'
  const [loading, setLoading] = useState(true);
  const { points: userPoints } = useGamification();
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [timeRange]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      
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
      
      // Fetch leaderboard data using a stored procedure or view
      const { data, error } = await supabase
        .rpc('get_leaderboard', { 
          from_date: fromDate,
          limit_count: 10
        });
      
      if (error) throw error;
      
      setLeaderboardData(data || []);
      
      // Find current user's rank
      if (userPoints) {
        const { data: rankData, error: rankError } = await supabase
          .rpc('get_user_rank', { 
            user_id: (await supabase.auth.getUser()).data.user.id,
            from_date: fromDate
          });
          
        if (!rankError && rankData) {
          setUserRank(rankData);
        }
      }
      
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedal = (index) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${index + 1}.`;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton height="50px" />
        <Skeleton height="50px" />
        <Skeleton height="50px" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Leaderboard</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1 text-sm rounded-full ${timeRange === 'week' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1 text-sm rounded-full ${timeRange === 'month' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1 text-sm rounded-full ${timeRange === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
            >
              All Time
            </button>
          </div>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {leaderboardData.length > 0 ? (
          leaderboardData.map((user, index) => (
            <div key={user.id} className="p-4 hover:bg-gray-50 flex items-center">
              <div className="w-8 text-center font-medium text-gray-500">
                {getMedal(index)}
              </div>
              <div className="flex-1 ml-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {user.name || 'Anonymous User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.points.toLocaleString()} points • {user.quiz_count} quizzes
                    </p>
                  </div>
                </div>
              </div>
              {user.is_current_user && (
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  You
                </span>
              )}
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            No leaderboard data available
          </div>
        )}
      </div>
      
      {userRank && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Your Rank</p>
              <p className="text-sm text-gray-500">
                {userRank.rank.toLocaleString()}{getOrdinalSuffix(userRank.rank)} place • {userRank.points.toLocaleString()} points
              </p>
            </div>
            <button 
              onClick={fetchLeaderboard}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to add ordinal suffix to numbers
function getOrdinalSuffix(num) {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

export default Leaderboard;
