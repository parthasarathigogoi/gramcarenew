const { Translate } = require('@google-cloud/translate').v2;
const fs = require('fs');
const path = require('path');

// Initialize Google Translate client
let translate;

try {
  // Check if Google Cloud credentials are available
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    translate = new Translate({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    });
  } else if (process.env.GOOGLE_TRANSLATE_API_KEY) {
    translate = new Translate({
      key: process.env.GOOGLE_TRANSLATE_API_KEY
    });
  }
} catch (error) {
  console.warn('Google Translate not configured, using fallback translation');
}

// Language mappings
const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'hi': 'Hindi',
  'bn': 'Bengali',
  'te': 'Telugu',
  'ta': 'Tamil',
  'mr': 'Marathi',
  'gu': 'Gujarati',
  'kn': 'Kannada',
  'ml': 'Malayalam',
  'pa': 'Punjabi',
  'or': 'Odia',
  'as': 'Assamese'
};

// Fallback translations for common health terms
const FALLBACK_TRANSLATIONS = {
  'hi': {
    'Hello': 'नमस्ते',
    'How can I help you?': 'मैं आपकी कैसे मदद कर सकता हूँ?',
    'Health': 'स्वास्थ्य',
    'Doctor': 'डॉक्टर',
    'Medicine': 'दवा',
    'Hospital': 'अस्पताल',
    'Fever': 'बुखार',
    'Cough': 'खांसी',
    'Cold': 'सर्दी',
    'Headache': 'सिरदर्द',
    'Pain': 'दर्द',
    'Vaccination': 'टीकाकरण',
    'Prevention': 'रोकथाम',
    'Symptoms': 'लक्षण',
    'Treatment': 'इलाज',
    'Emergency': 'आपातकाल',
    'Thank you': 'धन्यवाद',
    'Please': 'कृपया',
    'Yes': 'हाँ',
    'No': 'नहीं',
    'Help': 'मदद'
  },
  'bn': {
    'Hello': 'নমস্কার',
    'How can I help you?': 'আমি কিভাবে আপনাকে সাহায্য করতে পারি?',
    'Health': 'স্বাস্থ্য',
    'Doctor': 'ডাক্তার',
    'Medicine': 'ওষুধ',
    'Hospital': 'হাসপাতাল',
    'Fever': 'জ্বর',
    'Cough': 'কাশি',
    'Cold': 'ঠান্ডা',
    'Headache': 'মাথাব্যথা',
    'Pain': 'ব্যথা',
    'Vaccination': 'টিকাদান',
    'Prevention': 'প্রতিরোধ',
    'Symptoms': 'উপসর্গ',
    'Treatment': 'চিকিৎসা',
    'Emergency': 'জরুরি',
    'Thank you': 'ধন্যবাদ',
    'Please': 'দয়া করে',
    'Yes': 'হ্যাঁ',
    'No': 'না',
    'Help': 'সাহায্য'
  },
  'as': {
    'Hello': 'নমস্কাৰ',
    'How can I help you?': 'মই আপোনাক কেনেকৈ সহায় কৰিব পাৰোঁ?',
    'Health': 'স্বাস্থ্য',
    'Doctor': 'চিকিৎসক',
    'Medicine': 'ঔষধ',
    'Hospital': 'চিকিৎসালয়',
    'Fever': 'জ্বৰ',
    'Cough': 'কাহ',
    'Cold': 'চৰ্দি',
    'Headache': 'মূৰৰ বিষ',
    'Pain': 'বিষ',
    'Vaccination': 'টিকাকৰণ',
    'Prevention': 'প্ৰতিৰোধ',
    'Symptoms': 'লক্ষণ',
    'Treatment': 'চিকিৎসা',
    'Emergency': 'জৰুৰীকালীন',
    'Thank you': 'ধন্যবাদ',
    'Please': 'অনুগ্ৰহ কৰি',
    'Yes': 'হয়',
    'No': 'নহয়',
    'Help': 'সহায়'
  },
  'te': {
    'Hello': 'నమస్కారం',
    'How can I help you?': 'నేను మీకు ఎలా సహాయం చేయగలను?',
    'Health': 'ఆరోగ్యం',
    'Doctor': 'వైద్యుడు',
    'Medicine': 'మందు',
    'Hospital': 'ఆసుపత్రి',
    'Fever': 'జ్వరం',
    'Cough': 'దగ్గు',
    'Cold': 'జలుబు',
    'Headache': 'తలనొప్పి',
    'Pain': 'నొప్పి',
    'Vaccination': 'టీకా',
    'Prevention': 'నివారణ',
    'Symptoms': 'లక్షణాలు',
    'Treatment': 'చికిత్స',
    'Emergency': 'అత్యవసరం',
    'Thank you': 'ధన్యవాదాలు',
    'Please': 'దయచేసి',
    'Yes': 'అవును',
    'No': 'లేదు',
    'Help': 'సహాయం'
  }
};

