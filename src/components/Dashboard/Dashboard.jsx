import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase-config';
import Navbar from '../Layout/Navbar';
import EventDetailsModal from '../Booking/EventDetailsModal';
import './Dashboard.css';

const Dashboard = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalBookings: 0,
        upcomingBookings: 0,
        teams: 0
    });
    const [recentBookings, setRecentBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [teams, setTeams] = useState([]);
    const [customFields, setCustomFields] = useState([]);

    useEffect(() => {
        fetchDashboardData();
        fetchCustomFields();
    }, [currentUser]);

    const fetchDashboardData = async () => {
        try {
            // Fetch all teams (global visibility)
            const teamsQuery = query(collection(db, 'teams'));
            const teamsSnapshot = await getDocs(teamsQuery);
            const teamsData = teamsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTeams(teamsData);
            const teamIds = teamsSnapshot.docs.map(doc => doc.id);

            // Fetch all bookings and filter in-memory to avoid index requirement
            if (teamIds.length > 0) {
                const bookingsQuery = query(
                    collection(db, 'bookings'),
                    orderBy('date', 'asc') // Use 'date' to ensure legacy records (missing startDateTime) are included
                );
                const bookingsSnapshot = await getDocs(bookingsQuery);

                // Filter bookings for user's teams
                const allBookings = bookingsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Filter and sort bookings
                const userTeamBookings = allBookings.filter(booking => {
                    // Filter archived (treat missing as false)
                    const isArchived = booking.isArchived || false;
                    if (isArchived) return false;

                    // Filter team
                    return teamIds.includes(booking.teamId);
                }).sort((a, b) => {
                    // Refine sort client-side using full datetime
                    const dateA = a.startDateTime ? (a.startDateTime.toDate ? a.startDateTime.toDate() : new Date(a.startDateTime)) : new Date(`${a.date}T${a.startTime}`);
                    const dateB = b.startDateTime ? (b.startDateTime.toDate ? b.startDateTime.toDate() : new Date(b.startDateTime)) : new Date(`${b.date}T${b.startTime}`);
                    return dateA - dateB;
                });

                // Get recent bookings (first 5 since we sorted ascending)
                const recentBookings = userTeamBookings.slice(0, 5);

                // Calculate stats
                const today = new Date();
                const upcoming = userTeamBookings.filter(b => {
                    // Use startDateTime if available, otherwise fall back to date
                    if (b.startDateTime) {
                        const startDT = b.startDateTime.toDate ? b.startDateTime.toDate() : new Date(b.startDateTime);
                        return startDT >= today;
                    } else {
                        const dateStr = b.date;
                        return dateStr >= today.toISOString().split('T')[0];
                    }
                });

                setStats({
                    totalBookings: userTeamBookings.length,
                    upcomingBookings: upcoming.length,
                    teams: teamIds.length
                });

                setRecentBookings(recentBookings);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (time) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const fetchCustomFields = async () => {
        try {
            const fieldsSnapshot = await getDocs(collection(db, 'customFields'));
            const fieldsData = fieldsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCustomFields(fieldsData);
        } catch (err) {
            console.error('Error fetching custom fields:', err);
        }
    };

    return (
        <div className="dashboard">
            <Navbar />

            <div className="dashboard-container container">
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">Welcome back, {currentUser?.displayName}!</h1>
                        <p className="dashboard-subtitle">Here's what's happening with your bookings</p>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/calendar')}
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        New Booking
                    </button>
                </div>

                {loading ? (
                    <div className="dashboard-loading">
                        <span className="spinner"></span>
                        <p>Loading dashboard...</p>
                    </div>
                ) : (
                    <>
                        <div className="dashboard-stats">
                            <div className="stat-card card">
                                <div className="stat-icon stat-icon-primary">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                                    </svg>
                                </div>
                                <div className="stat-content">
                                    <p className="stat-label">Total Bookings</p>
                                    <p className="stat-value">{stats.totalBookings}</p>
                                </div>
                            </div>

                            <div className="stat-card card">
                                <div className="stat-icon stat-icon-success">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                </div>
                                <div className="stat-content">
                                    <p className="stat-label">Upcoming</p>
                                    <p className="stat-value">{stats.upcomingBookings}</p>
                                </div>
                            </div>

                            <div className="stat-card card">
                                <div className="stat-icon stat-icon-accent">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                                    </svg>
                                </div>
                                <div className="stat-content">
                                    <p className="stat-label">Teams</p>
                                    <p className="stat-value">{stats.teams}</p>
                                </div>
                            </div>
                        </div>

                        <div className="dashboard-recent">
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">Recent Bookings</h3>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => navigate('/calendar')}
                                    >
                                        View All
                                    </button>
                                </div>

                                {recentBookings.length === 0 ? (
                                    <div className="empty-state">
                                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        <h4>No bookings yet</h4>
                                        <p>Create your first booking to get started</p>
                                        <button
                                            className="btn btn-primary mt-md"
                                            onClick={() => navigate('/calendar')}
                                        >
                                            Create Booking
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bookings-list">
                                        {recentBookings.map(booking => (
                                            <div key={booking.id} className="booking-item">
                                                <div className="booking-date">
                                                    <span className="booking-day">
                                                        {new Date(booking.date).getDate()}
                                                    </span>
                                                    <span className="booking-month">
                                                        {new Date(booking.date).toLocaleDateString('en-US', { month: 'short' })}
                                                    </span>
                                                </div>
                                                <div className="booking-details">
                                                    <h4 className="booking-title">{booking.eventName}</h4>
                                                    <p className="booking-time">
                                                        {booking.isWholeDay
                                                            ? 'Whole Day'
                                                            : `${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}`
                                                        }
                                                    </p>
                                                </div>
                                                <div className="booking-team">
                                                    <span className="badge badge-primary">{booking.teamId}</span>
                                                </div>
                                                <div className="booking-actions">
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => setSelectedBooking(booking)}
                                                        title="View event details"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                        </svg>
                                                        View
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Event Details Modal */}
            {selectedBooking && (
                <EventDetailsModal
                    booking={selectedBooking}
                    teams={teams}
                    customFields={customFields}
                    onClose={() => setSelectedBooking(null)}
                    onEdit={(id) => navigate(`/booking/edit/${id}`)}
                    onViewInCalendar={() => navigate('/calendar')}
                    showEditButton={true}
                    showDeleteButton={false}
                    showViewInCalendarButton={true}
                />
            )}
        </div>
    );
};

export default Dashboard;
