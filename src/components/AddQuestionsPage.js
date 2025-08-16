import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function AddQuestionsPage({ selectedQuiz, setPage }) {
  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('Multiple-Choice');
  const [options, setOptions] = useState({ A: '', B: '', C: '', D: '' });
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('quiz_id', selectedQuiz.id)
            .order('created_at', { ascending: true });
        if (error) console.error("Error fetching questions", error);
        else setQuestions(data);
    };
    fetchQuestions();
  }, [selectedQuiz.id]);


  const handleAddQuestion = async (event) => {
    event.preventDefault();
    setLoading(true);
    let imageUrl = null;

    if (imageFile) {
        setUploading(true);
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${selectedQuiz.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
            .from('question_images')
            .upload(filePath, imageFile, { cacheControl: '3600', upsert: true, contentType: imageFile.type || 'application/octet-stream' });

        if (uploadError) {
            const msg = uploadError.message || '';
            if (msg === 'Failed to fetch') {
                alert('Error uploading image: Network/CORS error. Ensure the storage bucket "question_images" exists and that you are online.');
            } else {
                alert('Error uploading image: ' + msg);
            }
            setLoading(false);
            setUploading(false);
            return;
        }

        const { data: urlData } = supabase.storage
            .from('question_images')
            .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
        setUploading(false);
    }

    const questionData = {
        quiz_id: selectedQuiz.id,
        grade_level: selectedQuiz.grade_level,
        subject: selectedQuiz.subject,
        topic: selectedQuiz.title,
        question_text: questionText,
        question_type: questionType,
        options: questionType === 'Multiple-Choice' ? options : null,
        correct_answer: correctAnswer,
        explanation: explanation,
        image_url: imageUrl,
    };

    const { data, error } = await supabase.from('questions').insert(questionData).select().single();

    if (error) {
        alert('Error adding question: ' + error.message);
    } else {
        alert('Question added successfully!');
        setQuestions([...questions, data]);
        // Reset form
        setQuestionText('');
        setOptions({ A: '', B: '', C: '', D: '' });
        setCorrectAnswer('');
        setExplanation('');
        setImageFile(null);
        if (document.getElementById('image-upload')) {
            document.getElementById('image-upload').value = '';
        }
    }
    setLoading(false);
  };

  const renderAnswerFields = () => {
    switch (questionType) {
      case 'Multiple-Choice':
        return (
          <>
            <div className="form-group">
              <label>Options</label>
              <input type="text" placeholder="Option A" value={options.A} onChange={(e) => setOptions({...options, A: e.target.value})} required />
              <input type="text" placeholder="Option B" value={options.B} onChange={(e) => setOptions({...options, B: e.target.value})} required />
              <input type="text" placeholder="Option C" value={options.C} onChange={(e) => setOptions({...options, C: e.target.value})} required />
              <input type="text" placeholder="Option D" value={options.D} onChange={(e) => setOptions({...options, D: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Correct Answer</label>
              <select value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} required>
                <option value="" disabled>-- Select correct option --</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
          </>
        );
      case 'True/False':
        return (
          <div className="form-group">
            <label>Correct Answer</label>
            <select value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} required>
              <option value="" disabled>-- Select correct answer --</option>
              <option value="True">True</option>
              <option value="False">False</option>
            </select>
          </div>
        );
      case 'Short-Answer':
        return (
          <div className="form-group">
            <label>Correct Answer (One word or short phrase)</label>
            <input type="text" value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} required />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="main-container">
      <header className="main-header admin-header">
        <h2>Add Questions to: {selectedQuiz.title}</h2>
        <button className="back-button" onClick={() => setPage('admin-dashboard')}>Finish</button>
      </header>
      <div className="content-body">
        <div className="card">
          <h3>Add a New Question</h3>
          <form onSubmit={handleAddQuestion}>
            <div className="form-group">
              <label>Question Type</label>
              <select value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
                <option value="Multiple-Choice">Multiple-Choice</option>
                <option value="True/False">True/False</option>
                <option value="Short-Answer">Short-Answer</option>
              </select>
            </div>
            <div className="form-group">
              <label>Question Text</label>
              <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} required />
            </div>
             <div className="form-group">
                <label htmlFor="image-upload">Upload Optional Image (Diagram, etc.)</label>
                <input id="image-upload" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
            </div>
            {renderAnswerFields()}
            <div className="form-group">
              <label>Explanation (Why is the answer correct?)</label>
              <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading || uploading}>
                {uploading ? 'Uploading Image...' : loading ? 'Saving...' : 'Save Question'}
            </button>
          </form>
        </div>
        <div className="card">
            <h3>Questions in this Quiz ({questions.length})</h3>
            <ul className="question-list">
                {questions.map((q, index) => (
                    <li key={q.id}>
                        {index + 1}. {q.question_text}
                        {q.image_url && <span className="image-indicator"> (Has Image)</span>}
                    </li>
                ))}
            </ul>
        </div>
      </div>
    </div>
  );
}

export default AddQuestionsPage;