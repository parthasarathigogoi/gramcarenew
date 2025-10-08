const express = require('express');
const router = express.Router();
const outbreakAlerts = require('../data/outbreakAlerts.json');
const { translateText, getCachedTranslation } = require('../utils/translator');
const logger = require('../utils/logger');
const twilio = require('twilio');

// Initialize Twilio client for alerts
let twilioClient;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
} catch (error) {
  console.warn('Twilio not configured, outbreak alert features will be limited');
}

// In-memory storage for outbreak detection (in production, use database)
const symptomClusters = new Map();
const outbreakReports = new Map();
const subscribedUsers = new Map(); // Users subscribed to outbreak alerts

// Outbreak detection thresholds
const OUTBREAK_THRESHOLDS = {
  fever: { cases: 5, timeWindow: 7 * 24 * 60 * 60 * 1000 }, // 5 cases in 7 days
  diarrhea: { cases: 3, timeWindow: 3 * 24 * 60 * 60 * 1000 }, // 3 cases in 3 days
  respiratory: { cases: 4, timeWindow: 5 * 24 * 60 * 60 * 1000 }, // 4 cases in 5 days
  rash: { cases: 3, timeWindow: 7 * 24 * 60 * 60 * 1000 }, // 3 cases in 7 days
  default: { cases: 3, timeWindow: 5 * 24 * 60 * 60 * 1000 } // Default threshold
};

// Disease patterns for outbreak detection
const DISEASE_PATTERNS = {
  dengue: {
    symptoms: ['fever', 'headache', 'rash', 'fatigue'],
    season: 'monsoon',
    vector: 'mosquito',
    threshold: { cases: 3, timeWindow: 7 * 24 * 60 * 60 * 1000 }
  },
  malaria: {
    symptoms: ['fever', 'headache', 'fatigue', 'vomiting'],
    season: 'monsoon',
    vector: 'mosquito',
    threshold: { cases: 3, timeWindow: 7 * 24 * 60 * 60 * 1000 }
  },
  diarrheal_outbreak: {
    symptoms: ['diarrhea', 'vomiting', 'abdominal_pain'],
    cause: 'waterborne',
    threshold: { cases: 3, timeWindow: 3 * 24 * 60 * 60 * 1000 }
  },
  respiratory_outbreak: {
    symptoms: ['cough', 'fever', 'difficulty_breathing'],
    transmission: 'airborne',
    threshold: { cases: 4, timeWindow: 5 * 24 * 60 * 60 * 1000 }
  }
};

// Analyze symptom patterns for outbreak detection
const analyzeSymptomPatterns = (location, timeWindow = 7 * 24 * 60 * 60 * 1000) => {
  const now = new Date();
  const cutoffTime = new Date(now.getTime() - timeWindow);
  
  const locationClusters = symptomClusters.get(location) || [];
  const recentCases = locationClusters.filter(cluster => 
    new Date(cluster.timestamp) > cutoffTime
  );
  
  // Group by symptom combinations
  const symptomGroups = new Map();
  
  recentCases.forEach(caseData => {
    const symptomKey = caseData.symptoms.sort().join(',');
    if (!symptomGroups.has(symptomKey)) {
      symptomGroups.set(symptomKey, []);
    }
    symptomGroups.get(symptomKey).push(caseData);
  });
  
  // Check for potential outbreaks
  const potentialOutbreaks = [];
  
  symptomGroups.forEach((cases, symptomKey) => {
    const symptoms = symptomKey.split(',');
    
    // Check against disease patterns
    Object.entries(DISEASE_PATTERNS).forEach(([diseaseId, pattern]) => {
      const matchScore = calculateSymptomMatch(symptoms, pattern.symptoms);
      
      if (matchScore > 0.6 && cases.length >= pattern.threshold.cases) {
        potentialOutbreaks.push({
          diseaseId,
          disease: diseaseId.replace('_', ' ').toUpperCase(),
          symptoms: symptoms,
          caseCount: cases.length,
          matchScore: matchScore,
          cases: cases,
          severity: cases.length >= pattern.threshold.cases * 2 ? 'high' : 'medium',
          pattern: pattern
        });
      }
    });
    
    // Check general symptom clustering
    const primarySymptom = symptoms[0];
    const threshold = OUTBREAK_THRESHOLDS[primarySymptom] || OUTBREAK_THRESHOLDS.default;
    
    if (cases.length >= threshold.cases) {
      potentialOutbreaks.push({
        diseaseId: `${primarySymptom}_cluster`,
        disease: `${primarySymptom.toUpperCase()} CLUSTER`,
        symptoms: symptoms,
        caseCount: cases.length,
        matchScore: 1.0,
        cases: cases,
        severity: cases.length >= threshold.cases * 2 ? 'high' : 'medium',
        pattern: { threshold }
      });
    }
  });
  
  return potentialOutbreaks;
};

