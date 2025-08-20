import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';

const RegistrationPage = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'student' // Default role
  });
  const [error, setError] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await signUp(formData);
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className='auth-container'>
      <h1>Register</h1>
      {error && <div className='error'>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor='fullName'>Full Name</label>
          <input
            type='text'
            id='fullName'
            value={formData.fullName}
            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
            required
          />
        </div>
        <div>
          <label htmlFor='email'>Email</label>
          <input
            type='email'
            id='email'
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div>
          <label htmlFor='password'>Password</label>
          <input
            type='password'
            id='password'
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            required
          />
        </div>
        <div>
          <label htmlFor='confirmPassword'>Confirm Password</label>
          <input
            type='password'
            id='confirmPassword'
            value={formData.confirmPassword}
            onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
          />
        </div>
        <div>
          <label htmlFor='role'>Role</label>
          <select
            id='role'
            value={formData.role}
            onChange={e => setFormData({ ...formData, role: e.target.value })}
            required
          >
            <option value='student'>Student</option>
            <option value='teacher'>Teacher</option>
            <option value='parent'>Parent</option>
          </select>
        </div>
        <button type='submit'>Register</button>
      </form>
      <p>
        Already have an account? <button onClick={() => navigate('/login')}>Login here</button>
      </p>
    </div>
  );
};

export default RegistrationPage;
