import React from 'react';

function AuthChoicePage({ setPage }) {
  return (
    <div className="auth-choice-container">
      <div className="zambian-eagle">🦅</div>
      <h2>Join ZedQuiz</h2>
      <p>Are you a new or returning user?</p>
      <div className="choice-buttons">
        <button className="login-choice-btn" onClick={() => setPage('login')}>
          I have an account (Login)
        </button>
        <button className="register-choice-btn" onClick={() => setPage('register')}>
          I'm a new user (Register)
        </button>
      </div>
      <button className="back-to-home-button" onClick={() => setPage('landing')}>
        Back to Home
      </button>
    </div>
  );
}

export default AuthChoicePage;