// Calculate symptom match score
const calculateSymptomMatch = (reportedSymptoms, patternSymptoms) => {
  const matches = reportedSymptoms.filter(symptom => 
    patternSymptoms.includes(symptom)
  ).length;
  
  return matches / patternSymptoms.length;
};

// Generate outbreak alert message
const generateOutbreakAlert = (outbreak, location, language = 'en') => {
  const alertMessages = {
    dengue: {
      english: `🚨 DENGUE OUTBREAK ALERT: ${outbreak.caseCount} cases detected in ${location}. Use mosquito nets, remove stagnant water, seek medical help for fever.`,
      hindi: `🚨 डेंगू प्रकोप अलर्ट: ${location} में ${outbreak.caseCount} मामले मिले। मच्छरदानी का उपयोग करें, रुका पानी हटाएं, बुखार के लिए चिकित्सा सहायता लें।`,
      bengali: `🚨 ডেঙ্গু প্রাদুর্ভাব সতর্কতা: ${location} এ ${outbreak.caseCount}টি কেস পাওয়া গেছে। মশারি ব্যবহার করুন, জমা পানি সরান, জ্বরের জন্য চিকিৎসা নিন।`,
      assamese: `🚨 ডেংগু প্ৰাদুৰ্ভাৱ সতৰ্কবাণী: ${location} ত ${outbreak.caseCount}টা কেছ পোৱা গৈছে। মহজাল ব্যৱহাৰ কৰক, জমা পানী আঁতৰাওক, জ্বৰৰ বাবে চিকিৎসা লওক।`,
      telugu: `🚨 డెంగ్యూ వ్యాప్తి హెచ్చరిక: ${location}లో ${outbreak.caseCount} కేసులు కనుగొనబడ్డాయి. దోమతెరలు వాడండి, నిలిచిన నీరు తొలగించండి, జ్వరానికి వైద్య సహాయం తీసుకోండి.`
    },
    malaria: {
      english: `🦟 MALARIA OUTBREAK ALERT: ${outbreak.caseCount} cases in ${location}. Sleep under treated nets, clear water logging, get tested for fever.`,
      hindi: `🦟 मलेरिया प्रकोप अलर्ट: ${location} में ${outbreak.caseCount} मामले। उपचारित जाल के नीचे सोएं, पानी का जमाव साफ करें, बुखार की जांच कराएं।`,
      bengali: `🦟 ম্যালেরিয়া প্রাদুর্ভাব সতর্কতা: ${location} এ ${outbreak.caseCount}টি কেস। চিকিৎসিত জালের নিচে ঘুমান, পানি জমা পরিষ্কার করুন, জ্বরের পরীক্ষা করান।`,
      assamese: `🦟 মেলেৰিয়া প্ৰাদুৰ্ভাৱ সতৰ্কবাণী: ${location} ত ${outbreak.caseCount}টা কেছ। চিকিৎসিত জালৰ তলত শুওক, পানী জমা পৰিষ্কাৰ কৰক, জ্বৰৰ পৰীক্ষা কৰাওক।`,
      telugu: `🦟 మలేరియా వ్యాప్తి హెచ్చరిక: ${location}లో ${outbreak.caseCount} కేసులు. చికిత్సిత వలల కింద నిద్రించండి, నీరు జమ చేయకండి, జ్వరానికి పరీక్షలు చేయించుకోండి.`
    },
    diarrheal_outbreak: {
      english: `💧 DIARRHEA OUTBREAK ALERT: ${outbreak.caseCount} cases in ${location}. Boil water before drinking, maintain hygiene, use ORS for dehydration.`,
      hindi: `💧 दस्त प्रकोप अलर्ट: ${location} में ${outbreak.caseCount} मामले। पीने से पहले पानी उबालें, स्वच्छता बनाए रखें, निर्जलीकरण के लिए ORS का उपयोग करें।`,
      bengali: `💧 ডায়রিয়া প্রাদুর্ভাব সতর্কতা: ${location} এ ${outbreak.caseCount}টি কেস। পানি ফুটিয়ে পান করুন, স্বাস্থ্যবিধি মেনে চলুন, পানিশূন্যতার জন্য ORS ব্যবহার করুন।`,
      assamese: `💧 ডায়েৰিয়া প্ৰাদুৰ্ভাৱ সতৰ্কবাণী: ${location} ত ${outbreak.caseCount}টা কেছ। পানী উতলাই খাওক, স্বাস্থ্যবিধি মানি চলক, পানীশূন্যতাৰ বাবে ORS ব্যৱহাৰ কৰক।`,
      telugu: `💧 అతిసార వ్యాప్తি హెచ్చరిక: ${location}లో ${outbreak.caseCount} కేసులు. నీరు మరిగించి తాగండి, పరిశుభ్రత పాటించండి, నిర్జలీకరణకు ORS వాడండి.`
    },
    default: {
      english: `⚠️ HEALTH ALERT: Unusual increase in ${outbreak.disease} cases (${outbreak.caseCount}) detected in ${location}. Please take precautions and seek medical advice.`,
      hindi: `⚠️ स्वास्थ्य अलर्ट: ${location} में ${outbreak.disease} के मामलों (${outbreak.caseCount}) में असामान्य वृद्धि। कृपया सावधानी बरतें और चिकित्सा सलाह लें।`,
      bengali: `⚠️ স্বাস্থ্য সতর্কতা: ${location} এ ${outbreak.disease} কেসের (${outbreak.caseCount}) অস্বাভাবিক বৃদ্ধি। অনুগ্রহ করে সতর্কতা অবলম্বন করুন এবং চিকিৎসা পরামর্শ নিন।`,
      assamese: `⚠️ স্বাস্থ্য সতৰ্কবাণী: ${location} ত ${outbreak.disease} কেছৰ (${outbreak.caseCount}) অস্বাভাৱিক বৃদ্ধি। অনুগ্ৰহ কৰি সতৰ্কতা অৱলম্বন কৰক আৰু চিকিৎসা পৰামৰ্শ লওক।`,
      telugu: `⚠️ ఆరోగ్య హెచ్చరిక: ${location}లో ${outbreak.disease} కేసుల (${outbreak.caseCount}) అసాధారణ పెరుగుదల. దయచేసి జాగ్రత్తలు తీసుకోండి మరియు వైద్య సలహా తీసుకోండి.`
    }
  };
  
  const diseaseKey = outbreak.diseaseId.includes('dengue') ? 'dengue' :
                   outbreak.diseaseId.includes('malaria') ? 'malaria' :
                   outbreak.diseaseId.includes('diarrheal') ? 'diarrheal_outbreak' : 'default';
  
  return alertMessages[diseaseKey][language] || alertMessages[diseaseKey].english;
};

