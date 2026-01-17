/**
 * Conflict Detection Utility
 * Checks if a booking conflicts with existing bookings for the same team
 */

/**
 * Check if two time ranges overlap
 * @param {string} start1 - Start time in HH:mm format
 * @param {string} end1 - End time in HH:mm format
 * @param {string} start2 - Start time in HH:mm format
 * @param {string} end2 - End time in HH:mm format
 * @returns {boolean} - True if times overlap
 */
export const timeRangesOverlap = (start1, end1, start2, end2) => {
    const toMinutes = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const start1Min = toMinutes(start1);
    const end1Min = toMinutes(end1);
    const start2Min = toMinutes(start2);
    const end2Min = toMinutes(end2);

    // Check if ranges overlap
    return start1Min < end2Min && end1Min > start2Min;
};

/**
 * Check if a new booking conflicts with existing bookings
 * @param {Object} newBooking - The booking to check
 * @param {Array} existingBookings - Array of existing bookings
 * @returns {Object} - { hasConflict: boolean, conflictingBookings: Array }
 */
export const checkBookingConflict = (newBooking, existingBookings) => {
    const conflictingBookings = [];

    for (const booking of existingBookings) {
        // Skip if different team (different teams can book same date/time)
        if (booking.teamId !== newBooking.teamId) {
            continue;
        }

        // Skip if different date
        if (booking.date !== newBooking.date) {
            continue;
        }

        // Skip if checking against itself (for updates)
        if (booking.id === newBooking.id) {
            continue;
        }

        // Check for time overlap
        const hasTimeConflict = timeRangesOverlap(
            newBooking.startTime,
            newBooking.endTime,
            booking.startTime,
            booking.endTime
        );

        if (hasTimeConflict) {
            conflictingBookings.push(booking);
        }
    }

    return {
        hasConflict: conflictingBookings.length > 0,
        conflictingBookings
    };
};

/**
 * Format conflict message for display
 * @param {Array} conflictingBookings - Array of conflicting bookings
 * @returns {string} - Formatted conflict message
 */
export const formatConflictMessage = (conflictingBookings) => {
    if (conflictingBookings.length === 0) {
        return '';
    }

    const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const conflicts = conflictingBookings.map(booking => {
        const timeRange = booking.isWholeDay
            ? 'Whole Day'
            : `${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}`;
        return `"${booking.eventName}" (${timeRange})`;
    });

    return `This booking conflicts with: ${conflicts.join(', ')}`;
};
