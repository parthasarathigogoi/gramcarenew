const express = require('express');
const router = express.Router();
const symptomData = require('../data/symptomChecker.json');
const { translateText, getCachedTranslation } = require('../utils/translator');
const logger = require('../utils/logger');
const twilio = require('twilio');

// Initialize Twilio client for escalation
let twilioClient;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
} catch (error) {
  console.warn('Twilio not configured, escalation features will be limited');
}

// In-memory storage for symptom reports (in production, use database)
const symptomReports = new Map();
const escalationQueue = new Map();

// Analyze symptoms and match to conditions
const analyzeSymptoms = (symptoms, language = 'en') => {
  const matchedConditions = [];
  const symptomNames = symptoms.map(s => s.toLowerCase());
  
  // Check each condition against reported symptoms
  Object.entries(symptomData.conditions).forEach(([conditionId, condition]) => {
    let matchScore = 0;
    let matchedSymptoms = [];
    
    condition.symptoms.forEach(symptomId => {
      const symptom = symptomData.symptoms[symptomId];
      if (symptom) {
        // Check if any keyword matches
        const keywordMatch = symptom.keywords.some(keyword => 
          symptomNames.some(reportedSymptom => 
            reportedSymptom.includes(keyword.toLowerCase()) ||
            keyword.toLowerCase().includes(reportedSymptom)
          )
        );
        
        if (keywordMatch) {
          matchScore++;
          matchedSymptoms.push(symptomId);
        }
      }
    });
    
    // Calculate match percentage
    const matchPercentage = (matchScore / condition.symptoms.length) * 100;
    
    if (matchScore > 0) {
      matchedConditions.push({
        conditionId,
        condition,
        matchScore,
        matchPercentage,
        matchedSymptoms,
        severity: condition.severity,
        escalationRequired: condition.escalation_required
      });
    }
  });
  
  // Sort by match score (highest first)
  matchedConditions.sort((a, b) => b.matchScore - a.matchScore);
  
  return matchedConditions;
};

// Determine escalation level
const determineEscalation = (symptoms, matchedConditions) => {
  const symptomNames = symptoms.map(s => s.toLowerCase());
  
  // Check for immediate escalation symptoms
  const immediateSymptoms = symptomData.escalation_criteria.immediate.symptoms;
  const hasImmediateSymptom = immediateSymptoms.some(symptomId => {
    const symptom = symptomData.symptoms[symptomId];
    return symptom && symptom.keywords.some(keyword => 
      symptomNames.some(reportedSymptom => 
        reportedSymptom.includes(keyword.toLowerCase())
      )
    );
  });
  
  // Check for immediate escalation conditions
  const immediateConditions = symptomData.escalation_criteria.immediate.conditions;
  const hasImmediateCondition = matchedConditions.some(match => 
    immediateConditions.includes(match.conditionId) && match.matchPercentage > 50
  );
  
  if (hasImmediateSymptom || hasImmediateCondition) {
    return 'immediate';
  }
  
  // Check for 24-hour escalation
  const within24HourSymptoms = symptomData.escalation_criteria.within_24_hours.symptoms;
  const needs24HourCare = within24HourSymptoms.some(symptomId => {
    const symptom = symptomData.symptoms[symptomId];
    return symptom && symptom.keywords.some(keyword => 
      symptomNames.some(reportedSymptom => 
        reportedSymptom.includes(keyword.toLowerCase())
      )
    );
  });
  
  if (needs24HourCare || matchedConditions.some(match => match.severity === 'high')) {
    return 'within_24_hours';
  }
  
  return 'routine_care';
};

// Send escalation alert to health workers
const sendEscalationAlert = async (reportId, escalationLevel, patientInfo, symptoms, language = 'en') => {
  try {
    if (!twilioClient) {
      logger.warn('Twilio not configured, cannot send escalation alert');
      return false;
    }
    
    const healthWorkers = symptomData.health_worker_contacts.asha_workers;
    const escalationMessage = symptomData.escalation_criteria[escalationLevel].message[language] || 
                             symptomData.escalation_criteria[escalationLevel].message.english;
    
    const alertMessage = `🚨 HEALTH ALERT\n\nPatient: ${patientInfo.name || 'Unknown'}\nPhone: ${patientInfo.phone}\nSymptoms: ${symptoms.join(', ')}\n\n${escalationMessage}\n\nReport ID: ${reportId}`;
    
    // Send to appropriate health workers based on area/language
    const relevantWorkers = healthWorkers.filter(worker => 
      worker.languages.includes(language) || worker.languages.includes('english')
    );
    
    for (const worker of relevantWorkers.slice(0, 2)) { // Limit to 2 workers to avoid spam
      try {
        await twilioClient.messages.create({
          body: alertMessage,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: worker.phone
        });
        
        logger.info(`Escalation alert sent to ${worker.name} for report ${reportId}`);
      } catch (error) {
        logger.error(`Failed to send alert to ${worker.name}:`, error);
      }
    }
    
    return true;
  } catch (error) {
    logger.error('Escalation alert error:', error);
    return false;
  }
};

