import React from 'react';
import logo from '../assets/logo.png';

function LandingPage({ setPage }) {
  return (
    <div className="landing-container">
      <header className="landing-header">
        <div className="logo">
          <img src={logo} alt="ZedQuiz Logo" style={{ height: 40, verticalAlign: 'middle' }} />
          <span style={{ marginLeft: 8, fontWeight: 700, fontSize: '1.3em', color: 'var(--zambian-green)' }}>ZedQuiz</span>
        </div>
        <nav className="nav-buttons">
          <button className="nav-button find-teacher-btn" onClick={() => setPage('browse-teachers')}>Find a Teacher</button>
          <button className="nav-button tutor-button" onClick={() => setPage('tutor-application')}>Become a Teacher</button>
          <button className="nav-button" onClick={() => setPage('auth-choice')}>Login / Register</button>
        </nav>
      </header>
      <main className="landing-main">
        <div className="hero-section">
          <h1>Empowering the Next Generation of Zambian Leaders</h1>
          <p className="subtitle">Interactive quizzes and AI-powered feedback for students from Grade 1 to A-Levels. Made for Zambia, by Zambians.</p>
          <button className="hero-button" onClick={() => setPage('auth-choice')}>Get Started for Free</button>
        </div>

        <div className="features-section">
          <h2>Why Choose ZedQuiz?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>For Students</h3>
              <p>Access quizzes for your grade and subject. Track your progress and compete on provincial leaderboards.</p>
            </div>
            <div className="feature-card">
              <h3>For Teachers & Tutors</h3>
              <p>Join our platform to create quizzes, offer lessons, and earn an income by sharing your knowledge.</p>
            </div>
            <div className="feature-card">
              <h3>AI-Powered Marking</h3>
              <p>Our smart AI understands concepts, not just keywords, providing fair and insightful marking on short answers.</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="landing-footer">
        <p>&copy; 2025 ZedQuiz. All Rights Reserved. One Zambia, One Nation.</p>
      </footer>
    </div>
  );
}

export default LandingPage;