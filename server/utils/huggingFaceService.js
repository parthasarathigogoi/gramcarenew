const axios = require('axios');

// Hugging Face API configuration
const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models';
const MODEL_NAME = 'microsoft/DialoGPT-medium'; // Free conversational AI model

// Medical knowledge base for fever types and treatments
const MEDICAL_KNOWLEDGE = {
  en: {
    fever_types: {
      'viral fever': {
        symptoms: 'Body ache, headache, fatigue, runny nose, sore throat',
        treatment: 'Rest, fluids, paracetamol for fever. Usually resolves in 3-7 days.',
        when_to_see_doctor: 'If fever persists beyond 5 days or temperature exceeds 103°F'
      },
      'bacterial fever': {
        symptoms: 'High fever, chills, severe body ache, localized pain',
        treatment: 'Requires antibiotic treatment prescribed by a doctor',
        when_to_see_doctor: 'Immediate medical attention required'
      },
      'dengue fever': {
        symptoms: 'High fever, severe headache, eye pain, muscle pain, rash',
        treatment: 'Supportive care, plenty of fluids, avoid aspirin',
        when_to_see_doctor: 'Immediate medical attention required - can be life-threatening'
      },
      'malaria': {
        symptoms: 'Cyclical fever with chills, sweating, headache, nausea',
        treatment: 'Anti-malarial medication prescribed by doctor',
        when_to_see_doctor: 'Immediate medical attention required'
      },
      'typhoid': {
        symptoms: 'Prolonged fever, headache, weakness, stomach pain, rose-colored rash',
        treatment: 'Antibiotic treatment prescribed by doctor',
        when_to_see_doctor: 'Immediate medical attention required'
      }
    },
    general_advice: {
      fever_management: 'Keep hydrated, take rest, use cool compresses, take paracetamol as directed',
      emergency_signs: 'Difficulty breathing, chest pain, severe dehydration, confusion, seizures'
    }
  },
  hi: {
    fever_types: {
      'वायरल बुखार': {
        symptoms: 'शरीर में दर्द, सिरदर्द, थकान, नाक बहना, गले में खराश',
        treatment: 'आराम, तरल पदार्थ, बुखार के लिए पैरासिटामोल। आमतौर पर 3-7 दिनों में ठीक हो जाता है।',
        when_to_see_doctor: 'यदि बुखार 5 दिनों से अधिक रहे या तापमान 103°F से अधिक हो'
      },
      'बैक्टीरियल बुखार': {
        symptoms: 'तेज बुखार, कंपकंपी, गंभीर शरीर दर्द, स्थानीयकृत दर्द',
        treatment: 'डॉक्टर द्वारा निर्धारित एंटीबायोटिक उपचार की आवश्यकता',
        when_to_see_doctor: 'तत्काल चिकित्सा सहायता आवश्यक'
      },
      'डेंगू बुखार': {
        symptoms: 'तेज बुखार, गंभीर सिरदर्द, आंखों में दर्द, मांसपेशियों में दर्द, दाने',
        treatment: 'सहायक देखभाल, भरपूर तरल पदार्थ, एस्पिरिन से बचें',
        when_to_see_doctor: 'तत्काल चिकित्सा सहायता आवश्यक - जीवन के लिए खतरनाक हो सकता है'
      },
      'मलेरिया': {
        symptoms: 'कंपकंपी के साथ चक्रीय बुखार, पसीना, सिरदर्द, मतली',
        treatment: 'डॉक्टर द्वारा निर्धारित मलेरिया रोधी दवा',
        when_to_see_doctor: 'तत्काल चिकित्सा सहायता आवश्यक'
      },
      'टाइफाइड': {
        symptoms: 'लंबे समय तक बुखार, सिरदर्द, कमजोरी, पेट दर्द, गुलाबी रंग के दाने',
        treatment: 'डॉक्टर द्वारा निर्धारित एंटीबायोटिक उपचार',
        when_to_see_doctor: 'तत्काल चिकित्सा सहायता आवश्यक'
      }
    },
    general_advice: {
      fever_management: 'हाइड्रेटेड रहें, आराम करें, ठंडी पट्टी का उपयोग करें, निर्देशानुसार पैरासिटामोल लें',
      emergency_signs: 'सांस लेने में कठिनाई, सीने में दर्द, गंभीर निर्जलीकरण, भ्रम, दсудороги'
    }
  }
};

// Common medical terms and responses
const MEDICAL_RESPONSES = {
  en: {
    greeting: "Hello! I'm your medical assistant. I can help you with information about fevers, symptoms, and general health advice. How can I assist you today?",
    unknown: "I don't have specific information about that. I recommend consulting with a qualified doctor for proper diagnosis and treatment.",
    consult_doctor: "Please consult a doctor for proper medical advice and treatment.",
    emergency: "This sounds like it could be serious. Please seek immediate medical attention or call emergency services."
  },
  hi: {
    greeting: "नमस्ते! मैं आपका चिकित्सा सहायक हूं। मैं बुखार, लक्षण और सामान्य स्वास्थ्य सलाह के बारे में जानकारी दे सकता हूं। आज मैं आपकी कैसे सहायता कर सकता हूं?",
    unknown: "मेरे पास इसके बारे में विशिष्ट जानकारी नहीं है। उचित निदान और उपचार के लिए एक योग्य डॉक्टर से सलाह लेने की सिफारिश करता हूं।",
    consult_doctor: "कृपया उचित चिकित्सा सलाह और उपचार के लिए डॉक्टर से सलाह लें।",
    emergency: "यह गंभीर हो सकता है। कृपया तत्काल चिकित्सा सहायता लें या आपातकालीन सेवाओं को कॉल करें।"
  }
};

