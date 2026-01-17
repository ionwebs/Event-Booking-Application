import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, NavLink } from 'react-router-dom';

import { useNotifications } from '../../context/NotificationContext';
import './Navbar.css';
import './Notification.css';
import { formatDateForDisplay, formatTimeTo12Hour } from '../../utils/dateUtils';

const Navbar = () => {
    const { currentUser, userRole, logout } = useAuth();
    const navigate = useNavigate();
    const { unreadCount, notifications, markAsRead, markAllAsRead, requestPermission, permission } = useNotifications();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const formatNotificationTime = (date) => {
        if (!date) return '';
        const now = new Date();
        const diff = (now - date) / 1000; // seconds

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return formatDateForDisplay(date.toISOString().split('T')[0]);
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to logout:', error);
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-container container">
                <div className="navbar-brand" onClick={() => navigate('/dashboard')}>
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <rect width="32" height="32" rx="8" fill="url(#gradient)" />
                        <path d="M10 12h12M10 16h12M10 20h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        <defs>
                            <linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32">
                                <stop offset="0%" stopColor="var(--color-primary)" />
                                <stop offset="100%" stopColor="var(--color-secondary)" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <span className="navbar-title">Event Booking</span>
                </div>

                <div className="navbar-menu">
                    <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                        </svg>
                        <span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/calendar" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                        </svg>
                        <span>Calendar</span>
                    </NavLink>
                    <NavLink to="/teams" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                        </svg>
                        <span>Teams</span>
                    </NavLink>
                    <NavLink to="/custom-fields" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 3h18v2H3V3zm0 4h18v2H3V7zm0 4h18v2H3v-2zm0 4h18v2H3v-2zm0 4h18v2H3v-2z" />
                        </svg>
                        <span>Custom Fields</span>
                    </NavLink>
                    {userRole === 'admin' && (
                        <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                            <span>Users</span>
                        </NavLink>
                    )}
                </div>



                <div className="navbar-user">
                    {/* Notification Bell */}
                    <div className="notification-bell-container" onClick={() => setShowNotifications(!showNotifications)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}

                        {showNotifications && (
                            <div className="notification-dropdown" onClick={(e) => e.stopPropagation()}>
                                <div className="notification-header">
                                    <h3>Notifications</h3>
                                    {unreadCount > 0 && (
                                        <button className="mark-all-read" onClick={markAllAsRead}>
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                                <div className="notification-list">
                                    {notifications.length === 0 ? (
                                        <div className="notification-empty">No notifications yet</div>
                                    ) : (
                                        notifications.map(notif => (
                                            <div
                                                key={notif.id}
                                                className={`notification-item ${!notif.read ? 'unread' : ''}`}
                                                onClick={() => markAsRead(notif.id)}
                                            >
                                                <div className="notification-item-header">
                                                    <span className="notification-title">{notif.title}</span>
                                                    <span className="notification-time">{formatNotificationTime(notif.createdAt)}</span>
                                                </div>
                                                <p className="notification-message">{notif.message}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {permission === 'default' && (
                                    <button className="enable-notifications-btn" onClick={requestPermission}>
                                        Enable Push Notifications
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        className="navbar-user-btn"
                        onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                        <div className="navbar-user-avatar">
                            {currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="navbar-user-name">{currentUser?.displayName}</span>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>

                    {showUserMenu && (
                        <div className="navbar-user-menu">
                            <div className="navbar-user-info">
                                <p className="navbar-user-email">{currentUser?.email}</p>
                            </div>
                            <button
                                className="navbar-user-menu-item"
                                onClick={handleLogout}
                            >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                                </svg>
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
