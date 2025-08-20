import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useToastNotification } from '../hooks/useToastNotification';

function BookingPage({ currentUser, teacher, setPage }) {
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [message, setMessage] = useState('');
  const [teacherSchedule, setTeacherSchedule] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);

  const { showSuccess, showError } = useToastNotification();

  // Parse teacher weekly schedule on mount/teacher change
  useEffect(() => {
    if (!teacher) return;
    if (teacher.weekly_schedule) {
      try {
        const parsed =
          typeof teacher.weekly_schedule === 'string'
            ? JSON.parse(teacher.weekly_schedule)
            : teacher.weekly_schedule;
        setTeacherSchedule(parsed || null);
      } catch (e) {
        console.error('Error parsing teacher weekly_schedule', e);
        setTeacherSchedule(null);
      }
    } else {
      setTeacherSchedule(null);
    }
  }, [teacher]);

  const getDayKey = dateString => {
    if (!dateString) return '';
    const d = new Date(dateString);
    // keys stored as lowercase day names e.g. monday, tuesday ...
    return d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  };

  // Generate available 1-hour slots based on selected date + schedule
  useEffect(() => {
    if (!date || !teacherSchedule) {
      setAvailableSlots([]);
      return;
    }

    const key = getDayKey(date);
    const day = teacherSchedule?.[key];
    if (!day || !day.enabled) {
      setAvailableSlots([]);
      return;
    }

    const slots = [];
    const [startH, startM] = (day.startTime || '09:00').split(':').map(n => parseInt(n, 10));
    const [endH, endM] = (day.endTime || '17:00').split(':').map(n => parseInt(n, 10));

    let startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (startMinutes + 60 <= endMinutes) {
      const endSlot = startMinutes + 60;
      const sh = String(Math.floor(startMinutes / 60)).padStart(2, '0');
      const sm = String(startMinutes % 60).padStart(2, '0');
      const eh = String(Math.floor(endSlot / 60)).padStart(2, '0');
      const em = String(endSlot % 60).padStart(2, '0');

      slots.push({
        start: `${sh}:${sm}`,
        end: `${eh}:${em}`,
        display: `${sh}:${sm} - ${eh}:${em}`
      });
      startMinutes = endSlot;
    }

    setAvailableSlots(slots);
  }, [date, teacherSchedule]);

  const isDateAvailable = useMemo(() => {
    if (!date || !teacherSchedule) return false;
    const key = getDayKey(date);
    return Boolean(teacherSchedule?.[key]?.enabled);
  }, [date, teacherSchedule]);

  const handleSubmitBooking = async e => {
    e.preventDefault();
    if (!currentUser) {
      showError('Please log in to book a lesson.');
      setPage('auth-choice');
      return;
    }
    if (!date || !time) {
      showError('Please select both date and time for your lesson.');
      return;
    }

    try {
      setLoading(true);
      const requestedDateTime = new Date(`${date}T${time}:00`);

      const { error } = await supabase.from('bookings').insert({
        student_id: currentUser.id,
        teacher_id: teacher.user_id,
        requested_datetime: requestedDateTime.toISOString(),
        student_message: message
      });

      if (error) throw error;

      showSuccess('Booking request sent successfully! The teacher will be notified.');
      setPage('dashboard');
    } catch (err) {
      console.error(err);
      showError(`Error sending booking request: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };

  const renderWeeklySchedule = () => {
    if (!teacherSchedule) return null;
    const order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const label = k => k.charAt(0).toUpperCase() + k.slice(1);
    return (
      <div className='card'>
        <h3>Weekly Schedule</h3>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {order.map(k => {
            const s = teacherSchedule[k];
            if (!s)
              return (
                <div
                  key={k}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: 6
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{label(k)}</span>
                  <span style={{ color: '#9ca3af' }}>Not available</span>
                </div>
              );
            return (
              <div
                key={k}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  background: s.enabled ? '#f0f9ff' : '#f9fafb'
                }}
              >
                <span style={{ fontWeight: 500 }}>{label(k)}</span>
                <span style={{ color: s.enabled ? '#059669' : '#6b7280' }}>
                  {s.enabled ? `${s.startTime} - ${s.endTime}` : 'Not available'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className='main-container'>
      <header className='main-header'>
        <h2>Book a Lesson with {teacher?.full_name}</h2>
        <button className='back-button' onClick={() => setPage('teacher-public-profile')}>
          Back to Profile
        </button>
      </header>

      <div className='content-body'>
        <div className='card'>
          <h3>Teacher Information</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '1rem'
            }}
          >
            <div>
              <strong>Hourly Rate:</strong> {teacher?.hourly_rate || 'Contact teacher for rates'}
            </div>
            <div>
              <strong>Subjects:</strong> {teacher?.subjects?.join(', ') || '—'}
            </div>
          </div>
          {teacher?.availability_text && (
            <div>
              <strong>Additional Notes:</strong>
              <p style={{ marginTop: '0.5rem', color: '#666' }}>{teacher.availability_text}</p>
            </div>
          )}
        </div>

        {renderWeeklySchedule()}

        <div className='card'>
          <h3>Book a Lesson</h3>
          <form onSubmit={handleSubmitBooking}>
            <div className='form-group'>
              <label htmlFor='date'>Select Date</label>
              <input
                id='date'
                type='date'
                value={date}
                onChange={e => {
                  setDate(e.target.value);
                  setTime('');
                }}
                min={getMinDate()}
                max={getMaxDate()}
                required
              />
              {date && (
                <div style={{ marginTop: '0.5rem' }}>
                  <span
                    style={{ color: isDateAvailable ? '#059669' : '#dc2626', fontSize: '0.9rem' }}
                  >
                    {(() => {
                      const d = new Date(date);
                      const dn = d.toLocaleDateString('en-US', { weekday: 'long' });
                      return isDateAvailable ? `${dn} is available` : `${dn} is not available`;
                    })()}
                  </span>
                </div>
              )}
            </div>

            {date && isDateAvailable && (
              <div className='form-group'>
                <label>Available Time Slots</label>
                {availableSlots.length > 0 ? (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                      gap: '0.5rem'
                    }}
                  >
                    {availableSlots.map(slot => {
                      const selected = time === slot.start;
                      return (
                        <button
                          key={slot.start}
                          type='button'
                          onClick={() => setTime(slot.start)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: 6,
                            border: selected ? '2px solid #3b82f6' : '1px solid #d1d5db',
                            background: selected ? '#eff6ff' : 'white',
                            color: '#111827',
                            fontWeight: selected ? 600 : 400,
                            cursor: 'pointer'
                          }}
                        >
                          {slot.display}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: '#6b7280' }}>No slots available for this day.</p>
                )}
              </div>
            )}

            <div className='form-group'>
              <label htmlFor='message'>Message to the teacher (optional)</label>
              <textarea
                id='message'
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder='Share any details or goals for this lesson'
                rows={3}
              />
            </div>

            <div style={{ marginTop: '1rem' }}>
              <button
                type='submit'
                disabled={loading || !date || !time}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 500,
                  cursor: loading || !date || !time ? 'not-allowed' : 'pointer',
                  opacity: loading || !date || !time ? 0.6 : 1
                }}
              >
                {loading ? 'Sending…' : 'Send Booking Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BookingPage;
