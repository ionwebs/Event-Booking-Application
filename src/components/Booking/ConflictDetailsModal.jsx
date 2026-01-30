import React from 'react';
import format from 'date-fns/format';
import '../Common/ConfirmationModal.css'; // Reuse basic modal styles
import { formatTimeTo12Hour } from '../../utils/dateUtils';

const ConflictDetailsModal = ({ isOpen, onClose, conflicts, date }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container" style={{ maxWidth: '600px' }}>
                <div className="modal-header warning">
                    <h3>Schedule Conflicts - {date}</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <div className="modal-body" style={{ padding: '0' }}>
                    <div className="conflict-list-container" style={{ margin: '0', borderRadius: '0', background: 'transparent' }}>
                        <div className="alert-warning" style={{ margin: '16px', border: 'none', background: 'hsla(38, 92%, 50%, 0.1)' }}>
                            The following events are scheduled for this team. Your booking overlaps with the highlighted events.
                        </div>
                        <ul className="conflict-list" style={{ maxHeight: '400px', padding: '0 16px 16px' }}>
                            {conflicts.map(booking => {
                                const start = booking.startDateTime?.toDate ? booking.startDateTime.toDate() : (booking.startDateTime ? new Date(booking.startDateTime) : new Date(`${booking.date}T${booking.startTime}`));
                                const end = booking.endDateTime?.toDate ? booking.endDateTime.toDate() : (booking.endDateTime ? new Date(booking.endDateTime) : new Date(`${booking.date}T${booking.endTime}`));

                                return (
                                    <li key={booking.id} className="conflict-item" style={{
                                        background: booking.isConflict ? 'hsla(38, 92%, 50%, 0.1)' : 'transparent',
                                        borderColor: booking.isConflict ? 'var(--color-warning)' : 'var(--color-border)',
                                        borderWidth: '1px',
                                        borderStyle: 'solid',
                                        borderRadius: '8px',
                                        marginBottom: '8px'
                                    }}>
                                        <div className="conflict-item-title">
                                            {booking.eventName}
                                            {booking.isConflict && (
                                                <span style={{
                                                    color: 'var(--color-warning)',
                                                    marginLeft: '8px',
                                                    fontSize: '10px',
                                                    border: '1px solid var(--color-warning)',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px'
                                                }}>
                                                    OVERLAPPING
                                                </span>
                                            )}
                                        </div>
                                        <div className="conflict-item-time">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                            {booking.isWholeDay
                                                ? `${format(start, 'MMM d, yyyy')} (Whole Day)`
                                                : `${format(start, 'MMM d, h:mm a')} - ${format(end, 'MMM d, h:mm a')}`
                                            }
                                        </div>
                                        {booking.description && (
                                            <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                                                {booking.description}
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConflictDetailsModal;