/**
 * Get medical response based on user query
 * @param {string} userMessage - User's medical query
 * @param {string} language - Language preference ('en' or 'hi')
 * @returns {Promise<Object>} Medical response
 */
async function getMedicalResponse(userMessage, language = 'en') {
  try {
    const lowerMessage = userMessage.toLowerCase();
    const responses = MEDICAL_RESPONSES[language] || MEDICAL_RESPONSES.en;
    const knowledge = MEDICAL_KNOWLEDGE[language] || MEDICAL_KNOWLEDGE.en;
    
    // Check for greeting
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('नमस्ते')) {
      return {
        success: true,
        response: responses.greeting,
        source: 'medical_knowledge',
        confidence: 0.9
      };
    }
    
    // Check for fever-related queries
    const feverKeywords = ['fever', 'बुखार', 'temperature', 'तापमान'];
    if (feverKeywords.some(keyword => lowerMessage.includes(keyword))) {
      // Check for specific fever types
      for (const [feverType, info] of Object.entries(knowledge.fever_types)) {
        if (lowerMessage.includes(feverType.toLowerCase()) || 
            (language === 'hi' && lowerMessage.includes(feverType))) {
          const response = language === 'en' ? 
            `${feverType.toUpperCase()}:\n\nSymptoms: ${info.symptoms}\n\nTreatment: ${info.treatment}\n\nWhen to see a doctor: ${info.when_to_see_doctor}` :
            `${feverType.toUpperCase()}:\n\nलक्षण: ${info.symptoms}\n\nउपचार: ${info.treatment}\n\nडॉक्टर से कब मिलें: ${info.when_to_see_doctor}`;
          
          return {
            success: true,
            response: response,
            source: 'medical_knowledge',
            confidence: 0.95
          };
        }
      }
      
      // General fever advice
      const generalAdvice = language === 'en' ?
        `FEVER MANAGEMENT:\n\n${knowledge.general_advice.fever_management}\n\nEMERGENCY SIGNS: ${knowledge.general_advice.emergency_signs}\n\n${responses.consult_doctor}` :
        `बुखार प्रबंधन:\n\n${knowledge.general_advice.fever_management}\n\nआपातकालीन संकेत: ${knowledge.general_advice.emergency_signs}\n\n${responses.consult_doctor}`;
      
      return {
        success: true,
        response: generalAdvice,
        source: 'medical_knowledge',
        confidence: 0.8
      };
    }
    
    // Check for emergency keywords
    const emergencyKeywords = ['chest pain', 'difficulty breathing', 'seizure', 'unconscious', 'सीने में दर्द', 'सांस लेने में कठिनाई'];
    if (emergencyKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return {
        success: true,
        response: responses.emergency,
        source: 'medical_knowledge',
        confidence: 0.95
      };
    }
    
    // For other medical queries, try Hugging Face API
    if (process.env.HUGGINGFACE_API_KEY) {
      const aiResponse = await getHuggingFaceResponse(userMessage, language);
      if (aiResponse.success) {
        return {
          success: true,
          response: aiResponse.response + `\n\n${responses.consult_doctor}`,
          source: 'huggingface_ai',
          confidence: 0.7
        };
      }
    }
    
    // Default fallback
    return {
      success: true,
      response: responses.unknown,
      source: 'fallback',
      confidence: 0.5
    };
    
  } catch (error) {
    console.error('Medical response error:', error);
    return {
      success: false,
      error: error.message,
      response: MEDICAL_RESPONSES[language]?.consult_doctor || MEDICAL_RESPONSES.en.consult_doctor
    };
  }
}

/**
 * Get response from Hugging Face API
 * @param {string} userMessage - User's message
 * @param {string} language - Language preference
 * @returns {Promise<Object>} AI response
 */
async function getHuggingFaceResponse(userMessage, language = 'en') {
  try {
    if (!process.env.HUGGINGFACE_API_KEY) {
      throw new Error('Hugging Face API key not configured');
    }
    
    const response = await axios.post(
      `${HUGGINGFACE_API_URL}/${MODEL_NAME}`,
      {
        inputs: userMessage,
        parameters: {
          max_length: 200,
          temperature: 0.7,
          do_sample: true,
          top_p: 0.9
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    if (response.data && response.data[0] && response.data[0].generated_text) {
      return {
        success: true,
        response: response.data[0].generated_text.replace(userMessage, '').trim(),
        confidence: 0.7,
        tokens: response.data[0].generated_text.length
      };
    }
    
    throw new Error('Invalid response from Hugging Face API');
    
  } catch (error) {
    console.error('Hugging Face API Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if message is health-related
 * @param {string} message - User message
 * @returns {boolean} Whether message is health-related
 */
function isHealthRelated(message) {
  const healthKeywords = [
    'fever', 'pain', 'headache', 'cough', 'cold', 'flu', 'medicine', 'doctor', 'hospital',
    'symptom', 'treatment', 'disease', 'illness', 'health', 'medical', 'prescription',
    'बुखार', 'दर्द', 'सिरदर्द', 'खांसी', 'सर्दी', 'फ्लू', 'दवा', 'डॉक्टर', 'अस्पताल',
    'लक्षण', 'उपचार', 'बीमारी', 'स्वास्थ्य', 'चिकित्सा', 'नुस्खा'
  ];
  
  const lowerMessage = message.toLowerCase();
  return healthKeywords.some(keyword => lowerMessage.includes(keyword));
}

module.exports = {
  getMedicalResponse,
  getHuggingFaceResponse,
  isHealthRelated,
  MEDICAL_KNOWLEDGE,
  MEDICAL_RESPONSES
};