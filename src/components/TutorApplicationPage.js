import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

function TutorApplicationPage({ setPage }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [qualifications, setQualifications] = useState('');
    const [cvFile, setCvFile] = useState(null);
    const [certsFile, setCertsFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (setter) => (event) => {
        if (event.target.files && event.target.files.length > 0) {
            setter(event.target.files[0]);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!cvFile || !certsFile) {
            alert('Please upload both your CV and your certificates.');
            return;
        }
        setLoading(true);

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: fullName, role: 'student' } },
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Account created, but user data not returned.");

            const newUserId = authData.user.id;

            const uploadFile = async (file, fileType) => {
                const fileExt = file.name.split('.').pop();
                const fileName = `${fileType}.${fileExt}`;
                const filePath = `${newUserId}/${fileName}`;
                const { error } = await supabase.storage.from('tutor_documents').upload(filePath, file, { upsert: true });
                if (error) throw error;
                return filePath;
            };

            const cvPath = await uploadFile(cvFile, 'cv');
            const certsPath = await uploadFile(certsFile, 'certificates');

            const { error: insertError } = await supabase
                .from('tutor_applications')
                .insert({
                    user_id: newUserId,
                    full_name: fullName,
                    phone_number: phoneNumber,
                    qualifications: qualifications,
                    cv_url: cvPath,
                    certificates_url: certsPath,
                });
            
            if (insertError) throw insertError;

            alert('Your application has been submitted successfully! We will review it and get back to you.');
            setPage('login');

        } catch (error) {
            alert('Error submitting application: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="main-container">
            <header className="main-header">
                <h2>Become a ZedQuiz Teacher</h2>
                <button className="back-button" onClick={() => setPage('landing')}>Back to Home</button>
            </header>
            <div className="content-body">
                <div className="card">
                    <h3>Teacher Application Form</h3>
                    <p>Complete the form below to create your account and apply. Student teachers in their second year and above are welcome!</p>
                    <form onSubmit={handleSubmit}>
                        {/* Form groups remain the same */}
                        <div className="form-group">
                            <label htmlFor="full-name">Full Name</label>
                            <input id="full-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">Create Password</label>
                            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="phone">Phone Number</label>
                            <input id="phone" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="e.g., 0977123456" required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="qualifications">Qualifications / Course of Study</label>
                            <textarea id="qualifications" value={qualifications} onChange={(e) => setQualifications(e.target.value)} placeholder="e.g., TCZ Certified Teacher, or 2nd Year Student Teacher at UNZA" required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="cv-upload">Upload CV (PDF only)</label>
                            <input id="cv-upload" type="file" accept=".pdf" onChange={handleFileChange(setCvFile)} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="certs-upload">Upload Qualifications/Transcripts (PDF only)</label>
                            <input id="certs-upload" type="file" accept=".pdf" onChange={handleFileChange(setCertsFile)} required />
                        </div>
                        <button type="submit" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Application'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default TutorApplicationPage;