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
