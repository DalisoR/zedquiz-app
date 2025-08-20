import React from 'react';
import { useNavigate } from 'react-router-dom';

const AuthChoicePage = () => {
  const navigate = useNavigate();

  return (
    <div className='auth-choice-container'>
      <h1>Welcome to ZedQuiz</h1>
      <div className='auth-buttons'>
        <button onClick={() => navigate('/login')}>Login</button>
        <button onClick={() => navigate('/register')}>Register</button>
      </div>
    </div>
  );
};

export default AuthChoicePage;
