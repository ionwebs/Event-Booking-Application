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
import { formatDateToISO, getTodayISO, formatTimeTo12Hour } from '../../utils/dateUtils';
import DatePicker from 'react-datepicker';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import parseISO from 'date-fns/parseISO';
import 'react-datepicker/dist/react-datepicker.css';
import './DatePicker.css';
import './BookingForm.css';

const BookingForm = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams(); // For edit mode
    const isEditMode = !!id;

    // Form state
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState('');
    const [date, setDate] = useState(getTodayISO());
    const [isWholeDay, setIsWholeDay] = useState(true);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
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
        if (selectedTeam && date) {
            checkForConflicts();
        }
    }, [selectedTeam, date, startTime, endTime, isWholeDay]);

    const fetchBookingData = async () => {
        try {
            const bookingDoc = await getDoc(doc(db, 'bookings', id));
            if (bookingDoc.exists()) {
                const data = bookingDoc.data();
                setSelectedTeam(data.teamId);
                setDate(data.date);
                setIsWholeDay(data.isWholeDay);
                setStartTime(data.startTime);
                setEndTime(data.endTime);
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
            date: date,
            startTime: isWholeDay ? '00:00' : startTime,
            endTime: isWholeDay ? '23:59' : endTime,
            isWholeDay: isWholeDay
        };

        const { hasConflict, conflictingBookings } = checkBookingConflict(
            newBooking,
            existingBookings
        );

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

        if (conflictWarning) {
            if (!window.confirm('This booking conflicts with existing bookings. Do you want to proceed anyway?')) {
                return;
            }
        }

        setLoading(true);

        try {
            const bookingData = {
                teamId: selectedTeam,
                date: date,
                isWholeDay: isWholeDay,
                startTime: isWholeDay ? '00:00' : startTime,
                endTime: isWholeDay ? '23:59' : endTime,
                eventName: eventName.trim(),
                description: description.trim(),
                customFieldValues: customFieldValues,
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
                        <h1 className="booking-form-title">
                            {isEditMode ? 'Edit Booking' : 'Create New Booking'}
                        </h1>
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

                {conflictWarning && (
                    <div className="alert alert-warning">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {conflictWarning}
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
                            <label className="form-label">
                                Date
                                <span style={{ color: 'var(--color-error)' }}> *</span>
                            </label>
                            <DatePicker
                                selected={date ? parseISO(date) : new Date()}
                                onChange={(d) => setDate(format(d, 'yyyy-MM-dd'))}
                                minDate={new Date()}
                                dateFormat="MMMM d, yyyy"
                                className="custom-datepicker-input"
                                wrapperClassName="react-datepicker-wrapper"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-check">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={isWholeDay}
                                    onChange={(e) => setIsWholeDay(e.target.checked)}
                                    disabled={loading}
                                />
                                <span>Whole Day Booking</span>
                            </label>
                        </div>

                        {!isWholeDay && (
                            <div className="time-selection">
                                <div className="form-group">
                                    <label className="form-label">Start Time</label>
                                    <DatePicker
                                        selected={parse(startTime, 'HH:mm', new Date())}
                                        onChange={(d) => setStartTime(format(d, 'HH:mm'))}
                                        showTimeSelect
                                        showTimeSelectOnly
                                        timeIntervals={15}
                                        timeCaption="Time"
                                        dateFormat="h:mm aa"
                                        className="custom-datepicker-input custom-timepicker-input"
                                        wrapperClassName="react-datepicker-wrapper"
                                        disabled={loading}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">End Time</label>
                                    <DatePicker
                                        selected={parse(endTime, 'HH:mm', new Date())}
                                        onChange={(d) => setEndTime(format(d, 'HH:mm'))}
                                        showTimeSelect
                                        showTimeSelectOnly
                                        timeIntervals={15}
                                        timeCaption="Time"
                                        dateFormat="h:mm aa"
                                        className="custom-datepicker-input custom-timepicker-input"
                                        wrapperClassName="react-datepicker-wrapper"
                                        disabled={loading}
                                        required
                                    />
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
