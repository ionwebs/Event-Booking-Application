export default {
    id: 'gu-IN',
    name: 'Gujarati',
    numberMap: {
        '૦': '0', '૧': '1', '૨': '2', '૩': '3', '４': '4',
        '૫': '5', '૬': '6', '૭': '7', '૮': '8', '૯': '9'
    },
    replacements: {
        // Time markers
        'કાલે': 'tomorrow',
        'આજે': 'today',
        'પછી': 'after',
        'આવતા': 'next', // e.g. "avta somvare" -> "next monday"
        'આવતા અઠવાડિયે': 'next week',
        'ગયા': 'last',

        // Days
        'સોમવાર': 'Monday',
        'સોમવારે': 'Monday',
        'મંગળવાર': 'Tuesday',
        'મંગળવારે': 'Tuesday',
        'બુધવાર': 'Wednesday',
        'બુધવારે': 'Wednesday',
        'ગુરુવાર': 'Thursday',
        'ગુરુવારે': 'Thursday',
        'શુક્રવાર': 'Friday',
        'શુક્રવારે': 'Friday',
        'શનિવાર': 'Saturday',
        'શનિવારે': 'Saturday',
        'રવિવાર': 'Sunday',
        'રવિવારે': 'Sunday',

        // Time units
        'વાગ્યે': 'at',
        'વાગે': 'at',
        'મિનિટ': 'minutes',
        'કલાક': 'hours',
        'દિવસ': 'days',
        'માટે': 'for', // "be divas mate" -> "2 days for" (handled by simple replacement, grammar adjustment in normalizer maybe needed or simple regex)

        // Day parts
        'સવારે': 'AM',
        'બપોરે': 'PM',
        'સાંજે': 'PM',
        'રાત્રે': 'PM'
    },
    prompts: {
        listening: 'સાંભળી રહ્યો છું...',
        processing: 'પ્રક્રિયા કરી રહ્યો છું...',
        ask_team: 'આ કઈ ટીમ માટે છે?',
        ask_title: 'ઈવેન્ટ નું નામ શું છે?',
        ask_confirm: 'શું હું બુકિંગ બનાવી લઉં?',
        success: 'બુકિંગ સફળતાપૂર્વક થઈ ગયું!',
        retry: 'ક્ષમા કરશો, મને સમજાયું નહીં. ફરી પ્રયાસ કરો.',
        missing_info: 'મારે થોડી વધુ માહિતી જોઈએ છે.'
    }
};
