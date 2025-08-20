import PropTypes from 'prop-types';
import React from 'react';

/**
 * @component TeacherBookingsPage
 * @category teacher
 *
 * @description
 * [Add component description]
 *
 * @example
 * ```jsx
 * import { TeacherBookingsPage } from './TeacherBookingsPage';
 *
 * function Example() {
 *   return (
 *     <TeacherBookingsPage>
 *       [Add example usage]
 *     </TeacherBookingsPage>
 *   );
 * }
 * ```
 */

// Convert the existing component content
import React, { useState, useEffect } from 'react';

import { supabase } from '../supabaseClient';

import styles from './TeacherBookingsPage.module.css';

function TeacherBookingsPage({ currentUser, setPage }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      // Fetch bookings where the current user is the teacher
      // We also fetch the student's name from the profiles table
      const { data, error } = await supabase
        .from('bookings')
        .select(
          `
                    *,
                    student:profiles(full_name)
                `
        )
        .eq('teacher_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        alert('Could not fetch your bookings.');
      } else {
        setBookings(data);
      }
      setLoading(false);
    };
    fetchBookings();
  }, [currentUser.id]);

  const handleDecision = async (bookingId, decision) => {
    const functionName = decision === 'confirm' ? 'confirm_booking' : 'reject_booking';
    const { error } = await supabase.rpc(functionName, {
      booking_id_to_update: bookingId
    });

    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      // Refresh the list of bookings after a decision is made
      setBookings(bookings.map(b => (b.id === bookingId ? { ...b, status: `${decision}ed` } : b)));
      alert(`Booking has been ${decision}ed.`);
    }
  };

  const pendingRequests = bookings.filter(b => b.status === 'pending');
  const confirmedLessons = bookings.filter(b => b.status === 'confirmed');

  return (
    <div className='main-container'>
      <header className='main-header admin-header'>
        <h2>Manage My Bookings</h2>
        <button className='back-button' onClick={() => setPage('teacher-dashboard')}>
          Back to Dashboard
        </button>
      </header>
      <div className='content-body'>
        <div className='card'>
          <h3>Pending Requests ({pendingRequests.length})</h3>
          {loading ? (
            <p>Loading...</p>
          ) : pendingRequests.length > 0 ? (
            <ul className='booking-list'>
              {pendingRequests.map(req => (
                <li key={req.id}>
                  <div className='booking-info'>
                    <strong>Student: {req.student.full_name}</strong>
                    <span>Requested for: {new Date(req.requested_datetime).toLocaleString()}</span>
                    <p className='student-message'>"{req.student_message}"</p>
                  </div>
                  <div className='booking-actions'>
                    <button
                      className='confirm-btn'
                      onClick={() => handleDecision(req.id, 'confirm')}
                    >
                      Confirm
                    </button>
                    <button className='reject-btn' onClick={() => handleDecision(req.id, 'reject')}>
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>You have no new booking requests.</p>
          )}
        </div>
        <div className='card'>
          <h3>Upcoming Lessons ({confirmedLessons.length})</h3>
          {loading ? (
            <p>Loading...</p>
          ) : confirmedLessons.length > 0 ? (
            <ul className='booking-list'>
              {confirmedLessons.map(lesson => (
                <li key={lesson.id}>
                  <div className='booking-info'>
                    <strong>Student: {lesson.student.full_name}</strong>
                    <span>
                      Scheduled for: {new Date(lesson.requested_datetime).toLocaleString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>You have no upcoming lessons.</p>
          )}
        </div>
      </div>
    </div>
  );
}

TeacherBookingsPage.propTypes = {
  // Add prop types
};

TeacherBookingsPage.defaultProps = {
  // Add default props
};

export default TeacherBookingsPage;
