import PropTypes from 'prop-types';
import React from 'react';

/**
 * @component TeacherPublicProfilePage
 * @category teacher
 *
 * @description
 * [Add component description]
 *
 * @example
 * ```jsx
 * import { TeacherPublicProfilePage } from './TeacherPublicProfilePage';
 *
 * function Example() {
 *   return (
 *     <TeacherPublicProfilePage>
 *       [Add example usage]
 *     </TeacherPublicProfilePage>
 *   );
 * }
 * ```
 */

// Convert the existing component content
import React, { useState, useEffect } from 'react';

import { supabase } from '../supabaseClient';

import styles from './TeacherPublicProfilePage.module.css';

// Re-usable StarRating component
const StarRating = ({ rating }) => {
  const totalStars = 5;
  const filledStars = Math.round(rating * 2) / 2;
  return (
    <div className='star-rating-display large'>
      {[...Array(totalStars)].map((_, index) => (
        <span key={index} className={index < filledStars ? 'star filled' : 'star'}>
          ★
        </span>
      ))}
      <span className='rating-text'>{Number(rating).toFixed(1)} out of 5</span>
    </div>
  );
};

function TeacherPublicProfilePage({ teacher, setPage, currentUser }) {
  const [reviewsData, setReviewsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_teacher_reviews_and_rating', {
        teacher_user_id: teacher.user_id
      });
      if (error) {
        console.error('Error fetching reviews:', error);
      } else if (data && data.length > 0) {
        setReviewsData(data[0]);
      }
      setLoading(false);
    };
    fetchReviews();

    const checkFollowStatus = async () => {
      if (!currentUser) {
        setIsFollowLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('student_follows')
          .select('*')
          .eq('student_id', currentUser.id)
          .eq('tutor_id', teacher.user_id)
          .single();

        if (data && !error) {
          setIsFollowing(true);
        }
      } catch (error) {
        // Not an error if no record is found, just means not following
      }
      setIsFollowLoading(false);
    };

    checkFollowStatus();
  }, [teacher.user_id, currentUser]);

  const handleBookLesson = () => {
    if (!currentUser) {
      alert('Please log in as a student to book a lesson.');
      setPage('auth-choice');
      return;
    }
    setPage('booking');
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      alert('Please log in to follow a teacher.');
      setPage('auth-choice');
      return;
    }

    setIsFollowLoading(true);

    if (isFollowing) {
      // Unfollow logic
      const { error } = await supabase
        .from('student_follows')
        .delete()
        .match({ student_id: currentUser.id, tutor_id: teacher.user_id });

      if (error) {
        alert('Error unfollowing teacher. Please try again.');
        console.error('Error unfollowing:', error);
      } else {
        setIsFollowing(false);
      }
    } else {
      // Follow logic
      const { error } = await supabase
        .from('student_follows')
        .insert({ student_id: currentUser.id, tutor_id: teacher.user_id });

      if (error) {
        alert('Error following teacher. Please try again.');
        console.error('Error following:', error);
      } else {
        setIsFollowing(true);
      }
    }
    setIsFollowLoading(false);
  };

  return (
    <div className='main-container'>
      <header className='main-header'>
        <h2>Teacher Profile</h2>
        <button className='back-button' onClick={() => setPage('browse-teachers')}>
          Back to Teachers
        </button>
      </header>
      <div className='content-body'>
        <div className='card profile-view-card'>
          <div className='profile-view-header'>
            <img
              src={teacher.profile_picture_url || 'https://placehold.co/150x150'}
              alt={teacher.full_name}
              className='profile-view-pfp'
            />
            <div className='profile-view-info'>
              <h3>{teacher.full_name}</h3>
              <p className='profile-view-subjects'>
                <strong>Subjects:</strong> {teacher.subjects?.join(', ')}
              </p>
              <p className='profile-view-rate'>
                <strong>Rate:</strong> {teacher.hourly_rate || 'Not specified'}
              </p>
              {loading ? (
                <p>Loading rating...</p>
              ) : (
                reviewsData?.average_rating && <StarRating rating={reviewsData.average_rating} />
              )}
            </div>
          </div>
          <div className='profile-view-body'>
            <h4>About Me</h4>
            <p>{teacher.bio}</p>
            <h4>My Availability</h4>
            <p>{teacher.availability_text || 'Not specified'}</p>
          </div>
          <div className='profile-actions'>
            <button className='book-lesson-btn' onClick={handleBookLesson}>
              Book a Lesson
            </button>
            {currentUser && currentUser.role === 'student' && (
              <button
                className={`follow-btn ${isFollowing ? 'following' : ''}`}
                onClick={handleFollowToggle}
                disabled={isFollowLoading}
              >
                {isFollowLoading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
              </button>
            )}
          </div>
        </div>

        <div className='card'>
          <h3>Student Reviews ({reviewsData?.review_count || 0})</h3>
          {loading ? (
            <p>Loading reviews...</p>
          ) : reviewsData?.reviews ? (
            <ul className='reviews-list'>
              {reviewsData.reviews.map((review, index) => (
                <li key={index} className='review-item'>
                  <div className='review-header'>
                    <strong>{review.student_name}</strong>
                    <span className='review-stars'>
                      {'★'.repeat(review.rating)}
                      {'☆'.repeat(5 - review.rating)}
                    </span>
                  </div>
                  <p className='review-text'>"{review.review_text}"</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>This teacher has not received any reviews yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

TeacherPublicProfilePage.propTypes = {
  // Add prop types
};

TeacherPublicProfilePage.defaultProps = {
  // Add default props
};

export default TeacherPublicProfilePage;
