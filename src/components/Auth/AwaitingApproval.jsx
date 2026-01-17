import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const AwaitingApproval = () => {
    const { currentUser, userStatus, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Auto-refresh status every 30 seconds
    React.useEffect(() => {
        const interval = setInterval(() => {
            window.location.reload();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-icon">
                        {userStatus === 'rejected' ? (
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                        ) : (
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        )}
                    </div>
                    <h1 className="auth-title">
                        {userStatus === 'rejected' ? 'Access Denied' : 'Awaiting Approval'}
                    </h1>
                    <p className="auth-subtitle">
                        {userStatus === 'rejected'
                            ? 'Your access request has been declined'
                            : 'Your account is pending administrator approval'
                        }
                    </p>
                </div>

                <div className="approval-info">
                    <div className="info-item">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        <div>
                            <strong>Email:</strong>
                            <span>{currentUser?.email}</span>
                        </div>
                    </div>

                    <div className="info-item">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <strong>Status:</strong>
                            <span className={`status-badge status-${userStatus}`}>
                                {userStatus === 'rejected' ? 'Rejected' : 'Pending'}
                            </span>
                        </div>
                    </div>
                </div>

                {userStatus === 'pending' && (
                    <div className="approval-message">
                        <p>
                            <strong>What happens next?</strong>
                        </p>
                        <ul>
                            <li>An administrator will review your request</li>
                            <li>You'll receive access once approved</li>
                            <li>This page will automatically refresh every 30 seconds</li>
                        </ul>
                    </div>
                )}

                {userStatus === 'rejected' && (
                    <div className="approval-message error">
                        <p>
                            <strong>Access Denied</strong>
                        </p>
                        <p>
                            Your request to access this application has been declined by an administrator.
                            Please contact support if you believe this is an error.
                        </p>
                    </div>
                )}

                <button
                    className="btn btn-secondary btn-full-width"
                    onClick={handleLogout}
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                    </svg>
                    Logout
                </button>
            </div>
        </div>
    );
};

export default AwaitingApproval;