// Send outbreak alerts to subscribed users
const sendOutbreakAlerts = async (outbreak, location, language = 'en') => {
  try {
    if (!twilioClient) {
      logger.warn('Twilio not configured, cannot send outbreak alerts');
      return false;
    }
    
    const alertMessage = generateOutbreakAlert(outbreak, location, language);
    const locationSubscribers = Array.from(subscribedUsers.values())
      .filter(user => user.location === location || user.location === 'all');
    
    let sentCount = 0;
    
    for (const subscriber of locationSubscribers.slice(0, 100)) { // Limit to prevent spam
      try {
        await twilioClient.messages.create({
          body: alertMessage,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: subscriber.phone
        });
        
        sentCount++;
      } catch (error) {
        logger.error(`Failed to send outbreak alert to ${subscriber.phone}:`, error);
      }
    }
    
    logger.info(`Outbreak alert sent to ${sentCount} subscribers for ${location}`);
    return sentCount > 0;
    
  } catch (error) {
    logger.error('Send outbreak alerts error:', error);
    return false;
  }
};

// POST /api/outbreak-detection/report - Report symptoms for outbreak detection
router.post('/report', async (req, res) => {
  try {
    const { symptoms, location, patientInfo, language = 'en' } = req.body;
    
    if (!symptoms || !Array.isArray(symptoms) || !location) {
      return res.status(400).json({
        error: 'Symptoms array and location are required',
        success: false
      });
    }
    
    // Create symptom report for clustering
    const reportId = `OUT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const report = {
      id: reportId,
      symptoms: symptoms.map(s => s.toLowerCase()),
      location: location,
      patientInfo: patientInfo || {},
      timestamp: new Date().toISOString(),
      language: language
    };
    
    // Add to location cluster
    if (!symptomClusters.has(location)) {
      symptomClusters.set(location, []);
    }
    symptomClusters.get(location).push(report);
    
    // Analyze for potential outbreaks
    const potentialOutbreaks = analyzeSymptomPatterns(location);
    
    // Check if any outbreak threshold is crossed
    const newOutbreaks = [];
    for (const outbreak of potentialOutbreaks) {
      const outbreakKey = `${location}_${outbreak.diseaseId}`;
      
      if (!outbreakReports.has(outbreakKey)) {
        // New outbreak detected
        const outbreakReport = {
          id: `OUTBREAK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          location: location,
          disease: outbreak.disease,
          diseaseId: outbreak.diseaseId,
          caseCount: outbreak.caseCount,
          severity: outbreak.severity,
          symptoms: outbreak.symptoms,
          detectedAt: new Date().toISOString(),
          status: 'active',
          alertsSent: 0
        };
        
        outbreakReports.set(outbreakKey, outbreakReport);
        newOutbreaks.push(outbreakReport);
        
        // Send alerts
        const alertsSent = await sendOutbreakAlerts(outbreak, location, language);
        outbreakReport.alertsSent = alertsSent ? 1 : 0;
        
        logger.info(`New outbreak detected: ${outbreak.disease} in ${location}`);
      }
    }
    
    res.json({
      success: true,
      reportId: reportId,
      location: location,
      potentialOutbreaks: potentialOutbreaks.length,
      newOutbreaksDetected: newOutbreaks.length,
      outbreaks: newOutbreaks.map(outbreak => ({
        id: outbreak.id,
        disease: outbreak.disease,
        caseCount: outbreak.caseCount,
        severity: outbreak.severity
      })),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Outbreak detection report error:', error);
    res.status(500).json({
      error: 'Failed to process outbreak detection report',
      success: false
    });
  }
});

