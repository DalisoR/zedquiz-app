import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useToastNotification } from '../hooks/useToastNotification';

function CourseOverviewPage({ currentUser, selectedCourse, setPage, setSelectedChapter, setSelectedLesson }) {
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(selectedCourse || null);
  const [chapters, setChapters] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [progress, setProgress] = useState({});

  const { showSuccess, showError } = useToastNotification();

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseData();
    } else {
      setLoading(false);
    }
  }, [selectedCourse, currentUser]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);

      // Fetch course with teacher info
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          teacher:profiles!courses_teacher_id_fkey(full_name, bio)
        `)
        .eq('id', selectedCourse.id)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch chapters with lessons
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select(`
          *,
          lessons:lessons(
            id, title, description, order_index, lesson_type, 
            estimated_duration, is_mandatory,
            videos:video_content(count),
            attachments:lesson_attachments(count)
          )
        `)
        .eq('course_id', selectedCourse.id)
        .eq('is_published', true)
        .order('order_index');

      if (chaptersError) throw chaptersError;
      setChapters(chaptersData || []);

      // Check enrollment status
      if (currentUser) {
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('student_course_enrollments')
          .select('*')
          .eq('student_id', currentUser.id)
          .eq('course_id', selectedCourse.id)
          .single();

        if (enrollmentError && enrollmentError.code !== 'PGRST116') {
          throw enrollmentError;
        }
        setEnrollment(enrollmentData);

        // Fetch progress if enrolled
        if (enrollmentData) {
          await fetchProgress();
        }
      }
    } catch (err) {
      console.error('Error fetching course data:', err);
      showError('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const { data: progressData, error: progressError } = await supabase
        .from('student_progress')
        .select('lesson_id, completion_status')
        .eq('student_id', currentUser.id)
        .eq('course_id', selectedCourse.id);

      if (progressError) throw progressError;

      const progressMap = {};
      progressData.forEach(p => {
        progressMap[p.lesson_id] = p.completion_status;
      });
      setProgress(progressMap);
    } catch (err) {
      console.error('Error fetching progress:', err);
    }
  };

  const handleEnrollCourse = async () => {
    if (!currentUser) {
      showError('Please log in to enroll in courses');
      setPage('auth-choice');
      return;
    }

    try {
      // Check if course is paid and user needs to pay
      if (course.price > 0 && currentUser.subscription_tier !== 'premium') {
        showError('This is a premium course. Please upgrade to access paid courses.');
        setPage('upgrade');
        return;
      }

      const { data, error } = await supabase
        .from('student_course_enrollments')
        .insert({
          student_id: currentUser.id,
          course_id: course.id,
          payment_status: course.price > 0 ? 'paid' : 'free'
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          showError('You are already enrolled in this course');
          return;
        }
        throw error;
      }

      setEnrollment(data);
      showSuccess('Successfully enrolled in course!');
    } catch (err) {
      console.error('Error enrolling in course:', err);
      showError('Failed to enroll in course: ' + (err.message || 'Unknown error'));
    }
  };

  const handleStartLesson = (chapter, lesson) => {
    setSelectedChapter(chapter);
    setSelectedLesson(lesson);
    setPage('lesson-viewer');
  };

  const canAccessChapter = (chapterIndex) => {
    if (chapterIndex === 0) return true; // First chapter always accessible
    
    // Check if previous chapter is completed (simplified logic)
    const previousChapter = chapters[chapterIndex - 1];
    if (!previousChapter) return false;
    
    // For now, assume chapter is accessible if any lesson in previous chapter is completed
    const hasCompletedLessons = previousChapter.lessons?.some(lesson => 
      progress[lesson.id] === 'completed'
    );
    
    return hasCompletedLessons;
  };

  const getChapterProgress = (chapter) => {
    if (!chapter.lessons || chapter.lessons.length === 0) return 0;
    
    const completedLessons = chapter.lessons.filter(lesson => 
      progress[lesson.id] === 'completed'
    ).length;
    
    return Math.round((completedLessons / chapter.lessons.length) * 100);
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="main-container">
        <div className="card">
          <p>Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="main-container">
        <div className="card">
          <p>Course not found.</p>
          <button onClick={() => setPage('browse-courses')}>Back to Courses</button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <header className="main-header">
        <h2>{course.title}</h2>
        <button className="back-button" onClick={() => setPage('browse-courses')}>
          Back to Courses
        </button>
      </header>

      <div className="content-body">
        {/* Course Header */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <h3>{course.title}</h3>
              <p style={{ color: '#666', margin: '0.5rem 0' }}>
                {course.subject} • {course.grade_level} • {course.difficulty_level}
              </p>
              {course.description && (
                <p style={{ margin: '1rem 0', color: '#555' }}>{course.description}</p>
              )}
              
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
                <span>📚 {chapters.length} chapters</span>
                {course.estimated_hours && <span>⏱️ {course.estimated_hours} hours</span>}
                <span>👨‍🏫 {course.teacher?.full_name || 'Unknown Teacher'}</span>
                <span style={{ 
                  color: course.price === 0 ? '#10b981' : '#f59e0b',
                  fontWeight: 600 
                }}>
                  {course.price === 0 ? 'Free' : `K${course.price}`}
                </span>
              </div>
            </div>

            <div style={{ marginLeft: '2rem' }}>
              {enrollment ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    padding: '0.5rem 1rem',
                    background: '#e8f5e9',
                    color: '#2e7d32',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    marginBottom: '1rem'
                  }}>
                    ✓ Enrolled
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>
                    Progress: {enrollment.completion_percentage || 0}%
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleEnrollCourse}
                  style={{
                    background: '#4caf50',
                    padding: '1rem 2rem',
                    fontSize: '1rem',
                    fontWeight: 600
                  }}
                >
                  Enroll Now
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="card">
          <h3>Course Content</h3>
          
          {chapters.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              <p>This course doesn't have any published chapters yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {chapters.map((chapter, chapterIndex) => {
                const isAccessible = enrollment && canAccessChapter(chapterIndex);
                const chapterProgress = getChapterProgress(chapter);
                
                return (
                  <div
                    key={chapter.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      background: isAccessible ? '#f9fafb' : '#f3f4f6',
                      opacity: isAccessible ? 1 : 0.7
                    }}
                  >
                    <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ margin: '0 0 0.5rem 0' }}>
                            Chapter {chapter.order_index}: {chapter.title}
                            {!isAccessible && (
                              <span style={{ 
                                marginLeft: '0.5rem', 
                                fontSize: '0.75rem', 
                                color: '#ef4444',
                                background: '#fee2e2',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '12px'
                              }}>
                                🔒 Locked
                              </span>
                            )}
                          </h4>
                          {chapter.description && (
                            <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
                              {chapter.description}
                            </p>
                          )}
                        </div>
                        {enrollment && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.875rem', color: '#666' }}>
                              Progress: {chapterProgress}%
                            </div>
                            <div style={{
                              width: '100px',
                              height: '4px',
                              background: '#e5e7eb',
                              borderRadius: '2px',
                              marginTop: '0.25rem'
                            }}>
                              <div style={{
                                width: `${chapterProgress}%`,
                                height: '100%',
                                background: '#10b981',
                                borderRadius: '2px',
                                transition: 'width 0.3s'
                              }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Lessons */}
                    {chapter.lessons && chapter.lessons.length > 0 && (
                      <div style={{ padding: '0.5rem' }}>
                        {chapter.lessons.map((lesson) => {
                          const lessonProgress = progress[lesson.id];
                          const isCompleted = lessonProgress === 'completed';
                          
                          return (
                            <div
                              key={lesson.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.75rem',
                                margin: '0.25rem 0',
                                background: 'white',
                                borderRadius: '6px',
                                border: '1px solid #e5e7eb'
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ 
                                    color: isCompleted ? '#10b981' : '#6b7280',
                                    fontSize: '1rem'
                                  }}>
                                    {isCompleted ? '✓' : '○'}
                                  </span>
                                  <h5 style={{ margin: 0, fontSize: '0.9rem' }}>
                                    Lesson {lesson.order_index}: {lesson.title}
                                  </h5>
                                  {lesson.is_mandatory && (
                                    <span style={{
                                      fontSize: '0.75rem',
                                      color: '#ef4444',
                                      background: '#fee2e2',
                                      padding: '0.125rem 0.375rem',
                                      borderRadius: '8px'
                                    }}>
                                      Required
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                                  <span>{lesson.lesson_type}</span>
                                  <span>🎥 {lesson.videos?.[0]?.count || 0} videos</span>
                                  <span>📎 {lesson.attachments?.[0]?.count || 0} files</span>
                                  {lesson.estimated_duration && (
                                    <span>⏱️ {formatDuration(lesson.estimated_duration)}</span>
                                  )}
                                </div>
                              </div>
                              
                              {enrollment && isAccessible && (
                                <button
                                  onClick={() => handleStartLesson(chapter, lesson)}
                                  style={{
                                    width: 'auto',
                                    background: isCompleted ? '#10b981' : '#3b82f6',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.875rem'
                                  }}
                                >
                                  {isCompleted ? 'Review' : 'Start'}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Teacher Info */}
        {course.teacher && (
          <div className="card">
            <h3>About the Instructor</h3>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                color: '#6b7280'
              }}>
                👨‍🏫
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>{course.teacher.full_name}</h4>
                {course.teacher.bio && (
                  <p style={{ margin: 0, color: '#666' }}>{course.teacher.bio}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CourseOverviewPage;