import React from 'react';

function UpgradePage({ setPage }) {
  const handleSubscribe = () => {
    // This will be connected to a payment gateway like Paystack later.
    alert('Payment integration is coming soon!');
  };

  return (
    <div className="main-container">
      <header className="main-header">
        <h2>Upgrade to ZedQuiz Premium</h2>
        <button className="back-button" onClick={() => setPage('dashboard')}>Back to Dashboard</button>
      </header>
      <div className="content-body">
        <div className="card upgrade-card">
          <div className="zambian-eagle">🌟</div>
          <h3>Unlock Your Full Potential!</h3>
          <p>Join ZedQuiz Premium to get unlimited access to all our features and accelerate your learning journey.</p>
          <ul className="features-list">
            <li>✅ Unlimited access to all quizzes</li>
            <li>✅ Simulated mock exams for exam grades</li>
            <li>✅ In-app chat for group study sessions</li>
            <li>✅ Access to personalized tutors (Elite Tier)</li>
            <li>✅ Request personalized video tutorials (Elite Tier)</li>
          </ul>
          <button className="subscribe-button" onClick={handleSubscribe}>
            Subscribe Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpgradePage;