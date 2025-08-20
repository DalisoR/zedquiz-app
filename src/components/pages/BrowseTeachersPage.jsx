import React, { useState, useEffect } from 'react';

import { supabase } from '../supabaseClient';

// A simple component to render stars
const StarRating = ({ rating }) => {
  const totalStars = 5;
  const filledStars = Math.round(rating * 2) / 2; // Round to nearest half
  return (
    <div className='star-rating-display'>
      {[...Array(totalStars)].map((_, index) => {
        const starValue = index + 1;
        return (
          <span key={index} className={starValue <= filledStars ? 'star filled' : 'star'}>
            ★
          </span>
        );
      })}
    </div>
  );
};

function BrowseTeachersPage({ setPage, setSelectedTeacher }) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_teachers');

      if (error) {
        console.error('Error fetching teachers:', error);
        alert('Could not fetch teachers list.');
      } else {
        setTeachers(data);
      }
      setLoading(false);
    };
    fetchTeachers();
  }, []);

  const handleViewProfile = teacher => {
    setSelectedTeacher(teacher);
    setPage('teacher-public-profile');
  };

  return (
    <div className='main-container'>
      <header className='main-header'>
        <h2>Find a Teacher</h2>
        <button className='back-button' onClick={() => setPage('landing')}>
          Back to Home
        </button>
      </header>
      <div className='content-body'>
        <div className='card'>
          <h3>Our Qualified Educators</h3>
          {loading ? (
            <p>Loading teachers...</p>
          ) : teachers.length > 0 ? (
            <div className='teachers-grid'>
              {teachers.map(teacher => (
                <div key={teacher.user_id} className='teacher-card'>
                  <img
                    src={
                      teacher.profile_picture_url ||
                      '[https://placehold.co/150x150](https://placehold.co/150x150)'
                    }
                    alt={teacher.full_name}
                    className='teacher-pfp'
                  />
                  <h4>{teacher.full_name}</h4>
                  {teacher.average_rating && <StarRating rating={teacher.average_rating} />}
                  <p className='teacher-subjects'>{teacher.subjects?.join(', ')}</p>
                  <p className='teacher-bio'>{teacher.bio?.substring(0, 100)}...</p>
                  <button className='view-profile-btn' onClick={() => handleViewProfile(teacher)}>
                    View Profile
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>There are no teachers available at the moment. Please check back soon!</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default BrowseTeachersPage;
