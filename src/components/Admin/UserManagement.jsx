import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase-config';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../Layout/Navbar';
import './UserManagement.css';

const UserManagement = () => {
    const { currentUser, userRole } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, pending, approved, rejected

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(usersQuery);

            const usersList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setUsers(usersList);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (userId, newStatus) => {
        try {
            setError('');
            setSuccess('');

            await updateDoc(doc(db, 'users', userId), {
                status: newStatus,
                updatedAt: new Date()
            });

            // Update local state
            setUsers(users.map(user =>
                user.id === userId ? { ...user, status: newStatus } : user
            ));

            setSuccess(`User ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully.`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error updating user:', err);
            setError('Failed to update user status.');
        }
    };

    const handleToggleRole = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';

        if (userId === currentUser.uid) {
            if (!window.confirm('Warning: You are about to remove your own admin privileges. You will lose access to this page immediately. Continue?')) {
                return;
            }
        }

        try {
            setError('');
            setSuccess('');

            await updateDoc(doc(db, 'users', userId), {
                role: newRole,
                updatedAt: new Date()
            });

            // Update local state
            setUsers(users.map(user =>
                user.id === userId ? { ...user, role: newRole } : user
            ));

            setSuccess(`User role updated to ${newRole}.`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error updating role:', err);
            setError('Failed to update user role.');
        }
    };

    const filteredUsers = users.filter(user => {
        if (filterStatus === 'all') return true;
        return user.status === filterStatus;
    });

    if (loading) {
        return (
            <div className="user-management-page">
                <Navbar />
                <div className="container user-management-container">
                    <div className="loading-state">
                        <div className="spinner"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (userRole !== 'admin') {
        return (
            <div className="user-management-page">
                <Navbar />
                <div className="container user-management-container">
                    <div className="error-banner">
                        <p>You do not have permission to view this page.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="user-management-page">
            <Navbar />
            <div className="container user-management-container">
                <div className="page-header">
                    <h1 className="page-title">User Management</h1>
                    <p className="page-subtitle">Approve new users and manage permissions</p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <p>{error}</p>
                    </div>
                )}

                {success && (
                    <div className="alert alert-success">
                        <p>{success}</p>
                    </div>
                )}

                {/* Filters */}
                <div className="card filter-section">
                    <div className="filter-group">
                        <span className="filter-label">Filter by status:</span>
                        <div className="filter-options">
                            {['all', 'pending', 'approved', 'rejected'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`btn btn-filter ${filterStatus === status ? 'active' : ''}`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Users List */}
                <div className="card users-list-card">
                    <div className="table-responsive">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Status</th>
                                    <th>Role</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="user-row">
                                        <td data-label="User">
                                            <div className="user-info">
                                                <div className="user-avatar">
                                                    {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="user-details">
                                                    <div className="user-name">
                                                        {user.displayName || 'No Name'}
                                                    </div>
                                                    <div className="user-email">
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td data-label="Status">
                                            <span className={`status-badge status-${user.status || 'pending'}`}>
                                                {user.status?.toUpperCase() || 'PENDING'}
                                            </span>
                                        </td>
                                        <td data-label="Role">
                                            {user.role === 'admin' ? (
                                                <span className="role-badge role-admin">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                    </svg>
                                                    Admin
                                                </span>
                                            ) : (
                                                <span className="role-text">User</span>
                                            )}
                                        </td>
                                        <td data-label="Joined">
                                            <span className="date-text">
                                                {user.createdAt?.seconds
                                                    ? new Date(user.createdAt.seconds * 1000).toLocaleDateString()
                                                    : 'N/A'}
                                            </span>
                                        </td>
                                        <td data-label="Actions">
                                            <div className="action-buttons">
                                                {user.status !== 'approved' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(user.id, 'approved')}
                                                        className="btn btn-sm btn-success"
                                                        title="Approve User"
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                                {user.status !== 'rejected' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(user.id, 'rejected')}
                                                        className="btn btn-sm btn-danger"
                                                        title="Reject User"
                                                    >
                                                        Reject
                                                    </button>
                                                )}
                                                <span className="divider">|</span>
                                                <button
                                                    onClick={() => handleToggleRole(user.id, user.role)}
                                                    className={`btn btn-sm ${user.role === 'admin' ? 'btn-secondary' : 'btn-primary'}`}
                                                >
                                                    {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredUsers.length === 0 && (
                            <div className="empty-state">
                                <p>No users found with status: {filterStatus}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
