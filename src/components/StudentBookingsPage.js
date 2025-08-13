import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function StudentBookingsPage({ currentUser, setPage, setSelectedBooking }) {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    teacher:profiles(full_name),
                    reviews(id)
                `)
                .eq('student_id', currentUser.id)
                .order('requested_datetime', { ascending: false });

            if (error) {
                console.error("Error fetching bookings:", error);
            } else {
                setBookings(data);
            }
            setLoading(false);
        };
        fetchBookings();
    }, [currentUser.id]);

    const handleLeaveReview = (booking) => {
        setSelectedBooking(booking);
        setPage('leave-review');
    };

    const upcomingLessons = bookings.filter(b => b.status === 'confirmed' && new Date(b.requested_datetime) > new Date());
    const pastLessons = bookings.filter(b => b.status === 'confirmed' && new Date(b.requested_datetime) <= new Date());

    return (
        <div className="main-container">
            <header className="main-header">
                <h2>My Lessons</h2>
                <button className="back-button" onClick={() => setPage('dashboard')}>Back to Dashboard</button>
            </header>
            <div className="content-body">
                <div className="card">
                    <h3>Upcoming Lessons ({upcomingLessons.length})</h3>
                    {loading ? <p>Loading...</p> : upcomingLessons.length > 0 ? (
                        <ul className="booking-list">
                            {upcomingLessons.map(lesson => (
                                <li key={lesson.id}>
                                    <div className="booking-info">
                                        <strong>Teacher: {lesson.teacher.full_name}</strong>
                                        <span>Scheduled for: {new Date(lesson.requested_datetime).toLocaleString()}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : <p>You have no upcoming lessons.</p>}
                </div>
                <div className="card">
                    <h3>Past Lessons ({pastLessons.length})</h3>
                     {loading ? <p>Loading...</p> : pastLessons.length > 0 ? (
                        <ul className="booking-list">
                            {pastLessons.map(lesson => (
                                <li key={lesson.id}>
                                    <div className="booking-info">
                                        <strong>Teacher: {lesson.teacher.full_name}</strong>
                                        <span>On: {new Date(lesson.requested_datetime).toLocaleDateString()}</span>
                                    </div>
                                    <div className="booking-actions">
                                        {lesson.reviews.length === 0 ? (
                                            <button className="review-btn" onClick={() => handleLeaveReview(lesson)}>Leave a Review</button>
                                        ) : (
                                            <span className="reviewed-text">Reviewed ✓</span>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : <p>You have no past lessons.</p>}
                </div>
            </div>
        </div>
    );
}

export default StudentBookingsPage;