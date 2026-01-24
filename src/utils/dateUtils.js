/**
 * Date utility functions
 */

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
export const formatDateToISO = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Format time to 12-hour format
 * @param {string} time24 - Time in HH:mm format
 * @returns {string} - Time in 12-hour format with AM/PM
 */
export const formatTimeTo12Hour = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
};

/**
 * Format date for display
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} - Formatted date (e.g., "Jan 15, 2026")
 */
export const formatDateForDisplay = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

/**
 * Get current date in YYYY-MM-DD format
 * @returns {string} - Today's date
 */
export const getTodayISO = () => {
    return formatDateToISO(new Date());
};

/**
 * Check if a date is in the past
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {boolean} - True if date is in the past
 */
export const isPastDate = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(dateString + 'T00:00:00');
    return checkDate < today;
};

/**
 * Get day of week
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} - Day name (e.g., "Monday")
 */
export const getDayOfWeek = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long' });
};

/**
 * Format datetime for display
 * @param {Date|string} datetime - Date object or ISO string
 * @returns {string} - Formatted datetime (e.g., "Jan 15, 2026 at 2:30 PM")
 */
export const formatDateTimeForDisplay = (datetime) => {
    const date = new Date(datetime);
    const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
    return `${dateStr} at ${timeStr}`;
};

/**
 * Check if two dates are on the same day
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean} - True if same day
 */
export const isSameDay = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
};

/**
 * Format date range for display
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {string} - Formatted date range
 */
export const formatDateRange = (startDate, endDate) => {
    if (isSameDay(startDate, endDate)) {
        const date = new Date(startDate);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Same month and year
    if (start.getMonth() === end.getMonth() &&
        start.getFullYear() === end.getFullYear()) {
        const monthYear = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return `${start.getDate()} - ${end.getDate()}, ${monthYear}`;
    }

    // Same year, different months
    if (start.getFullYear() === end.getFullYear()) {
        const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${startStr} - ${endStr}`;
    }

    // Different years
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} - ${endStr}`;
};

/**
 * Calculate duration between two datetimes
 * @param {Date|string} startDateTime - Start datetime
 * @param {Date|string} endDateTime - End datetime
 * @returns {Object} - { days, hours, minutes }
 */
export const calculateDuration = (startDateTime, endDateTime) => {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const diffMs = end - start;

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes };
};

/**
 * Format duration for display
 * @param {Date|string} startDateTime - Start datetime
 * @param {Date|string} endDateTime - End datetime
 * @returns {string} - Formatted duration (e.g., "2 days, 5 hours")
 */
export const formatDuration = (startDateTime, endDateTime) => {
    const { days, hours, minutes } = calculateDuration(startDateTime, endDateTime);

    const parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0 && days === 0) parts.push(`${minutes} min`);

    return parts.join(', ') || '0 minutes';
};

/**
 * Check if event is all day (00:00 to 23:59)
 * @param {Date|string} startDateTime - Start datetime
 * @param {Date|string} endDateTime - End datetime
 * @returns {boolean} - True if all day event
 */
export const isAllDayEvent = (startDateTime, endDateTime) => {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    // Check if same day and covers full day
    if (!isSameDay(start, end)) {
        return false;
    }

    return start.getHours() === 0 && start.getMinutes() === 0 &&
        (end.getHours() === 23 && end.getMinutes() === 59);
};

