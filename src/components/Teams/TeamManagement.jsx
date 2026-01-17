import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    updateDoc,
    deleteDoc,
    doc
} from 'firebase/firestore';
import { db } from '../../firebase-config';
import Navbar from '../Layout/Navbar';
import './TeamManagement.css';

const TeamManagement = () => {
    const { currentUser } = useAuth();
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchTeams();
    }, [currentUser]);

    const fetchTeams = async () => {
        try {
            const teamsQuery = query(
                collection(db, 'teams')
            );
            const teamsSnapshot = await getDocs(teamsQuery);
            const teamsData = teamsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTeams(teamsData);
        } catch (err) {
            console.error('Error fetching teams:', err);
            setError('Failed to load teams');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!newTeamName.trim()) {
            setError('Team name is required');
            return;
        }

        try {
            await addDoc(collection(db, 'teams'), {
                name: newTeamName.trim(),
                members: [currentUser.uid],
                createdBy: currentUser.uid,
                createdAt: new Date()
            });

            setSuccess('Team created successfully!');
            setNewTeamName('');
            setShowCreateModal(false);
            fetchTeams();

            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error creating team:', err);
            setError('Failed to create team');
        }
    };

    const handleDeleteTeam = async (teamId) => {
        if (!window.confirm('Are you sure you want to delete this team?')) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'teams', teamId));
            setSuccess('Team deleted successfully!');
            fetchTeams();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error deleting team:', err);
            setError('Failed to delete team');
        }
    };

    return (
        <div className="team-management">
            <Navbar />

            <div className="team-container container">
                <div className="team-header">
                    <div>
                        <h1 className="team-title">Team Management</h1>
                        <p className="team-subtitle">Create and manage your booking teams</p>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Create Team
                    </button>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </div>
                )}

                {success && (
                    <div className="alert alert-success">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {success}
                    </div>
                )}

                {loading ? (
                    <div className="team-loading">
                        <span className="spinner"></span>
                        <p>Loading teams...</p>
                    </div>
                ) : teams.length === 0 ? (
                    <div className="empty-state card">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <h3>No teams yet</h3>
                        <p>Create your first team to start managing bookings</p>
                        <button
                            className="btn btn-primary mt-md"
                            onClick={() => setShowCreateModal(true)}
                        >
                            Create Team
                        </button>
                    </div>
                ) : (
                    <div className="teams-grid">
                        {teams.map(team => (
                            <div key={team.id} className="team-card card">
                                <div className="team-card-header">
                                    <div className="team-card-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                                        </svg>
                                    </div>
                                    <h3 className="team-card-title">{team.name}</h3>
                                </div>

                                <div className="team-card-body">
                                    <div className="team-card-stat">
                                        <span className="team-card-stat-label">Members</span>
                                        <span className="team-card-stat-value">{team.members?.length || 0}</span>
                                    </div>
                                    <div className="team-card-stat">
                                        <span className="team-card-stat-label">Created</span>
                                        <span className="team-card-stat-value">
                                            {team.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div className="team-card-actions">
                                    <button
                                        className="btn btn-danger"
                                        onClick={() => handleDeleteTeam(team.id)}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Team Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Create New Team</h3>
                            <button
                                className="modal-close"
                                onClick={() => setShowCreateModal(false)}
                            >
                                <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleCreateTeam}>
                            <div className="form-group">
                                <label className="form-label">Team Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., Team A, Marketing Team"
                                    value={newTeamName}
                                    onChange={(e) => setNewTeamName(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Create Team
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamManagement;
