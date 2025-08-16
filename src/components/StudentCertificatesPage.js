import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useToastNotification } from '../hooks/useToastNotification';

function StudentCertificatesPage({ currentUser, setPage }) {
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState([]);
  const [achievements, setAchievements] = useState([]);

  const { showError } = useToastNotification();

  useEffect(() => {
    fetchCertificatesAndAchievements();
  }, [currentUser]);

  const fetchCertificatesAndAchievements = async () => {
    try {
      setLoading(true);

      // Fetch certificates
      const { data: certificatesData, error: certificatesError } = await supabase
        .from('course_certificates')
        .select(`
          *,
          course:courses(
            title,
            subject,
            grade_level,
            teacher:profiles!courses_teacher_id_fkey(full_name)
          )
        `)
        .eq('student_id', currentUser.id)
        .order('completion_date', { ascending: false });

      if (certificatesError) throw certificatesError;
      setCertificates(certificatesData || []);

      // Fetch achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('learning_achievements')
        .select(`
          *,
          course:courses(title, subject)
        `)
        .eq('student_id', currentUser.id)
        .order('earned_date', { ascending: false });

      if (achievementsError) throw achievementsError;
      setAchievements(achievementsData || []);
    } catch (err) {
      console.error('Error fetching certificates and achievements:', err);
      showError('Failed to load certificates and achievements');
    } finally {
      setLoading(false);
    }
  };

  const generateCertificatePDF = async (certificate) => {
    // This would integrate with a PDF generation service
    // For now, we'll create a simple certificate view
    const certificateWindow = window.open('', '_blank');
    certificateWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Course Completion Certificate</title>
        <style>
          body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .certificate {
            background: white;
            padding: 60px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 800px;
            border: 8px solid #f0f0f0;
          }
          .header {
            color: #2c3e50;
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 3px;
          }
          .subheader {
            color: #7f8c8d;
            font-size: 18px;
            margin-bottom: 40px;
          }
          .student-name {
            color: #2980b9;
            font-size: 36px;
            font-weight: bold;
            margin: 30px 0;
            text-decoration: underline;
          }
          .course-title {
            color: #27ae60;
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
          }
          .details {
            margin: 30px 0;
            color: #34495e;
            font-size: 16px;
            line-height: 1.6;
          }
          .signature-section {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .signature {
            text-align: center;
            flex: 1;
          }
          .signature-line {
            border-top: 2px solid #2c3e50;
            width: 200px;
            margin: 20px auto 10px;
          }
          .certificate-number {
            position: absolute;
            top: 20px;
            right: 20px;
            color: #7f8c8d;
            font-size: 12px;
          }
          .seal {
            width: 100px;
            height: 100px;
            border: 4px solid #e74c3c;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #e74c3c;
            font-weight: bold;
            font-size: 14px;
            text-align: center;
            margin: 0 auto;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="certificate-number">Certificate No: ${certificate.certificate_number}</div>
          
          <div class="header">Certificate of Completion</div>
          <div class="subheader">This is to certify that</div>
          
          <div class="student-name">${currentUser.full_name}</div>
          
          <div class="subheader">has successfully completed the course</div>
          
          <div class="course-title">${certificate.course.title}</div>
          
          <div class="details">
            <strong>Subject:</strong> ${certificate.course.subject}<br>
            <strong>Grade Level:</strong> ${certificate.course.grade_level}<br>
            <strong>Instructor:</strong> ${certificate.course.teacher?.full_name || 'ZedQuiz Team'}<br>
            <strong>Completion Date:</strong> ${new Date(certificate.completion_date).toLocaleDateString()}<br>
            <strong>Final Score:</strong> ${Math.round(certificate.final_score)}%<br>
            <strong>Time Invested:</strong> ${Math.round(certificate.time_spent_hours)} hours
          </div>
          
          <div class="signature-section">
            <div class="signature">
              <div class="signature-line"></div>
              <div>Instructor</div>
            </div>
            
            <div class="seal">
              ZEDQUIZ<br>
              VERIFIED
            </div>
            
            <div class="signature">
              <div class="signature-line"></div>
              <div>Director</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    certificateWindow.document.close();
  };

  const getAchievementIcon = (type) => {
    switch (type) {
      case 'course_completion': return '🎓';
      case 'perfect_score': return '⭐';
      case 'fast_learner': return '⚡';
      case 'consistent_learner': return '📚';
      default: return '🏆';
    }
  };

  const getAchievementTitle = (type) => {
    switch (type) {
      case 'course_completion': return 'Course Completed';
      case 'perfect_score': return 'Perfect Score';
      case 'fast_learner': return 'Fast Learner';
      case 'consistent_learner': return 'Consistent Learner';
      default: return 'Achievement Unlocked';
    }
  };

  if (loading) {
    return (
      <div className="main-container">
        <div className="card">
          <p>Loading your certificates and achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <header className="main-header">
        <h2>My Certificates & Achievements</h2>
        <button className="back-button" onClick={() => setPage('dashboard')}>
          Back to Dashboard
        </button>
      </header>

      <div className="content-body">
        {/* Certificates Section */}
        <div className="card">
          <h3>Course Completion Certificates ({certificates.length})</h3>
          
          {certificates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
              <h4>No certificates yet</h4>
              <p>Complete a course to earn your first certificate!</p>
              <button
                onClick={() => setPage('browse-courses')}
                style={{ width: 'auto', marginTop: '1rem' }}
              >
                Browse Courses
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {certificates.map((certificate) => (
                <div
                  key={certificate.id}
                  style={{
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Certificate Background Pattern */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '200px',
                    height: '200px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    transform: 'translate(50%, -50%)'
                  }} />
                  
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                          🎓 Certificate of Completion
                        </div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                          Certificate No: {certificate.certificate_number}
                        </div>
                      </div>
                      <button
                        onClick={() => generateCertificatePDF(certificate)}
                        style={{
                          background: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.3)',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          fontSize: '0.875rem'
                        }}
                      >
                        View Certificate
                      </button>
                    </div>

                    <h4 style={{ margin: '1rem 0', fontSize: '1.25rem' }}>
                      {certificate.course.title}
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Subject</div>
                        <div style={{ fontWeight: 600 }}>{certificate.course.subject}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Grade Level</div>
                        <div style={{ fontWeight: 600 }}>{certificate.course.grade_level}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Final Score</div>
                        <div style={{ fontWeight: 600 }}>{Math.round(certificate.final_score)}%</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Time Spent</div>
                        <div style={{ fontWeight: 600 }}>{Math.round(certificate.time_spent_hours)}h</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', opacity: 0.9 }}>
                      <span>Instructor: {certificate.course.teacher?.full_name || 'ZedQuiz Team'}</span>
                      <span>Completed: {new Date(certificate.completion_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Achievements Section */}
        <div className="card">
          <h3>Learning Achievements ({achievements.length})</h3>
          
          {achievements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏆</div>
              <p>No achievements yet. Keep learning to unlock badges!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '1rem',
                    background: 'white',
                    textAlign: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    {getAchievementIcon(achievement.achievement_type)}
                  </div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>
                    {getAchievementTitle(achievement.achievement_type)}
                  </h4>
                  {achievement.course && (
                    <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.875rem' }}>
                      {achievement.course.title}
                    </p>
                  )}
                  <div style={{ fontSize: '0.75rem', color: '#999' }}>
                    Earned: {new Date(achievement.earned_date).toLocaleDateString()}
                  </div>
                  {achievement.points_awarded > 0 && (
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      background: '#f0f9ff',
                      color: '#0369a1',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      +{achievement.points_awarded} points
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {(certificates.length > 0 || achievements.length > 0) && (
          <div className="card">
            <h3>Learning Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                  {certificates.length}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>Certificates Earned</div>
              </div>
              
              <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                  {achievements.length}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>Achievements Unlocked</div>
              </div>
              
              <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                  {Math.round(certificates.reduce((sum, cert) => sum + (cert.time_spent_hours || 0), 0))}h
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>Total Learning Time</div>
              </div>
              
              <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                  {achievements.reduce((sum, ach) => sum + (ach.points_awarded || 0), 0)}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>Achievement Points</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentCertificatesPage;