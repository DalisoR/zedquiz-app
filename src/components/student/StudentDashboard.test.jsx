import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';

import { StudentDashboard } from './StudentDashboard';

// Mock the required dependencies
jest.mock('../../contexts/AuthContext');
jest.mock('react-router-dom');
jest.mock('../../supabaseClient');

describe('StudentDashboard', () => {
  const mockNavigate = jest.fn();
  const mockProfile = {
    id: '123',
    full_name: 'Test Student',
    subscription_tier: 'free',
    school_name: 'Test School',
    grade_level: '10',
    points_balance: 100
  };

  beforeEach(() => {
    useAuth.mockReturnValue({ profile: mockProfile });
    useNavigate.mockReturnValue(mockNavigate);

    // Mock Supabase responses
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null })
    });

    supabase.rpc.mockReturnValue({
      data: 0,
      error: null
    });
  });

  it('renders without crashing', () => {
    render(<StudentDashboard />);
    expect(screen.getByText('Welcome, Test Student')).toBeInTheDocument();
  });

  it('displays correct subscription status', () => {
    render(<StudentDashboard />);
    expect(screen.getByText('free')).toBeInTheDocument();
  });

  it('shows upgrade button for free tier users', () => {
    render(<StudentDashboard />);
    expect(screen.getByText('Upgrade Now')).toBeInTheDocument();
  });

  it('navigates to correct routes when buttons are clicked', () => {
    render(<StudentDashboard />);

    fireEvent.click(screen.getByText('🏆 Leaderboard'));
    expect(mockNavigate).toHaveBeenCalledWith('/leaderboard');

    fireEvent.click(screen.getByText('👨‍🏫 Browse Tutors'));
    expect(mockNavigate).toHaveBeenCalledWith('/teachers');
  });

  it('handles sign out correctly', () => {
    render(<StudentDashboard />);

    fireEvent.click(screen.getByText('Sign Out'));
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('displays loading spinner when loading history', () => {
    render(<StudentDashboard />);
    expect(screen.getAllByRole('progressbar')).toHaveLength(2);
  });
});
