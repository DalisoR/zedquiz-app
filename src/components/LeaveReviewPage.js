import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

function LeaveReviewPage({ currentUser, booking, setPage }) {
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitReview = async event => {
    event.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('reviews').insert({
      booking_id: booking.id,
      teacher_id: booking.teacher_id,
      student_id: currentUser.id,
      rating: rating,
      review_text: reviewText
    });

    if (error) {
      alert('Error submitting review: ' + error.message);
    } else {
      alert('Thank you for your feedback!');
      setPage('student-bookings');
    }
    setLoading(false);
  };

  return (
    <div className='main-container'>
      <header className='main-header'>
        <h2>Leave a Review</h2>
        <button className='back-button' onClick={() => setPage('student-bookings')}>
          Back to Lessons
        </button>
      </header>
      <div className='content-body'>
        <div className='card'>
          <h3>Review for your lesson with {booking.teacher.full_name}</h3>
          <form onSubmit={handleSubmitReview}>
            <div className='form-group'>
              <label>Star Rating</label>
              <div className='star-rating'>
                {[...Array(5)].map((_, index) => {
                  const ratingValue = index + 1;
                  return (
                    <span
                      key={ratingValue}
                      className={ratingValue <= rating ? 'star filled' : 'star'}
                      onClick={() => setRating(ratingValue)}
                    >
                      ★
                    </span>
                  );
                })}
              </div>
            </div>
            <div className='form-group'>
              <label htmlFor='review-text'>Your Feedback</label>
              <textarea
                id='review-text'
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder='How was your lesson? What did you enjoy or think could be improved?'
                required
              />
            </div>
            <button type='submit' disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LeaveReviewPage;
