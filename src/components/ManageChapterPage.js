import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useToastNotification } from '../hooks/useToastNotification';

function ManageChapterPage({ currentUser, selectedChapter, setPage, setSelectedLesson }) {
  const [loading, setLoading] = useState(true);
  const [chapter, setChapter] = useState(selectedChapter || null);
  const [lessons, setLessons] = useState([]);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    lessonType: 'mixed',
    estimatedDuration: '',
    isMandatory: true
  });

  const { showSuccess, showError } = useToastNotification();

  useEffect(() => {
    if (selectedChapter) {
      fetchChapterData();
    } else {
      setLoading(false);
    }
  }, [selectedChapter]);

  const fetchChapterData = async () => {
    try {
      setLoading(true);

      // Fetch lessons with video count
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select(`
          *,
          videos:video_content(count),
          attachments:lesson_attachments(count)
        `)
        .eq('chapter_id', selectedChapter.id)
        .order('order_index');

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);
    } catch (err) {
      console.error('Error fetching chapter data:', err);
      showError('Failed to load chapter data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLesson = async (e) => {
    e.preventDefault();
    
    try {
      const nextOrderIndex = lessons.length + 1;
      
      const lessonData = {
        chapter_id: chapter.id,
        title: newLesson.title,
        description: newLesson.description,
        order_index: nextOrderIndex,
        lesson_type: newLesson.lessonType,
        estimated_duration: parseInt(newLesson.estimatedDuration) || null,
        is_mandatory: newLesson.isMandatory,
        content_blocks: []
      };

      const { data, error } = await supabase
        .from('lessons')
        .insert(lessonData)
        .select()
        .single();

      if (error) throw error;

      setLessons(prev => [...prev, { ...data, videos: [], attachments: [] }]);
      setNewLesson({ title: '', description: '', lessonType: 'mixed', estimatedDuration: '', isMandatory: true });
      setShowAddLesson(false);
      showSuccess('Lesson added successfully!');
    } catch (err) {
      console.error('Error adding lesson:', err);
      showError('Failed to add lesson: ' + (err.message || 'Unknown error'));
    }
  };

  const handleManageLesson = (lesson) => {
    setSelectedLesson(lesson);
    setPage('manage-lesson');
  };

  const handlePublishChapter = async () => {
    if (lessons.length === 0) {
      showError('Add at least one lesson before publishing');
      return;
    }

    try {
      const { error } = await supabase
        .from('chapters')
        .update({ is_published: !chapter.is_published })
        .eq('id', chapter.id);

      if (error) throw error;

      setChapter(prev => ({ ...prev, is_published: !prev.is_published }));
      showSuccess(chapter.is_published ? 'Chapter unpublished' : 'Chapter published successfully!');
    } catch (err) {
      console.error('Error publishing chapter:', err);
      showError('Failed to update chapter status');
    }
  };

  if (loading) {
    return (
      <div className="main-container">
        <div className="card">
          <p>Loading chapter data...</p>
        </div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="main-container">
        <div className="card">
          <p>Chapter not found.</p>
          <button onClick={() => setPage('manage-course')}>Back to Course</button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <header className="main-header">
        <h2>Chapter {chapter.order_index}: {chapter.title}</h2>
        <button className="back-button" onClick={() => setPage('manage-course')}>
          Back to Course
        </button>
      </header>

      <div className="content-body">
        {/* Chapter Overview */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <h3>{chapter.title}</h3>
              {chapter.description && (
                <p style={{ margin: '0.5rem 0', color: '#666' }}>{chapter.description}</p>
              )}
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                <span>Unlock Score: {chapter.unlock_score_required}%</span>
                {chapter.estimated_duration && (
                  <span>Duration: {chapter.estimated_duration} min</span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
              <span style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.875rem',
                fontWeight: 600,
                background: chapter.is_published ? '#e8f5e9' : '#fff3e0',
                color: chapter.is_published ? '#2e7d32' : '#ef6c00'
              }}>
                {chapter.is_published ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              onClick={handlePublishChapter}
              style={{
                width: 'auto',
                background: chapter.is_published ? '#f57c00' : '#4caf50'
              }}
            >
              {chapter.is_published ? 'Unpublish Chapter' : 'Publish Chapter'}
            </button>
            <button
              onClick={() => setShowAddLesson(true)}
              style={{ width: 'auto', background: '#2196f3' }}
            >
              Add Lesson
            </button>
            <button
              onClick={() => setPage('create-chapter-quiz')}
              style={{ width: 'auto', background: '#8b5cf6' }}
            >
              Create Chapter Quiz
            </button>
          </div>
        </div>

        {/* Add Lesson Form */}
        {showAddLesson && (
          <div className="card">
            <h3>Add New Lesson</h3>
            <form onSubmit={handleAddLesson}>
              <div className="form-group">
                <label>Lesson Title *</label>
                <input
                  type="text"
                  value={newLesson.title}
                  onChange={(e) => setNewLesson(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Introduction to Linear Equations"
                  required
                />
              </div>

              <div className="form-group">
                <label>Lesson Description</label>
                <textarea
                  value={newLesson.description}
                  onChange={(e) => setNewLesson(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What will students learn in this lesson?"
                  rows={3}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Lesson Type</label>
                  <select
                    value={newLesson.lessonType}
                    onChange={(e) => setNewLesson(prev => ({ ...prev, lessonType: e.target.value }))}
                  >
                    <option value="video">Video Only</option>
                    <option value="text">Text/Reading</option>
                    <option value="interactive">Interactive</option>
                    <option value="mixed">Mixed Content</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    value={newLesson.estimatedDuration}
                    onChange={(e) => setNewLesson(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                    placeholder="e.g., 15"
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={newLesson.isMandatory}
                      onChange={(e) => setNewLesson(prev => ({ ...prev, isMandatory: e.target.checked }))}
                    />
                    Mandatory Lesson
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="submit" style={{ width: 'auto' }}>Add Lesson</button>
                <button
                  type="button"
                  onClick={() => setShowAddLesson(false)}
                  style={{ width: 'auto', background: '#6b7280' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lessons List */}
        <div className="card">
          <h3>Chapter Lessons ({lessons.length})</h3>
          
          {lessons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              <p>No lessons yet. Add your first lesson to get started!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '1rem',
                    background: '#f9fafb'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.5rem 0' }}>
                        Lesson {lesson.order_index}: {lesson.title}
                      </h4>
                      {lesson.description && (
                        <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>
                          {lesson.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#666' }}>
                        <span>Type: {lesson.lesson_type}</span>
                        <span>Videos: {lesson.videos?.[0]?.count || 0}</span>
                        <span>Attachments: {lesson.attachments?.[0]?.count || 0}</span>
                        {lesson.estimated_duration && (
                          <span>Duration: {lesson.estimated_duration} min</span>
                        )}
                        {lesson.is_mandatory && (
                          <span style={{ color: '#ef4444', fontWeight: 600 }}>Mandatory</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleManageLesson(lesson)}
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

export default ManageChapterPage;