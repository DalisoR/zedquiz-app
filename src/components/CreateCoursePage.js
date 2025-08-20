import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useToastNotification } from '../hooks/useToastNotification';

function CreateCoursePage({ currentUser, setPage, setSelectedCourse }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    gradeLevel: 'Grade 1',
    estimatedHours: '',
    difficultyLevel: 'beginner',
    price: '0'
  });

  const { showSuccess, showError } = useToastNotification();

  const juniorSubjects = [
    'Mathematics',
    'English Language',
    'Integrated Science',
    'Social Studies',
    'Creative & Technology Studies',
    'Cinyanja'
  ];
  const seniorSubjects = [
    'Mathematics',
    'Science',
    'English',
    'History',
    'Geography',
    'Civics',
    'Religious Education',
    'Computer Studies',
    'Business Studies',
    'Agricultural Science',
    'Icibemba',
    'Chitonga'
  ];
  const aLevelSubjects = ['Biology', 'Physics', 'Maths', 'Chemistry', 'English'];

  const getSubjectsForGrade = grade => {
    if (grade.includes('Grade')) return juniorSubjects;
    if (grade.includes('Form')) return seniorSubjects;
    if (grade.includes('A Levels')) return aLevelSubjects;
    return [];
  };

  const gradeLevels = [
    'Grade 1',
    'Grade 2',
    'Grade 3',
    'Grade 4',
    'Grade 5',
    'Grade 6',
    'Form 1',
    'Form 2',
    'Form 3',
    'Form 4',
    'Form 5',
    'A Levels'
  ];
  const subjects = getSubjectsForGrade(formData.gradeLevel);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateCourse = async e => {
    e.preventDefault();

    if (!currentUser) {
      showError('Please log in to create a course.');
      return;
    }

    setLoading(true);

    try {
      const courseData = {
        title: formData.title,
        description: formData.description,
        teacher_id: currentUser.id,
        subject: formData.subject,
        grade_level: formData.gradeLevel,
        estimated_hours: parseFloat(formData.estimatedHours) || null,
        difficulty_level: formData.difficultyLevel,
        price: parseFloat(formData.price) || 0,
        is_published: false // Start as draft
      };

      const { data, error } = await supabase.from('courses').insert(courseData).select().single();

      if (error) throw error;

      showSuccess('Course created successfully! Now add chapters and lessons.');
      setSelectedCourse(data);
      setPage('manage-course');
    } catch (err) {
      console.error('Error creating course:', err);
      showError('Failed to create course: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='main-container'>
      <header className='main-header'>
        <h2>Create New Course</h2>
        <button className='back-button' onClick={() => setPage('teacher-dashboard')}>
          Back to Dashboard
        </button>
      </header>

      <div className='content-body'>
        <div className='card'>
          <h3>Course Information</h3>
          <form onSubmit={handleCreateCourse}>
            <div className='form-group'>
              <label htmlFor='title'>Course Title *</label>
              <input
                id='title'
                type='text'
                value={formData.title}
                onChange={e => handleInputChange('title', e.target.value)}
                placeholder='e.g., Complete Mathematics for Form 4'
                required
              />
            </div>

            <div className='form-group'>
              <label htmlFor='description'>Course Description</label>
              <textarea
                id='description'
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                placeholder='Describe what students will learn in this course...'
                rows={4}
              />
            </div>

            <div className='form-group'>
              <label htmlFor='gradeLevel'>Grade Level *</label>
              <select
                id='gradeLevel'
                value={formData.gradeLevel}
                onChange={e => handleInputChange('gradeLevel', e.target.value)}
                required
              >
                {gradeLevels.map(grade => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>

            <div className='form-group'>
              <label htmlFor='subject'>Subject *</label>
              <select
                id='subject'
                value={formData.subject}
                onChange={e => handleInputChange('subject', e.target.value)}
                required
              >
                <option value=''>-- Select a subject --</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div className='form-group'>
              <label htmlFor='estimatedHours'>Estimated Course Duration (hours)</label>
              <input
                id='estimatedHours'
                type='number'
                step='0.5'
                min='0'
                value={formData.estimatedHours}
                onChange={e => handleInputChange('estimatedHours', e.target.value)}
                placeholder='e.g., 20'
              />
            </div>

            <div className='form-group'>
              <label htmlFor='difficultyLevel'>Difficulty Level</label>
              <select
                id='difficultyLevel'
                value={formData.difficultyLevel}
                onChange={e => handleInputChange('difficultyLevel', e.target.value)}
              >
                <option value='beginner'>Beginner</option>
                <option value='intermediate'>Intermediate</option>
                <option value='advanced'>Advanced</option>
              </select>
            </div>

            <div className='form-group'>
              <label htmlFor='price'>Course Price (ZMW)</label>
              <input
                id='price'
                type='number'
                step='0.01'
                min='0'
                value={formData.price}
                onChange={e => handleInputChange('price', e.target.value)}
                placeholder='0 for free course'
              />
              <small style={{ color: '#666', fontSize: '0.875rem' }}>
                Set to 0 for a free course. You can change this later.
              </small>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <button type='submit' disabled={loading}>
                {loading ? 'Creating Course...' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>

        <div className='card' style={{ marginTop: '1rem', background: '#f8f9fa' }}>
          <h4>📚 What happens next?</h4>
          <ul style={{ margin: '1rem 0', paddingLeft: '1.5rem' }}>
            <li>Your course will be created as a draft</li>
            <li>Add chapters to organize your content</li>
            <li>Create lessons with videos, notes, and quizzes</li>
            <li>Preview and test your course</li>
            <li>Publish when ready for students</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default CreateCoursePage;
