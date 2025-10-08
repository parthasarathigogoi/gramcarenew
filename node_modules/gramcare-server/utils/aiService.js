const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getCachedTranslation } = require('./translator');

// Initialize AI clients
let openai = null;
let gemini = null;

// Initialize OpenAI
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log('OpenAI initialized successfully');
} else {
  console.warn('OpenAI API key not found. OpenAI features will be disabled.');
}

// Initialize Google Gemini
if (process.env.GEMINI_API_KEY) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  gemini = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  console.log('Google Gemini initialized successfully');
} else {
  console.warn('Gemini API key not found. Gemini features will be disabled.');
}

// Health-focused system prompt
const HEALTH_SYSTEM_PROMPT = `You are GramCare, a helpful and knowledgeable health assistant designed to provide accurate, reliable health information to rural communities. Your responses should be:

1. ACCURATE: Based on established medical knowledge and WHO/CDC guidelines
2. ACCESSIBLE: Use simple, clear language that's easy to understand
3. CULTURALLY SENSITIVE: Respect local customs and practices
4. SAFE: Always recommend consulting healthcare professionals for serious conditions
5. SUPPORTIVE: Be empathetic and encouraging

Guidelines:
- Provide general health information and education
- Suggest when to seek professional medical care
- Offer preventive care advice
- Explain symptoms and conditions in simple terms
- Never diagnose specific medical conditions
- Always emphasize the importance of professional medical consultation
- Be concise but comprehensive (aim for 2-3 sentences)

If asked about non-health topics, politely redirect to health-related questions.`;

/**
 * Get AI response using the preferred AI service
 * @param {string} userMessage - The user's message
 * @param {string} language - Target language for response
 * @param {string} preferredAI - 'openai' or 'gemini' or 'auto'
 * @returns {Promise<Object>} AI response with metadata
 */
async function getAIResponse(userMessage, language = 'en', preferredAI = 'auto') {
  try {
    let response = null;
    let aiProvider = null;
    
    // Determine which AI to use
    if (preferredAI === 'openai' && openai) {
      response = await getOpenAIResponse(userMessage, language);
      aiProvider = 'openai';
    } else if (preferredAI === 'gemini' && gemini) {
      response = await getGeminiResponse(userMessage, language);
      aiProvider = 'gemini';
    } else {
      // Auto-select: try Gemini first (free tier), fallback to OpenAI
      if (gemini) {
        response = await getGeminiResponse(userMessage, language);
        aiProvider = 'gemini';
      } else if (openai) {
        response = await getOpenAIResponse(userMessage, language);
        aiProvider = 'openai';
      } else {
        throw new Error('No AI service available');
      }
    }
    
    return {
      success: true,
      response: response.content,
      aiProvider,
      confidence: response.confidence || 0.8,
      tokens: response.tokens || null,
      language
    };
    
  } catch (error) {
    console.error('AI Service Error:', error);
    return {
      success: false,
      error: error.message,
      aiProvider: null,
      confidence: 0
    };
  }
}

/**
 * Get response from OpenAI GPT
 * @param {string} userMessage - User's message
 * @param {string} language - Target language
 * @returns {Promise<Object>} OpenAI response
 */
async function getOpenAIResponse(userMessage, language) {
  if (!openai) {
    throw new Error('OpenAI not initialized');
  }
  
  const languageInstruction = language !== 'en' 
    ? `Please respond in ${getLanguageName(language)} language.` 
    : '';
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `${HEALTH_SYSTEM_PROMPT}\n\n${languageInstruction}`
      },
      {
        role: 'user',
        content: userMessage
      }
    ],
    max_tokens: 300,
    temperature: 0.7,
  });
  
  return {
    content: completion.choices[0].message.content.trim(),
    tokens: completion.usage.total_tokens,
    confidence: 0.9
  };
}

/**
 * Get response from Google Gemini
 * @param {string} userMessage - User's message
 * @param {string} language - Target language
 * @returns {Promise<Object>} Gemini response
 */
async function getGeminiResponse(userMessage, language) {
  if (!gemini) {
    throw new Error('Gemini not initialized');
  }
  
  const languageInstruction = language !== 'en' 
    ? `Please respond in ${getLanguageName(language)} language.` 
    : '';
  
  const prompt = `${HEALTH_SYSTEM_PROMPT}\n\n${languageInstruction}\n\nUser Question: ${userMessage}`;
  
  const result = await gemini.generateContent(prompt);
  const response = await result.response;
  
  return {
    content: response.text().trim(),
    tokens: null, // Gemini doesn't provide token count in free tier
    confidence: 0.85
  };
}

/**
 * Check if the message is health-related
 * @param {string} message - User message
 * @returns {boolean} True if health-related
 */
function isHealthRelated(message) {
  const healthKeywords = [
    // English
    'health', 'medical', 'doctor', 'medicine', 'symptom', 'disease', 'illness', 'pain',
    'fever', 'cough', 'cold', 'flu', 'headache', 'stomach', 'treatment', 'cure',
    'vaccine', 'vaccination', 'hospital', 'clinic', 'pharmacy', 'drug', 'medication',
    'covid', 'coronavirus', 'dengue', 'malaria', 'diabetes', 'blood pressure',
    'pregnancy', 'child', 'baby', 'nutrition', 'diet', 'exercise', 'mental health',
    
    // Hindi
    'स्वास्थ्य', 'चिकित्सा', 'डॉक्टर', 'दवा', 'लक्षण', 'बीमारी', 'दर्द', 'बुखार',
    'खांसी', 'सर्दी', 'सिरदर्द', 'पेट', 'इलाज', 'अस्पताल', 'क्लिनिक', 'टीका',
    
    // Bengali
    'স্বাস্থ্য', 'চিকিৎসা', 'ডাক্তার', 'ওষুধ', 'লক্ষণ', 'রোগ', 'ব্যথা', 'জ্বর',
    'কাশি', 'সর্দি', 'মাথাব্যথা', 'পেট', 'চিকিৎসা', 'হাসপাতাল',
    
    // Telugu
    'ఆరోగ్యం', 'వైద్యం', 'వైద్యుడు', 'మందు', 'లక్షణం', 'వ్యాధి', 'నొప్పి', 'జ్వరం',
    'దగ్గు', 'జలుబు', 'తలనొప్పి', 'కడుపు', 'చికిత్స', 'ఆసుపత్రి'
  ];
  
  const lowerMessage = message.toLowerCase();
  return healthKeywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
}

/**
 * Get language name from code
 * @param {string} langCode - Language code
 * @returns {string} Language name
 */
function getLanguageName(langCode) {
  const languages = {
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
  
  return languages[langCode] || 'English';
}

/**
 * Get AI service status
 * @returns {Object} Status of available AI services
 */
function getAIStatus() {
  return {
    openai: {
      available: !!openai,
      configured: !!process.env.OPENAI_API_KEY
    },
    gemini: {
      available: !!gemini,
      configured: !!process.env.GEMINI_API_KEY
    }
  };
}

module.exports = {
  getAIResponse,
  isHealthRelated,
  getAIStatus,
  getOpenAIResponse,
  getGeminiResponse
};