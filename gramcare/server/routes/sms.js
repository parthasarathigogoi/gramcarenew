const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const healthFAQs = require('../data/healthFAQs.json');
const outbreakAlerts = require('../data/outbreakAlerts.json');
const { getCachedTranslation, detectLanguage, isLanguageSupported } = require('../utils/translator');
const logger = require('../utils/logger');
const { generateHealthResponse } = require('../utils/aiService');
const ChatLog = require('../models/ChatLog');

// Initialize Twilio client
let twilioClient;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
} catch (error) {
  console.warn('Twilio not configured, SMS features will be limited');
}

const TWILIO_SMS_NUMBER = process.env.SMS_FROM_NUMBER;

// Store user sessions
const userSessions = new Map();

// Health-related keywords and responses
const healthKeywords = {
  symptoms: ['fever', 'cough', 'headache', 'pain', 'nausea', 'vomiting', 'diarrhea', 'fatigue'],
  diseases: ['covid', 'malaria', 'dengue', 'typhoid', 'diabetes', 'hypertension', 'tuberculosis'],
  prevention: ['vaccine', 'vaccination', 'immunization', 'hygiene', 'sanitize', 'mask'],
  emergency: ['emergency', 'urgent', 'severe', 'critical', 'hospital', 'ambulance']
};

// Get or create user session
const getUserSession = (phoneNumber) => {
  if (!userSessions.has(phoneNumber)) {
    userSessions.set(phoneNumber, {
      language: 'en',
      conversationHistory: [],
      lastActivity: new Date(),
      userProfile: {
        preferredLanguage: null,
        location: null,
        age: null
      }
    });
  }
  return userSessions.get(phoneNumber);
};

// Helper function to find FAQ match (reused from chat.js)
const findBestMatch = (userMessage) => {
  const message = userMessage.toLowerCase();
  let bestMatch = null;
  let highestScore = 0;
  
  healthFAQs.faqs.forEach(faq => {
    let score = 0;
    
    faq.keywords.forEach(keyword => {
      if (message.includes(keyword.toLowerCase())) {
        score += 2;
      }
    });
    
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

// Update user session
const updateUserSession = (phoneNumber, updates) => {
  const session = getUserSession(phoneNumber);
  Object.assign(session, updates);
  session.lastActivity = new Date();
};

// Cleanup old sessions
const cleanupSessions = () => {
  const now = new Date();
  for (const [phoneNumber, session] of userSessions.entries()) {
    // Sessions expire after 24 hours of inactivity
    if (now.getTime() - session.lastActivity.getTime() > 24 * 60 * 60 * 1000) {
      userSessions.delete(phoneNumber);
      logger.info(`Cleaned up session for ${phoneNumber}`);
    }
  }
};

// Run cleanup every hour
setInterval(cleanupSessions, 60 * 60 * 1000);

// Analyze message for health context
const analyzeHealthContext = (message) => {
  const lowerMessage = message.toLowerCase();
  const context = {
    category: 'general',
    urgency: 'low',
    keywords: []
  };

  // Check for emergency keywords
  if (healthKeywords.emergency.some(keyword => lowerMessage.includes(keyword))) {
    context.urgency = 'high';
    context.category = 'emergency';
  }
  
  // Check for symptoms
  const foundSymptoms = healthKeywords.symptoms.filter(symptom => lowerMessage.includes(symptom));
  if (foundSymptoms.length > 0) {
    context.category = 'symptoms';
    context.keywords = foundSymptoms;
    if (foundSymptoms.length > 2) context.urgency = 'medium';
  }
  
  // Check for diseases
  const foundDiseases = healthKeywords.diseases.filter(disease => lowerMessage.includes(disease));
  if (foundDiseases.length > 0) {
    context.category = 'disease_info';
    context.keywords = foundDiseases;
  }
  
  // Check for prevention
  if (healthKeywords.prevention.some(keyword => lowerMessage.includes(keyword))) {
    context.category = 'prevention';
  }

  return context;
};

// Get location-based alerts
const getLocationAlerts = (location, language) => {
  const alerts = outbreakAlerts.filter(alert => 
    alert.location.toLowerCase() === location.toLowerCase() &&
    alert.language === language
  );

  if (alerts.length > 0) {
    return alerts.map(alert => `🚨 *${alert.title}*\n${alert.description}`).join('\n\n');
  } else {
    return language === 'hindi'
      ? `📍 ${location} के लिए कोई अलर्ट नहीं मिला।`
      : `📍 No alerts found for ${location}.`;
  }
};

// Send SMS message
const sendSMSMessage = async (to, message) => {
  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: TWILIO_SMS_NUMBER,
      to: to
    });
    logger.info(`SMS message sent to ${to}:`, result.sid);
    return result;
  } catch (error) {
    logger.error('Error sending SMS message:', error);
    throw error;
  }
};

