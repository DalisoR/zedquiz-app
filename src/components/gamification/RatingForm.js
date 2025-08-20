import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import './RatingForm.css'; // We will create this file next

const RatingForm = ({ contentId, contentType, tutorId, studentId, onRatingSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating before submitting.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const { data, error: submissionError } = await supabase.from('content_ratings').insert([
        {
          content_id: contentId,
          content_type: contentType,
          tutor_id: tutorId,
          student_id: studentId,
          rating: rating,
          comment: comment
        }
      ]);

      if (submissionError) {
        throw submissionError;
      }

      setMessage('Thank you for your feedback!');
      if (onRatingSubmitted) {
        onRatingSubmitted(data[0]);
      }
      // Reset form after a delay
      setTimeout(() => {
        setRating(0);
        setComment('');
        setMessage('');
      }, 3000);
    } catch (err) {
      setError('There was an error submitting your rating. Please try again.');
      console.error('Rating submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='rating-form-container'>
      <h3>Rate this {contentType}</h3>
      {error && <p className='error-message'>{error}</p>}
      {message && <p className='success-message'>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div className='star-rating'>
          {[...Array(5)].map((_, index) => {
            const ratingValue = index + 1;
            return (
              <label key={ratingValue}>
                <input
                  type='radio'
                  name='rating'
                  value={ratingValue}
                  onClick={() => setRating(ratingValue)}
                  disabled={isSubmitting || !!message}
                />
                <span className={ratingValue <= rating ? 'filled' : ''}>&#9733;</span>
              </label>
            );
          })}
        </div>
        <textarea
          placeholder='Leave a comment (optional)'
          value={comment}
          onChange={e => setComment(e.target.value)}
          disabled={isSubmitting || !!message}
        />
        <button type='submit' disabled={isSubmitting || !!message}>
          {isSubmitting ? 'Submitting...' : 'Submit Rating'}
        </button>
      </form>
    </div>
  );
};

export default RatingForm;
