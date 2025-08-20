import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import logo from '../../assets/logo.png';
import { supabase } from '../../supabaseClient';

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async event => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      alert(error.error_description || error.message);
    }
    // The onAuthStateChange listener in App.js will handle navigation
    setLoading(false);
  };

  return (
    <div className='login-container'>
      <div className='logo' style={{ textAlign: 'center', marginBottom: 10 }}>
        <img src={logo} alt='ZedQuiz Logo' style={{ height: 40, verticalAlign: 'middle' }} />
      </div>
      <h2>ZedQuiz Login</h2>
      <p>Welcome back!</p>
      <form onSubmit={handleLogin}>
        <div className='form-group'>
          <label htmlFor='email'>Email</label>
          <input
            id='email'
            type='email'
            placeholder='student@example.com'
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className='form-group'>
          <label htmlFor='password'>Password</label>
          <input
            id='password'
            type='password'
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button type='submit' disabled={loading}>
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      <button className='back-to-home-button' type='button' onClick={() => navigate('/')}>
        Back to Home
      </button>
      <p className='auth-switch-text'>
        Don't have an account? <span onClick={() => navigate('/register')}>Register here</span>
      </p>
    </div>
  );
}

export default LoginPage;
