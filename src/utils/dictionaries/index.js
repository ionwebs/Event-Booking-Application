import enUS from './en-US';
import guIN from './gu-IN';

export const dictionaries = {
    'en-US': enUS,
    'gu-IN': guIN
};

export const getDictionary = (langCode) => {
    return dictionaries[langCode] || dictionaries['en-US'];
};

export const defaultLanguage = 'en-US';
