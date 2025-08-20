import { useCallback } from 'react';
import { useGamification } from '../contexts/GamificationContext';
import { useToastNotification } from './useToastNotification';

export const usePoints = () => {
  const { addPoints, refreshData } = useGamification();
  const { showSuccess, showError } = useToastNotification();

  const awardPoints = useCallback(
    async (amount, source, sourceId = null, message = null) => {
      try {
        const result = await addPoints(amount, source, sourceId);

        if (message) {
          showSuccess(message, {
            title: `+${amount} Points!`,
            icon: '🎉',
            duration: 3000
          });
        }

        return result;
      } catch (error) {
        console.error('Failed to award points:', error);
        showError('Failed to update points. Please try again.', {
          title: 'Error',
          duration: 3000
        });
        throw error;
      } finally {
        await refreshData();
      }
    },
    [addPoints, refreshData, showSuccess, showError]
  );

  return { awardPoints };
};
