import PropTypes from 'prop-types';
import React from 'react';

/**
 * @component TeacherDashboard
 * @category teacher
 *
 * @description
 * [Add component description]
 *
 * @example
 * ```jsx
 * import { TeacherDashboard } from './TeacherDashboard';
 *
 * function Example() {
 *   return (
 *     <TeacherDashboard>
 *       [Add example usage]
 *     </TeacherDashboard>
 *   );
 * }
 * ```
 */

// Convert the existing component content
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';

import styles from './TeacherDashboard.module.css';

function TeacherDashboard() {
  const navigate = useNavigate();
  const { profile: currentUser } = useAuth();
  return (
    <div className='main-container'>
      <header className='main-header admin-header'>
        <h2>Teacher Dashboard</h2>
        <button className='logout-button' onClick={() => supabase.auth.signOut()}>
          Log Out
        </button>
      </header>
      <div className='content-body'>
        <div className='card'>
          <h3>Welcome, {currentUser.full_name}!</h3>
          <p>
            From here, you can manage your profile, create courses, quizzes, and handle lesson
            bookings.
          </p>
        </div>

        <div className='card admin-actions'>
          <h3>Course Management</h3>
          <div className='admin-buttons'>
            <button className='start-button' onClick={() => navigate('/teacher/courses/create')}>
              Create New Course
            </button>
            <button className='manage-button' onClick={() => navigate('/teacher/courses')}>
              Manage My Courses
            </button>
          </div>
        </div>

        <div className='card admin-actions'>
          <h3>Quiz Management</h3>
          <div className='admin-buttons'>
            <button className='start-button' onClick={() => navigate('/teacher/quizzes/create')}>
              Create New Quiz
            </button>
            <button className='manage-button' onClick={() => navigate('/teacher/quizzes')}>
              Manage My Quizzes
            </button>
          </div>
        </div>

        <div className='card admin-actions'>
          <h3>Teaching & Bookings</h3>
          <div className='admin-buttons'>
            <button className='profile-button' onClick={() => navigate('/teacher/profile')}>
              Manage My Profile
            </button>
            <button
              className='availability-button'
              onClick={() => navigate('/teacher/availability')}
            >
              Set My Availability
            </button>
            <button className='bookings-button' onClick={() => navigate('/teacher/bookings')}>
              Manage Bookings
            </button>
            <button className='earnings-button' onClick={() => navigate('/teacher/earnings')}>
              View My Earnings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

TeacherDashboard.propTypes = {
  // Add prop types
};

TeacherDashboard.defaultProps = {
  // Add default props
};

export default TeacherDashboard;
