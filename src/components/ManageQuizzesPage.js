import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function ManageQuizzesPage({ currentUser, setPage, setSelectedQuiz }) {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuizzes = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('quizzes')
                .select('*')
                .eq('author_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching quizzes:", error);
                alert("Could not fetch your quizzes.");
            } else {
                setQuizzes(data);
            }
            setLoading(false);
        };
        fetchQuizzes();
    }, [currentUser.id]);

    const handleEdit = (quiz) => {
        setSelectedQuiz(quiz);
        setPage('add-questions');
    };

    return (
        <div className="main-container">
            <header className="main-header admin-header">
                <h2>My Quizzes</h2>
                <button className="back-button" onClick={() => setPage('teacher-dashboard')}>Back to Dashboard</button>
            </header>
            <div className="content-body">
                <div className="card">
                    <h3>Your Created Quizzes</h3>
                    {loading ? (
                        <p>Loading your quizzes...</p>
                    ) : quizzes.length > 0 ? (
                        <ul className="manage-quiz-list">
                            {quizzes.map(quiz => (
                                <li key={quiz.id}>
                                    <div className="quiz-info">
                                        <strong>{quiz.title}</strong>
                                        <span>{quiz.grade_level} - {quiz.subject}</span>
                                    </div>
                                    <button className="edit-button" onClick={() => handleEdit(quiz)}>Edit Questions</button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>You have not created any quizzes yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ManageQuizzesPage;