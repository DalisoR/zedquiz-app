import React from 'react';
import { supabase } from '../supabaseClient';

function TeacherDashboard({ currentUser, setPage }) {
  return (
    <div className="main-container">
      <header className="main-header admin-header">
        <h2>Teacher Dashboard</h2>
        <button className="logout-button" onClick={() => supabase.auth.signOut()}>Log Out</button>
      </header>
      <div className="content-body">
        <div className="card">
            <h3>Welcome, {currentUser.full_name}!</h3>
            <p>From here, you can manage your profile, create quizzes, and handle lesson bookings.</p>
        </div>
        <div className="card admin-actions">
            <h3>Actions</h3>
            <div className="admin-buttons">
                <button className="start-button" onClick={() => setPage('create-quiz')}>
                    Create New Quiz
                </button>
                <button className="manage-button" onClick={() => setPage('manage-quizzes')}>
                    Manage My Quizzes
                </button>
                <button className="profile-button" onClick={() => setPage('teacher-profile')}>
                    Manage My Profile
                </button>
                <button className="availability-button" onClick={() => setPage('teacher-availability')}>
                    Set My Availability
                </button>
                 <button className="bookings-button" onClick={() => setPage('teacher-bookings')}>
                    Manage Bookings
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;