/**
 * Detect the language of the given text
 * @param {string} text - Text to detect language for
 * @returns {Promise<string>} - Detected language code
 */
async function detectLanguage(text) {
  try {
    if (!translate) {
      // Fallback language detection based on script
      if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Devanagari (Hindi)
      if (/[\u0980-\u09FF]/.test(text)) return 'bn'; // Bengali
      if (/[\u0C00-\u0C7F]/.test(text)) return 'te'; // Telugu
      if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'; // Tamil
      return 'en'; // Default to English
    }

    const [detection] = await translate.detect(text);
    return detection.language;
  } catch (error) {
    console.error('Language detection error:', error);
    return 'en'; // Default to English on error
  }
}

/**
 * Translate text to target language
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language code
 * @param {string} sourceLanguage - Source language code (optional)
 * @returns {Promise<string>} - Translated text
 */
async function translateText(text, targetLanguage, sourceLanguage = null) {
  try {
    // If target language is English or same as source, return original
    if (targetLanguage === 'en' || targetLanguage === sourceLanguage) {
      return text;
    }

    // Check if we have a fallback translation
    if (FALLBACK_TRANSLATIONS[targetLanguage] && FALLBACK_TRANSLATIONS[targetLanguage][text]) {
      return FALLBACK_TRANSLATIONS[targetLanguage][text];
    }

    // Use Google Translate if available
    if (translate) {
      const options = {
        to: targetLanguage
      };
      
      if (sourceLanguage) {
        options.from = sourceLanguage;
      }

      const [translation] = await translate.translate(text, options);
      return translation;
    }

    // Fallback: return original text with language indicator
    return `[${targetLanguage.toUpperCase()}] ${text}`;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text on error
  }
}

/**
 * Translate multiple texts in batch
 * @param {string[]} texts - Array of texts to translate
 * @param {string} targetLanguage - Target language code
 * @param {string} sourceLanguage - Source language code (optional)
 * @returns {Promise<string[]>} - Array of translated texts
 */
async function translateBatch(texts, targetLanguage, sourceLanguage = null) {
  try {
    if (!translate) {
      // Use fallback translations
      return texts.map(text => {
        if (FALLBACK_TRANSLATIONS[targetLanguage] && FALLBACK_TRANSLATIONS[targetLanguage][text]) {
          return FALLBACK_TRANSLATIONS[targetLanguage][text];
        }
        return `[${targetLanguage.toUpperCase()}] ${text}`;
      });
    }

    const options = {
      to: targetLanguage
    };
    
    if (sourceLanguage) {
      options.from = sourceLanguage;
    }

    const [translations] = await translate.translate(texts, options);
    return Array.isArray(translations) ? translations : [translations];
  } catch (error) {
    console.error('Batch translation error:', error);
    return texts; // Return original texts on error
  }
}

/**
 * Get list of supported languages
 * @returns {Object} - Object with language codes and names
 */
function getSupportedLanguages() {
  return SUPPORTED_LANGUAGES;
}

