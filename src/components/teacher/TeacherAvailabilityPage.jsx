import { format, addDays, isSameDay } from 'date-fns';
import PropTypes from 'prop-types';
import React from 'react';

/**
 * @component TeacherAvailabilityPage
 * @category teacher
 *
 * @description
 * [Add component description]
 *
 * @example
 * ```jsx
 * import { TeacherAvailabilityPage } from './TeacherAvailabilityPage';
 *
 * function Example() {
 *   return (
 *     <TeacherAvailabilityPage>
 *       [Add example usage]
 *     </TeacherAvailabilityPage>
 *   );
 * }
 * ```
 */

// Convert the existing component content
import React, { useState, useEffect } from 'react';

import { supabase } from '../supabaseClient';

import Calendar from 'react-calendar';
import TimePicker from 'react-time-picker';

import 'react-calendar/dist/Calendar.css';
import 'react-time-picker/dist/TimePicker.css';
import { useToastNotification } from '../hooks/useToastNotification';

import styles from './TeacherAvailabilityPage.module.css';

function TeacherAvailabilityPage({ currentUser, setPage }) {
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState('');
  const [rate, setRate] = useState('');
  const [weeklySchedule, setWeeklySchedule] = useState({
    monday: { enabled: false, startTime: '09:00', endTime: '17:00' },
    tuesday: { enabled: false, startTime: '09:00', endTime: '17:00' },
    wednesday: { enabled: false, startTime: '09:00', endTime: '17:00' },
    thursday: { enabled: false, startTime: '09:00', endTime: '17:00' },
    friday: { enabled: false, startTime: '09:00', endTime: '17:00' },
    saturday: { enabled: false, startTime: '10:00', endTime: '16:00' },
    sunday: { enabled: false, startTime: '10:00', endTime: '16:00' }
  });
  const { showSuccess, showError } = useToastNotification();

  useEffect(() => {
    // Load existing data when the page loads
    setAvailability(currentUser.availability_text || '');
    setRate(currentUser.hourly_rate || '');

    // Load weekly schedule if it exists
    if (currentUser.weekly_schedule) {
      try {
        const schedule = JSON.parse(currentUser.weekly_schedule);
        setWeeklySchedule(schedule);
      } catch (error) {
        console.error('Error parsing weekly schedule:', error);
      }
    }
  }, [currentUser]);

  const handleScheduleChange = (day, field, value) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleUpdateAvailability = async event => {
    event.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          availability_text: availability,
          hourly_rate: rate,
          weekly_schedule: JSON.stringify(weeklySchedule)
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      showSuccess('Availability updated successfully!');
      setPage('teacher-dashboard');
    } catch (error) {
      showError('Error updating availability: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  return (
    <div className='main-container'>
      <header className='main-header admin-header'>
        <h2>Set My Availability & Rate</h2>
        <button className='back-button' onClick={() => setPage('teacher-dashboard')}>
          Back to Dashboard
        </button>
      </header>
      <div className='content-body'>
        <div className='card'>
          <h3>General Information</h3>
          <form onSubmit={handleUpdateAvailability}>
            <div className='form-group'>
              <label htmlFor='rate'>My Hourly Rate</label>
              <input
                id='rate'
                type='text'
                value={rate}
                onChange={e => setRate(e.target.value)}
                placeholder='e.g., K150 per hour'
              />
            </div>
            <div className='form-group'>
              <label htmlFor='availability'>Additional Notes</label>
              <textarea
                id='availability'
                value={availability}
                onChange={e => setAvailability(e.target.value)}
                placeholder='e.g., I prefer online sessions. I can also do in-person tutoring in Lusaka.'
              />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <button
                type='submit'
                disabled={loading}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Saving...' : 'Save General Info'}
              </button>
            </div>
          </form>
        </div>

        <div className='card'>
          <h3>Weekly Schedule</h3>
          <p style={{ marginBottom: '1rem', color: '#666' }}>
            Set your available hours for each day of the week. Students will only be able to book
            during these times.
          </p>

          <div className='schedule-grid' style={{ display: 'grid', gap: '1rem' }}>
            {daysOfWeek.map(({ key, label }) => (
              <div
                key={key}
                className='day-schedule'
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr 100px 100px',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: weeklySchedule[key].enabled ? '#f8fafc' : '#f9fafb'
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: '500'
                  }}
                >
                  <input
                    type='checkbox'
                    checked={weeklySchedule[key].enabled}
                    onChange={e => handleScheduleChange(key, 'enabled', e.target.checked)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  {label}
                </label>

                {weeklySchedule[key].enabled && (
                  <>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <span style={{ fontSize: '0.9rem', color: '#666' }}>Available from:</span>
                    </div>
                    <input
                      type='time'
                      value={weeklySchedule[key].startTime}
                      onChange={e => handleScheduleChange(key, 'startTime', e.target.value)}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '0.9rem'
                      }}
                    />
                    <input
                      type='time'
                      value={weeklySchedule[key].endTime}
                      onChange={e => handleScheduleChange(key, 'endTime', e.target.value)}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '0.9rem'
                      }}
                    />
                  </>
                )}

                {!weeklySchedule[key].enabled && (
                  <div
                    style={{
                      gridColumn: '2 / -1',
                      color: '#9ca3af',
                      fontSize: '0.9rem',
                      fontStyle: 'italic'
                    }}
                  >
                    Not available
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem' }}>
            <button
              type='button'
              onClick={handleUpdateAvailability}
              disabled={loading}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Saving...' : 'Save Availability & Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

TeacherAvailabilityPage.propTypes = {
  // Add prop types
};

TeacherAvailabilityPage.defaultProps = {
  // Add default props
};

export default TeacherAvailabilityPage;
