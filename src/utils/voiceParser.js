import * as chrono from 'chrono-node';
import { VoiceNormalizer } from './VoiceNormalizer';
import { getDictionary } from './dictionaries';

/**
 * Parse voice command into structured booking data
 * @param {string} transcript - The raw text from speech recognition
 * @param {string} languageCode - 'en-US' or 'gu-IN'
 * @param {Array} teams - List of available teams
 * @returns {Object} - { eventName, startDateTime, endDateTime, teamId, isAllDay }
 */
export const parseVoiceCommand = (transcript, languageCode, teams) => {
    if (!transcript) return null;

    const dictionary = getDictionary(languageCode);
    const normalizer = new VoiceNormalizer(dictionary);
    const normalizedText = normalizer.normalize(transcript);

    console.log('Original::', transcript);
    console.log('Normalized::', normalizedText);

    // 1. Parse Date & Time
    const parsedDate = chrono.parse(normalizedText, new Date(), { forwardDate: true })[0];

    let startDateTime = null;
    let endDateTime = null;
    let isAllDay = false;

    if (parsedDate) {
        startDateTime = parsedDate.start.date();

        // Check if time is implied or explicit
        const isTimeCertain = parsedDate.start.isCertain('hour');

        if (!isTimeCertain) {
            // Default to 9 AM if no time specified, or treat as all day if appropriate
            // For now, let's default to next upcoming valid slot or 9 AM
            startDateTime.setHours(9, 0, 0, 0);
        }

        // 2. Duration Logic
        // Check for "for X days" or "for X hours"
        // standard chrono might handle ranges "monday to wednesday", but "for 2 days" needs help often
        const durationMatch = normalizedText.match(/for\s+(\d+)\s+(day|hour|minute)s?/i);

        if (durationMatch) {
            const amount = parseInt(durationMatch[1]);
            const unit = durationMatch[2].toLowerCase();

            endDateTime = new Date(startDateTime);

            if (unit.startsWith('day')) {
                // Add days
                endDateTime.setDate(endDateTime.getDate() + amount);
                // If it's "for 2 days", typically means all day
                // But if they said "at 3pm for 2 days", maybe it's 48 hours?
                // "for X days" usually implies All Day Event in booking context
                isAllDay = true;
                startDateTime.setHours(0, 0, 0, 0);
                endDateTime.setHours(23, 59, 59, 999);
                // Adjust: "For 1 day" -> same day. "For 2 days" -> today + tomorrow.
                // So add (amount - 1) days to get the end date inclusive?
                // "For 2 days" starting today -> Today & Tomorrow.
                // endDate = start + 1 day (span of 2 days).
                // Let's set end date to start + (amount - 1) days?
                // No, typically endDateTime is exclusive or inclusive depending on system.
                // Booking system treats start/end. 
                // Let's just add 'amount' days to start for the end range.
                // If user says "2 days", duration is 48 hours. start + 2 days.
                endDateTime.setDate(startDateTime.getDate() + amount);
                // Reset to end of previous day for inclusive? 
                // If I book Jan 1 for 1 day -> Jan 1 00:00 to Jan 1 23:59.
                // If I book Jan 1 for 2 days -> Jan 1 00:00 to Jan 2 23:59.
                endDateTime.setDate(startDateTime.getDate() + (amount - 1));
            } else if (unit.startsWith('hour')) {
                endDateTime.setHours(endDateTime.getHours() + amount);
            } else if (unit.startsWith('minute')) {
                endDateTime.setMinutes(endDateTime.getMinutes() + amount);
            }
        } else if (parsedDate.end) {
            // Chrono found an end date (e.g. "Monday to Wednesday")
            endDateTime = parsedDate.end.date();
        } else {
            // Default duration: 1 hour
            endDateTime = new Date(startDateTime);
            endDateTime.setHours(startDateTime.getHours() + 1);
        }
    }

    // 3. Extract Team
    // Simple fuzzy match: check if normalized text includes team name 
    // OR original text includes team name (for proper nouns)
    let teamId = '';
    let matchedTeamName = '';

    if (teams && teams.length > 0) {
        // Try exact match in normalized or original
        const searchPool = [normalizedText, transcript.toLowerCase()];

        for (const team of teams) {
            const teamName = team.name.toLowerCase();
            if (searchPool.some(text => text.includes(teamName))) {
                teamId = team.id;
                matchedTeamName = team.name;
                break;
            }
        }
    }

    // 4. Extract Event Name (The "Rest" of the string)
    // Remove detected date text and team name
    let eventName = transcript;

    // Check what chrono matched to remove it
    if (parsedDate) {
        // We assume the text chrono matched is the date part
        // but normalized text indices map differently to original transcript.
        // This is tricky.
        // Simplified approach: matches unused parts.
        // Or just use the full transcript as the name if we can't easily strip.
        // Let's try to strip the team name at least.
        if (matchedTeamName) {
            const regex = new RegExp(matchedTeamName, 'gi');
            eventName = eventName.replace(regex, '').trim();
        }

        // Remove common filler words from start
        eventName = eventName.replace(/^(schedule|book|create|a|an)\s+/i, '').trim();

        // This is heuristic. Ideally we map back ranges from normalized to original.
        // For now, let's just clean up obvious "at 5pm" etc if we can, 
        // but often keeping context in title is safer than aggressive stripping.
    }

    // Clean up
    eventName = eventName
        .replace(/\s+/g, ' ')
        // Remove "meeting" if it's generic? No, keep it. "Marketing Meeting" is good.
        .trim();

    return {
        eventName,
        startDateTime,
        endDateTime,
        teamId,
        isAllDay,
        originalTranscript: transcript,
        normalizedTranscript: normalizedText
    };
};
