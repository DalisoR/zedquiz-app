import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useToastNotification } from '../hooks/useToastNotification';

function BrowseCoursesPage({ currentUser, setPage, setSelectedCourse }) {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [filters, setFilters] = useState({
    subject: '',
    gradeLevel: currentUser?.grade_level || '',
    difficultyLevel: '',
    priceRange: 'all'
  });
  const [enrolledCourses, setEnrolledCourses] = useState(new Set());

  const { showSuccess, showError } = useToastNotification();

  const subjects = ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Civics', 'Religious Education', 'Computer Studies', 'Business Studies', 'Agricultural Science'];
  const gradeLevels = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'A Levels'];

  useEffect(() => {
    fetchCourses();
    if (currentUser) {
      fetchEnrollments();
    }
  }, [filters, currentUser]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('courses')
        .select(`
          *,
          teacher:profiles!courses_teacher_id_fkey(full_name),
          chapters:chapters(count),
          enrollments:student_course_enrollments(count)
        `)
        .eq('is_published', true);

      // Apply filters
      if (filters.subject) {
        query = query.eq('subject', filters.subject);
      }
      if (filters.gradeLevel) {
        query = query.eq('grade_level', filters.gradeLevel);
      }
      if (filters.difficultyLevel) {
        query = query.eq('difficulty_level', filters.difficultyLevel);
      }
      if (filters.priceRange === 'free') {
        query = query.eq('price', 0);
      } else if (filters.priceRange === 'paid') {
        query = query.gt('price', 0);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
      showError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from('student_course_enrollments')
        .select('course_id')
        .eq('student_id', currentUser.id);

      if (error) throw error;
      setEnrolledCourses(new Set(data.map(e => e.course_id)));
    } catch (err) {
      console.error('Error fetching enrollments:', err);
    }
  };

  const handleEnrollCourse = async (course) => {
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

      const { error } = await supabase
        .from('student_course_enrollments')
        .insert({
          student_id: currentUser.id,
          course_id: course.id,
          payment_status: course.price > 0 ? 'paid' : 'free'
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          showError('You are already enrolled in this course');
          return;
        }
        throw error;
      }

      setEnrolledCourses(prev => new Set([...prev, course.id]));
      showSuccess('Successfully enrolled in course!');
    } catch (err) {
      console.error('Error enrolling in course:', err);
      showError('Failed to enroll in course: ' + (err.message || 'Unknown error'));
    }
  };

  const handleViewCourse = (course) => {
    setSelectedCourse(course);
    setPage('course-overview');
  };

  const formatPrice = (price) => {
    return price === 0 ? 'Free' : `K${price}`;
  };

  return (
    <div className="main-container">
      <header className="main-header">
        <h2>Browse Courses</h2>
        <button className="back-button" onClick={() => setPage('dashboard')}>
          Back to Dashboard
        </button>
      </header>

      <div className="content-body">
        {/* Filters */}
        <div className="card">
          <h3>Filter Courses</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label>Subject</label>
              <select
                value={filters.subject}
                onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Grade Level</label>
              <select
                value={filters.gradeLevel}
                onChange={(e) => setFilters(prev => ({ ...prev, gradeLevel: e.target.value }))}
              >
                <option value="">All Grades</option>
                {gradeLevels.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Difficulty</label>
              <select
                value={filters.difficultyLevel}
                onChange={(e) => setFilters(prev => ({ ...prev, difficultyLevel: e.target.value }))}
              >
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="form-group">
              <label>Price</label>
              <select
                value={filters.priceRange}
                onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
              >
                <option value="all">All Courses</option>
                <option value="free">Free Only</option>
                <option value="paid">Premium Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="card">
          <h3>Available Courses ({courses.length})</h3>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
              <h4>No courses found</h4>
              <p>Try adjusting your filters or check back later for new courses!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {courses.map((course) => (
                <div
                  key={course.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    background: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }}
                >
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1.125rem' }}>{course.title}</h4>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: course.price === 0 ? '#e8f5e9' : '#fff3e0',
                        color: course.price === 0 ? '#2e7d32' : '#ef6c00'
                      }}>
                        {formatPrice(course.price)}
                      </span>
                    </div>

                    <p style={{ color: '#666', margin: '0.5rem 0', fontSize: '0.9rem' }}>
                      {course.subject} • {course.grade_level} • {course.difficulty_level}
                    </p>

                    {course.description && (
                      <p style={{ margin: '0.5rem 0', color: '#555', fontSize: '0.9rem' }}>
                        {course.description.length > 120 
                          ? course.description.substring(0, 120) + '...'
                          : course.description
                        }
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
                      <span>📚 {course.chapters?.[0]?.count || 0} chapters</span>
                      <span>👥 {course.enrollments?.[0]?.count || 0} students</span>
                      {course.estimated_hours && <span>⏱️ {course.estimated_hours}h</span>}
                    </div>

                    <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#666' }}>
                      <span>By {course.teacher?.full_name || 'Unknown Teacher'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleViewCourse(course)}
                      style={{
                        flex: 1,
                        background: '#3b82f6',
                        padding: '0.75rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      View Details
                    </button>
                    
                    {enrolledCourses.has(course.id) ? (
                      <button
                        onClick={() => handleViewCourse(course)}
                        style={{
                          flex: 1,
                          background: '#10b981',
                          padding: '0.75rem',
                          fontSize: '0.875rem'
                        }}
                      >
                        Continue Learning
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnrollCourse(course)}
                        style={{
                          flex: 1,
                          background: '#4caf50',
                          padding: '0.75rem',
                          fontSize: '0.875rem'
                        }}
                      >
                        Enroll Now
                      </button>
                    )}
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

export default BrowseCoursesPage;