// GET /api/outbreak-detection/outbreaks - Get active outbreaks
router.get('/outbreaks', async (req, res) => {
  try {
    const { location, severity, language = 'en' } = req.query;
    
    let outbreaks = Array.from(outbreakReports.values())
      .filter(outbreak => outbreak.status === 'active');
    
    if (location) {
      outbreaks = outbreaks.filter(outbreak => 
        outbreak.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    if (severity) {
      outbreaks = outbreaks.filter(outbreak => outbreak.severity === severity);
    }
    
    // Sort by detection time (newest first)
    outbreaks.sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt));
    
    // Add alert messages
    const outbreaksWithAlerts = outbreaks.map(outbreak => ({
      ...outbreak,
      alertMessage: generateOutbreakAlert(outbreak, outbreak.location, language)
    }));
    
    res.json({
      success: true,
      outbreaks: outbreaksWithAlerts,
      totalOutbreaks: outbreaks.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Get outbreaks error:', error);
    res.status(500).json({
      error: 'Failed to get outbreak information',
      success: false
    });
  }
});

// POST /api/outbreak-detection/subscribe - Subscribe to outbreak alerts
router.post('/subscribe', async (req, res) => {
  try {
    const { phone, location, language = 'en', name } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        error: 'Phone number is required',
        success: false
      });
    }
    
    const subscriber = {
      phone: phone,
      location: location || 'all',
      language: language,
      name: name || 'Unknown',
      subscribedAt: new Date().toISOString(),
      active: true
    };
    
    subscribedUsers.set(phone, subscriber);
    
    logger.info(`User subscribed to outbreak alerts: ${phone} for ${location}`);
    
    res.json({
      success: true,
      message: 'Successfully subscribed to outbreak alerts',
      subscription: {
        phone: phone,
        location: location || 'all',
        language: language
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Subscribe to outbreak alerts error:', error);
    res.status(500).json({
      error: 'Failed to subscribe to outbreak alerts',
      success: false
    });
  }
});

// POST /api/outbreak-detection/unsubscribe - Unsubscribe from outbreak alerts
router.post('/unsubscribe', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        error: 'Phone number is required',
        success: false
      });
    }
    
    const wasSubscribed = subscribedUsers.has(phone);
    subscribedUsers.delete(phone);
    
    logger.info(`User unsubscribed from outbreak alerts: ${phone}`);
    
    res.json({
      success: true,
      message: wasSubscribed ? 'Successfully unsubscribed from outbreak alerts' : 'Phone number was not subscribed',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Unsubscribe from outbreak alerts error:', error);
    res.status(500).json({
      error: 'Failed to unsubscribe from outbreak alerts',
      success: false
    });
  }
});