// Helper to format response for SMS (no markdown)
const formatSMSResponse = (text) => {
  return text.replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
             .replace(/\n/g, ' ') // Replace newlines with spaces
             .replace(/---\s*🏥 GramCare - Your Health Assistant/g, '') // Remove footer
             .trim();
};

// POST /api/sms/webhook - Handles incoming SMS messages
router.post('/webhook', async (req, res) => {
  const twiml = new twilio.twiml.MessagingResponse();
  try {
    const incomingMessage = req.body.Body || '';
    const fromNumber = req.body.From;
    const profileName = req.body.ProfileName || fromNumber; // Use From number as profile name for SMS

    logger.info(`Incoming SMS from ${fromNumber}: ${incomingMessage}`);

    const session = getUserSession(fromNumber);

    // Language detection (if not set)
    if (!session.userProfile.preferredLanguage && incomingMessage.length > 10) {
      try {
        const detectedLang = await detectLanguage(incomingMessage);
        if (detectedLang && isLanguageSupported(detectedLang)) {
          session.userProfile.preferredLanguage = detectedLang;
          session.language = detectedLang;
        }
      } catch (error) {
        logger.error('Language detection error:', error);
      }
    }
    
    let responseText = '';
    let language = session.language || 'english';
    
    // Detect Hindi language (basic detection)
    const hindiPattern = /[\u0900-\u097F]/;
    if (hindiPattern.test(incomingMessage)) {
      language = 'hindi';
    }
    
    // Handle different message types
    if (!incomingMessage) {
      responseText = language === 'hindi'
        ? 'नमस्ते! मैं ग्रामकेयर हूं। कृपया अपना स्वास्थ्य प्रश्न भेजें।'
        : 'Hello! I\'m GramCare. Please send your health question.';
    }
    // Greetings
    else if (/^(hi|hello|hey|namaste|namaskar|start)$/i.test(incomingMessage)) {
      responseText = language === 'hindi'
        ? `नमस्ते ${profileName}! 🙏\n\nमैं ग्रामकेयर हूं, आपका स्वास्थ्य सहायक। मैं इनमें आपकी मदद कर सकता हूं:\n\n• बीमारी के लक्षण\n• टीकाकरण जानकारी\n• बचाव के तरीके\n• स्वास्थ्य अलर्ट\n\nकृपया अपना प्रश्न भेजें।`
        : `Hello ${profileName}! 🙏\n\nI\'m GramCare, your health assistant. I can help you with:\n\n• Disease symptoms\n• Vaccination information\n• Prevention tips\n• Health alerts\n\nPlease send your question.`;
      responseText = formatSMSResponse(responseText);
    }
    // Help command
    else if (/^(help|मदद|सहायता)$/i.test(incomingMessage)) {
      responseText = language === 'hindi'
        ? '📋 मैं इनमें आपकी मदद कर सकता हूं:  • "लक्षण" - बीमारी के लक्षण • "टीका" - टीकाकरण जानकारी • "बचाव" - रोकथाम के तरीके • "अलर्ट [स्थान]" - स्वास्थ्य चेतावनी  उदाहरण: "डेंगू के लक्षण" या "अलर्ट असम"'
        : '📋 I can help you with:  • "symptoms" - Disease symptoms • "vaccines" - Vaccination info • "prevention" - Prevention tips • "alerts [location]" - Health alerts  Example: "dengue symptoms" or "alerts assam"';
      responseText = formatSMSResponse(responseText);
    }
    // Alert requests
    else if (/alert|अलर्ट/i.test(incomingMessage)) {
      const locationMatch = incomingMessage.match(/alert[s]?\s+([a-zA-Z\s]+)|अलर्ट\s+([\u0900-\u097F\s]+)/i);
      if (locationMatch) {
        const location = locationMatch[1] || locationMatch[2];
        responseText = getLocationAlerts(location.trim(), language);
      } else {
        responseText = language === 'hindi'
          ? '📍 कृपया अपना स्थान बताएं। उदाहरण: "अलर्ट असम" या "अलर्ट बिहार"'
          : '📍 Please specify your location. Example: "alerts assam" or "alerts bihar"';
      }
      responseText = formatSMSResponse(responseText);
    }
    // FAQ search
    else {
      // Analyze message for health context
      const context = analyzeHealthContext(incomingMessage);
      
      // Try FAQ match first
      const matchedFAQ = findBestMatch(incomingMessage);
      
      if (matchedFAQ) {
        responseText = `${matchedFAQ.question}  ${matchedFAQ.answer[language] || matchedFAQ.answer.english}`;
        
        // Add related quick actions
        if (matchedFAQ.category === 'disease') {
          responseText += language === 'hindi'
            ? '  💡 सुझाव: "बचाव" टाइप करें रोकथाम के तरीकों के लिए।'
            : '  💡 Tip: Type "prevention" for prevention methods.';
        }
      } else {
        // Use enhanced health response
        try {
          responseText = await generateHealthResponse(incomingMessage, context, session.language);
        } catch (error) {
          logger.error('Error generating health response:', error);
          responseText = language === 'hindi'
            ? '😔 मुझे आपका प्रश्न समझ नहीं आया।  कृपया इन विषयों के बारे में पूछें: • डेंगू, मलेरिया, टीबी के लक्षण • टीकाकरण कार्यक्रम • बचाव के तरीके  "help" टाइप करें अधिक विकल्पों के लिए।'
            : '😔 I didn\'t understand your question.  Please ask about: • Dengue, malaria, TB symptoms • Vaccination schedules • Prevention methods  Type "help" for more options.';
        }
      }
      responseText = formatSMSResponse(responseText);
    }
    
    // Add footer
    responseText += '  🏥 GramCare - Your Health Assistant';
    
    // Update conversation history
    session.conversationHistory.push({
      timestamp: new Date(),
      userMessage: incomingMessage,
      botResponse: responseText,
      language: language
    });
    
    // Keep only last 10 messages
    if (session.conversationHistory.length > 10) {
      session.conversationHistory = session.conversationHistory.slice(-10);
    }
    
    updateUserSession(fromNumber, session);
    
    // Save chat log
    const chatLog = new ChatLog({
      platform: 'SMS',
      from: fromNumber,
      to: TWILIO_SMS_NUMBER,
      message: incomingMessage,
      response: responseText,
      language: language,
      aiService: process.env.PREFERRED_AI_SERVICE || 'groq',
      aiModel: 'llama-3.1-8b-instant', // Assuming Groq is used
      session: session.conversationHistory
    });
    await chatLog.save();

    // Send response
    twiml.message(responseText);
    
    // Log the interaction
    console.log(`SMS response to ${profileName}: ${responseText.substring(0, 100)}...`);
    
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
    
  } catch (error) {
    console.error('SMS webhook error:', error);
    
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('Sorry, I encountered an error. Please try again later.');
    
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  }
});

