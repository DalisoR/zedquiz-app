import React, { useState, useEffect } from 'react';

import { useToastNotification } from '../hooks/useToastNotification';
import { supabase } from '../supabaseClient';

function ManageLessonPage({ currentUser, selectedLesson, setPage }) {
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState(selectedLesson || null);
  const [videos, setVideos] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [showAddAttachment, setShowAddAttachment] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    mandatoryWatchPercentage: 80,
    videoFile: null
  });

  const [newAttachment, setNewAttachment] = useState({
    title: '',
    description: '',
    isMandatory: false,
    attachmentFile: null
  });

  const { showSuccess, showError, showInfo } = useToastNotification();

  useEffect(() => {
    if (selectedLesson) {
      fetchLessonData();
    } else {
      setLoading(false);
    }
  }, [selectedLesson]);

  const fetchLessonData = async () => {
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

      // Fetch attachments
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('lesson_attachments')
        .select('*')
        .eq('lesson_id', selectedLesson.id)
        .order('created_at');

      if (attachmentsError) throw attachmentsError;
      setAttachments(attachmentsData || []);
    } catch (err) {
      console.error('Error fetching lesson data:', err);
      showError('Failed to load lesson data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVideo = async e => {
    e.preventDefault();

    if (!newVideo.videoFile) {
      showError('Please select a video file');
      return;
    }

    try {
      setUploading(true);
      showInfo('Uploading video...', { duration: false });

      // Upload video file
      const fileExt = newVideo.videoFile.name.split('.').pop();
      const fileName = `${lesson.id}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('lesson-videos')
        .upload(fileName, newVideo.videoFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: newVideo.videoFile.type || 'video/mp4'
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from('lesson-videos').getPublicUrl(fileName);

      // Create video record
      const videoData = {
        lesson_id: lesson.id,
        title: newVideo.title,
        description: newVideo.description,
        file_url: urlData.publicUrl,
        file_size: newVideo.videoFile.size,
        mandatory_watch_percentage: parseInt(newVideo.mandatoryWatchPercentage),
        processing_status: 'completed' // For now, assume immediate availability
      };

      const { data, error } = await supabase
        .from('video_content')
        .insert(videoData)
        .select()
        .single();

      if (error) throw error;

      setVideos(prev => [...prev, data]);
      setNewVideo({ title: '', description: '', mandatoryWatchPercentage: 80, videoFile: null });
      setShowAddVideo(false);

      // Reset file input
      const fileInput = document.getElementById('video-upload');
      if (fileInput) fileInput.value = '';

      showSuccess('Video uploaded successfully!');
    } catch (err) {
      console.error('Error uploading video:', err);
      showError('Failed to upload video: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const handleAddAttachment = async e => {
    e.preventDefault();

    if (!newAttachment.attachmentFile) {
      showError('Please select a file');
      return;
    }

    try {
      setUploading(true);
      showInfo('Uploading attachment...', { duration: false });

      // Upload attachment file
      const fileExt = newAttachment.attachmentFile.name.split('.').pop();
      const fileName = `${lesson.id}/attachments/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('lesson-attachments')
        .upload(fileName, newAttachment.attachmentFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from('lesson-attachments').getPublicUrl(fileName);

      // Create attachment record
      const attachmentData = {
        lesson_id: lesson.id,
        title: newAttachment.title,
        description: newAttachment.description,
        file_url: urlData.publicUrl,
        file_type: fileExt.toLowerCase(),
        file_size: newAttachment.attachmentFile.size,
        is_mandatory: newAttachment.isMandatory
      };

      const { data, error } = await supabase
        .from('lesson_attachments')
        .insert(attachmentData)
        .select()
        .single();

      if (error) throw error;

      setAttachments(prev => [...prev, data]);
      setNewAttachment({ title: '', description: '', isMandatory: false, attachmentFile: null });
      setShowAddAttachment(false);

      // Reset file input
      const fileInput = document.getElementById('attachment-upload');
      if (fileInput) fileInput.value = '';

      showSuccess('Attachment uploaded successfully!');
    } catch (err) {
      console.error('Error uploading attachment:', err);
      showError('Failed to upload attachment: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = bytes => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = seconds => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className='main-container'>
        <div className='card'>
          <p>Loading lesson data...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className='main-container'>
        <div className='card'>
          <p>Lesson not found.</p>
          <button onClick={() => setPage('manage-chapter')}>Back to Chapter</button>
        </div>
      </div>
    );
  }

  return (
    <div className='main-container'>
      <header className='main-header'>
        <h2>
          Lesson {lesson.order_index}: {lesson.title}
        </h2>
        <button className='back-button' onClick={() => setPage('manage-chapter')}>
          Back to Chapter
        </button>
      </header>

      <div className='content-body'>
        {/* Lesson Overview */}
        <div className='card'>
          <h3>{lesson.title}</h3>
          {lesson.description && (
            <p style={{ margin: '0.5rem 0', color: '#666' }}>{lesson.description}</p>
          )}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              fontSize: '0.875rem',
              color: '#666',
              marginTop: '0.5rem'
            }}
          >
            <span>Type: {lesson.lesson_type}</span>
            {lesson.estimated_duration && <span>Duration: {lesson.estimated_duration} min</span>}
            {lesson.is_mandatory && (
              <span style={{ color: '#ef4444', fontWeight: 600 }}>Mandatory</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              onClick={() => setShowAddVideo(true)}
              style={{ width: 'auto', background: '#4caf50' }}
              disabled={uploading}
            >
              Add Video
            </button>
            <button
              onClick={() => setShowAddAttachment(true)}
              style={{ width: 'auto', background: '#2196f3' }}
              disabled={uploading}
            >
              Add Attachment
            </button>
          </div>
        </div>

        {/* Add Video Form */}
        {showAddVideo && (
          <div className='card'>
            <h3>Add Video Content</h3>
            <form onSubmit={handleAddVideo}>
              <div className='form-group'>
                <label>Video Title *</label>
                <input
                  type='text'
                  value={newVideo.title}
                  onChange={e => setNewVideo(prev => ({ ...prev, title: e.target.value }))}
                  placeholder='e.g., Introduction to Linear Equations'
                  required
                />
              </div>

              <div className='form-group'>
                <label>Video Description</label>
                <textarea
                  value={newVideo.description}
                  onChange={e => setNewVideo(prev => ({ ...prev, description: e.target.value }))}
                  placeholder='Brief description of the video content'
                  rows={3}
                />
              </div>

              <div className='form-group'>
                <label>Required Watch Percentage (%)</label>
                <input
                  type='number'
                  min='1'
                  max='100'
                  value={newVideo.mandatoryWatchPercentage}
                  onChange={e =>
                    setNewVideo(prev => ({ ...prev, mandatoryWatchPercentage: e.target.value }))
                  }
                />
                <small style={{ color: '#666', fontSize: '0.875rem' }}>
                  Students must watch this percentage to mark the video as complete
                </small>
              </div>

              <div className='form-group'>
                <label htmlFor='video-upload'>Select Video File *</label>
                <input
                  id='video-upload'
                  type='file'
                  accept='video/*'
                  onChange={e => setNewVideo(prev => ({ ...prev, videoFile: e.target.files[0] }))}
                  required
                />
                <small style={{ color: '#666', fontSize: '0.875rem' }}>
                  Supported formats: MP4, WebM, AVI (Max 100MB)
                </small>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type='submit' disabled={uploading} style={{ width: 'auto' }}>
                  {uploading ? 'Uploading...' : 'Upload Video'}
                </button>
                <button
                  type='button'
                  onClick={() => setShowAddVideo(false)}
                  style={{ width: 'auto', background: '#6b7280' }}
                  disabled={uploading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Attachment Form */}
        {showAddAttachment && (
          <div className='card'>
            <h3>Add Attachment</h3>
            <form onSubmit={handleAddAttachment}>
              <div className='form-group'>
                <label>Attachment Title *</label>
                <input
                  type='text'
                  value={newAttachment.title}
                  onChange={e => setNewAttachment(prev => ({ ...prev, title: e.target.value }))}
                  placeholder='e.g., Practice Worksheet'
                  required
                />
              </div>

              <div className='form-group'>
                <label>Description</label>
                <textarea
                  value={newAttachment.description}
                  onChange={e =>
                    setNewAttachment(prev => ({ ...prev, description: e.target.value }))
                  }
                  placeholder='Brief description of the attachment'
                  rows={2}
                />
              </div>

              <div className='form-group'>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type='checkbox'
                    checked={newAttachment.isMandatory}
                    onChange={e =>
                      setNewAttachment(prev => ({ ...prev, isMandatory: e.target.checked }))
                    }
                  />
                  Mandatory Download
                </label>
              </div>

              <div className='form-group'>
                <label htmlFor='attachment-upload'>Select File *</label>
                <input
                  id='attachment-upload'
                  type='file'
                  onChange={e =>
                    setNewAttachment(prev => ({ ...prev, attachmentFile: e.target.files[0] }))
                  }
                  required
                />
                <small style={{ color: '#666', fontSize: '0.875rem' }}>
                  Supported formats: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT (Max 10MB)
                </small>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type='submit' disabled={uploading} style={{ width: 'auto' }}>
                  {uploading ? 'Uploading...' : 'Upload Attachment'}
                </button>
                <button
                  type='button'
                  onClick={() => setShowAddAttachment(false)}
                  style={{ width: 'auto', background: '#6b7280' }}
                  disabled={uploading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Videos List */}
        <div className='card'>
          <h3>Videos ({videos.length})</h3>

          {videos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              <p>No videos yet. Add your first video to get started!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {videos.map(video => (
                <div
                  key={video.id}
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
                      <h4 style={{ margin: '0 0 0.5rem 0' }}>{video.title}</h4>
                      {video.description && (
                        <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>{video.description}</p>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          gap: '1rem',
                          fontSize: '0.875rem',
                          color: '#666'
                        }}
                      >
                        <span>Duration: {formatDuration(video.duration)}</span>
                        <span>Size: {formatFileSize(video.file_size)}</span>
                        <span>Required: {video.mandatory_watch_percentage}%</span>
                        <span
                          style={{
                            color: video.processing_status === 'completed' ? '#10b981' : '#f59e0b'
                          }}
                        >
                          {video.processing_status}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <a
                        href={video.file_url}
                        target='_blank'
                        rel='noopener noreferrer'
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#3b82f6',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '4px',
                          fontSize: '0.875rem'
                        }}
                      >
                        Preview
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attachments List */}
        <div className='card'>
          <h3>Attachments ({attachments.length})</h3>

          {attachments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              <p>No attachments yet. Add downloadable resources for students!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {attachments.map(attachment => (
                <div
                  key={attachment.id}
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
                      <h4 style={{ margin: '0 0 0.5rem 0' }}>{attachment.title}</h4>
                      {attachment.description && (
                        <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>
                          {attachment.description}
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
                        <span>Type: {attachment.file_type.toUpperCase()}</span>
                        <span>Size: {formatFileSize(attachment.file_size)}</span>
                        <span>Downloads: {attachment.download_count}</span>
                        {attachment.is_mandatory && (
                          <span style={{ color: '#ef4444', fontWeight: 600 }}>Mandatory</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <a
                        href={attachment.file_url}
                        target='_blank'
                        rel='noopener noreferrer'
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#10b981',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '4px',
                          fontSize: '0.875rem'
                        }}
                      >
                        Download
                      </a>
                    </div>
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

export default ManageLessonPage;
