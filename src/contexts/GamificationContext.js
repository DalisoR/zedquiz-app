import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export const GamificationContext = createContext();

export const GamificationProvider = ({ children }) => {
  const [points, setPoints] = useState(0);
  const [badges, setBadges] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user's points and badges
  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user points
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (pointsError) throw pointsError;
      if (pointsData) setPoints(pointsData.points);

      // Fetch user badges with badge details
      const { data: badgesData, error: badgesError } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge:badges(*)
        `)
        .eq('user_id', user.id);

      if (badgesError) throw badgesError;
      if (badgesData) {
        setBadges(badgesData.map(ub => ({
          ...ub.badge,
          earnedAt: ub.earned_at
        })));
      }

      // Fetch recent transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionsError) throw transactionsError;
      if (transactionsData) setTransactions(transactionsData);

    } catch (err) {
      console.error('Error fetching gamification data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Add points to user's account
  const addPoints = async (amount, source, sourceId = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Start a transaction
      const { data, error } = await supabase.rpc('add_points', {
        user_id: user.id,
        points_amount: amount,
        points_source: source,
        source_id: sourceId
      });

      if (error) throw error;
      
      // Update local state
      setPoints(data.new_balance);
      
      // Check for new badges
      await checkForNewBadges(user.id, data.new_balance);
      
      // Refresh data
      await fetchUserData();
      
      return data;
    } catch (err) {
      console.error('Error adding points:', err);
      throw err;
    }
  };

  // Check if user earned any new badges
  const checkForNewBadges = async (userId, currentPoints) => {
    try {
      const { data: newBadges, error } = await supabase
        .from('badges')
        .select('*')
        .lte('points_required', currentPoints)
        .not('id', 'in', `(${badges.map(b => `'${b.id}'`).join(',') || "''"})`);

      if (error) throw error;

      // Award new badges
      for (const badge of newBadges) {
        const { error: awardError } = await supabase
          .from('user_badges')
          .insert([{ user_id: userId, badge_id: badge.id }]);

        if (awardError) throw awardError;
      }

      if (newBadges.length > 0) {
        // Refresh badges
        const { data: updatedBadges } = await supabase
          .from('user_badges')
          .select(`
            *,
            badge:badges(*)
          `)
          .eq('user_id', userId);

        setBadges(updatedBadges.map(ub => ({
          ...ub.badge,
          earnedAt: ub.earned_at
        })));

        return newBadges;
      }
      
      return [];
    } catch (err) {
      console.error('Error checking for badges:', err);
      return [];
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <GamificationContext.Provider
      value={{
        points,
        badges,
        transactions,
        isLoading,
        error,
        addPoints,
        refreshData: fetchUserData
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};