/**
 * Check if a language is supported
 * @param {string} languageCode - Language code to check
 * @returns {boolean} - Whether the language is supported
 */
function isLanguageSupported(languageCode) {
  return Object.keys(SUPPORTED_LANGUAGES).includes(languageCode);
}

/**
 * Get language name from code
 * @param {string} languageCode - Language code
 * @returns {string} - Language name
 */
function getLanguageName(languageCode) {
  return SUPPORTED_LANGUAGES[languageCode] || 'Unknown';
}

/**
 * Smart translate function that handles FAQ responses
 * @param {Object} faqResponse - FAQ response object
 * @param {string} targetLanguage - Target language code
 * @returns {Promise<Object>} - Translated FAQ response
 */
async function translateFAQResponse(faqResponse, targetLanguage) {
  try {
    if (targetLanguage === 'en') {
      return {
        ...faqResponse,
        answer: faqResponse.answer_en || faqResponse.answer,
        language: 'en'
      };
    }

    // Check if we already have the translation
    const answerKey = `answer_${targetLanguage}`;
    if (faqResponse[answerKey]) {
      return {
        ...faqResponse,
        answer: faqResponse[answerKey],
        language: targetLanguage
      };
    }

    // Translate the English answer
    const translatedAnswer = await translateText(
      faqResponse.answer_en || faqResponse.answer,
      targetLanguage,
      'en'
    );

    return {
      ...faqResponse,
      answer: translatedAnswer,
      language: targetLanguage
    };
  } catch (error) {
    console.error('FAQ translation error:', error);
    return {
      ...faqResponse,
      answer: faqResponse.answer_en || faqResponse.answer,
      language: 'en'
    };
  }
}

/**
 * Translate alert messages
 * @param {Object} alert - Alert object
 * @param {string} targetLanguage - Target language code
 * @returns {Promise<Object>} - Translated alert
 */
async function translateAlert(alert, targetLanguage) {
  try {
    if (targetLanguage === 'en') {
      return {
        ...alert,
        message: alert.message_en || alert.message,
        description: alert.description_en || alert.description,
        language: 'en'
      };
    }

    // Check if we already have the translation
    const messageKey = `message_${targetLanguage}`;
    const descriptionKey = `description_${targetLanguage}`;
    
    if (alert[messageKey] && alert[descriptionKey]) {
      return {
        ...alert,
        message: alert[messageKey],
        description: alert[descriptionKey],
        language: targetLanguage
      };
    }

    // Translate the content
    const [translatedMessage, translatedDescription] = await translateBatch([
      alert.message_en || alert.message,
      alert.description_en || alert.description
    ], targetLanguage, 'en');

    return {
      ...alert,
      message: translatedMessage,
      description: translatedDescription,
      language: targetLanguage
    };
  } catch (error) {
    console.error('Alert translation error:', error);
    return {
      ...alert,
      message: alert.message_en || alert.message,
      description: alert.description_en || alert.description,
      language: 'en'
    };
  }
}

/**
 * Initialize translation cache
 */
const translationCache = new Map();

/**
 * Get cached translation or translate and cache
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language
 * @param {string} sourceLanguage - Source language
 * @returns {Promise<string>} - Translated text
 */
async function getCachedTranslation(text, targetLanguage, sourceLanguage = 'en') {
  const cacheKey = `${text}:${sourceLanguage}:${targetLanguage}`;
  
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  const translation = await translateText(text, targetLanguage, sourceLanguage);
  translationCache.set(cacheKey, translation);
  
  // Limit cache size
  if (translationCache.size > 1000) {
    const firstKey = translationCache.keys().next().value;
    translationCache.delete(firstKey);
  }

  return translation;
}

module.exports = {
  detectLanguage,
  translateText,
  translateBatch,
  getSupportedLanguages,
  isLanguageSupported,
  getLanguageName,
  translateFAQResponse,
  translateAlert,
  getCachedTranslation,
  SUPPORTED_LANGUAGES,
  FALLBACK_TRANSLATIONS
};