import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useToastNotification } from '../hooks/useToastNotification';

function StudentCoursesPage({ currentUser, setPage, setSelectedCourse }) {
  const [loading, setLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [filter, setFilter] = useState('all'); // all, in-progress, completed

  const { showError } = useToastNotification();

  useEffect(() => {
    fetchEnrolledCourses();
  }, [currentUser, filter]);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('student_course_enrollments')
        .select(
          `
          *,
          course:courses(
            *,
            teacher:profiles!courses_teacher_id_fkey(full_name),
            chapters:chapters(count)
          )
        `
        )
        .eq('student_id', currentUser.id);

      // Apply filter
      if (filter === 'completed') {
        query = query.gte('completion_percentage', 100);
      } else if (filter === 'in-progress') {
        query = query.gt('completion_percentage', 0).lt('completion_percentage', 100);
      }

      const { data, error } = await query.order('last_accessed', { ascending: false });

      if (error) throw error;

      // Fetch detailed progress for each course
      const coursesWithProgress = await Promise.all(
        (data || []).map(async enrollment => {
          const progress = await fetchCourseProgress(enrollment.course.id);
          return {
            ...enrollment,
            detailedProgress: progress
          };
        })
      );

      setEnrolledCourses(coursesWithProgress);
    } catch (err) {
      console.error('Error fetching enrolled courses:', err);
      showError('Failed to load your courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseProgress = async courseId => {
    try {
      // Get total lessons and completed lessons
      const { data: progressData, error } = await supabase
        .from('student_progress')
        .select('lesson_id, completion_status')
        .eq('student_id', currentUser.id)
        .eq('course_id', courseId);

      if (error) throw error;

      const completedLessons = progressData.filter(p => p.completion_status === 'completed').length;
      const totalLessons = progressData.length;

      // Get video progress
      const { data: videoData, error: videoError } = await supabase
        .from('video_progress')
        .select(
          `
          mandatory_completed,
          video:video_content(
            lesson:lessons(course_id)
          )
        `
        )
        .eq('student_id', currentUser.id);

      if (videoError) throw videoError;

      const courseVideos = videoData.filter(v => v.video?.lesson?.course_id === courseId);
      const completedVideos = courseVideos.filter(v => v.mandatory_completed).length;

      return {
        completedLessons,
        totalLessons,
        completedVideos,
        totalVideos: courseVideos.length
      };
    } catch (err) {
      console.error('Error fetching course progress:', err);
      return {
        completedLessons: 0,
        totalLessons: 0,
        completedVideos: 0,
        totalVideos: 0
      };
    }
  };

  const handleContinueCourse = enrollment => {
    setSelectedCourse(enrollment.course);
    setPage('course-overview');
  };

  const getProgressColor = percentage => {
    if (percentage >= 100) return '#10b981';
    if (percentage >= 70) return '#3b82f6';
    if (percentage >= 30) return '#f59e0b';
    return '#ef4444';
  };

  const formatLastAccessed = dateString => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className='main-container'>
      <header className='main-header'>
        <h2>My Courses</h2>
        <button className='back-button' onClick={() => setPage('dashboard')}>
          Back to Dashboard
        </button>
      </header>

      <div className='content-body'>
        {/* Filter Tabs */}
        <div className='card'>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {[
              { key: 'all', label: 'All Courses' },
              { key: 'in-progress', label: 'In Progress' },
              { key: 'completed', label: 'Completed' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                style={{
                  width: 'auto',
                  background: filter === key ? '#3b82f6' : '#f3f4f6',
                  color: filter === key ? 'white' : '#374151',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem'
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, color: '#666' }}>
              {enrolledCourses.length} course{enrolledCourses.length !== 1 ? 's' : ''} enrolled
            </p>
            <button
              onClick={() => setPage('browse-courses')}
              style={{
                width: 'auto',
                background: '#4caf50',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem'
              }}
            >
              Browse More Courses
            </button>
          </div>
        </div>

        {/* Courses List */}
        <div className='card'>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Loading your courses...</p>
            </div>
          ) : enrolledCourses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
              <h4>No courses found</h4>
              <p>
                {filter === 'all'
                  ? "You haven't enrolled in any courses yet."
                  : `No ${filter.replace('-', ' ')} courses found.`}
              </p>
              <button
                onClick={() => setPage('browse-courses')}
                style={{ width: 'auto', marginTop: '1rem' }}
              >
                Explore Courses
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {enrolledCourses.map(enrollment => {
                const course = enrollment.course;
                const progress = enrollment.detailedProgress;
                const completionPercentage = enrollment.completion_percentage || 0;

                return (
                  <div
                    key={enrollment.id}
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
                          <h3 style={{ margin: 0 }}>{course.title}</h3>
                          <span
                            style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: course.price === 0 ? '#e8f5e9' : '#fff3e0',
                              color: course.price === 0 ? '#2e7d32' : '#ef6c00'
                            }}
                          >
                            {course.price === 0 ? 'Free' : `K${course.price}`}
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

                        {/* Progress Bar */}
                        <div style={{ margin: '1rem 0' }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '0.5rem'
                            }}
                          >
                            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                              Progress: {Math.round(completionPercentage)}%
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#666' }}>
                              {progress.completedLessons}/{progress.totalLessons} lessons completed
                            </span>
                          </div>
                          <div
                            style={{
                              width: '100%',
                              height: '8px',
                              background: '#e5e7eb',
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}
                          >
                            <div
                              style={{
                                width: `${completionPercentage}%`,
                                height: '100%',
                                background: getProgressColor(completionPercentage),
                                borderRadius: '4px',
                                transition: 'width 0.3s'
                              }}
                            />
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            gap: '1.5rem',
                            fontSize: '0.875rem',
                            color: '#666'
                          }}
                        >
                          <span>📚 {course.chapters?.[0]?.count || 0} chapters</span>
                          <span>
                            🎥 {progress.completedVideos}/{progress.totalVideos} videos watched
                          </span>
                          <span>👨‍🏫 {course.teacher?.full_name || 'Unknown Teacher'}</span>
                        </div>

                        <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#666' }}>
                          Last accessed: {formatLastAccessed(enrollment.last_accessed)}
                        </div>
                      </div>

                      <div
                        style={{
                          marginLeft: '2rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem'
                        }}
                      >
                        <button
                          onClick={() => handleContinueCourse(enrollment)}
                          style={{
                            width: 'auto',
                            background: completionPercentage >= 100 ? '#10b981' : '#3b82f6',
                            padding: '0.75rem 1.5rem',
                            fontSize: '0.875rem',
                            fontWeight: 600
                          }}
                        >
                          {completionPercentage >= 100 ? 'Review Course' : 'Continue Learning'}
                        </button>

                        {completionPercentage >= 100 && (
                          <div
                            style={{
                              textAlign: 'center',
                              padding: '0.5rem',
                              background: '#e8f5e9',
                              color: '#2e7d32',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          >
                            ✓ Completed
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {enrolledCourses.length > 0 && (
          <div className='card'>
            <h3>Learning Statistics</h3>
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
                  {enrolledCourses.length}
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
                  {enrolledCourses.filter(e => e.completion_percentage >= 100).length}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>Completed</div>
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
                  {
                    enrolledCourses.filter(
                      e => e.completion_percentage > 0 && e.completion_percentage < 100
                    ).length
                  }
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>In Progress</div>
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
                  {Math.round(
                    enrolledCourses.reduce((sum, e) => sum + (e.completion_percentage || 0), 0) /
                      enrolledCourses.length
                  ) || 0}
                  %
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>Average Progress</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentCoursesPage;
