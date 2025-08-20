import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await signIn(credentials.email, credentials.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className='auth-container'>
      <h1>Login</h1>
      {error && <div className='error'>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor='email'>Email</label>
          <input
            type='email'
            id='email'
            value={credentials.email}
            onChange={e => setCredentials({ ...credentials, email: e.target.value })}
            required
          />
        </div>
        <div>
          <label htmlFor='password'>Password</label>
          <input
            type='password'
            id='password'
            value={credentials.password}
            onChange={e => setCredentials({ ...credentials, password: e.target.value })}
            required
          />
        </div>
        <button type='submit'>Login</button>
      </form>
      <p>
        Don't have an account? <button onClick={() => navigate('/register')}>Register here</button>
      </p>
    </div>
  );
};

export default LoginPage;
