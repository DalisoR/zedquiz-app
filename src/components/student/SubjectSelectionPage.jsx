import PropTypes from 'prop-types';
import React from 'react';

/**
 * @component SubjectSelectionPage
 * @category student
 *
 * @description
 * [Add component description]
 *
 * @example
 * ```jsx
 * import { SubjectSelectionPage } from './SubjectSelectionPage';
 *
 * function Example() {
 *   return (
 *     <SubjectSelectionPage>
 *       [Add example usage]
 *     </SubjectSelectionPage>
 *   );
 * }
 * ```
 */

// Convert the existing component content
import React, { useState, useEffect } from 'react';

import { supabase } from '../supabaseClient';

import styles from './SubjectSelectionPage.module.css';

function SubjectSelectionPage({ currentUser, setPage, setSelectedSubject }) {
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      // Fetch unique subjects from quizzes that are published (publish_date is today or in the past)
      const { data, error } = await supabase
        .from('quizzes')
        .select('subject')
        .eq('grade_level', currentUser.grade_level)
        .lte('publish_date', new Date().toISOString()); // lte means 'less than or equal to'

      if (error) {
        console.error('Error fetching subjects:', error);
      } else if (data) {
        const uniqueSubjects = [...new Set(data.map(item => item.subject))];
        setAvailableSubjects(uniqueSubjects);
      }
      setLoading(false);
    };

    fetchSubjects();
  }, [currentUser.grade_level]);

  const handleSubjectSelect = subject => {
    setSelectedSubject(subject);
    setPage('quiz');
  };

  return (
    <div className='main-container'>
      <header className='main-header'>
        <h2>Select a Subject</h2>
        <button className='back-button' onClick={() => setPage('dashboard')}>
          Back to Dashboard
        </button>
      </header>
      <div className='content-body'>
        <div className='subject-list'>
          {loading ? (
            <p>Loading subjects...</p>
          ) : availableSubjects.length > 0 ? (
            availableSubjects.map(subject => (
              <button
                key={subject}
                className='subject-button'
                onClick={() => handleSubjectSelect(subject)}
              >
                {subject}
              </button>
            ))
          ) : (
            <div className='card'>
              <p>
                No quizzes are available for your grade level ({currentUser.grade_level}) yet.
                Please check back later!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

SubjectSelectionPage.propTypes = {
  // Add prop types
};

SubjectSelectionPage.defaultProps = {
  // Add default props
};

export default SubjectSelectionPage;
