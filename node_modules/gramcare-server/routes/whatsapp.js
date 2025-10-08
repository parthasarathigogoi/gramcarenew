const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const healthFAQs = require('../data/healthFAQs.json');
const outbreakAlerts = require('../data/outbreakAlerts.json');
const { getCachedTranslation, detectLanguage, isLanguageSupported } = require('../utils/translator');
const logger = require('../utils/logger');

// Initialize Twilio client
let twilioClient;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
} catch (error) {
  console.warn('Twilio not configured, WhatsApp features will be limited');
}

const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

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

// Update user session
const updateUserSession = (phoneNumber, updates) => {
  const session = getUserSession(phoneNumber);
  Object.assign(session, updates);
  session.lastActivity = new Date();
  userSessions.set(phoneNumber, session);
};

// Clean up old sessions (older than 24 hours)
const cleanupSessions = () => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  for (const [phoneNumber, session] of userSessions.entries()) {
    if (session.lastActivity < cutoff) {
      userSessions.delete(phoneNumber);
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

// Generate health response based on context
const generateHealthResponse = async (message, context, language = 'en') => {
  let response = '';
  
  switch (context.category) {
    case 'emergency':
      response = 'This seems like an emergency situation. Please contact your nearest hospital or call emergency services immediately. For immediate help, call 108 (India) or your local emergency number.';
      break;
      
    case 'symptoms':
      response = `I understand you're experiencing ${context.keywords.join(', ')}. While I can provide general information, it's important to consult with a healthcare professional for proper diagnosis and treatment. Would you like me to provide some general care tips or help you find nearby healthcare facilities?`;
      break;
      
    case 'disease_info':
      response = `I can provide information about ${context.keywords.join(', ')}. What specific information would you like to know? For example: symptoms, prevention, treatment options, or when to see a doctor?`;
      break;
      
    case 'prevention':
      response = 'Prevention is key to good health! I can help you with information about vaccinations, hygiene practices, and preventive care. What specific prevention topic interests you?';
      break;
      
    default:
      response = 'Hello! I\'m GramCare, your health assistant. I can help you with health information, symptoms, disease prevention, and vaccination schedules. How can I assist you today?';
  }
  
  // Translate response if needed
  if (language !== 'en' && isLanguageSupported(language)) {
    try {
      response = await getCachedTranslation(response, language);
    } catch (error) {
      logger.error('Translation error in WhatsApp response:', error);
    }
  }
  
  return response;
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

// Helper function to get location alerts
const getLocationAlerts = (location, language = 'english') => {
  const normalizedLocation = location.toLowerCase();
  const alerts = outbreakAlerts.alerts.filter(alert => 
    alert.location.toLowerCase().includes(normalizedLocation) ||
    alert.affectedAreas.some(area => 
      area.toLowerCase().includes(normalizedLocation)
    )
  );
  
  if (alerts.length === 0) {
    return language === 'hindi'
      ? `${location} के लिए कोई सक्रिय अलर्ट नहीं मिला। 🟢`
      : `No active alerts found for ${location}. 🟢`;
  }
  
  let response = language === 'hindi'
    ? `${location} के लिए स्वास्थ्य अलर्ट:\n\n`
    : `Health alerts for ${location}:\n\n`;
  
  alerts.slice(0, 2).forEach((alert, index) => {
    response += `${index + 1}. ${alert.message[language] || alert.message.english}\n\n`;
  });
  
  return response;
};

// Helper function to format WhatsApp response
const formatWhatsAppResponse = (text, includeMenu = false) => {
  let response = text;
  
  if (includeMenu) {
    response += '\n\n📋 *Quick Options:*\n';
    response += '• Type "symptoms" for disease symptoms\n';
    response += '• Type "vaccines" for vaccination info\n';
    response += '• Type "prevention" for prevention tips\n';
    response += '• Type "alerts [location]" for health alerts\n';
    response += '• Type "help" for more options';
  }
  
  return response;
};

// Send WhatsApp message
const sendWhatsAppMessage = async (to, message) => {
  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${to}`
    });
    logger.info(`WhatsApp message sent to ${to}:`, result.sid);
    return result;
  } catch (error) {
    logger.error('Error sending WhatsApp message:', error);
    throw error;
  }
};

// POST /api/whatsapp/webhook - Twilio WhatsApp webhook
router.post('/webhook', async (req, res) => {
  try {
    const twiml = new twilio.twiml.MessagingResponse();
    const incomingMessage = req.body.Body?.trim() || '';
    const fromNumber = req.body.From || '';
    const profileName = req.body.ProfileName || 'User';
    const phoneNumber = fromNumber.replace('whatsapp:', '');
    
    console.log(`WhatsApp message from ${profileName} (${fromNumber}): ${incomingMessage}`);
    
    // Get user session
    const session = getUserSession(phoneNumber);
    
    // Detect language if not set
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
    let language = 'english';
    
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
        : `Hello ${profileName}! 🙏\n\nI'm GramCare, your health assistant. I can help you with:\n\n• Disease symptoms\n• Vaccination information\n• Prevention tips\n• Health alerts\n\nPlease send your question.`;
      responseText = formatWhatsAppResponse(responseText, true);
    }
    // Help command
    else if (/^(help|मदद|सहायता)$/i.test(incomingMessage)) {
      responseText = language === 'hindi'
        ? '📋 *मैं इनमें आपकी मदद कर सकता हूं:*\n\n• "लक्षण" - बीमारी के लक्षण\n• "टीका" - टीकाकरण जानकारी\n• "बचाव" - रोकथाम के तरीके\n• "अलर्ट [स्थान]" - स्वास्थ्य चेतावनी\n\nउदाहरण: "डेंगू के लक्षण" या "अलर्ट असम"'
        : '📋 *I can help you with:*\n\n• "symptoms" - Disease symptoms\n• "vaccines" - Vaccination info\n• "prevention" - Prevention tips\n• "alerts [location]" - Health alerts\n\nExample: "dengue symptoms" or "alerts assam"';
    }
    // Alert requests
    else if (/alert|अलर्ट/i.test(incomingMessage)) {
      const locationMatch = incomingMessage.match(/alert[s]?\s+([a-zA-Z\s]+)|अलर्ट\s+([\u0900-\u097F\s]+)/i);
      if (locationMatch) {
        const location = locationMatch[1] || locationMatch[2];
        responseText = getLocationAlerts(location.trim(), language);
      } else {
        responseText = language === 'hindi'
          ? '📍 कृपया अपना स्थान बताएं।\nउदाहरण: "अलर्ट असम" या "अलर्ट बिहार"'
          : '📍 Please specify your location.\nExample: "alerts assam" or "alerts bihar"';
      }
    }
    // FAQ search
    else {
      // Analyze message for health context
      const context = analyzeHealthContext(incomingMessage);
      
      // Try FAQ match first
      const matchedFAQ = findBestMatch(incomingMessage);
      
      if (matchedFAQ) {
        responseText = `*${matchedFAQ.question}*\n\n${matchedFAQ.answer[language] || matchedFAQ.answer.english}`;
        
        // Add related quick actions
        if (matchedFAQ.category === 'disease') {
          responseText += language === 'hindi'
            ? '\n\n💡 *सुझाव:* "बचाव" टाइप करें रोकथाम के तरीकों के लिए।'
            : '\n\n💡 *Tip:* Type "prevention" for prevention methods.';
        }
      } else {
        // Use enhanced health response
        try {
          responseText = await generateHealthResponse(incomingMessage, context, session.language);
        } catch (error) {
          logger.error('Error generating health response:', error);
          responseText = language === 'hindi'
            ? '😔 मुझे आपका प्रश्न समझ नहीं आया।\n\nकृपया इन विषयों के बारे में पूछें:\n• डेंगू, मलेरिया, टीबी के लक्षण\n• टीकाकरण कार्यक्रम\n• बचाव के तरीके\n\n"help" टाइप करें अधिक विकल्पों के लिए।'
            : '😔 I didn\'t understand your question.\n\nPlease ask about:\n• Dengue, malaria, TB symptoms\n• Vaccination schedules\n• Prevention methods\n\nType "help" for more options.';
        }
      }
    }
    
    // Add footer
    responseText += '\n\n---\n🏥 *GramCare* - Your Health Assistant';
    
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
    
    updateUserSession(phoneNumber, session);
    
    // Send response
    twiml.message(responseText);
    
    // Log the interaction
    console.log(`WhatsApp response to ${profileName}: ${responseText.substring(0, 100)}...`);
    
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
    
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('Sorry, I encountered an error. Please try again later.');
    
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  }
});

