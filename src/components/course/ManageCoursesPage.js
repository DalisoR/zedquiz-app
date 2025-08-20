import React, { useState, useEffect } from 'react';

import { useToastNotification } from '../hooks/useToastNotification';
import { supabase } from '../supabaseClient';

function ManageCoursesPage({ currentUser, setPage, setSelectedCourse }) {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);

  const { showError } = useToastNotification();

  useEffect(() => {
    fetchCourses();
  }, [currentUser]);

  const fetchCourses = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('courses')
        .select(
          `
          *,
          chapters:chapters(count),
          enrollments:student_course_enrollments(count)
        `
        )
        .eq('teacher_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
      showError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleManageCourse = course => {
    setSelectedCourse(course);
    setPage('manage-course');
  };

  const handleDeleteCourse = async (courseId, courseTitle) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${courseTitle}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase.from('courses').delete().eq('id', courseId);

      if (error) throw error;

      setCourses(prev => prev.filter(course => course.id !== courseId));
      showError('Course deleted successfully');
    } catch (err) {
      console.error('Error deleting course:', err);
      showError('Failed to delete course: ' + (err.message || 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className='main-container'>
        <div className='card'>
          <p>Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='main-container'>
      <header className='main-header'>
        <h2>My Courses</h2>
        <button className='back-button' onClick={() => setPage('teacher-dashboard')}>
          Back to Dashboard
        </button>
      </header>

      <div className='content-body'>
        <div className='card'>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}
          >
            <h3>Your Courses ({courses.length})</h3>
            <button
              onClick={() => setPage('create-course')}
              style={{ width: 'auto', background: '#4caf50' }}
            >
              Create New Course
            </button>
          </div>

          {courses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
              <h4>No courses yet</h4>
              <p>Create your first course to start teaching online!</p>
              <button
                onClick={() => setPage('create-course')}
                style={{ width: 'auto', marginTop: '1rem' }}
              >
                Create Your First Course
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {courses.map(course => (
                <div
                  key={course.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    background: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
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
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          marginBottom: '0.5rem'
                        }}
                      >
                        <h4 style={{ margin: 0 }}>{course.title}</h4>
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: course.is_published ? '#e8f5e9' : '#fff3e0',
                            color: course.is_published ? '#2e7d32' : '#ef6c00'
                          }}
                        >
                          {course.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>

                      <p style={{ color: '#666', margin: '0.5rem 0', fontSize: '0.9rem' }}>
                        {course.subject} • {course.grade_level} • {course.difficulty_level}
                      </p>

                      {course.description && (
                        <p style={{ margin: '0.5rem 0', color: '#555' }}>
                          {course.description.length > 150
                            ? course.description.substring(0, 150) + '...'
                            : course.description}
                        </p>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          gap: '1.5rem',
                          marginTop: '1rem',
                          fontSize: '0.875rem',
                          color: '#666'
                        }}
                      >
                        <span>📚 {course.chapters?.[0]?.count || 0} chapters</span>
                        <span>👥 {course.enrollments?.[0]?.count || 0} students</span>
                        {course.price > 0 && <span>💰 K{course.price}</span>}
                        {course.estimated_hours && <span>⏱️ {course.estimated_hours}h</span>}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        marginLeft: '1rem'
                      }}
                    >
                      <button
                        onClick={() => handleManageCourse(course)}
                        style={{
                          width: 'auto',
                          background: '#3b82f6',
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem'
                        }}
                      >
                        Manage
                      </button>

                      <button
                        onClick={() => handleDeleteCourse(course.id, course.title)}
                        style={{
                          width: 'auto',
                          background: '#ef4444',
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid #f3f4f6',
                      fontSize: '0.875rem',
                      color: '#666'
                    }}
                  >
                    Created: {new Date(course.created_at).toLocaleDateString()}
                    {course.updated_at !== course.created_at && (
                      <span> • Updated: {new Date(course.updated_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {courses.length > 0 && (
          <div className='card' style={{ marginTop: '1rem' }}>
            <h3>Quick Stats</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem'
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  padding: '1rem',
                  background: '#f8f9fa',
                  borderRadius: '8px'
                }}
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                  {courses.length}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>Total Courses</div>
              </div>

              <div
                style={{
                  textAlign: 'center',
                  padding: '1rem',
                  background: '#f8f9fa',
                  borderRadius: '8px'
                }}
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                  {courses.filter(c => c.is_published).length}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>Published</div>
              </div>

              <div
                style={{
                  textAlign: 'center',
                  padding: '1rem',
                  background: '#f8f9fa',
                  borderRadius: '8px'
                }}
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                  {courses.reduce((sum, c) => sum + (c.enrollments?.[0]?.count || 0), 0)}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>Total Students</div>
              </div>

              <div
                style={{
                  textAlign: 'center',
                  padding: '1rem',
                  background: '#f8f9fa',
                  borderRadius: '8px'
                }}
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                  {courses.reduce((sum, c) => sum + (c.chapters?.[0]?.count || 0), 0)}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>Total Chapters</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageCoursesPage;
