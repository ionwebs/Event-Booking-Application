export class VoiceNormalizer {
    constructor(dictionary) {
        this.dictionary = dictionary;
    }

    normalize(text) {
        if (!text) return '';

        let normalized = text.toLowerCase();

        // 1. Replace numerals
        if (this.dictionary.numberMap) {
            Object.entries(this.dictionary.numberMap).forEach(([native, ascii]) => {
                normalized = normalized.split(native).join(ascii);
            });
        }

        // 2. Replace phrases/keywords
        if (this.dictionary.replacements) {
            // Sort replacements by length (longest first) to avoid partial replacement issues
            const replacements = Object.entries(this.dictionary.replacements)
                .sort((a, b) => b[0].length - a[0].length);

            replacements.forEach(([key, value]) => {
                // Use simple global replace
                // Note: For more complex grammar (like "X mate" -> "for X"), we might need regex
                // But simple replacement often works enough for chrono to catch it
                // e.g. "2 divas mate" -> "2 days for" -> chrono might stumble on "days for" vs "for days"
                // Let's refine for "mate" (for) case specifically if needed or trust chrono's flexibility
                // Actually chrono expects "for 2 days". 
                // "2 days for" might be missed. 
                // Let's handle special suffix logic if needed, but for now direct map.

                // Regex to match whole words or parts
                // creating a safe regex from the key
                const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(escapedKey, 'g');
                normalized = normalized.replace(regex, value);
            });
        }

        // 3. Post-processing grammar fixes (Generic)
        // Fix "2 days for" -> "for 2 days" pattern common in Indian languages
        // Regex: (number) (unit) for -> for (number) (unit)
        normalized = normalized.replace(/(\d+)\s+(days|hours|minutes)\s+for/g, 'for $1 $2');

        return normalized;
    }
}
