import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

function CreateQuizPage({ currentUser, setPage, setSelectedQuiz }) {
  const [gradeLevel, setGradeLevel] = useState('Grade 1');
  const [subject, setSubject] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  // Set default publish date to today in YYYY-MM-DD format
  const [publishDate, setPublishDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const juniorSubjects = ['Mathematics', 'English Language', 'Integrated Science', 'Social Studies', 'Creative & Technology Studies', 'Cinyanja'];
  const seniorSubjects = ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Civics', 'Religious Education', 'Computer Studies', 'Business Studies', 'Agricultural Science', 'Icibemba', 'Chitonga'];
  const aLevelSubjects = ['Biology', 'Physics', 'Maths', 'Chemistry', 'English'];

  const getSubjectsForGrade = (grade) => {
    if (grade.includes('Grade')) return juniorSubjects;
    if (grade.includes('Form')) return seniorSubjects;
    if (grade.includes('A Levels')) return aLevelSubjects;
    return [];
  };

  const gradeLevels = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'A Levels'];
  const subjects = getSubjectsForGrade(gradeLevel);

  const handleCreateQuiz = async (event) => {
    event.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from('quizzes')
      .insert({
        grade_level: gradeLevel,
        subject: subject,
        title: quizTitle,
        author_id: currentUser.id,
        publish_date: publishDate, // Save the publish date
      })
      .select()
      .single();

    if (error) {
      alert('Error creating quiz: ' + error.message);
    } else if (data) {
      alert('Quiz created successfully! Now add some questions.');
      setSelectedQuiz(data);
      setPage('add-questions');
    }
    setLoading(false);
  };

  return (
    <div className="main-container">
      <header className="main-header admin-header">
        <h2>Create New Quiz</h2>
        <button className="back-button" onClick={() => setPage('teacher-dashboard')}>Back to Dashboard</button>
      </header>
      <div className="content-body">
        <div className="card">
          <form onSubmit={handleCreateQuiz}>
            <div className="form-group">
              <label htmlFor="grade-level">1. Select Grade Level</label>
              <select id="grade-level" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} required>
                {gradeLevels.map(grade => <option key={grade} value={grade}>{grade}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="subject">2. Select Subject</label>
              <select id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required>
                <option value="" disabled>-- Select a subject --</option>
                {subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
            <div className="form-group">
                <label htmlFor="quiz-title">3. Enter Quiz Title (Topic)</label>
                <input id="quiz-title" type="text" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} placeholder="e.g., Chapter 5: Photosynthesis" required />
            </div>
            {/* New Date Picker Field */}
            <div className="form-group">
                <label htmlFor="publish-date">4. Publish Date (optional)</label>
                <input id="publish-date" type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} required />
            </div>
            <button type="submit" className="start-button" disabled={loading}>
              {loading ? 'Creating...' : 'Create Quiz and Add Questions'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateQuizPage;