import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useToastNotification } from '../hooks/useToastNotification';
import './ChildConnectionRequests.css';

function ChildConnectionRequests({ user }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showSuccess, showError } = useToastNotification();

    useEffect(() => {
        const fetchRequests = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('parent_child_relationships')
                    .select(`
                        id,
                        status,
                        parent:profiles!parent_id ( id, full_name, email )
                    `)
                    .eq('child_id', user.id)
                    .eq('status', 'pending');

                if (error) throw error;
                setRequests(data || []);
            } catch (error) {
                showError('Could not fetch connection requests.');
                console.error('Error fetching requests:', error);
            }
            setLoading(false);
        };

        fetchRequests();
    }, [user.id, showError]);

    const handleRequest = async (requestId, newStatus) => {
        try {
            const { error } = await supabase
                .from('parent_child_relationships')
                .update({ status: newStatus })
                .eq('id', requestId);

            if (error) throw error;

            showSuccess(`Request has been ${newStatus}.`);
            setRequests(requests.filter(req => req.id !== requestId));

        } catch (error) {
            showError('Failed to update request status.');
            console.error('Error updating request:', error);
        }
    };

    if (loading) {
        return <div>Loading requests...</div>;
    }

    return (
        <div className="connection-requests-container">
            <h3>Parent Connection Requests</h3>
            {requests.length > 0 ? (
                <ul className="requests-list">
                    {requests.map(req => (
                        <li key={req.id}>
                            <span>{req.parent.full_name || req.parent.email} wants to connect.</span>
                            <div className="request-actions">
                                <button onClick={() => handleRequest(req.id, 'approved')} className="approve-btn">Approve</button>
                                <button onClick={() => handleRequest(req.id, 'rejected')} className="reject-btn">Reject</button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>You have no pending connection requests.</p>
            )}
        </div>
    );
}

export default ChildConnectionRequests;
