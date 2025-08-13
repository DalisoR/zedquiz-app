import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

function BookingPage({ currentUser, teacher, setPage }) {
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmitBooking = async (event) => {
        event.preventDefault();
        setLoading(true);

        const requestedDateTime = new Date(`${date}T${time}`);

        const { error } = await supabase
            .from('bookings')
            .insert({
                student_id: currentUser.id,
                teacher_id: teacher.user_id,
                requested_datetime: requestedDateTime.toISOString(),
                student_message: message,
            });

        if (error) {
            alert("Error sending booking request: " + error.message);
        } else {
            alert("Booking request sent successfully! The teacher will be notified.");
            setPage('dashboard');
        }
        setLoading(false);
    };

    return (
        <div className="main-container">
            <header className="main-header">
                <h2>Book a Lesson with {teacher.full_name}</h2>
                <button className="back-button" onClick={() => setPage('teacher-public-profile')}>Back to Profile</button>
            </header>
            <div className="content-body">
                <div className="card">
                    <h3>Teacher's Availability</h3>
                    <p><strong>General Schedule:</strong> {teacher.availability_text || "Not specified"}</p>
                    <p><strong>Hourly Rate:</strong> {teacher.hourly_rate || "Not specified"}</p>
                </div>
                <div className="card">
                    <h3>Request a Lesson</h3>
                    <form onSubmit={handleSubmitBooking}>
                        <div className="form-group">
                            <label htmlFor="date">Proposed Date</label>
                            <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="time">Proposed Time</label>
                            <input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="message">Message to Teacher (optional)</label>
                            <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g., I need help with calculus differentiation." />
                        </div>
                        <button type="submit" className="book-lesson-btn" disabled={loading}>
                            {loading ? 'Sending Request...' : 'Send Booking Request'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default BookingPage;