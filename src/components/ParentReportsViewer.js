import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useToastNotification } from '../hooks/useToastNotification';
import './ParentReportsViewer.css';

function ParentReportsViewer({ user }) {
  const [reports, setReports] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useToastNotification();
  const [children, setChildren] = useState([]);

  // Fetch the parent's linked children
  useEffect(() => {
    const fetchChildren = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('parent_child_relationships')
          .select(
            `
                        id,
                        child:profiles!child_id (id, full_name, email)
                    `
          )
          .eq('parent_id', user.id)
          .eq('status', 'approved');

        if (error) throw error;

        setChildren(data.map(item => item.child));
        if (data.length > 0) {
          setSelectedChild(data[0].child.id);
        }
      } catch (error) {
        showError("Could not fetch your children's data.");
        console.error('Error fetching children:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [user.id, showError]);

  // Fetch reports for the selected child
  useEffect(() => {
    const fetchReports = async () => {
      if (!selectedChild) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('performance_reports')
          .select('*')
          .eq('student_id', selectedChild)
          .order('end_date', { ascending: false });

        if (error) throw error;

        setReports(data || []);
      } catch (error) {
        showError('Could not fetch performance reports.');
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [selectedChild, showError]);

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getChildName = childId => {
    const child = children.find(c => c.id === childId);
    return child ? child.full_name || child.email : 'Unknown';
  };

  if (loading && children.length === 0) {
    return <div>Loading...</div>;
  }

  if (children.length === 0) {
    return (
      <div className='no-children-message'>
        <h3>No Linked Children</h3>
        <p>You haven't linked any children's accounts yet.</p>
        <button
          className='btn-primary'
          onClick={() => (window.location.href = '/parent-dashboard')}
        >
          Link a Child's Account
        </button>
      </div>
    );
  }

  return (
    <div className='reports-container'>
      <div className='child-selector'>
        <label htmlFor='child-select'>Select Child:</label>
        <select
          id='child-select'
          value={selectedChild}
          onChange={e => setSelectedChild(e.target.value)}
        >
          {children.map(child => (
            <option key={child.id} value={child.id}>
              {child.full_name || child.email}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div>Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className='no-reports-message'>
          <h3>No Reports Available</h3>
          <p>No performance reports have been generated yet for {getChildName(selectedChild)}.</p>
        </div>
      ) : (
        <div className='reports-list'>
          <h3>Performance Reports for {getChildName(selectedChild)}</h3>
          {reports.map(report => (
            <div key={report.id} className='report-card'>
              <div className='report-header'>
                <h4>
                  {report.report_type === 'weekly' ? 'Weekly' : 'Monthly'} Report •
                  {formatDate(report.start_date)} to {formatDate(report.end_date)}
                </h4>
                <span className='overall-score'>Overall: {report.report_data.overallAverage}%</span>
              </div>

              <div className='report-section'>
                <h5>📊 Performance Summary</h5>
                <p>
                  Completed <strong>{report.report_data.totalQuizzes}</strong> quizzes with an
                  average score of <strong>{report.report_data.overallAverage}%</strong>.
                </p>
              </div>

              {report.report_data.strengths.length > 0 && (
                <div className='report-section'>
                  <h5>⭐ Strengths</h5>
                  <ul>
                    {report.report_data.strengths.map((strength, i) => (
                      <li key={i}>
                        <strong>{strength.subject}</strong>: {Math.round(strength.average)}%
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {report.report_data.weaknesses.length > 0 && (
                <div className='report-section'>
                  <h5>📉 Areas for Improvement</h5>
                  <ul>
                    {report.report_data.weaknesses.map((weakness, i) => (
                      <li key={i}>
                        <strong>{weakness.subject}</strong>: {Math.round(weakness.average)}%
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {report.report_data.improvementSuggestions.length > 0 && (
                <div className='report-section suggestions'>
                  <h5>📝 Suggestions</h5>
                  <ul>
                    {report.report_data.improvementSuggestions.map((suggestion, i) => (
                      <li key={i}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ParentReportsViewer;
