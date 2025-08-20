import React, { useEffect, useState } from 'react';

import { supabase } from '../supabaseClient';

function InsertSampleQuestionPage({ currentUser, setPage }) {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Preparing to insert sample question...');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        if (!currentUser) {
          setMessage('No user found. Please log in.');
          setLoading(false);
          return;
        }

        const grade_level = 'Form 4';
        const subject = 'Science';
        const title = 'Sample Short Answer – Form 4 Science';
        const today = new Date().toISOString().split('T')[0];

        // 1) Ensure quiz exists (by this teacher)
        setMessage('Checking for existing quiz...');
        const { data: existingQuiz, error: quizFetchError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('author_id', currentUser.id)
          .eq('grade_level', grade_level)
          .eq('subject', subject)
          .eq('title', title)
          .limit(1);
        if (quizFetchError) throw quizFetchError;

        let quiz = existingQuiz && existingQuiz[0];
        if (!quiz) {
          setMessage('Creating quiz...');
          const { data: created, error: createQuizError } = await supabase
            .from('quizzes')
            .insert({ grade_level, subject, title, author_id: currentUser.id, publish_date: today })
            .select()
            .single();
          if (createQuizError) throw createQuizError;
          quiz = created;
        }

        if (!quiz) throw new Error('Quiz not available after create/fetch.');

        // 2) Insert question if not already present
        const question_text =
          'When magnesium ribbon reacts with dilute hydrochloric acid, what gas is produced?';
        const question_type = 'Short-Answer';
        const correct_answer = 'Hydrogen';
        const explanation =
          'Metals like magnesium react with dilute acids to form a salt and hydrogen gas. Balanced equation: Mg + 2HCl → MgCl2 + H2.';

        setMessage('Checking for existing question...');
        const { data: existingQ, error: qFetchError } = await supabase
          .from('questions')
          .select('id')
          .eq('quiz_id', quiz.id)
          .eq('question_text', question_text)
          .limit(1);
        if (qFetchError) throw qFetchError;

        if (!existingQ || existingQ.length === 0) {
          setMessage('Inserting sample question...');
          const payload = {
            quiz_id: quiz.id,
            grade_level: grade_level,
            subject: subject,
            topic: title,
            question_text,
            question_type,
            options: null,
            correct_answer,
            explanation,
            image_url: null
          };
          const { error: insertQError } = await supabase.from('questions').insert(payload);
          if (insertQError) throw insertQError;
          setMessage('Sample question inserted successfully.');
        } else {
          setMessage('Sample question already exists. No duplicate inserted.');
        }
      } catch (err) {
        console.error('Insert sample question error', err);
        setMessage(`Failed: ${err.message || err}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  return (
    <div className='main-container'>
      <header className='main-header admin-header'>
        <h2>Insert Sample Question</h2>
        <button className='back-button' onClick={() => setPage('manage-quizzes')}>
          Back
        </button>
      </header>
      <div className='content-body'>
        <div className='card' style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
            {loading ? 'Working…' : 'Done'}
          </div>
          <p style={{ color: '#6b7280' }}>{message}</p>
          {!loading && (
            <div style={{ marginTop: '1rem' }}>
              <button
                type='button'
                onClick={() => setPage('manage-quizzes')}
                style={{ width: 'auto' }}
              >
                Go to My Quizzes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InsertSampleQuestionPage;
