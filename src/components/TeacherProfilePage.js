import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function TeacherProfilePage({ currentUser, setPage }) {
  const [loading, setLoading] = useState(false);
  const [bio, setBio] = useState('');
  const [subjects, setSubjects] = useState('');
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicUrl, setProfilePicUrl] = useState(null);

  useEffect(() => {
    // Load existing profile data when the page loads
    setBio(currentUser.bio || '');
    setSubjects(currentUser.subjects?.join(', ') || '');
    setProfilePicUrl(currentUser.profile_picture_url || null);
  }, [currentUser]);

  const handleUpdateProfile = async event => {
    event.preventDefault();
    setLoading(true);
    let publicUrl = profilePicUrl;

    if (profilePicFile) {
      const fileExt = profilePicFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${currentUser.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, profilePicFile, { upsert: true });

      if (uploadError) {
        alert('Error uploading profile picture: ' + uploadError.message);
        setLoading(false);
        return;
      }

      const { data } = supabase.storage.from('profile-pictures').getPublicUrl(filePath);
      publicUrl = data.publicUrl;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        bio: bio,
        subjects: subjects.split(',').map(s => s.trim()), // Save subjects as an array
        profile_picture_url: publicUrl
      })
      .eq('id', currentUser.id);

    if (error) {
      alert('Error updating profile: ' + error.message);
    } else {
      alert('Profile updated successfully!');
      // Note: The profile in the main App state won't update until next login.
      // A more advanced app would use a global state manager to fix this.
      setPage('teacher-dashboard');
    }
    setLoading(false);
  };

  return (
    <div className='main-container'>
      <header className='main-header admin-header'>
        <h2>Manage My Profile</h2>
        <button className='back-button' onClick={() => setPage('teacher-dashboard')}>
          Back to Dashboard
        </button>
      </header>
      <div className='content-body'>
        <div className='card'>
          <form onSubmit={handleUpdateProfile}>
            <div className='form-group'>
              <label htmlFor='profile-pic'>Profile Picture</label>
              {profilePicUrl && (
                <img src={profilePicUrl} alt='Profile' className='profile-pic-preview' />
              )}
              <input
                id='profile-pic'
                type='file'
                accept='image/*'
                onChange={e => setProfilePicFile(e.target.files[0])}
              />
            </div>
            <div className='form-group'>
              <label htmlFor='bio'>My Bio</label>
              <textarea
                id='bio'
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder='Write a short introduction about your teaching experience and style...'
              />
            </div>
            <div className='form-group'>
              <label htmlFor='subjects'>Subjects I Teach</label>
              <input
                id='subjects'
                type='text'
                value={subjects}
                onChange={e => setSubjects(e.target.value)}
                placeholder='e.g., Maths, Physics, English'
              />
            </div>
            <button type='submit' disabled={loading}>
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TeacherProfilePage;
