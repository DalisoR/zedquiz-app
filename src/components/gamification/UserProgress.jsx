import React from 'react';
import { useGamification } from '../../contexts/GamificationContext';
import { Skeleton } from '../ui/Skeleton';
import { FaTrophy, FaMedal, FaStar } from 'react-icons/fa';

const BadgeIcon = ({ badge }) => {
  // Default badge icon based on points
  if (badge.icon_url) {
    return <img src={badge.icon_url} alt={badge.name} className="w-12 h-12" />;
  }
  
  // Fallback icons based on points
  if (badge.points_required >= 1000) {
    return <FaTrophy className="w-12 h-12 text-yellow-500" />;
  } else if (badge.points_required >= 500) {
    return <FaMedal className="w-12 h-12 text-gray-400" />;
  }
  return <FaStar className="w-12 h-12 text-yellow-300" />;
};

export const UserProgress = () => {
  const { points, badges, isLoading, error } = useGamification();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <Skeleton width="200px" height="32px" className="mb-4" />
        <div className="flex items-center space-x-4">
          <Skeleton width="120px" height="120px" circle />
          <div className="flex-1">
            <Skeleton width="80%" height="24px" className="mb-2" />
            <Skeleton width="60%" height="20px" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              Error loading gamification data: {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Your Progress</h3>
      
      {/* Points Display */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-6">
        <div>
          <p className="text-sm font-medium text-gray-500">Total Points</p>
          <p className="text-3xl font-bold text-indigo-600">{points?.toLocaleString() || 0}</p>
        </div>
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
          <FaTrophy className="w-8 h-8 text-indigo-600" />
        </div>
      </div>
      
      {/* Badges */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-3">Your Badges</h4>
        {badges?.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {badges.map((badge) => (
              <div 
                key={badge.id}
                className="flex flex-col items-center p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-white hover:shadow-sm transition-all"
                title={`${badge.name}: ${badge.description}`}
              >
                <div className="relative">
                  <BadgeIcon badge={badge} />
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    ✓
                  </div>
                </div>
                <span className="mt-2 text-xs font-medium text-center text-gray-700">
                  {badge.name}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(badge.earnedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">No badges earned yet. Keep learning to earn badges!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProgress;