// POST /api/sms/send - Send SMS message (for testing)
router.post('/send', async (req, res) => {
  try {
    const { to, message, language = 'en' } = req.body;
    
    if (!twilioClient) {
      return res.status(400).json({
        error: 'Twilio not configured',
        success: false,
        message: 'SMS sending requires Twilio configuration'
      });
    }
    
    if (!to || !message) {
      return res.status(400).json({
        error: 'Phone number and message are required',
        success: false
      });
    }
    
    // Translate message if needed
    let translatedMessage = message;
    if (language !== 'en' && isLanguageSupported(language)) {
      try {
        translatedMessage = await getCachedTranslation(message, language);
      } catch (error) {
        logger.error('Translation error:', error);
      }
    }
    
    const sentMessage = await sendSMSMessage(to, translatedMessage);
    
    res.json({
      success: true,
      messageId: sentMessage.sid,
      to: to,
      status: sentMessage.status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('SMS send error:', error);
    res.status(500).json({
      error: 'Failed to send SMS message',
      success: false,
      details: error.message
    });
  }
});

// GET /api/sms/status - Check SMS setup status
router.get('/status', (req, res) => {
  try {
    const setupInstructions = {
      configured: !!twilioClient,
      requiredEnv: [
        'TWILIO_ACCOUNT_SID',
        'TWILIO_AUTH_TOKEN',
        'TWILIO_SMS_NUMBER'
      ],
      currentEnv: {
        TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Not Set',
        TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Not Set',
        TWILIO_SMS_NUMBER: process.env.TWILIO_SMS_NUMBER || '+15017122661'
      },
      endpoints: [
        '/api/sms/webhook - POST (for incoming SMS from Twilio)',
        '/api/sms/send - POST (to send outgoing SMS)',
        '/api/sms/status - GET (to check SMS setup status)'
      ],
      testCommand: `curl -X POST -H "Content-Type: application/json" -d '{"to": "+1234567890", "message": "Hello from GramCare SMS!"}' http://localhost:5000/api/sms/send`
    };
    
    res.json({
      success: true,
      setup: setupInstructions,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('SMS setup error:', error);
    res.status(500).json({
      error: 'Failed to get setup instructions',
      success: false
    });
  }
});

module.exports = router;