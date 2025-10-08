const express = require('express');
const router = express.Router();
const { Translate } = require('@google-cloud/translate').v2;
const healthFAQs = require('../data/healthFAQs.json');
const ChatLog = require('../models/ChatLog');
const {
  detectLanguage,
  translateText,
  translateFAQResponse,
  getSupportedLanguages,
  isLanguageSupported,
  getCachedTranslation
} = require('../utils/translator');
const {
  getAIResponse,
  isHealthRelated,
  getAIStatus
} = require('../utils/aiService');

// Initialize Google Translate (fallback to mock if no API key)
let translate;
try {
  translate = new Translate({
    key: process.env.GOOGLE_TRANSLATE_KEY
  });
} catch (error) {
  console.warn('Google Translate not configured, using mock translation');
  translate = null;
}

// Enhanced greeting messages in multiple languages
const GREETING_MESSAGES = {
  'en': 'Hello! I\'m GramCare, your health assistant. How can I help you today?',
  'hi': 'नमस्ते! मैं ग्रामकेयर हूँ, आपका स्वास्थ्य सहायक। आज मैं आपकी कैसे मदद कर सकता हूँ?',
  'bn': 'নমস্কার! আমি গ্রামকেয়ার, আপনার স্বাস্থ্য সহায়ক। আজ আমি কিভাবে আপনাকে সাহায্য করতে পারি?',
  'as': 'নমস্কাৰ! মই গ্ৰামকেয়াৰ, আপোনাৰ স্বাস্থ্য সহায়ক। আজি মই আপোনাক কেনেকৈ সহায় কৰিব পাৰোঁ?',
  'te': 'నమస్కారం! నేను గ্রামকেयর్, మీ ఆరోగ్య సహాయకుడు। ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?'
};

const FALLBACK_MESSAGES = {
  'en': 'I\'m sorry, I didn\'t understand that. Could you please rephrase your question?',
  'hi': 'मुझे खुशी है, मैं इसे समझ नहीं पाया। क्या आप कृपया अपना प्रश्न दोबारा पूछ सकते हैं?',
  'bn': 'দুঃখিত, আমি এটা বুঝতে পারিনি। আপনি কি দয়া করে আপনার প্রশ্নটি আবার বলতে পারেন?',
  'as': 'দুঃখিত, মই এইটো বুজি পোৱা নাই। আপুনি অনুগ্ৰহ কৰি আপোনাৰ প্ৰশ্নটো পুনৰ ক\'ব পাৰিবনে?',
  'te': 'క్షమించండి, నేను అది అర్థం చేసుకోలేకపోయాను। దయచేసి మీ ప్రశ్నను మళ్లీ అడగగలరా?'
};

// Mock translation function for demo
const mockTranslate = async (text, targetLang) => {
  // Simple mock - in real implementation, use Google Translate API
  const translations = {
    'hello': { 'hi': 'नमस्ते' },
    'thank you': { 'hi': 'धन्यवाद' },
    'goodbye': { 'hi': 'अलविदा' }
  };
  
  return translations[text.toLowerCase()]?.[targetLang] || text;
};

// Function to find best matching FAQ
const findBestMatch = (userMessage) => {
  const message = userMessage.toLowerCase();
  let bestMatch = null;
  let highestScore = 0;
  
  healthFAQs.faqs.forEach(faq => {
    let score = 0;
    
    // Check keywords
    faq.keywords.forEach(keyword => {
      if (message.includes(keyword.toLowerCase())) {
        score += 2;
      }
    });
    
    // Check question similarity
    const questionWords = faq.question.toLowerCase().split(' ');
    questionWords.forEach(word => {
      if (message.includes(word) && word.length > 3) {
        score += 1;
      }
    });
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = faq;
    }
  });
  
  return highestScore > 0 ? bestMatch : null;
};

