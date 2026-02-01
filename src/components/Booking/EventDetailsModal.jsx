import React from 'react';
import { formatDateForDisplay, formatTimeTo12Hour, getDayOfWeek, formatDateTimeForDisplay, isSameDay, formatDuration } from '../../utils/dateUtils';
import format from 'date-fns/format';
import '../Common/ConfirmationModal.css';
import './BookingCalendar.css';

const EventDetailsModal = ({
    booking,
    teams,
    customFields,
    onClose,
    onEdit,
    onDelete,
    onViewInCalendar,
    showEditButton = true,
    showDeleteButton = false,
    showViewInCalendarButton = false
}) => {
    if (!booking) return null;

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

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Event Details</h3>
                    <button
                        className="modal-close"
                        onClick={onClose}
                    >
                        <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body">
                    <div className="booking-details-modal">
                        <div className="detail-row">
                            <div className="detail-label">Event Name</div>
                            <div className="detail-value">{booking.eventName}</div>
                        </div>

                        <div className="detail-row">
                            <div className="detail-label">Team</div>
                            <div className="detail-value">
                                <span
                                    className="badge"
                                    style={{ background: getTeamColor(booking.teamId) }}
                                >
                                    {getTeamName(booking.teamId)}
                                </span>
                            </div>
                        </div>

                        {/* Date/Time Display - Always show Start and End */}
                        {(() => {
                            const startDT = booking.startDateTime?.toDate ? booking.startDateTime.toDate() :
                                (booking.startDateTime ? new Date(booking.startDateTime) :
                                    new Date(`${booking.date}T${booking.startTime}`));
                            const endDT = booking.endDateTime?.toDate ? booking.endDateTime.toDate() :
                                (booking.endDateTime ? new Date(booking.endDateTime) :
                                    new Date(`${booking.date}T${booking.endTime}`));

                            const isMultiDay = !isSameDay(startDT, endDT);

                            return (
                                <>
                                    <div className="detail-row">
                                        <div className="detail-label">Start</div>
                                        <div className="detail-value">
                                            {formatDateTimeForDisplay(startDT)}
                                        </div>
                                    </div>
                                    <div className="detail-row">
                                        <div className="detail-label">End</div>
                                        <div className="detail-value">
                                            {formatDateTimeForDisplay(endDT)}
                                            {isMultiDay && <span className="multi-day-badge" style={{ marginLeft: '8px' }}>Multi-day</span>}
                                        </div>
                                    </div>
                                    {isMultiDay && (
                                        <div className="detail-row">
                                            <div className="detail-label">Duration</div>
                                            <div className="detail-value">
                                                {formatDuration(startDT, endDT)}
                                            </div>
                                        </div>
                                    )}
                                </>
                            );
                        })()}

                        {booking.description && (
                            <div className="detail-row">
                                <div className="detail-label">Description</div>
                                <div className="detail-value detail-description">
                                    {booking.description}
                                </div>
                            </div>
                        )}

                        {/* Custom Fields */}
                        {customFields && customFields.length > 0 && (
                            <>
                                {customFields.map(field => {
                                    const value = booking.customFieldValues?.[field.id];
                                    if (!value) return null;
                                    return (
                                        <div key={field.id} className="detail-row">
                                            <div className="detail-label">{field.name}</div>
                                            <div className="detail-value">{value}</div>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="modal-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={onClose}
                    >
                        Close
                    </button>
                    {showEditButton && onEdit && (
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                onClose();
                                onEdit(booking.id);
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            Edit
                        </button>
                    )}
                    {showDeleteButton && onDelete && (
                        <button
                            className="btn btn-danger"
                            onClick={() => {
                                onClose();
                                onDelete(booking.id);
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Delete
                        </button>
                    )}
                    {showViewInCalendarButton && onViewInCalendar && (
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                onClose();
                                onViewInCalendar();
                            }}
                        >
                            View in Calendar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventDetailsModal;
