import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import logo from '../assets/logo.png';

function RegistrationPage({ setPage }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Grade 1');
  const [province, setProvince] = useState('Lusaka');

  const gradeLevels = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'A Levels'
  ];

  const provinces = [
    'Central', 'Copperbelt', 'Eastern', 'Luapula', 'Lusaka',
    'Muchinga', 'Northern', 'North-Western', 'Southern', 'Western'
  ];

  const handleRegister = async (event) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
          school_name: schoolName,
          grade_level: gradeLevel,
          province: province,
        }
      }
    });

    if (error) {
      alert(error.error_description || error.message);
    } else {
      alert('Registration successful! Please check your email to verify your account.');
      setPage('login');
    }
    setLoading(false);
  };

  return (
    <div className="register-container">
      <div className="logo" style={{ textAlign: 'center', marginBottom: 10 }}>
        <img src={logo} alt="ZedQuiz Logo" style={{ height: 40, verticalAlign: 'middle' }} />
      </div>
      
      <h2>Create Your Account</h2>
      <p>Join the ZedQuiz community!</p>
      <form onSubmit={handleRegister}>
        <div className="form-group">
          <label htmlFor="full-name">Full Name</label>
          <input id="full-name" type="text" placeholder="e.g., Bwalya Phiri" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="school-name">School Name</label>
          <input id="school-name" type="text" placeholder="e.g., David Kaunda STEM School" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="grade-level">Grade Level</label>
          <select id="grade-level" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} required>
            {gradeLevels.map(grade => <option key={grade} value={grade}>{grade}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="province">Province</label>
          <select id="province" value={province} onChange={(e) => setProvince(e.target.value)} required>
            {provinces.map(prov => <option key={prov} value={prov}>{prov}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p className="auth-switch-text">
        Already have an account? <span onClick={() => setPage('login')}>Login here</span>
      </p>
    </div>
  );
}

export default RegistrationPage;