// Function to get greeting response
const getGreetingResponse = (language = 'english') => {
  const greetings = {
    english: "Hello! I'm GramCare, your health assistant. I can help you with health questions, vaccination schedules, disease prevention, and outbreak alerts. How can I help you today?",
    hindi: "नमस्ते! मैं ग्रामकेयर हूं, आपका स्वास्थ्य सहायक। मैं आपकी स्वास्थ्य संबंधी प्रश्नों, टीकाकरण कार्यक्रम, बीमारी की रोकथाम, और प्रकोप अलर्ट में मदद कर सकता हूं। आज मैं आपकी कैसे मदद कर सकता हूं?"
  };
  
  return greetings[language] || greetings.english;
};

// Function to get fallback response
const getFallbackResponse = (language = 'english') => {
  const fallbacks = {
    english: "I'm sorry, I didn't understand your question. I can help you with:\n\n• Disease symptoms (dengue, malaria, TB)\n• Vaccination schedules\n• Prevention tips\n• Treatment advice\n• Health alerts\n\nPlease try asking about any of these topics, or type 'help' for more options.",
    hindi: "मुझे खुशी है, मैं आपका प्रश्न समझ नहीं पाया। मैं इनमें आपकी मदद कर सकता हूं:\n\n• बीमारी के लक्षण (डेंगू, मलेरिया, टीबी)\n• टीकाकरण कार्यक्रम\n• बचाव के तरीके\n• इलाज की सलाह\n• स्वास्थ्य अलर्ट\n\nकृपया इन विषयों के बारे में पूछें, या अधिक विकल्पों के लिए 'help' टाइप करें।"
  };
  
  return fallbacks[language] || fallbacks.english;
};

// POST /api/chat - Main chat endpoint
router.post('/', async (req, res) => {
  try {
    const { message, language = 'english', userId = 'anonymous', sessionId } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Message is required',
        success: false
      });
    }
    
    const userMessage = message.trim();
    let response = '';
    let responseType = 'faq';
    let matchedFAQ = null;
    let confidence = 0;
    let aiResponse = null;
    
    // Detect language if not provided or auto-detect is requested
    let detectedLanguage = language;
    if (language === 'auto' || !isLanguageSupported(language)) {
      detectedLanguage = await detectLanguage(userMessage);
    }
    
    // Handle greetings
    const greetingPatterns = /^(hi|hello|hey|namaste|namaskar|hola|good morning|good evening|নমস্কার|నమస్కారం)$/i;
    if (greetingPatterns.test(userMessage)) {
      response = GREETING_MESSAGES[detectedLanguage] || GREETING_MESSAGES['en'];
      if (!GREETING_MESSAGES[detectedLanguage]) {
        response = await getCachedTranslation(GREETING_MESSAGES['en'], detectedLanguage);
      }
      responseType = 'greeting';
      confidence = 1.0;
    }
    // Handle help requests
    else if (/^(help|मदद|सहायता)$/i.test(userMessage)) {
      response = getFallbackResponse(detectedLanguage);
      responseType = 'help';
      confidence = 1.0;
    }
    // Handle alerts request
    else if (/alert|outbreak|emergency|अलर्ट|आपातकाल/i.test(userMessage)) {
      response = detectedLanguage === 'hindi' 
        ? "स्वास्थ्य अलर्ट देखने के लिए कृपया अपना राज्य या क्षेत्र बताएं। उदाहरण: 'असम अलर्ट' या 'बिहार अलर्ट'।"
        : "To view health alerts, please specify your state or region. Example: 'Assam alerts' or 'Bihar alerts'.";
      responseType = 'alert_prompt';
      confidence = 0.8;
    }
    // Handle all queries with AI or FAQ matching
    else {
      let usedAI = false;
      
      // Check if AI is enabled (removed health-related filtering)
      const aiEnabled = process.env.AI_ENABLED === 'true';
      
      if (aiEnabled) {
        try {
          // Try to get AI response first for any question
          aiResponse = await getAIResponse(
            userMessage, 
            detectedLanguage, 
            process.env.PREFERRED_AI_SERVICE || 'auto'
          );
          
          if (aiResponse.success) {
            response = aiResponse.response;
            responseType = 'ai';
            confidence = aiResponse.confidence;
            usedAI = true;
          }
        } catch (error) {
          console.error('AI Response Error:', error);
          // Continue to FAQ fallback
        }
      }
      
      // If AI didn't work or isn't enabled, try FAQ matching
      if (!usedAI) {
        matchedFAQ = findBestMatch(userMessage);
        
        if (matchedFAQ) {
          // Translate FAQ response to target language
          const translatedFAQ = await translateFAQResponse(matchedFAQ, detectedLanguage);
          response = translatedFAQ.answer || matchedFAQ.answer[detectedLanguage] || matchedFAQ.answer.english;
          responseType = 'faq';
          confidence = 0.7;
        } else {
          // Final fallback: try AI for any question if enabled
          if (aiEnabled && !healthRelated) {
            try {
              aiResponse = await getAIResponse(
                `This question seems to be outside health topics, but please provide a brief, helpful response while gently redirecting to health-related questions: "${userMessage}"`,
                detectedLanguage,
                process.env.PREFERRED_AI_SERVICE || 'auto'
              );
              
              if (aiResponse.success) {
                response = aiResponse.response;
                responseType = 'ai_redirect';
                confidence = 0.5;
                usedAI = true;
              }
            } catch (error) {
              console.error('AI Redirect Error:', error);
            }
          }
          
          // Ultimate fallback message
          if (!usedAI) {
            response = FALLBACK_MESSAGES[detectedLanguage] || FALLBACK_MESSAGES['en'];
            if (!FALLBACK_MESSAGES[detectedLanguage]) {
              response = await getCachedTranslation(FALLBACK_MESSAGES['en'], detectedLanguage);
            }
            responseType = 'fallback';
            confidence = 0.1;
          }
        }
      }
    }
    
    // Log the conversation (in production, save to database)
    const chatLog = {
      userId,
      sessionId,
      message: userMessage,
      response,
      language: detectedLanguage,
      responseType,
      confidence,
      matchedFAQ: matchedFAQ?.id || null,
      timestamp: new Date().toISOString()
    };
    
    // In a real app, save to database:
    // await ChatLog.create(chatLog);
    console.log('Chat Log:', chatLog);
    
    // Get quick reply suggestions based on language
