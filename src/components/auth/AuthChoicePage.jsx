import React from 'react';
import { useNavigate } from 'react-router-dom';

import logo from '../assets/logo.png';

function AuthChoicePage() {
  const navigate = useNavigate();
  return (
    <div className='auth-choice-container'>
      <div className='logo' style={{ textAlign: 'center', marginBottom: 10 }}>
        <img src={logo} alt='ZedQuiz Logo' style={{ height: 40, verticalAlign: 'middle' }} />
      </div>
      <h2>Join ZedQuiz</h2>
      <p>Are you a new or returning user?</p>
      <div className='choice-buttons'>
        <button className='login-choice-btn' onClick={() => navigate('/login')}>
          I have an account (Login)
        </button>
        <button className='register-choice-btn' onClick={() => navigate('/register')}>
          I'm a new user (Register)
        </button>
      </div>
      <button className='back-to-home-button' onClick={() => navigate('/')}>
        Back to Home
      </button>
    </div>
  );
}

export default AuthChoicePage;
