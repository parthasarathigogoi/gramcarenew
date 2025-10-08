const fs = require('fs');
const path = require('path');
const { getCachedTranslation } = require('./translator');

// Load folk remedies data
let folkRemedies = [];
try {
  const folkRemediesPath = path.join(__dirname, '../data/folkRemedies.json');
  const folkRemediesData = JSON.parse(fs.readFileSync(folkRemediesPath, 'utf8'));
  folkRemedies = folkRemediesData.remedies || [];
} catch (error) {
  console.error('Error loading folk remedies data:', error);
  folkRemedies = [];
}

/**
 * Detect if a message mentions any known folk remedies
 * @param {string} message - User message
 * @returns {Object|null} - Detected remedy or null
 */
const detectFolkRemedy = (message) => {
  if (!message || folkRemedies.length === 0) return null;
  
  const messageLower = message.toLowerCase();
  
  // Check for each remedy by name and common uses
  for (const remedy of folkRemedies) {
    // Check remedy names in all languages
    const nameMatches = Object.values(remedy.name).some(name => 
      messageLower.includes(name.toLowerCase())
    );
    
    // Check for common uses
    const usesMatch = remedy.commonUses.some(use => 
      messageLower.includes(use.toLowerCase())
    );
    
    // If name matches directly or both a common ingredient and use match
    if (nameMatches || (usesMatch && 
        Object.values(remedy.description).some(desc => 
          desc.toLowerCase().split(' ').some(word => 
            word.length > 3 && messageLower.includes(word.toLowerCase())
          )
        ))) {
      return remedy;
    }
  }
  
  return null;
};

/**
 * Generate a culturally sensitive response for a detected folk remedy
 * @param {Object} remedy - Detected folk remedy
 * @param {string} language - Target language code
 * @returns {Promise<string>} - Culturally sensitive response
 */
const generateCulturalResponse = async (remedy, language = 'en') => {
  if (!remedy) return null;
  
  // Get the appropriate language version or default to English
  const name = remedy.name[language] || remedy.name.en;
  const medicalContext = remedy.medicalContext[language] || remedy.medicalContext.en;
  
  // Generate response based on safety status
  let response = '';
  
  switch (remedy.safetyStatus) {
    case 'safe':
      response = `I see you're mentioning ${name}. This is a common remedy in ${remedy.regions.join(', ')}. It's generally considered safe. ${medicalContext}`;
      break;
    case 'safe_with_caution':
      response = `I notice you're referring to ${name}. This is a traditional remedy used in ${remedy.regions.join(', ')}. While many people use it, there are some precautions to consider: ${medicalContext}`;
      break;
    case 'unsafe':
      response = `I see you're mentioning ${name}. While this is a traditional remedy in ${remedy.regions.join(', ')}, medical research suggests it may not be safe. ${medicalContext}`;
      break;
    default:
      response = `I notice you're mentioning ${name}. This is a traditional remedy in ${remedy.regions.join(', ')}. ${medicalContext}`;
  }
  
  // If the response is not in the target language, translate it
  if (language !== 'en' && language !== 'hi' && language !== 'bn') {
    try {
      response = await getCachedTranslation(response, language);
    } catch (error) {
      console.error('Error translating cultural response:', error);
    }
  }
  
  return response;
};

module.exports = {
  detectFolkRemedy,
  generateCulturalResponse
};