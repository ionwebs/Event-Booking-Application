import React from 'react';
import { formatDateForDisplay, formatTimeTo12Hour, getDayOfWeek } from '../../utils/dateUtils';
import './BookingCalendar.css';

const EventDetailsModal = ({ booking, teams, customFields, onClose }) => {
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
            <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
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

                    <div className="detail-row">
                        <div className="detail-label">Date</div>
                        <div className="detail-value">
                            {formatDateForDisplay(booking.date)} ({getDayOfWeek(booking.date)})
                        </div>
                    </div>

                    <div className="detail-row">
                        <div className="detail-label">Time</div>
                        <div className="detail-value">
                            {booking.isWholeDay
                                ? 'Whole Day'
                                : `${formatTimeTo12Hour(booking.startTime)} - ${formatTimeTo12Hour(booking.endTime)}`
                            }
                        </div>
                    </div>

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
        </div>
    );
};

export default EventDetailsModal;
