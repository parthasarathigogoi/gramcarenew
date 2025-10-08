/**
 * SwasthAI Triage Logic
 * 
 * This module implements a simple symptom triage system that classifies health concerns into:
 * - GREEN: Minor issues that can be managed at home
 * - YELLOW: Moderate issues that may need medical attention
 * - RED: Severe issues requiring immediate medical attention
 */

// Severity levels
export const SEVERITY = {
  GREEN: 'green',
  YELLOW: 'yellow',
  RED: 'red'
};

// Common symptoms and their default severity
const symptomSeverity = {
  // Respiratory
  'cough': SEVERITY.GREEN,
  'shortness of breath': SEVERITY.YELLOW,
  'difficulty breathing': SEVERITY.RED,
  
  // Fever related
  'fever': SEVERITY.YELLOW,
  'high fever': SEVERITY.YELLOW,
  'fever for more than 3 days': SEVERITY.YELLOW,
  
  // Pain
  'headache': SEVERITY.GREEN,
  'severe headache': SEVERITY.YELLOW,
  'chest pain': SEVERITY.RED,
  'abdominal pain': SEVERITY.YELLOW,
  
  // Digestive
  'nausea': SEVERITY.GREEN,
  'vomiting': SEVERITY.YELLOW,
  'diarrhea': SEVERITY.YELLOW,
  
  // Emergency
  'unconscious': SEVERITY.RED,
  'not breathing': SEVERITY.RED,
  'severe bleeding': SEVERITY.RED,
  'seizure': SEVERITY.RED,
  'stroke': SEVERITY.RED,
  'heart attack': SEVERITY.RED,
};

// Follow-up questions based on initial symptom
export const followUpQuestions = {
  'fever': [
    'How many days have you had the fever?',
    'Is the fever accompanied by any other symptoms like cough or body ache?'
  ],
  'cough': [
    'Is the cough dry or producing phlegm/mucus?',
    'Do you have any difficulty breathing or chest pain?'
  ],
  'headache': [
    'How severe is your headache on a scale of 1-10?',
    'Do you have any other symptoms like fever, vomiting, or sensitivity to light?'
  ],
  'abdominal pain': [
    'Where exactly is the pain located?',
    'Is the pain constant or does it come and go?'
  ],
  'emergency': [
    'Is the person conscious and breathing?',
    'Is there severe bleeding or injury?'
  ],
  'default': [
    'How long have you been experiencing this symptom?',
    'On a scale of 1-10, how severe would you rate this symptom?'
  ]
};

/**
 * Analyzes the initial symptom and follow-up answers to determine severity
 * @param {string} initialSymptom - The initial symptom reported
 * @param {Array<string>} followUpAnswers - Answers to follow-up questions
 * @returns {Object} Triage result with severity and recommendations
 */
export const triageSymptom = (initialSymptom, followUpAnswers = []) => {
  // Convert to lowercase for matching
  const symptom = initialSymptom.toLowerCase();
  
  // Start with default severity or GREEN if not found
  let severity = symptomSeverity[symptom] || SEVERITY.GREEN;
  
  // Emergency keywords that immediately escalate to RED
  const emergencyKeywords = [
    'emergency', 'unconscious', 'not breathing', 'severe bleeding', 
    'seizure', 'stroke', 'heart attack', 'can\'t breathe', 'chest pain'
  ];
  
  // Check for emergency keywords in the initial symptom
  if (emergencyKeywords.some(keyword => symptom.includes(keyword))) {
    severity = SEVERITY.RED;
  }
  
  // Analyze follow-up answers to potentially escalate severity
  if (followUpAnswers && followUpAnswers.length > 0) {
    // Duration-based escalation
    const durationAnswer = followUpAnswers[0] || '';
    if (durationAnswer.includes('more than') || 
        durationAnswer.includes('several days') || 
        durationAnswer.includes('week') || 
        durationAnswer.includes('long time')) {
      if (severity === SEVERITY.GREEN) severity = SEVERITY.YELLOW;
    }
    
    // Severity-based escalation
    const severityAnswer = followUpAnswers[1] || '';
    if (severityAnswer.includes('10') || 
        severityAnswer.includes('9') || 
        severityAnswer.includes('8') || 
        severityAnswer.includes('severe') || 
        severityAnswer.includes('extreme')) {
      if (severity === SEVERITY.GREEN) severity = SEVERITY.YELLOW;
      if (severity === SEVERITY.YELLOW && 
          (severityAnswer.includes('10') || severityAnswer.includes('extreme'))) {
        severity = SEVERITY.RED;
      }
    }
    
    // Additional symptoms that may escalate
    const combinedAnswers = followUpAnswers.join(' ').toLowerCase();
    if (combinedAnswers.includes('difficulty breathing') || 
        combinedAnswers.includes('chest pain') || 
        combinedAnswers.includes('unconscious')) {
      severity = SEVERITY.RED;
    }
  }
  
  // Generate recommendations based on severity
  let recommendations = '';
  switch (severity) {
    case SEVERITY.GREEN:
      recommendations = 'This appears to be a minor issue. Rest, stay hydrated, and monitor your symptoms. Use over-the-counter medications as appropriate.';
      break;
    case SEVERITY.YELLOW:
      recommendations = 'This may require medical attention. Consider consulting with a healthcare provider within 24-48 hours. Book a teleconsultation for further guidance.';
      break;
    case SEVERITY.RED:
      recommendations = 'This requires immediate medical attention. Please go to the nearest emergency room or call emergency services immediately.';
      break;
    default:
      recommendations = 'Please consult with a healthcare provider for proper evaluation.';
  }
  
  return {
    initialSymptom,
    severity,
    recommendations,
    needsFollowUp: severity === SEVERITY.YELLOW,
    needsEmergency: severity === SEVERITY.RED
  };
};

/**
 * Gets follow-up questions for a specific symptom
 * @param {string} symptom - The symptom to get follow-up questions for
 * @returns {Array<string>} Array of follow-up questions
 */
export const getFollowUpQuestions = (symptom) => {
  const lowerSymptom = symptom.toLowerCase();
  
  // Find the most relevant symptom key
  const matchingSymptom = Object.keys(followUpQuestions).find(key => 
    lowerSymptom.includes(key)
  );
  
  return followUpQuestions[matchingSymptom] || followUpQuestions.default;
};