import React, { useState } from 'react';

import logo from '../assets/logo.png';
import { supabase } from '../supabaseClient';

function UpgradePage({ setPage, currentUser }) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    try {
      if (!currentUser) {
        alert('Please log in to upgrade.');
        setPage('auth-choice');
        return;
      }
      setLoading(true);
      const amount = 50; // ZMW, adjust as needed
      const description = 'ZedQuiz Premium Subscription';
      const email = currentUser.email || '';
      const phone_number = currentUser.phone || '';

      const { data, error } = await supabase.functions.invoke('pesapal-create-order', {
        body: {
          amount,
          currency: 'ZMW',
          description,
          email,
          phone_number,
          reference: currentUser.id
        }
      });

      if (error) throw error;
      if (!data || !data.redirect_url || !data.order_tracking_id)
        throw new Error('Invalid response from payment service.');

      // persist tracking id locally for status checks
      localStorage.setItem(
        'pesapal_order',
        JSON.stringify({ orderTrackingId: data.order_tracking_id, userId: currentUser.id })
      );

      // redirect to Pesapal hosted checkout (shows mobile money options)
      window.location.href = data.redirect_url;
    } catch (err) {
      console.error('Failed to initialize payment', err);
      alert('Failed to start payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='main-container'>
      <header className='main-header'>
        <h2>Upgrade to ZedQuiz Premium</h2>
        <button className='back-button' onClick={() => setPage('dashboard')}>
          Back to Dashboard
        </button>
      </header>
      <div className='content-body'>
        <div className='card upgrade-card'>
          <div className='logo' style={{ textAlign: 'center', marginBottom: 10 }}>
            <img src={logo} alt='ZedQuiz Logo' style={{ height: 40, verticalAlign: 'middle' }} />
          </div>
          <h3>Unlock Your Full Potential!</h3>
          <p>
            Join ZedQuiz Premium to get unlimited access to all our features and accelerate your
            learning journey.
          </p>
          <ul className='features-list'>
            <li>✅ Unlimited access to all quizzes</li>
            <li>✅ Simulated mock exams for exam grades</li>
            <li>✅ In-app chat for group study sessions</li>
            <li>✅ Access to personalized tutors (Elite Tier)</li>
            <li>✅ Request personalized video tutorials (Elite Tier)</li>
          </ul>
          <button disabled={loading} className='subscribe-button' onClick={handleSubscribe}>
            {loading ? 'Initializing…' : 'Subscribe Now'}
          </button>
          <div style={{ marginTop: '1rem' }}>
            <button
              type='button'
              onClick={() => setPage('payment-status')}
              style={{ width: 'auto', background: '#6b7280' }}
            >
              I've completed payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpgradePage;
