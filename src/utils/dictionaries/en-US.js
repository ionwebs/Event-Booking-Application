export default {
    id: 'en-US',
    name: 'English',
    numberMap: {}, // No mapping needed for English
    replacements: {
        'next week': 'next week',
        'tomorrow': 'tomorrow',
        'today': 'today'
    },
    prompts: {
        listening: 'Listening...',
        processing: 'Processing...',
        ask_team: 'Which team is this for?',
        ask_title: 'What is the title of the event?',
        ask_confirm: 'Ready to create this booking?',
        success: 'Booking created successfully!',
        retry: 'Sorry, I didn\'t catch that. Please try again.',
        missing_info: 'I need some more information.'
    }
};
