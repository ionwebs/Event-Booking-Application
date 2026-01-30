import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    doc,
    getDoc,
    updateDoc,
    writeBatch
} from 'firebase/firestore';
import { db } from '../../firebase-config';
import Navbar from '../Layout/Navbar';
import TeamSelector from '../Teams/TeamSelector';
import { checkBookingConflict, formatConflictMessage } from '../../utils/ConflictDetector';
import { formatDateToISO, getTodayISO, formatTimeTo12Hour, formatDuration, isSameDay } from '../../utils/dateUtils';
import DatePicker from 'react-datepicker';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import parseISO from 'date-fns/parseISO';
import 'react-datepicker/dist/react-datepicker.css';
import './DatePicker.css';
import './BookingForm.css';
// import VoiceManager from './VoiceManager';
import ConfirmationModal from '../Common/ConfirmationModal';
import ConflictDetailsModal from './ConflictDetailsModal';

const BookingForm = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams(); // For edit mode
    const isEditMode = !!id;

    // Form state
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState('');
    const [startDateTime, setStartDateTime] = useState(() => {
        const now = new Date();
        now.setHours(9, 0, 0, 0);
        return now;
    });
    const [endDateTime, setEndDateTime] = useState(() => {
        const now = new Date();
        now.setHours(17, 0, 0, 0);
        return now;
    });
    const [isAllDay, setIsAllDay] = useState(false);
    const [eventName, setEventName] = useState('');
    const [description, setDescription] = useState('');
    const [customFields, setCustomFields] = useState([]);
    const [customFieldValues, setCustomFieldValues] = useState({});

    // UI state
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditMode);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [conflictWarning, setConflictWarning] = useState('');
    const [existingBookings, setExistingBookings] = useState([]);
    const [conflictingBookingsList, setConflictingBookingsList] = useState([]);
    // const [isVoiceOpen, setIsVoiceOpen] = useState(false);
    const [showConflictModal, setShowConflictModal] = useState(false);
    const [showConflictDetails, setShowConflictDetails] = useState(false);

    useEffect(() => {
        fetchTeams();
        fetchBookings();
        fetchCustomFields();
        if (isEditMode) {
            fetchBookingData();
        }
    }, [currentUser, id]);

    useEffect(() => {
        // Check for conflicts whenever relevant fields change
        if (selectedTeam && startDateTime && endDateTime) {
            checkForConflicts();
        }
    }, [selectedTeam, startDateTime, endDateTime, existingBookings]);

    const fetchBookingData = async () => {
        try {
            const bookingDoc = await getDoc(doc(db, 'bookings', id));
            if (bookingDoc.exists()) {
                const data = bookingDoc.data();
                setSelectedTeam(data.teamId);

                // Handle both new and old data formats
                if (data.startDateTime && data.endDateTime) {
                    // New format: use datetime fields
                    setStartDateTime(data.startDateTime.toDate());
                    setEndDateTime(data.endDateTime.toDate());
                } else {
                    // Old format: construct from date + time
                    const start = new Date(`${data.date}T${data.startTime}`);
                    const end = new Date(`${data.date}T${data.endTime}`);
                    setStartDateTime(start);
                    setEndDateTime(end);
                }

                setIsAllDay(data.isWholeDay || false);
                setEventName(data.eventName);
                setDescription(data.description || '');
                setCustomFieldValues(data.customFieldValues || {});
            } else {
                setError('Booking not found');
                setTimeout(() => navigate('/calendar'), 2000);
            }
        } catch (err) {
            console.error('Error fetching booking:', err);
            setError('Failed to load booking');
        } finally {
            setInitialLoading(false);
        }
    };

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
        }
    };

    const fetchBookings = async () => {
        try {
            const bookingsQuery = query(
                collection(db, 'bookings'),
                orderBy('date', 'desc')
            );
            const bookingsSnapshot = await getDocs(bookingsQuery);
            const bookingsData = bookingsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setExistingBookings(bookingsData);
        } catch (err) {
            console.error('Error fetching bookings:', err);
        }
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

    const checkForConflicts = () => {
        const newBooking = {
            id: isEditMode ? id : null, // Exclude self when editing
            teamId: selectedTeam,
            startDateTime: startDateTime,
            endDateTime: endDateTime
        };

        const { hasConflict, conflictingBookings } = checkBookingConflict(
            newBooking,
            existingBookings
        );

        // Filter all events for the same day and team for better context
        const dayEvents = existingBookings.filter(b => {
            // Must be same team
            if (b.teamId !== selectedTeam) return false;
            // Exclude current booking if editing
            if (isEditMode && b.id === id) return false;

            // Handle both formats
            let bStart;
            if (b.startDateTime) {
                bStart = b.startDateTime.toDate ? b.startDateTime.toDate() : new Date(b.startDateTime);
            } else {
                bStart = new Date(`${b.date}T${b.startTime}`);
            }

            return isSameDay(bStart, startDateTime);
        });

        // Combine day events and conflicting bookings (deduplicated)
        const allRelevantBookings = [...dayEvents];
        conflictingBookings.forEach(conflict => {
            if (!allRelevantBookings.find(b => b.id === conflict.id)) {
                allRelevantBookings.push(conflict);
            }
        });

        setConflictingBookingsList(allRelevantBookings);

        if (hasConflict) {
            setConflictWarning(formatConflictMessage(conflictingBookings));
        } else {
            setConflictWarning('');
        }
    };

    const notifyUsers = async (bookingId, bookingData, type) => {
        try {
            console.log('🚀 Starting notifyUsers for:', type);
            // Get all approved users
            const usersQuery = query(
                collection(db, 'users'),
                where('status', '==', 'approved')
            );
            const usersSnapshot = await getDocs(usersQuery);
            console.log('👥 Found approved users:', usersSnapshot.size);

            const batch = writeBatch(db);
            const title = type === 'create' ? 'New Booking' : 'Booking Updated';
            const message = `${currentUser.displayName || 'A user'} ${type === 'create' ? 'created' : 'updated'} booking "${bookingData.eventName}"`;

            let count = 0;
            usersSnapshot.docs.forEach(userDoc => {
                console.log('checking user:', userDoc.id, 'current:', currentUser.uid);
                // Don't notify self
                if (userDoc.id !== currentUser.uid) {
                    console.log('📧 Queueing notification for:', userDoc.id);
                    const notifRef = doc(collection(db, 'notifications'));
                    batch.set(notifRef, {
                        recipientId: userDoc.id,
                        type: `booking_${type}`,
                        title: title,
                        message: message,
                        bookingId: bookingId || 'unknown',
                        read: false,
                        createdAt: new Date(),
                        senderId: currentUser.uid
                    });
                    count++;
                }
            });

            console.log('📤 Total notifications to send:', count);

            if (count > 0) {
                await batch.commit();
                console.log('✅ Notifications batch committed successfully');
            } else {
                console.log('⚠️ No notifications to send (no other approved users?)');
            }
        } catch (error) {
            console.error('🔥 Error sending notifications:', error);
        }
    };

    const handleVoiceData = (data) => {
        if (data.eventName) setEventName(data.eventName);
        if (data.teamId) setSelectedTeam(data.teamId);

        if (data.startDateTime) {
            setStartDateTime(data.startDateTime);
        }

        if (data.endDateTime) {
            setEndDateTime(data.endDateTime);
        }

        if (data.isAllDay !== undefined) {
            setIsAllDay(data.isAllDay);
        }
    };

    const executeBooking = async () => {
        setLoading(true);
        setShowConflictModal(false);

        try {
            const bookingData = {
                teamId: selectedTeam,
                // New datetime fields
                startDateTime: startDateTime,
                endDateTime: endDateTime,
                // Backward compatibility fields
                date: format(startDateTime, 'yyyy-MM-dd'),
                startTime: format(startDateTime, 'HH:mm'),
                endTime: format(endDateTime, 'HH:mm'),
                isWholeDay: isAllDay,
                eventName: eventName.trim(),
                description: description.trim(),
                customFieldValues: customFieldValues,
                isArchived: false, // Default to not archived
                updatedAt: new Date()
            };

            // Denormalize custom fields for efficient querying
            Object.keys(customFieldValues).forEach(fieldId => {
                const field = customFields.find(f => f.id === fieldId);
                const value = customFieldValues[fieldId];

                if (value) {
                    if (field?.type === 'text') {
                        // For text fields, split by comma and store as lowercase array for array-contains queries
                        const arrayValue = value
                            .split(',')
                            .map(v => v.trim().toLowerCase())
                            .filter(v => v.length > 0);
                        bookingData[`customField_${fieldId}`] = arrayValue;
                    } else {
                        // For select and number fields, store as-is
                        bookingData[`customField_${fieldId}`] = value;
                    }
                }
            });

            if (isEditMode) {
                // Update existing booking
                await updateDoc(doc(db, 'bookings', id), bookingData);
                setSuccess('Booking updated successfully!');

                // Send notifications (async, don't await)
                notifyUsers(id, bookingData, 'update');
            } else {
                // Create new booking
                bookingData.createdBy = currentUser.uid;
                bookingData.createdAt = new Date();
                const docRef = await addDoc(collection(db, 'bookings'), bookingData);
                setSuccess('Booking created successfully!');

                // Send notifications (async, don't await)
                notifyUsers(docRef.id, bookingData, 'create');
            }

            // Navigate to calendar after 1.5 seconds
            setTimeout(() => {
                navigate('/calendar');
            }, 1500);

        } catch (err) {
            console.error('Error saving booking:', err);
            setError('Failed to save booking. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate
        if (!selectedTeam) {
            setError('Please select a team');
            return;
        }

        if (!eventName.trim()) {
            setError('Please enter an event name');
            return;
        }

        if (endDateTime <= startDateTime) {
            setError('End date/time must be after start date/time');
            return;
        }

        if (conflictWarning) {
            setShowConflictModal(true);
            return;
        }

        executeBooking();
    };

    if (initialLoading) {
        return (
            <div className="booking-form-page">
                <Navbar />
                <div className="booking-form-container container">
                    <div className="booking-form-loading">
                        <span className="spinner"></span>
                        <p>Loading booking...</p>
                    </div>
                </div>
            </div>
        );
    }



    return (
        <div className="booking-form-page">
            {/* <VoiceManager
                isOpen={isVoiceOpen}
                onClose={() => setIsVoiceOpen(false)}
                onDataParsed={handleVoiceData}
                teams={teams}
            /> */}
            <ConfirmationModal
                isOpen={showConflictModal}
                title="Conflict Warning"
                message="This booking conflicts with existing bookings. Do you want to proceed anyway?"
                onConfirm={executeBooking}
                onCancel={() => setShowConflictModal(false)}
                confirmText="Yes, Proceed"
                cancelText="Cancel"
                type="warning"
            />
            <ConflictDetailsModal
                isOpen={showConflictDetails}
                onClose={() => setShowConflictDetails(false)}
                conflicts={conflictingBookingsList.map(booking => ({
                    ...booking,
                    isConflict: checkBookingConflict({
                        id: isEditMode ? id : null,
                        teamId: selectedTeam,
                        startDateTime,
                        endDateTime
                    }, [booking]).hasConflict
                })).sort((a, b) => {
                    const aStart = a.startDateTime?.toDate ? a.startDateTime.toDate() : new Date(a.date + 'T' + a.startTime);
                    const bStart = b.startDateTime?.toDate ? b.startDateTime.toDate() : new Date(b.date + 'T' + b.startTime);
                    return aStart - bStart;
                })}
                date={startDateTime ? format(startDateTime, 'MMMM d, yyyy') : ''}
            />
            <Navbar />

            <div className="booking-form-container container">
                <div className="booking-form-header">
                    <button
                        className="btn btn-secondary"
                        onClick={() => navigate('/calendar')}
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Back to Calendar
                    </button>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h1 className="booking-form-title">
                                {isEditMode ? 'Edit Booking' : 'Create New Booking'}
                            </h1>
                            {/* <button
                                type="button"
                                className="btn btn-icon"
                                onClick={() => setIsVoiceOpen(true)}
                                title="Use Voice Input"
                                style={{ background: '#e3f2fd', color: '#2196f3', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                                🎙️
                            </button> */}
                        </div>
                        <p className="booking-form-subtitle">
                            {isEditMode ? 'Update your event details' : 'Schedule an event for your team'}
                        </p>
                    </div>
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


                <div className="card booking-form-card">
                    <form onSubmit={handleSubmit}>
                        <TeamSelector
                            teams={teams}
                            selectedTeam={selectedTeam}
                            onTeamChange={setSelectedTeam}
                            disabled={loading}
                        />

                        <div className="form-group">
                            <label className="form-label">
                                Event Name
                                <span style={{ color: 'var(--color-error)' }}> *</span>
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., Client Meeting, Team Workshop"
                                value={eventName}
                                onChange={(e) => setEventName(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-check">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={isAllDay}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setIsAllDay(checked);
                                        if (checked) {
                                            // Set to all day (00:00 to 23:59 same day)
                                            const start = new Date(startDateTime);
                                            start.setHours(0, 0, 0, 0);
                                            const end = new Date(start);
                                            end.setHours(23, 59, 0, 0);
                                            setStartDateTime(start);
                                            setEndDateTime(end);
                                        }
                                    }}
                                    disabled={loading}
                                />
                                <span>All Day Event</span>
                            </label>
                        </div>

                        <div className="datetime-selection">
                            <div className="form-group">
                                <label className="form-label">
                                    Start Date & Time
                                    <span style={{ color: 'var(--color-error)' }}> *</span>
                                </label>
                                <DatePicker
                                    selected={startDateTime}
                                    onChange={(date) => {
                                        setStartDateTime(date);
                                        // Handle end date logic
                                        if (isAllDay) {
                                            const newEnd = new Date(date);
                                            newEnd.setHours(23, 59, 59, 999);
                                            setEndDateTime(newEnd);
                                        } else if (date >= endDateTime) {
                                            // Ensure end is after start for non-all-day
                                            const newEnd = new Date(date);
                                            newEnd.setHours(date.getHours() + 1);
                                            setEndDateTime(newEnd);
                                        }
                                    }}
                                    showTimeSelect={!isAllDay}
                                    timeIntervals={15}
                                    timeCaption="Time"
                                    dateFormat={isAllDay ? "MMMM d, yyyy" : "MMMM d, yyyy h:mm aa"}
                                    minDate={new Date()}
                                    className="custom-datepicker-input"
                                    wrapperClassName="react-datepicker-wrapper"
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    End Date & Time
                                    <span style={{ color: 'var(--color-error)' }}> *</span>
                                </label>
                                <DatePicker
                                    selected={endDateTime}
                                    onChange={(date) => setEndDateTime(date)}
                                    showTimeSelect={!isAllDay}
                                    timeIntervals={15}
                                    timeCaption="Time"
                                    dateFormat={isAllDay ? "MMMM d, yyyy" : "MMMM d, yyyy h:mm aa"}
                                    minDate={startDateTime}
                                    className="custom-datepicker-input"
                                    wrapperClassName="react-datepicker-wrapper"
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>

                        {/* Duration Display */}
                        {startDateTime && endDateTime && endDateTime > startDateTime && (
                            <div className="form-group">
                                <div className="duration-display">
                                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                    <span>Duration: {formatDuration(startDateTime, endDateTime)}</span>
                                    {!isSameDay(startDateTime, endDateTime) && (
                                        <span className="multi-day-badge">Multi-day event</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {conflictWarning && (
                            <div className="alert alert-warning" style={{ marginTop: '24px', marginBottom: '8px' }}>
                                <div className="alert-warning-container">
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <span style={{ fontWeight: '500' }}>{conflictWarning}</span>
                                        </div>
                                        {conflictingBookingsList.length > 0 && (
                                            <button
                                                type="button"
                                                className="btn"
                                                style={{
                                                    background: 'var(--color-warning)',
                                                    border: 'none',
                                                    color: '#fff',
                                                    fontWeight: '600',
                                                    padding: '6px 16px',
                                                    fontSize: '13px',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                    borderRadius: '6px',
                                                    whiteSpace: 'nowrap'
                                                }}
                                                onClick={() => setShowConflictDetails(true)}
                                            >
                                                Show {conflictingBookingsList.length} Conflict{conflictingBookingsList.length > 1 ? 's' : ''}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}


                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-textarea"
                                placeholder="Add any additional details about this booking..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={loading}
                                rows="4"
                            />
                        </div>

                        {/* Custom Fields */}
                        {customFields.length > 0 && (
                            <div className="custom-fields-section">
                                <h3 className="custom-fields-heading">Additional Details</h3>
                                {customFields.map(field => (
                                    <div key={field.id} className="form-group">
                                        <label className="form-label">{field.name}</label>
                                        {field.type === 'select' ? (
                                            <select
                                                className="form-select"
                                                value={customFieldValues[field.id] || ''}
                                                onChange={(e) => setCustomFieldValues({
                                                    ...customFieldValues,
                                                    [field.id]: e.target.value
                                                })}
                                                disabled={loading}
                                            >
                                                <option value="">Select {field.name}...</option>
                                                {field.options.map((option, index) => (
                                                    <option key={index} value={option}>
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : field.type === 'number' ? (
                                            <input
                                                type="number"
                                                className="form-input"
                                                placeholder={`Enter ${field.name}`}
                                                value={customFieldValues[field.id] || ''}
                                                onChange={(e) => setCustomFieldValues({
                                                    ...customFieldValues,
                                                    [field.id]: e.target.value
                                                })}
                                                disabled={loading}
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder={`Enter ${field.name}`}
                                                value={customFieldValues[field.id] || ''}
                                                onChange={(e) => setCustomFieldValues({
                                                    ...customFieldValues,
                                                    [field.id]: e.target.value
                                                })}
                                                disabled={loading}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => navigate('/calendar')}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading || teams.length === 0}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner"></span>
                                        {isEditMode ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    isEditMode ? 'Update Booking' : 'Create Booking'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BookingForm;