async function getQuickReplies(language) {
  const quickReplies = {
    'en': [
      "What are COVID-19 symptoms?",
      "How to prevent dengue?",
      "Vaccination schedule for children",
      "Home remedies for fever",
      "When to see a doctor?"
    ],
    'hi': [
      "कोविड-19 के लक्षण क्या हैं?",
      "डेंगू से कैसे बचें?",
      "बच्चों के लिए टीकाकरण कार्यक्रम",
      "बुखार के लिए घरेलू उपचार",
      "डॉक्टर को कब दिखाना चाहिए?"
    ],
    'bn': [
      "কোভিড-১৯ এর লক্ষণগুলি কী?",
      "ডেঙ্গু কীভাবে প্রতিরোধ করবেন?",
      "শিশুদের জন্য টিকাদানের সময়সূচী",
      "জ্বরের জন্য ঘরোয়া প্রতিকার",
      "কখন ডাক্তার দেখাতে হবে?"
    ],
    'te': [
      "కోవిడ్-19 లక్షణాలు ఏమిటి?",
      "డెంగ్యూని ఎలా నివారించాలి?",
      "పిల్లలకు టీకాల షెడ్యూల్",
      "జ్వరానికి ఇంటి వైద్యం",
      "ఎప్పుడు వైద్యుడిని చూడాలి?"
    ]
  };
  
  // Return existing translations or translate from English
  if (quickReplies[language]) {
    return quickReplies[language];
  }
  
  // Translate English quick replies to target language
  try {
    const englishReplies = quickReplies['en'];
    const translatedReplies = await Promise.all(
      englishReplies.map(reply => getCachedTranslation(reply, language))
    );
    return translatedReplies;
  } catch (error) {
    console.error('Quick replies translation error:', error);
    return quickReplies['en']; // Fallback to English
  }
}

    // Prepare response with quick replies
    const quickRepliesData = await getQuickReplies(detectedLanguage);
    const quickReplies = quickRepliesData.map((text, index) => ({
      text,
      payload: `quick_${index}`
    }));
    
    res.json({
      success: true,
      response,
      language: detectedLanguage,
      responseType,
      confidence,
      matchedFAQ: matchedFAQ?.id || null,
      aiProvider: aiResponse?.aiProvider || null,
      aiTokens: aiResponse?.tokens || null,
      quickReplies: responseType === 'greeting' || responseType === 'help' ? quickReplies : [],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Internal server error',
      success: false,
      message: 'Sorry, I encountered an error. Please try again.'
    });
  }
});

