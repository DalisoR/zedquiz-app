import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function TeacherAvailabilityPage({ currentUser, setPage }) {
    const [loading, setLoading] = useState(false);
    const [availability, setAvailability] = useState('');
    const [rate, setRate] = useState('');

    useEffect(() => {
        // Load existing data when the page loads
        setAvailability(currentUser.availability_text || '');
        setRate(currentUser.hourly_rate || '');
    }, [currentUser]);

    const handleUpdateAvailability = async (event) => {
        event.preventDefault();
        setLoading(true);

        const { error } = await supabase
            .from('profiles')
            .update({
                availability_text: availability,
                hourly_rate: rate,
            })
            .eq('id', currentUser.id);

        if (error) {
            alert('Error updating availability: ' + error.message);
        } else {
            alert('Availability updated successfully!');
            // A more advanced app would refresh the profile data in App.js
            setPage('teacher-dashboard');
        }
        setLoading(false);
    };

    return (
        <div className="main-container">
            <header className="main-header admin-header">
                <h2>Set My Availability & Rate</h2>
                <button className="back-button" onClick={() => setPage('teacher-dashboard')}>Back to Dashboard</button>
            </header>
            <div className="content-body">
                <div className="card">
                    <form onSubmit={handleUpdateAvailability}>
                        <div className="form-group">
                            <label htmlFor="availability">General Availability</label>
                            <textarea 
                                id="availability" 
                                value={availability} 
                                onChange={(e) => setAvailability(e.target.value)} 
                                placeholder="e.g., Weekdays from 16:00 to 20:00. Weekends from 10:00 to 18:00." 
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="rate">My Hourly Rate</label>
                            <input 
                                id="rate" 
                                type="text" 
                                value={rate} 
                                onChange={(e) => setRate(e.target.value)} 
                                placeholder="e.g., K150 per hour" 
                            />
                        </div>
                        <button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Availability'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default TeacherAvailabilityPage;