import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requireApproval = true }) => {
    const { currentUser, userStatus, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // specific check for approved users
    if (requireApproval && userStatus !== 'approved') {
        return <Navigate to="/awaiting-approval" replace />;
    }

    return children;
};

export default ProtectedRoute;
