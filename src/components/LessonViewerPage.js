import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useToastNotification } from '../hooks/useToastNotification';

function LessonViewerPage({ currentUser, selectedLesson, selectedChapter, setPage }) {
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState(selectedLesson || null);
  const [videos, setVideos] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [videoProgress, setVideoProgress] = useState({});
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const videoRef = useRef(null);
  const progressUpdateRef = useRef(null);

  const { showSuccess, showError, showInfo } = useToastNotification();

  useEffect(() => {
    if (selectedLesson) {
      fetchLessonContent();
    } else {
      setLoading(false);
    }
  }, [selectedLesson]);

  useEffect(() => {
    // Update video progress every 5 seconds while playing
    const updateProgress = () => {
      if (videoRef.current && currentVideo && !videoRef.current.paused) {
        const currentTime = Math.floor(videoRef.current.currentTime);
        const duration = Math.floor(videoRef.current.duration);
        
        if (duration > 0) {
          updateVideoProgress(currentVideo.id, currentTime, currentTime);
        }
      }
    };

    if (currentVideo) {
      progressUpdateRef.current = setInterval(updateProgress, 5000);
    }

    return () => {
      if (progressUpdateRef.current) {
        clearInterval(progressUpdateRef.current);
      }
    };
  }, [currentVideo]);

  const fetchLessonContent = async () => {
    try {
      setLoading(true);

      // Fetch videos
      const { data: videosData, error: videosError } = await supabase
        .from('video_content')
        .select('*')
        .eq('lesson_id', selectedLesson.id)
        .order('created_at');

      if (videosError) throw videosError;
      setVideos(videosData || []);

      // Set first video as current if available
      if (videosData && videosData.length > 0) {
        setCurrentVideo(videosData[0]);
      }

      // Fetch attachments
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('lesson_attachments')
        .select('*')
        .eq('lesson_id', selectedLesson.id)
        .order('created_at');

      if (attachmentsError) throw attachmentsError;
      setAttachments(attachmentsData || []);

      // Fetch video progress
      await fetchVideoProgress();

      // Fetch notes
      await fetchNotes();

      // Track lesson interaction
      await trackInteraction('view');
    } catch (err) {
      console.error('Error fetching lesson content:', err);
      showError('Failed to load lesson content');
    } finally {
      setLoading(false);
    }
  };

  const fetchVideoProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('video_progress')
        .select('*')
        .eq('student_id', currentUser.id)
        .in('video_id', videos.map(v => v.id));

      if (error) throw error;

      const progressMap = {};
      data.forEach(p => {
        progressMap[p.video_id] = p;
      });
      setVideoProgress(progressMap);
    } catch (err) {
      console.error('Error fetching video progress:', err);
    }
  };

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('student_notes')
        .select('*')
        .eq('student_id', currentUser.id)
        .eq('lesson_id', selectedLesson.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  };

  const updateVideoProgress = async (videoId, currentPosition, watchTime) => {
    try {
      const { data, error } = await supabase.rpc('update_video_progress', {
        p_student_id: currentUser.id,
        p_video_id: videoId,
        p_current_position: currentPosition,
        p_watch_time: watchTime
      });

      if (error) throw error;

      // Update local progress state
      setVideoProgress(prev => ({
        ...prev,
        [videoId]: {
          ...prev[videoId],
          completion_percentage: data.completion_percentage,
          mandatory_completed: data.mandatory_completed,
          watch_time: data.watch_time,
          last_position: currentPosition
        }
      }));

      // Show completion message if video just completed
      if (data.mandatory_completed && (!videoProgress[videoId]?.mandatory_completed)) {
        showSuccess('Video completed! Great job!');
      }
    } catch (err) {
      console.error('Error updating video progress:', err);
    }
  };

  const trackInteraction = async (type, data = {}) => {
    try {
      await supabase
        .from('lesson_interactions')
        .insert({
          student_id: currentUser.id,
          lesson_id: selectedLesson.id,
          interaction_type: type,
          interaction_data: data
        });
    } catch (err) {
      console.error('Error tracking interaction:', err);
    }
  };

  const handleVideoSelect = (video) => {
    setCurrentVideo(video);
    
    // Resume from last position if available
    setTimeout(() => {
      if (videoRef.current && videoProgress[video.id]?.last_position) {
        videoRef.current.currentTime = videoProgress[video.id].last_position;
      }
    }, 100);
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current && currentVideo) {
      const currentTime = Math.floor(videoRef.current.currentTime);
      const duration = Math.floor(videoRef.current.duration);
      
      // Update progress every 10 seconds of watch time
      if (currentTime > 0 && currentTime % 10 === 0) {
        updateVideoProgress(currentVideo.id, currentTime, currentTime);
      }
    }
  };

  const handleAttachmentDownload = async (attachment) => {
    try {
      // Track download
      await trackInteraction('download', { attachment_id: attachment.id });
      
      // Update download count
      await supabase
        .from('lesson_attachments')
        .update({ download_count: attachment.download_count + 1 })
        .eq('id', attachment.id);

      // Open file in new tab
      window.open(attachment.file_url, '_blank');
      
      showInfo('Download started');
    } catch (err) {
      console.error('Error downloading attachment:', err);
      showError('Failed to download file');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    
    if (!newNote.trim()) return;

    try {
      const noteData = {
        student_id: currentUser.id,
        lesson_id: selectedLesson.id,
        video_id: currentVideo?.id || null,
        note_content: newNote.trim(),
        timestamp_seconds: currentVideo && videoRef.current ? Math.floor(videoRef.current.currentTime) : null
      };

      const { data, error } = await supabase
        .from('student_notes')
        .insert(noteData)
        .select()
        .single();

      if (error) throw error;

      setNotes(prev => [data, ...prev]);
      setNewNote('');
      await trackInteraction('note', { note_id: data.id });
      showSuccess('Note added!');
    } catch (err) {
      console.error('Error adding note:', err);
      showError('Failed to add note');
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="main-container">
        <div className="card">
          <p>Loading lesson content...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="main-container">
        <div className="card">
          <p>Lesson not found.</p>
          <button onClick={() => setPage('course-overview')}>Back to Course</button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <header className="main-header">
        <h2>
          {selectedChapter?.title} - Lesson {lesson.order_index}: {lesson.title}
        </h2>
        <button className="back-button" onClick={() => setPage('course-overview')}>
          Back to Course
        </button>
      </header>

      <div className="content-body">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          {/* Main Content */}
          <div>
            {/* Video Player */}
            {currentVideo && (
              <div className="card">
                <h3>{currentVideo.title}</h3>
                {currentVideo.description && (
                  <p style={{ color: '#666', marginBottom: '1rem' }}>{currentVideo.description}</p>
                )}
                
                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                  <video
                    ref={videoRef}
                    controls
                    style={{ width: '100%', maxHeight: '400px', borderRadius: '8px' }}
                    onTimeUpdate={handleVideoTimeUpdate}
                    onLoadedMetadata={() => {
                      // Resume from last position
                      if (videoProgress[currentVideo.id]?.last_position) {
                        videoRef.current.currentTime = videoProgress[currentVideo.id].last_position;
                      }
                    }}
                  >
                    <source src={currentVideo.file_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  
                  {/* Progress Overlay */}
                  {videoProgress[currentVideo.id] && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.875rem'
                    }}>
                      Progress: {Math.round(videoProgress[currentVideo.id].completion_percentage || 0)}%
                      {videoProgress[currentVideo.id].mandatory_completed && (
                        <span style={{ color: '#10b981', marginLeft: '0.5rem' }}>✓ Complete</span>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                  Required watch time: {currentVideo.mandatory_watch_percentage}% 
                  ({formatTime(Math.floor((currentVideo.duration * currentVideo.mandatory_watch_percentage) / 100))})
                </div>
              </div>
            )}

            {/* Lesson Content */}
            <div className="card">
              <h3>Lesson Overview</h3>
              {lesson.description && (
                <p style={{ marginBottom: '1rem' }}>{lesson.description}</p>
              )}
              
              {lesson.notes_content && (
                <div>
                  <h4>Lesson Notes</h4>
                  <div style={{ 
                    background: '#f9fafb', 
                    padding: '1rem', 
                    borderRadius: '8px',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {lesson.notes_content}
                  </div>
                </div>
              )}
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="card">
                <h3>Downloadable Resources</h3>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        background: '#f9fafb'
                      }}
                    >
                      <div>
                        <h4 style={{ margin: '0 0 0.25rem 0' }}>{attachment.title}</h4>
                        {attachment.description && (
                          <p style={{ margin: '0 0 0.25rem 0', color: '#666', fontSize: '0.875rem' }}>
                            {attachment.description}
                          </p>
                        )}
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                          {attachment.file_type.toUpperCase()} • {formatFileSize(attachment.file_size)} • 
                          Downloaded {attachment.download_count} times
                          {attachment.is_mandatory && (
                            <span style={{ color: '#ef4444', marginLeft: '0.5rem' }}>• Required</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAttachmentDownload(attachment)}
                        style={{
                          width: 'auto',
                          background: '#10b981',
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem'
                        }}
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            {/* Video List */}
            {videos.length > 1 && (
              <div className="card">
                <h3>Videos ({videos.length})</h3>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {videos.map((video, index) => {
                    const progress = videoProgress[video.id];
                    const isCompleted = progress?.mandatory_completed;
                    const isCurrent = currentVideo?.id === video.id;
                    
                    return (
                      <div
                        key={video.id}
                        onClick={() => handleVideoSelect(video)}
                        style={{
                          padding: '0.75rem',
                          border: `2px solid ${isCurrent ? '#3b82f6' : '#e5e7eb'}`,
                          borderRadius: '8px',
                          background: isCurrent ? '#eff6ff' : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ color: isCompleted ? '#10b981' : '#6b7280' }}>
                            {isCompleted ? '✓' : index + 1}
                          </span>
                          <h4 style={{ margin: 0, fontSize: '0.875rem' }}>{video.title}</h4>
                        </div>
                        {progress && (
                          <div style={{ fontSize: '0.75rem', color: '#666' }}>
                            {Math.round(progress.completion_percentage || 0)}% watched
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes Section */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>My Notes ({notes.length})</h3>
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  style={{
                    width: 'auto',
                    background: '#6b7280',
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.75rem'
                  }}
                >
                  {showNotes ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} style={{ marginBottom: '1rem' }}>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note about this lesson..."
                  rows={3}
                  style={{ marginBottom: '0.5rem' }}
                />
                <button type="submit" style={{ width: '100%', fontSize: '0.875rem' }}>
                  Add Note
                </button>
              </form>

              {/* Notes List */}
              {showNotes && (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {notes.length === 0 ? (
                    <p style={{ color: '#666', fontSize: '0.875rem', textAlign: 'center' }}>
                      No notes yet. Add your first note above!
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                      {notes.map((note) => (
                        <div
                          key={note.id}
                          style={{
                            padding: '0.75rem',
                            background: '#f9fafb',
                            borderRadius: '6px',
                            border: '1px solid #e5e7eb'
                          }}
                        >
                          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>
                            {note.note_content}
                          </p>
                          <div style={{ fontSize: '0.75rem', color: '#666' }}>
                            {note.timestamp_seconds && (
                              <span>At {formatTime(note.timestamp_seconds)} • </span>
                            )}
                            {new Date(note.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LessonViewerPage;