// POST /api/chat/translate - Translate text
router.post('/translate', async (req, res) => {
  try {
    const { text, targetLanguage = 'hi' } = req.body;
    
    if (!text) {
      return res.status(400).json({
        error: 'Text is required for translation',
        success: false
      });
    }
    
    let translatedText;
    
    if (translate) {
      // Use Google Translate API
      const [translation] = await translate.translate(text, targetLanguage);
      translatedText = translation;
    } else {
      // Use mock translation for demo
      translatedText = await mockTranslate(text, targetLanguage);
    }
    
    res.json({
      success: true,
      originalText: text,
      translatedText,
      targetLanguage,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      error: 'Translation failed',
      success: false,
      originalText: req.body.text
    });
  }
});

// GET /api/chat/faqs - Get all FAQs
router.get('/faqs', (req, res) => {
  try {
    const { category, language = 'english' } = req.query;
    
    let faqs = healthFAQs.faqs;
    
    // Filter by category if specified
    if (category) {
      faqs = faqs.filter(faq => faq.category === category);
    }
    
    // Format response
    const formattedFAQs = faqs.map(faq => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer[language] || faq.answer.english,
      category: faq.category,
      keywords: faq.keywords
    }));
    
    res.json({
      success: true,
      faqs: formattedFAQs,
      total: formattedFAQs.length,
      language,
      categories: [...new Set(healthFAQs.faqs.map(faq => faq.category))]
    });
    
  } catch (error) {
    console.error('FAQs fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch FAQs',
      success: false
    });
  }
});

// GET /api/chat/quick-replies - Get quick reply options
router.get('/quick-replies', (req, res) => {
  try {
    res.json({
      success: true,
      quickReplies: healthFAQs.quickReplies,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Quick replies error:', error);
    res.status(500).json({
      error: 'Failed to fetch quick replies',
      success: false
    });
  }
});

// GET /api/chat/languages - Get supported languages
router.get('/languages', (req, res) => {
  try {
    const languages = getSupportedLanguages();
    res.json({
      success: true,
      languages,
      total: Object.keys(languages).length
    });
  } catch (error) {
    console.error('Languages endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/chat/detect-language - Detect language of text
router.post('/detect-language', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const detectedLanguage = await detectLanguage(text);
    const isSupported = isLanguageSupported(detectedLanguage);
    
    res.json({
      success: true,
      detectedLanguage,
      isSupported,
      confidence: isSupported ? 0.9 : 0.5
    });
  } catch (error) {
    console.error('Language detection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/chat/ai-status - Get AI service status
router.get('/ai-status', (req, res) => {
  try {
    const status = getAIStatus();
    res.json({
      success: true,
      aiServices: status,
      aiEnabled: process.env.AI_ENABLED === 'true',
      preferredService: process.env.PREFERRED_AI_SERVICE || 'auto',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI Status error:', error);
    res.status(500).json({
      error: 'Failed to get AI status',
      success: false
    });
  }
});

// POST /api/chat/translate - Translate text
router.post('/translate', async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage = 'en' } = req.body;
    
    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'Text and target language are required' });
    }

    if (!isLanguageSupported(targetLanguage)) {
      return res.status(400).json({ error: 'Target language not supported' });
    }

    const translatedText = await getCachedTranslation(text, targetLanguage, sourceLanguage);
    
    res.json({
      success: true,
      originalText: text,
      translatedText,
      sourceLanguage,
      targetLanguage
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;