// POST /api/whatsapp/send - Send WhatsApp message (for testing)
router.post('/send', async (req, res) => {
  try {
    const { to, message, language = 'en' } = req.body;
    
    if (!twilioClient) {
      return res.status(400).json({
        error: 'Twilio not configured',
        success: false,
        message: 'WhatsApp sending requires Twilio configuration'
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
    
    // Ensure phone number is in WhatsApp format
    const phoneNumber = to.replace('whatsapp:', '');
    
    const sentMessage = await sendWhatsAppMessage(phoneNumber, translatedMessage);
    
    res.json({
      success: true,
      messageId: sentMessage.sid,
      to: `whatsapp:${phoneNumber}`,
      status: sentMessage.status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('WhatsApp send error:', error);
    res.status(500).json({
      error: 'Failed to send WhatsApp message',
      success: false,
      details: error.message
    });
  }
});

// Get user session info
router.get('/session/:phoneNumber', (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const session = userSessions.get(phoneNumber);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({
      success: true,
      session: {
        language: session.language,
        userProfile: session.userProfile,
        lastActivity: session.lastActivity,
        conversationCount: session.conversationHistory.length
      }
    });
  } catch (error) {
    logger.error('Session retrieval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get analytics for WhatsApp usage
router.get('/analytics', (req, res) => {
  try {
    const totalSessions = userSessions.size;
    const activeSessions = Array.from(userSessions.values())
      .filter(session => {
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return session.lastActivity > hourAgo;
      }).length;
    
    const languageDistribution = {};
    const conversationCounts = [];
    
    for (const session of userSessions.values()) {
      // Language distribution
      const lang = session.language || 'unknown';
      languageDistribution[lang] = (languageDistribution[lang] || 0) + 1;
      
      // Conversation counts
      conversationCounts.push(session.conversationHistory.length);
    }
    
    const avgConversationLength = conversationCounts.length > 0 
      ? conversationCounts.reduce((a, b) => a + b, 0) / conversationCounts.length 
      : 0;
    
    res.json({
      success: true,
      analytics: {
        totalSessions,
        activeSessions,
        languageDistribution,
        avgConversationLength: Math.round(avgConversationLength * 100) / 100,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/whatsapp/broadcast - Broadcast alert to multiple numbers
router.post('/broadcast', async (req, res) => {
  try {
    const { numbers, message, alertType = 'general' } = req.body;
    
    if (!twilioClient) {
      return res.status(400).json({
        error: 'Twilio not configured',
        success: false
      });
    }
    
    if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
      return res.status(400).json({
        error: 'Phone numbers array is required',
        success: false
      });
    }
    
    if (!message) {
      return res.status(400).json({
        error: 'Message is required',
        success: false
      });
    }
    
    const results = [];
    
    // Send to each number
    for (const number of numbers) {
      try {
        const whatsappNumber = number.startsWith('whatsapp:') ? number : `whatsapp:${number}`;
        
        const sentMessage = await twilioClient.messages.create({
          body: `🚨 *HEALTH ALERT*\n\n${message}\n\n---\n🏥 GramCare Health System`,
          from: TWILIO_WHATSAPP_NUMBER,
          to: whatsappNumber
        });
        
        results.push({
          number: whatsappNumber,
          messageId: sentMessage.sid,
          status: 'sent',
          timestamp: new Date().toISOString()
        });
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        results.push({
          number: number,
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    const successCount = results.filter(r => r.status === 'sent').length;
    const failureCount = results.filter(r => r.status === 'failed').length;
    
    res.json({
      success: true,
      broadcast: {
        total: numbers.length,
        sent: successCount,
        failed: failureCount,
        results
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('WhatsApp broadcast error:', error);
    res.status(500).json({
      error: 'Failed to broadcast WhatsApp messages',
      success: false,
      details: error.message
    });
  }
});

// GET /api/whatsapp/status - Get WhatsApp integration status
router.get('/status', (req, res) => {
  try {
    const status = {
      configured: !!twilioClient,
      accountSid: process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Not set',
      authToken: process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Not set',
      whatsappNumber: TWILIO_WHATSAPP_NUMBER,
      webhookUrl: `${req.protocol}://${req.get('host')}/api/whatsapp/webhook`,
      features: {
        receiveMessages: !!twilioClient,
        sendMessages: !!twilioClient,
        broadcast: !!twilioClient
      }
    };
    
    res.json({
      success: true,
      whatsapp: status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('WhatsApp status error:', error);
    res.status(500).json({
      error: 'Failed to get WhatsApp status',
      success: false
    });
  }
});

// GET /api/whatsapp/setup - Get setup instructions
router.get('/setup', (req, res) => {
  try {
    const setupInstructions = {
      steps: [
        {
          step: 1,
          title: 'Create Twilio Account',
          description: 'Sign up at https://www.twilio.com and get your Account SID and Auth Token'
        },
        {
          step: 2,
          title: 'Enable WhatsApp Sandbox',
          description: 'Go to Twilio Console > Messaging > Try it out > Send a WhatsApp message'
        },
        {
          step: 3,
          title: 'Configure Environment Variables',
          description: 'Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER in your .env file'
        },
        {
          step: 4,
          title: 'Set Webhook URL',
          description: `Configure webhook URL in Twilio: ${req.protocol}://${req.get('host')}/api/whatsapp/webhook`
        },
        {
          step: 5,
          title: 'Test Integration',
          description: 'Send a message to your WhatsApp sandbox number to test the bot'
        }
      ],
      webhookUrl: `${req.protocol}://${req.get('host')}/api/whatsapp/webhook`,
      testCommands: [
        'hi - Get welcome message',
        'help - Show available commands',
        'dengue symptoms - Get dengue information',
        'alerts assam - Get health alerts for Assam'
      ]
    };
    
    res.json({
      success: true,
      setup: setupInstructions,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('WhatsApp setup error:', error);
    res.status(500).json({
      error: 'Failed to get setup instructions',
      success: false
    });
  }
});

module.exports = router;