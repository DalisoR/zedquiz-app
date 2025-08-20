import React, { useState, useEffect } from 'react';

import { useToastNotification } from '../../hooks/useToastNotification';
import { supabase } from '../../supabaseClient';

function ManageCoursePage({ currentUser, selectedCourse, setPage, setSelectedChapter }) {
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(selectedCourse || null);
  const [chapters, setChapters] = useState([]);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapter, setNewChapter] = useState({
    title: '',
    description: '',
    unlockScore: 70,
    estimatedDuration: ''
  });

  const { showSuccess, showError } = useToastNotification();

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseData();
    } else {
      setLoading(false);
    }
  }, [selectedCourse]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);

      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', selectedCourse.id)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch chapters
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select(
          `
          *,
          lessons:lessons(count)
        `
        )
        .eq('course_id', selectedCourse.id)
        .order('order_index');

      if (chaptersError) throw chaptersError;
      setChapters(chaptersData || []);
    } catch (err) {
      console.error('Error fetching course data:', err);
      showError('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddChapter = async e => {
    e.preventDefault();

    try {
      const nextOrderIndex = chapters.length + 1;

      const chapterData = {
        course_id: course.id,
        title: newChapter.title,
        description: newChapter.description,
        order_index: nextOrderIndex,
        unlock_score_required: parseInt(newChapter.unlockScore),
        estimated_duration: parseInt(newChapter.estimatedDuration) || null
      };

      const { data, error } = await supabase.from('chapters').insert(chapterData).select().single();

      if (error) throw error;

      setChapters(prev => [...prev, { ...data, lessons: [] }]);
      setNewChapter({ title: '', description: '', unlockScore: 70, estimatedDuration: '' });
      setShowAddChapter(false);
      showSuccess('Chapter added successfully!');
    } catch (err) {
      console.error('Error adding chapter:', err);
      showError('Failed to add chapter: ' + (err.message || 'Unknown error'));
    }
  };

  const handlePublishCourse = async () => {
    if (chapters.length === 0) {
      showError('Add at least one chapter before publishing');
      return;
    }

    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_published: !course.is_published })
        .eq('id', course.id);

      if (error) throw error;

      setCourse(prev => ({ ...prev, is_published: !prev.is_published }));
      showSuccess(course.is_published ? 'Course unpublished' : 'Course published successfully!');
    } catch (err) {
      console.error('Error publishing course:', err);
      showError('Failed to update course status');
    }
  };

  const handleManageChapter = chapter => {
    setSelectedChapter(chapter);
    setPage('manage-chapter');
  };

  if (loading) {
    return (
      <div className='main-container'>
        <div className='card'>
          <p>Loading course data...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className='main-container'>
        <div className='card'>
          <p>Course not found.</p>
          <button onClick={() => setPage('teacher-dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className='main-container'>
      <header className='main-header'>
        <h2>Manage Course: {course.title}</h2>
        <button className='back-button' onClick={() => setPage('manage-courses')}>
          Back to Courses
        </button>
      </header>

      <div className='content-body'>
        {/* Course Overview */}
        <div className='card'>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1rem'
            }}
          >
            <div>
              <h3>{course.title}</h3>
              <p style={{ color: '#666', margin: '0.5rem 0' }}>
                {course.subject} • {course.grade_level} • {course.difficulty_level}
              </p>
              {course.description && <p style={{ margin: '0.5rem 0' }}>{course.description}</p>}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
              <span
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  background: course.is_published ? '#e8f5e9' : '#fff3e0',
                  color: course.is_published ? '#2e7d32' : '#ef6c00'
                }}
              >
                {course.is_published ? 'Published' : 'Draft'}
              </span>
              {course.price > 0 && (
                <span style={{ fontSize: '0.875rem', color: '#666' }}>K{course.price}</span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              onClick={handlePublishCourse}
              style={{
                width: 'auto',
                background: course.is_published ? '#f57c00' : '#4caf50'
              }}
            >
              {course.is_published ? 'Unpublish Course' : 'Publish Course'}
            </button>
            <button
              onClick={() => setShowAddChapter(true)}
              style={{ width: 'auto', background: '#2196f3' }}
            >
              Add Chapter
            </button>
          </div>
        </div>

        {/* Add Chapter Form */}
        {showAddChapter && (
          <div className='card'>
            <h3>Add New Chapter</h3>
            <form onSubmit={handleAddChapter}>
              <div className='form-group'>
                <label>Chapter Title *</label>
                <input
                  type='text'
                  value={newChapter.title}
                  onChange={e => setNewChapter(prev => ({ ...prev, title: e.target.value }))}
                  placeholder='e.g., Introduction to Algebra'
                  required
                />
              </div>

              <div className='form-group'>
                <label>Chapter Description</label>
                <textarea
                  value={newChapter.description}
                  onChange={e => setNewChapter(prev => ({ ...prev, description: e.target.value }))}
                  placeholder='What will students learn in this chapter?'
                  rows={3}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className='form-group'>
                  <label>Required Score to Unlock Next Chapter (%)</label>
                  <input
                    type='number'
                    min='0'
                    max='100'
                    value={newChapter.unlockScore}
                    onChange={e =>
                      setNewChapter(prev => ({ ...prev, unlockScore: e.target.value }))
                    }
                  />
                </div>

                <div className='form-group'>
                  <label>Estimated Duration (minutes)</label>
                  <input
                    type='number'
                    min='0'
                    value={newChapter.estimatedDuration}
                    onChange={e =>
                      setNewChapter(prev => ({ ...prev, estimatedDuration: e.target.value }))
                    }
                    placeholder='e.g., 60'
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type='submit' style={{ width: 'auto' }}>
                  Add Chapter
                </button>
                <button
                  type='button'
                  onClick={() => setShowAddChapter(false)}
                  style={{ width: 'auto', background: '#6b7280' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Chapters List */}
        <div className='card'>
          <h3>Course Chapters ({chapters.length})</h3>

          {chapters.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              <p>No chapters yet. Add your first chapter to get started!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {chapters.map((chapter, index) => (
                <div
                  key={chapter.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '1rem',
                    background: '#f9fafb'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.5rem 0' }}>
                        Chapter {chapter.order_index}: {chapter.title}
                      </h4>
                      {chapter.description && (
                        <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>
                          {chapter.description}
                        </p>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          gap: '1rem',
                          fontSize: '0.875rem',
                          color: '#666'
                        }}
                      >
                        <span>Lessons: {chapter.lessons?.[0]?.count || 0}</span>
                        <span>Unlock Score: {chapter.unlock_score_required}%</span>
                        {chapter.estimated_duration && (
                          <span>Duration: {chapter.estimated_duration} min</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleManageChapter(chapter)}
                      style={{
                        width: 'auto',
                        background: '#3b82f6',
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ManageCoursePage;
