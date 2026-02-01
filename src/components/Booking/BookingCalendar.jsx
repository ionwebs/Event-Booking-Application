import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    deleteDoc,
    doc,
    updateDoc,
    startAfter,
    limit,
    writeBatch
} from 'firebase/firestore';
import { db } from '../../firebase-config';
import Navbar from '../Layout/Navbar';
import EventDetailsModal from './EventDetailsModal';
import { formatDateForDisplay, formatTimeTo12Hour, getDayOfWeek, formatDateRange, formatDateTimeForDisplay, isSameDay, formatDuration } from '../../utils/dateUtils';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './BookingCalendar.css';

const locales = {
    'en-US': import('date-fns/locale/en-US')
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const BookingCalendar = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [bookings, setBookings] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTeamFilter, setSelectedTeamFilter] = useState('all');
    const [success, setSuccess] = useState('');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [customFields, setCustomFields] = useState([]);
    const [customFieldFilters, setCustomFieldFilters] = useState({});

    // View Mode State
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
    const [archiveView, setArchiveView] = useState(false); // false = Active, true = Archive

    // Temporary filter state (before applying)
    const [tempTeamFilter, setTempTeamFilter] = useState('all');
    const [tempCustomFieldFilters, setTempCustomFieldFilters] = useState({});
    const [filtersExpanded, setFiltersExpanded] = useState(false); // Collapsed by default

    // Pagination state
    const [pageSize, setPageSize] = useState(25);
    const [lastVisible, setLastVisible] = useState(null);
    const [firstVisible, setFirstVisible] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    // Notification & Confirmation State
    const [error, setError] = useState('');
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        message: '',
        onConfirm: null
    });

    // Use ref to track if we need to reset pagination
    const shouldResetPagination = useRef(false);

    useEffect(() => {
        fetchCustomFields();
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        console.log('🔄 useEffect triggered - Resetting pagination', {
            pageSize,
            selectedTeamFilter,
            customFieldFiltersCount: Object.keys(customFieldFilters).length,
            archiveView
        });

        // Mark that we need to reset pagination
        shouldResetPagination.current = true;

        // Reset pagination state when filters or page size change
        setLastVisible(null);
        setFirstVisible(null);
        setHasPrevious(false);
        setHasMore(true);

        // Fetch data from beginning
        fetchDataInternal();
    }, [currentUser, selectedTeamFilter, customFieldFilters, pageSize, archiveView]);


    // Archive/Unarchive handler
    const handleArchiveToggle = async (bookingId, currentArchiveStatus) => {
        try {
            const newArchiveStatus = !currentArchiveStatus;
            await updateDoc(doc(db, 'bookings', bookingId), {
                isArchived: newArchiveStatus,
                updatedAt: new Date()
            });

            setSuccess(`Event ${newArchiveStatus ? 'archived' : 'unarchived'} successfully!`);

            // Refresh data
            shouldResetPagination.current = true;
            setLastVisible(null);
            setFirstVisible(null);
            setHasPrevious(false);

            fetchDataInternal();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error toggling archive status:', err);
            setError('Failed to update archive status');
            setTimeout(() => setError(''), 3000);
        }
    };

    // Calendar Events Transformation
    const calendarEvents = bookings.map(booking => {
        // Support both new datetime fields and old date/time fields
        let start, end;

        if (booking.startDateTime && booking.endDateTime) {
            // New format: use datetime objects
            start = booking.startDateTime.toDate ? booking.startDateTime.toDate() : new Date(booking.startDateTime);
            end = booking.endDateTime.toDate ? booking.endDateTime.toDate() : new Date(booking.endDateTime);
        } else {
            // Old format: construct from date + time
            start = new Date(`${booking.date}T${booking.startTime}`);
            end = booking.isWholeDay
                ? new Date(`${booking.date}T23:59:59`)
                : new Date(`${booking.date}T${booking.endTime}`);
        }

        return {
            id: booking.id,
            title: booking.eventName,
            start,
            end,
            allDay: booking.isWholeDay,
            resource: booking
        };
    });

    const eventStyleGetter = (event) => {
        const backgroundColor = getTeamColor(event.resource.teamId);
        return {
            style: {
                backgroundColor,
                borderRadius: '4px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    const handleApplyFilters = () => {
        // Apply temporary filters
        setSelectedTeamFilter(tempTeamFilter);
        setCustomFieldFilters(tempCustomFieldFilters);
    };

    const handleClearFilters = () => {
        // Clear both temp and applied filters
        setTempTeamFilter('all');
        setTempCustomFieldFilters({});
        setSelectedTeamFilter('all');
        setCustomFieldFilters({});
    };

    const fetchDataInternal = async (direction = 'next') => {
        try {
            setLoading(true);

            // Fetch teams
            const teamsQuery = query(
                collection(db, 'teams')
            );
            const teamsSnapshot = await getDocs(teamsQuery);
            const teamsData = teamsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTeams(teamsData);

            // Build bookings query with filters
            // Note: We don't filter by isArchived in the query to support existing records
            // that don't have this field. Instead, we filter client-side below.
            // Sorting: Active events = ascending (upcoming first), Archived = descending (most recent first)
            const sortOrder = archiveView ? 'desc' : 'asc';
            let bookingsQueryConstraints = [
                orderBy('date', sortOrder),
                limit(pageSize + 1) // Fetch one extra to check if there's more
            ];

            // Add team filter
            if (selectedTeamFilter !== 'all') {
                bookingsQueryConstraints.unshift(where('teamId', '==', selectedTeamFilter));
            }

            // Custom field filters are applied CLIENT-SIDE (see below)

            // Add pagination - only use cursors when explicitly navigating AND not resetting
            const isResetting = shouldResetPagination.current;

            if (isResetting) {
                shouldResetPagination.current = false; // Reset the flag
            } else if (direction === 'next' && lastVisible) {
                bookingsQueryConstraints.push(startAfter(lastVisible));
            } else if (direction === 'prev' && firstVisible) {
                const reverseSortOrder = archiveView ? 'asc' : 'desc'; // Reverse for pagination
                bookingsQueryConstraints = [
                    orderBy('date', reverseSortOrder),
                    limit(pageSize + 1),
                    startAfter(firstVisible)
                ];
                // Re-add team filter for reverse query
                if (selectedTeamFilter !== 'all') {
                    bookingsQueryConstraints.splice(1, 0, where('teamId', '==', selectedTeamFilter));
                }
                // Custom field filters applied client-side
            }
            // If direction is undefined or 'next' without lastVisible, start from beginning

            const bookingsQuery = query(
                collection(db, 'bookings'),
                ...bookingsQueryConstraints
            );

            const bookingsSnapshot = await getDocs(bookingsQuery);
            const allDocs = bookingsSnapshot.docs;

            console.log('📦 Fetched documents:', allDocs.length);
            console.log('📋 Sample document data:', allDocs[0]?.data());

            let bookingsData = allDocs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Filter by archive status client-side (treats missing isArchived as false)
            bookingsData = bookingsData.filter(booking => {
                const isArchived = booking.isArchived || false; // Treat missing as false
                return isArchived === archiveView;
            });

            // Apply custom field filters client-side
            Object.keys(customFieldFilters).forEach(fieldId => {
                const filterValue = customFieldFilters[fieldId];
                if (filterValue && filterValue !== 'all') {
                    const field = customFields.find(f => f.id === fieldId);

                    bookingsData = bookingsData.filter(booking => {
                        const bookingValue = booking.customFieldValues?.[fieldId];

                        if (!bookingValue) return false;

                        if (field?.type === 'text') {
                            // Case-insensitive substring match for text fields
                            return bookingValue.toLowerCase().includes(filterValue.toLowerCase().trim());
                        } else if (field?.type === 'number') {
                            // Exact match for numbers
                            return bookingValue.toString() === filterValue.toString();
                        } else {
                            // Exact match for select fields
                            return bookingValue === filterValue;
                        }
                    });
                }
            });

            console.log('✅ After client-side filtering:', bookingsData.length, 'bookings');

            // Reverse if going backwards
            if (direction === 'prev') {
                bookingsData = bookingsData.reverse();
            }

            // Check if there are more results
            const hasMoreResults = bookingsData.length > pageSize;
            if (hasMoreResults) {
                bookingsData = bookingsData.slice(0, pageSize);
            }

            setHasMore(hasMoreResults);
            setHasPrevious(direction === 'next' ? (lastVisible !== null) : true);

            // Set pagination cursors correctly
            if (bookingsData.length > 0) {
                const actualDocs = direction === 'prev'
                    ? allDocs.slice(0, pageSize).reverse()
                    : allDocs.slice(0, pageSize);

                setFirstVisible(actualDocs[0]);
                setLastVisible(actualDocs[actualDocs.length - 1]);
            } else {
                setFirstVisible(null);
                setLastVisible(null);
            }

            setBookings(bookingsData);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchData = (direction) => {
        // Wrapper function for pagination buttons
        fetchDataInternal(direction);
    };

    const notifyUsers = async (bookingData) => {
        try {
            // Get all approved users
            const usersQuery = query(
                collection(db, 'users'),
                where('status', '==', 'approved')
            );
            const usersSnapshot = await getDocs(usersQuery);

            const batch = writeBatch(db);
            const title = 'Booking Cancelled';
            const message = `${currentUser.displayName || 'A user'} cancelled booking "${bookingData.eventName}"`;

            let count = 0;
            usersSnapshot.docs.forEach(userDoc => {
                if (userDoc.id !== currentUser.uid) {
                    const notifRef = doc(collection(db, 'notifications'));
                    batch.set(notifRef, {
                        recipientId: userDoc.id,
                        type: 'booking_deleted',
                        title: title,
                        message: message,
                        bookingId: bookingData.id || null,
                        read: false,
                        createdAt: new Date(),
                        senderId: currentUser.uid
                    });
                    count++;
                }
            });

            if (count > 0) {
                await batch.commit();
            }
        } catch (error) {
            console.error('Error sending notifications:', error);
        }
    };

    const handleDeleteBooking = async (bookingId) => {
        try {
            // Find booking details for notification before deleting
            const bookingToDelete = bookings.find(b => b.id === bookingId);

            await deleteDoc(doc(db, 'bookings', bookingId));
            setSuccess('Booking deleted successfully!');

            if (bookingToDelete) {
                notifyUsers(bookingToDelete);
            }

            // Reset pagination to avoid empty state (fetched "next" page instead of refresh)
            shouldResetPagination.current = true;
            setLastVisible(null);
            setFirstVisible(null);
            setHasPrevious(false);

            fetchDataInternal(); // Refresh from beginning after delete
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error deleting booking:', err);
            setError('Failed to delete booking');
            setTimeout(() => setError(''), 3000);
        }
        setConfirmModal({ isOpen: false, message: '', onConfirm: null });
    };

    const requestDelete = (bookingId) => {
        setConfirmModal({
            isOpen: true,
            message: 'Are you sure you want to delete this booking? This action cannot be undone.',
            onConfirm: () => handleDeleteBooking(bookingId)
        });
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

    const getTeamName = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : teamId;
    };

    const getTeamColor = (teamId) => {
        const colors = [
            'var(--color-team-a)',
            'var(--color-team-b)',
            'var(--color-team-c)',
            'var(--color-team-d)'
        ];
        const index = teams.findIndex(t => t.id === teamId);
        return colors[index % colors.length];
    };

    // Group bookings by date
    const groupedBookings = bookings.reduce((groups, booking) => {
        const date = booking.date;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(booking);
        return groups;
    }, {});

    return (
        <div className="booking-calendar">
            <Navbar />

            <div className="calendar-container container">
                <div className="calendar-header">
                    <div>
                        <h1 className="calendar-title">Event Calendar</h1>
                        <p className="calendar-subtitle">View and manage all your bookings</p>
                    </div>
                    <div className="header-actions">
                        <div className="view-toggle">
                            <button
                                className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setViewMode('list')}
                            >
                                List View
                            </button>
                            <button
                                className={`btn ${viewMode === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setViewMode('calendar')}
                            >
                                Calendar View
                            </button>
                        </div>
                        <div className="view-toggle">
                            <button
                                className={`btn ${!archiveView ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setArchiveView(false)}
                            >
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{ marginRight: '4px' }}>
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                Active
                            </button>
                            <button
                                className={`btn ${archiveView ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setArchiveView(true)}
                            >
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{ marginRight: '4px' }}>
                                    <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                                    <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                                Archive
                            </button>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/booking/new')}
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            New Booking
                        </button>
                    </div>
                </div>

                {success && (
                    <div className="alert alert-success">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {success}
                    </div>
                )}

                {error && (
                    <div className="alert alert-error">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </div>
                )}

                {/* Unified Filter Section */}
                <div className="calendar-filters-section">
                    <div className="filters-header" onClick={() => setFiltersExpanded(!filtersExpanded)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
                        </svg>
                        <h3 className="filters-title">Filters</h3>
                        <svg
                            className={`filters-toggle-icon ${filtersExpanded ? 'expanded' : ''}`}
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </div>

                    {filtersExpanded && (
                        <div className="filters-content">
                            <div className="filters-grid">
                                {/* Team Filter */}
                                <div className="filter-item">
                                    <label className="filter-item-label">Team</label>
                                    <select
                                        className="filter-select"
                                        value={tempTeamFilter}
                                        onChange={(e) => setTempTeamFilter(e.target.value)}
                                    >
                                        <option value="all">All Teams</option>
                                        {teams.map(team => (
                                            <option key={team.id} value={team.id}>
                                                {team.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Custom Field Filters */}
                                {customFields.map(field => (
                                    <div key={field.id} className="filter-item">
                                        <label className="filter-item-label">{field.name}</label>
                                        {field.type === 'select' ? (
                                            <select
                                                className="filter-select"
                                                value={tempCustomFieldFilters[field.id] || 'all'}
                                                onChange={(e) => setTempCustomFieldFilters({
                                                    ...tempCustomFieldFilters,
                                                    [field.id]: e.target.value
                                                })}
                                            >
                                                <option value="all">All</option>
                                                {field.options.map((option, index) => (
                                                    <option key={index} value={option}>
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type={field.type === 'number' ? 'number' : 'text'}
                                                className="filter-input"
                                                placeholder={`Filter by ${field.name}`}
                                                value={tempCustomFieldFilters[field.id] || ''}
                                                onChange={(e) => setTempCustomFieldFilters({
                                                    ...tempCustomFieldFilters,
                                                    [field.id]: e.target.value
                                                })}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Filter Action Buttons */}
                            <div className="filter-actions">
                                <button
                                    className="btn btn-primary"
                                    onClick={handleApplyFilters}
                                >
                                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Apply Filters
                                </button>
                                {(tempTeamFilter !== 'all' || Object.keys(tempCustomFieldFilters).some(k => tempCustomFieldFilters[k] && tempCustomFieldFilters[k] !== 'all')) && (
                                    <button
                                        className="btn btn-secondary"
                                        onClick={handleClearFilters}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {/* Pagination Controls - Only show in list mode */}
                {viewMode === 'list' && (
                    <div className="pagination-controls">
                        <div className="pagination-info">
                            <label className="pagination-label">Show:</label>
                            <select
                                className="pagination-select"
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <span className="pagination-text">events per page</span>
                            {totalCount > 0 && (
                                <span className="pagination-total">• Total: {totalCount} events</span>
                            )}
                        </div>

                        <div className="pagination-buttons">
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => fetchData('prev')}
                                disabled={!hasPrevious || loading}
                            >
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Previous
                            </button>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => fetchData('next')}
                                disabled={!hasMore || loading}
                            >
                                Next
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="calendar-loading">
                        <span className="spinner"></span>
                        <p>Loading bookings...</p>
                    </div>
                ) : (
                    <>
                        {viewMode === 'calendar' ? (
                            <div className="calendar-view-container card">
                                <Calendar
                                    localizer={localizer}
                                    events={calendarEvents}
                                    startAccessor="start"
                                    endAccessor="end"
                                    style={{ height: 600 }}
                                    eventPropGetter={eventStyleGetter}
                                    onSelectEvent={booking => setSelectedBooking(booking.resource)}
                                    popup
                                />
                            </div>
                        ) : Object.keys(groupedBookings).length === 0 ? (
                            <div className="empty-state card">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                <h3>No bookings yet</h3>
                                <p>Create your first booking to get started</p>
                                <button
                                    className="btn btn-primary mt-md"
                                    onClick={() => navigate('/booking/new')}
                                >
                                    Create Booking
                                </button>
                            </div>
                        ) : (
                            <div className="calendar-timeline">
                                {Object.entries(groupedBookings).sort().map(([date, dateBookings]) => (
                                    <div key={date} className="timeline-date-group">
                                        <div className="timeline-date-header">
                                            <div className="timeline-date-badge">
                                                <span className="timeline-day">
                                                    {new Date(date + 'T00:00:00').getDate()}
                                                </span>
                                                <span className="timeline-month">
                                                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                                                </span>
                                            </div>
                                            <div className="timeline-date-info">
                                                <h3 className="timeline-date-title">
                                                    {formatDateForDisplay(date)}
                                                </h3>
                                                <p className="timeline-date-subtitle">
                                                    {getDayOfWeek(date)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="timeline-bookings">
                                            {dateBookings.map(booking => (
                                                <div
                                                    key={booking.id}
                                                    className="booking-card card"
                                                    style={{ '--team-color': getTeamColor(booking.teamId) }}
                                                >
                                                    <div className="booking-card-indicator"></div>

                                                    <div className="booking-card-content">
                                                        <div className="booking-card-header">
                                                            <h4 className="booking-card-title">{booking.eventName}</h4>
                                                            <span
                                                                className="booking-card-team badge"
                                                                style={{ background: getTeamColor(booking.teamId) }}
                                                            >
                                                                {getTeamName(booking.teamId)}
                                                            </span>
                                                        </div>

                                                        <div className="booking-card-details">
                                                            {/* Date/Time Display */}
                                                            {(() => {
                                                                // Get datetime objects
                                                                let startDT, endDT;

                                                                if (booking.startDateTime && booking.endDateTime) {
                                                                    startDT = booking.startDateTime.toDate ? booking.startDateTime.toDate() : new Date(booking.startDateTime);
                                                                    endDT = booking.endDateTime.toDate ? booking.endDateTime.toDate() : new Date(booking.endDateTime);
                                                                } else {
                                                                    startDT = new Date(`${booking.date}T${booking.startTime}`);
                                                                    endDT = new Date(`${booking.date}T${booking.endTime}`);
                                                                }

                                                                const isMultiDay = !isSameDay(startDT, endDT);

                                                                return (
                                                                    <>
                                                                        <div className="booking-card-detail">
                                                                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                                                                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" />
                                                                            </svg>
                                                                            <span>
                                                                                <strong>Start:</strong> {formatDateTimeForDisplay(startDT)}
                                                                            </span>
                                                                        </div>
                                                                        <div className="booking-card-detail">
                                                                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                                                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                                            </svg>
                                                                            <span>
                                                                                <strong>End:</strong> {formatDateTimeForDisplay(endDT)}
                                                                                {isMultiDay && <span className="multi-day-badge" style={{ marginLeft: '8px' }}>Multi-day</span>}
                                                                            </span>
                                                                        </div>
                                                                        {isMultiDay && (
                                                                            <div className="booking-card-detail">
                                                                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                                                </svg>
                                                                                <span>
                                                                                    <strong>Duration:</strong> {formatDuration(startDT, endDT)}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                );
                                                            })()}

                                                            {/* Custom Fields in List View */}
                                                            {customFields
                                                                .filter(field => field.showInListView !== false)
                                                                .map(field => {
                                                                    const value = booking.customFieldValues?.[field.id];
                                                                    if (!value) return null;
                                                                    return (
                                                                        <div key={field.id} className="booking-card-detail">
                                                                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                                                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                                                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                                                            </svg>
                                                                            <span>
                                                                                <strong>{field.name}:</strong> {value}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })
                                                            }

                                                            {booking.description && (
                                                                <p className="booking-card-description">
                                                                    {booking.description}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="booking-card-actions">
                                                            <button
                                                                className="btn btn-secondary btn-sm"
                                                                onClick={() => setSelectedBooking(booking)}
                                                                title="View details"
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                                </svg>
                                                                View
                                                            </button>
                                                            <button
                                                                className="btn btn-secondary btn-sm"
                                                                onClick={() => navigate(`/booking/edit/${booking.id}`)}
                                                                title="Edit booking"
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                                </svg>
                                                                Edit
                                                            </button>
                                                            <button
                                                                className="btn btn-secondary btn-sm"
                                                                onClick={() => handleArchiveToggle(booking.id, booking.isArchived)}
                                                                title={booking.isArchived ? "Unarchive booking" : "Archive booking"}
                                                            >
                                                                {booking.isArchived ? (
                                                                    <>
                                                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                                                            <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                                                                            <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                                                                            <path d="M10 11l-2 2m2-2l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                                        </svg>
                                                                        Unarchive
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                                                            <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                                                                            <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                                                                        </svg>
                                                                        Archive
                                                                    </>
                                                                )}
                                                            </button>
                                                            <button
                                                                className="btn btn-danger btn-sm"
                                                                onClick={() => requestDelete(booking.id)}
                                                                title="Delete booking"
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                </svg>
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div >

            {/* Booking Details Modal */}
            {selectedBooking && (
                <EventDetailsModal
                    booking={selectedBooking}
                    teams={teams}
                    customFields={customFields}
                    onClose={() => setSelectedBooking(null)}
                    onEdit={(id) => navigate(`/booking/edit/${id}`)}
                    onDelete={(id) => requestDelete(id)}
                    showEditButton={true}
                    showDeleteButton={true}
                    showViewInCalendarButton={false}
                />
            )}

            {/* Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="modal-overlay" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>
                    <div className="modal-content card confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Confirm Action</h3>
                            <button
                                className="modal-close"
                                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                            >
                                <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="confirm-message">{confirmModal.message}</p>
                        </div>
                        <div className="modal-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={confirmModal.onConfirm}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default BookingCalendar;