// POST /api/symptom-checker/check - Check symptoms and provide recommendations
router.post('/check', async (req, res) => {
  try {
    const { symptoms, patientInfo, language = 'en' } = req.body;
    
    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({
        error: 'Symptoms array is required',
        success: false
      });
    }
    
    // Generate report ID
    const reportId = `RPT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Analyze symptoms
    const matchedConditions = analyzeSymptoms(symptoms, language);
    const escalationLevel = determineEscalation(symptoms, matchedConditions);
    
    // Create symptom report
    const report = {
      id: reportId,
      symptoms: symptoms,
      patientInfo: patientInfo || {},
      matchedConditions: matchedConditions,
      escalationLevel: escalationLevel,
      language: language,
      timestamp: new Date().toISOString(),
      escalationSent: false
    };
    
    symptomReports.set(reportId, report);
    
    // Handle escalation if needed
    if (escalationLevel === 'immediate' || escalationLevel === 'within_24_hours') {
      const escalationSent = await sendEscalationAlert(
        reportId, 
        escalationLevel, 
        patientInfo || {}, 
        symptoms, 
        language
      );
      
      report.escalationSent = escalationSent;
      
      if (escalationSent) {
        escalationQueue.set(reportId, {
          ...report,
          escalationTime: new Date().toISOString(),
          status: 'pending_response'
        });
      }
    }
    
    // Prepare response
    const escalationMessage = symptomData.escalation_criteria[escalationLevel].message[language] || 
                             symptomData.escalation_criteria[escalationLevel].message.english;
    
    const topConditions = matchedConditions.slice(0, 3).map(match => ({
      name: match.condition.name[language] || match.condition.name.english,
      description: match.condition.description[language] || match.condition.description.english,
      immediateActions: match.condition.immediate_actions[language] || match.condition.immediate_actions.english,
      matchPercentage: Math.round(match.matchPercentage),
      severity: match.severity
    }));
    
    logger.info(`Symptom check completed: ${reportId}, escalation: ${escalationLevel}`);
    
    res.json({
      success: true,
      reportId: reportId,
      escalationLevel: escalationLevel,
      escalationMessage: escalationMessage,
      possibleConditions: topConditions,
      escalationSent: report.escalationSent,
      healthWorkerContacts: escalationLevel !== 'routine_care' ? {
        asha: symptomData.health_worker_contacts.asha_workers.slice(0, 2),
        phc: symptomData.health_worker_contacts.phc_centers.slice(0, 2)
      } : null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Symptom checker error:', error);
    res.status(500).json({
      error: 'Failed to process symptom check',
      success: false
    });
  }
});

// GET /api/symptom-checker/report/:reportId - Get symptom report details
router.get('/report/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { language = 'en' } = req.query;
    
    const report = symptomReports.get(reportId);
    
    if (!report) {
      return res.status(404).json({
        error: 'Report not found',
        success: false
      });
    }
    
    // Translate condition information if needed
    const translatedConditions = report.matchedConditions.map(match => ({
      name: match.condition.name[language] || match.condition.name.english,
      description: match.condition.description[language] || match.condition.description.english,
      immediateActions: match.condition.immediate_actions[language] || match.condition.immediate_actions.english,
      matchPercentage: Math.round(match.matchPercentage),
      severity: match.severity
    }));
    
    res.json({
      success: true,
      report: {
        id: report.id,
        symptoms: report.symptoms,
        escalationLevel: report.escalationLevel,
        possibleConditions: translatedConditions,
        escalationSent: report.escalationSent,
        timestamp: report.timestamp
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Get symptom report error:', error);
    res.status(500).json({
      error: 'Failed to get symptom report',
      success: false
    });
  }
});

// GET /api/symptom-checker/escalations - Get pending escalations (for health workers)
router.get('/escalations', async (req, res) => {
  try {
    const { status = 'all', language = 'en' } = req.query;
    
    let escalations = Array.from(escalationQueue.values());
    
    if (status !== 'all') {
      escalations = escalations.filter(escalation => escalation.status === status);
    }
    
    // Sort by escalation time (newest first)
    escalations.sort((a, b) => new Date(b.escalationTime) - new Date(a.escalationTime));
    
    // Translate condition information
    const translatedEscalations = escalations.map(escalation => ({
      id: escalation.id,
      symptoms: escalation.symptoms,
      patientInfo: escalation.patientInfo,
      escalationLevel: escalation.escalationLevel,
      status: escalation.status,
      escalationTime: escalation.escalationTime,
      possibleConditions: escalation.matchedConditions.slice(0, 2).map(match => ({
        name: match.condition.name[language] || match.condition.name.english,
        severity: match.severity,
        matchPercentage: Math.round(match.matchPercentage)
      }))
    }));
    
    res.json({
      success: true,
      escalations: translatedEscalations,
      totalEscalations: escalations.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Get escalations error:', error);
    res.status(500).json({
      error: 'Failed to get escalations',
      success: false
    });
  }
});

// POST /api/symptom-checker/escalation/:reportId/respond - Health worker response to escalation
router.post('/escalation/:reportId/respond', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { healthWorkerName, response, action, followUpRequired } = req.body;
    
    const escalation = escalationQueue.get(reportId);
    
    if (!escalation) {
      return res.status(404).json({
        error: 'Escalation not found',
        success: false
      });
    }
    
    // Update escalation status
    escalation.status = 'responded';
    escalation.healthWorkerResponse = {
      workerName: healthWorkerName,
      response: response,
      action: action,
      followUpRequired: followUpRequired || false,
      responseTime: new Date().toISOString()
    };
    
    escalationQueue.set(reportId, escalation);
    
    // Send response to patient if phone number available
    if (escalation.patientInfo.phone && twilioClient) {
      try {
        const responseMessage = `Health Update: ${response}\n\nFrom: ${healthWorkerName}\nNext steps: ${action}\n\nReport ID: ${reportId}`;
        
        await twilioClient.messages.create({
          body: responseMessage,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: escalation.patientInfo.phone
        });
        
        logger.info(`Response sent to patient for report ${reportId}`);
      } catch (error) {
        logger.error(`Failed to send response to patient:`, error);
      }
    }
    
    logger.info(`Health worker response recorded for report ${reportId}`);
    
    res.json({
      success: true,
      message: 'Response recorded successfully',
      escalation: {
        id: escalation.id,
        status: escalation.status,
        responseTime: escalation.healthWorkerResponse.responseTime
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Health worker response error:', error);
    res.status(500).json({
      error: 'Failed to record health worker response',
      success: false
    });
  }
});

// GET /api/symptom-checker/stats - Get symptom checker statistics
router.get('/stats', async (req, res) => {
  try {
    const totalReports = symptomReports.size;
    const totalEscalations = escalationQueue.size;
    
    let immediateEscalations = 0;
    let within24HourEscalations = 0;
    let routineCases = 0;
    let respondedEscalations = 0;
    
    // Count escalation levels
    for (let report of symptomReports.values()) {
      switch (report.escalationLevel) {
        case 'immediate':
          immediateEscalations++;
          break;
        case 'within_24_hours':
          within24HourEscalations++;
          break;
        case 'routine_care':
          routineCases++;
          break;
      }
    }
    
    // Count responded escalations
    for (let escalation of escalationQueue.values()) {
      if (escalation.status === 'responded') {
        respondedEscalations++;
      }
    }
    
    // Most common symptoms
    const symptomCounts = new Map();
    for (let report of symptomReports.values()) {
      report.symptoms.forEach(symptom => {
        const count = symptomCounts.get(symptom) || 0;
        symptomCounts.set(symptom, count + 1);
      });
    }
    
    const topSymptoms = Array.from(symptomCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([symptom, count]) => ({ symptom, count }));
    
    res.json({
      success: true,
      statistics: {
        totalReports,
        totalEscalations,
        immediateEscalations,
        within24HourEscalations,
        routineCases,
        respondedEscalations,
        responseRate: totalEscalations > 0 ? ((respondedEscalations / totalEscalations) * 100).toFixed(2) : 0,
        topSymptoms
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Get symptom checker statistics error:', error);
    res.status(500).json({
      error: 'Failed to get statistics',
      success: false
    });
  }
});

module.exports = router;