// GET /api/outbreak-detection/stats - Get outbreak detection statistics
router.get('/stats', async (req, res) => {
  try {
    const totalReports = Array.from(symptomClusters.values())
      .reduce((sum, cluster) => sum + cluster.length, 0);
    
    const activeOutbreaks = Array.from(outbreakReports.values())
      .filter(outbreak => outbreak.status === 'active').length;
    
    const totalSubscribers = subscribedUsers.size;
    
    // Outbreak severity distribution
    const severityCount = { high: 0, medium: 0, low: 0 };
    Array.from(outbreakReports.values())
      .filter(outbreak => outbreak.status === 'active')
      .forEach(outbreak => {
        severityCount[outbreak.severity] = (severityCount[outbreak.severity] || 0) + 1;
      });
    
    // Most affected locations
    const locationCounts = new Map();
    Array.from(outbreakReports.values())
      .filter(outbreak => outbreak.status === 'active')
      .forEach(outbreak => {
        const count = locationCounts.get(outbreak.location) || 0;
        locationCounts.set(outbreak.location, count + 1);
      });
    
    const topLocations = Array.from(locationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([location, count]) => ({ location, outbreaks: count }));
    
    res.json({
      success: true,
      statistics: {
        totalReports,
        activeOutbreaks,
        totalSubscribers,
        severityDistribution: severityCount,
        topAffectedLocations: topLocations,
        detectionRate: totalReports > 0 ? ((activeOutbreaks / totalReports) * 100).toFixed(2) : 0
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Get outbreak detection statistics error:', error);
    res.status(500).json({
      error: 'Failed to get outbreak detection statistics',
      success: false
    });
  }
});

module.exports = router;