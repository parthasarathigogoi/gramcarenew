const express = require('express');
const router = express.Router();
const outbreakAlerts = require('../data/outbreakAlerts.json');
const moment = require('moment');
const { translateAlert, isLanguageSupported } = require('../utils/translator');

// Helper function to normalize location names
const normalizeLocation = (location) => {
  const locationMap = {
    'assam': 'Assam',
    'bihar': 'Bihar',
    'up': 'Uttar Pradesh',
    'uttar pradesh': 'Uttar Pradesh',
    'wb': 'West Bengal',
    'west bengal': 'West Bengal',
    'rajasthan': 'Rajasthan',
    'kerala': 'Kerala',
    'punjab': 'Punjab',
    'haryana': 'Haryana',
    'maharashtra': 'Maharashtra',
    'gujarat': 'Gujarat',
    'karnataka': 'Karnataka',
    'tamil nadu': 'Tamil Nadu',
    'andhra pradesh': 'Andhra Pradesh',
    'telangana': 'Telangana',
    'odisha': 'Odisha',
    'jharkhand': 'Jharkhand',
    'chhattisgarh': 'Chhattisgarh',
    'madhya pradesh': 'Madhya Pradesh'
  };
  
  return locationMap[location.toLowerCase()] || location;
};

// Helper function to get severity color
const getSeverityColor = (severity) => {
  const colors = {
    'high': '#ef4444',
    'medium': '#f59e0b',
    'low': '#10b981'
  };
  return colors[severity] || '#6b7280';
};

// GET /api/alerts - Get all active alerts
router.get('/', async (req, res) => {
  try {
    const { language = 'english', severity, limit = 10 } = req.query;
    
    let alerts = outbreakAlerts.alerts;
    
    // Filter by severity if specified
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    
    // Sort by date (most recent first)
    alerts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Limit results
    alerts = alerts.slice(0, parseInt(limit));
    
    // Translate alerts if language is not English
    if (language !== 'english' && isLanguageSupported(language)) {
      alerts = await Promise.all(
        alerts.map(alert => translateAlert(alert, language))
      );
    }
    
    // Format alerts for response
    const formattedAlerts = alerts.map(alert => ({
      id: alert.id,
      location: alert.location,
      disease: alert.disease,
      severity: alert.severity,
      severityColor: getSeverityColor(alert.severity),
      message: alert.message[language] || alert.message.english,
      date: alert.date,
      dateFormatted: moment(alert.date).format('MMMM DD, YYYY'),
      daysAgo: moment().diff(moment(alert.date), 'days'),
      affectedAreas: alert.affectedAreas,
      preventionTips: alert.preventionTips
    }));
    
    res.json({
      success: true,
      alerts: formattedAlerts,
      total: formattedAlerts.length,
      language,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Alerts fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch alerts',
      success: false
    });
  }
});

// GET /api/alerts/:location - Get alerts for specific location
router.get('/:location', async (req, res) => {
  try {
    const { language = 'english' } = req.query;
    const requestedLocation = normalizeLocation(req.params.location);
    
    // Find alerts for the specified location
    let locationAlerts = outbreakAlerts.alerts.filter(alert => 
      alert.location.toLowerCase() === requestedLocation.toLowerCase() ||
      alert.affectedAreas.some(area => 
        area.toLowerCase().includes(requestedLocation.toLowerCase())
      )
    );
    
    if (locationAlerts.length === 0) {
      return res.json({
        success: true,
        alerts: [],
        message: language === 'hindi' 
          ? `${requestedLocation} के लिए कोई सक्रिय अलर्ट नहीं मिला। यह अच्छी खबर है!`
          : `No active alerts found for ${requestedLocation}. That's good news!`,
        location: requestedLocation,
        language,
        timestamp: new Date().toISOString()
      });
    }
    
    // Sort by severity and date
    locationAlerts.sort((a, b) => {
      const severityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return new Date(b.date) - new Date(a.date);
    });
    
    // Translate alerts if language is not English
    if (language !== 'english' && isLanguageSupported(language)) {
      locationAlerts = await Promise.all(
        locationAlerts.map(alert => translateAlert(alert, language))
      );
    }
    
    // Format alerts
    const formattedAlerts = locationAlerts.map(alert => ({
      id: alert.id,
      location: alert.location,
      disease: alert.disease,
      severity: alert.severity,
      severityColor: getSeverityColor(alert.severity),
      message: alert.message[language] || alert.message.english,
      date: alert.date,
      dateFormatted: moment(alert.date).format('MMMM DD, YYYY'),
      daysAgo: moment().diff(moment(alert.date), 'days'),
      affectedAreas: alert.affectedAreas,
      preventionTips: alert.preventionTips
    }));
    
    res.json({
      success: true,
      alerts: formattedAlerts,
      total: formattedAlerts.length,
      location: requestedLocation,
      language,
      summary: language === 'hindi'
        ? `${requestedLocation} में ${formattedAlerts.length} सक्रिय स्वास्थ्य अलर्ट मिले।`
        : `Found ${formattedAlerts.length} active health alert(s) in ${requestedLocation}.`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Location alerts error:', error);
    res.status(500).json({
      error: 'Failed to fetch location alerts',
      success: false
    });
  }
});

// GET /api/alerts/disease/:disease - Get alerts for specific disease
router.get('/disease/:disease', async (req, res) => {
  try {
    const { language = 'english' } = req.query;
    const requestedDisease = req.params.disease;
    
    // Find alerts for the specified disease
    let diseaseAlerts = outbreakAlerts.alerts.filter(alert => 
      alert.disease.toLowerCase().includes(requestedDisease.toLowerCase())
    );
    
    if (diseaseAlerts.length === 0) {
      return res.json({
        success: true,
        alerts: [],
        message: language === 'hindi'
          ? `${requestedDisease} के लिए कोई सक्रिय अलर्ट नहीं मिला।`
          : `No active alerts found for ${requestedDisease}.`,
        disease: requestedDisease,
        language,
        timestamp: new Date().toISOString()
      });
    }
    
    // Sort by severity and date
    diseaseAlerts.sort((a, b) => {
      const severityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return new Date(b.date) - new Date(a.date);
    });
    
    // Translate alerts if language is not English
    if (language !== 'english' && isLanguageSupported(language)) {
      diseaseAlerts = await Promise.all(
        diseaseAlerts.map(alert => translateAlert(alert, language))
      );
    }
    
    // Format alerts
    const formattedAlerts = diseaseAlerts.map(alert => ({
      id: alert.id,
      location: alert.location,
      disease: alert.disease,
      severity: alert.severity,
      severityColor: getSeverityColor(alert.severity),
      message: alert.message[language] || alert.message.english,
      date: alert.date,
      dateFormatted: moment(alert.date).format('MMMM DD, YYYY'),
      daysAgo: moment().diff(moment(alert.date), 'days'),
      affectedAreas: alert.affectedAreas,
      preventionTips: alert.preventionTips
    }));
    
    res.json({
      success: true,
      alerts: formattedAlerts,
      total: formattedAlerts.length,
      disease: requestedDisease,
      language,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Disease alerts error:', error);
    res.status(500).json({
      error: 'Failed to fetch disease alerts',
      success: false
    });
  }
});

// GET /api/alerts/general - Get general seasonal alerts
router.get('/general', (req, res) => {
  try {
    const { language = 'english', season } = req.query;
    
    let generalAlerts = outbreakAlerts.generalAlerts;
    
    // Filter by season if specified
    if (season) {
      generalAlerts = generalAlerts.filter(alert => alert.season === season);
    }
    
    // Sort by priority
    generalAlerts.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    // Format alerts
    const formattedAlerts = generalAlerts.map(alert => ({
      id: alert.id,
      title: alert.title,
      message: alert.message[language] || alert.message.english,
      season: alert.season,
      priority: alert.priority,
      priorityColor: getSeverityColor(alert.priority)
    }));
    
    res.json({
      success: true,
      alerts: formattedAlerts,
      total: formattedAlerts.length,
      language,
      availableSeasons: ['monsoon', 'winter', 'summer'],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('General alerts error:', error);
    res.status(500).json({
      error: 'Failed to fetch general alerts',
      success: false
    });
  }
});

// GET /api/alerts/stats - Get alert statistics
router.get('/stats', (req, res) => {
  try {
    const alerts = outbreakAlerts.alerts;
    
    // Calculate statistics
    const stats = {
      total: alerts.length,
      bySeverity: {
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length
      },
      byDisease: {},
      byLocation: {},
      recent: alerts.filter(a => 
        moment().diff(moment(a.date), 'days') <= 7
      ).length
    };
    
    // Count by disease
    alerts.forEach(alert => {
      stats.byDisease[alert.disease] = (stats.byDisease[alert.disease] || 0) + 1;
    });
    
    // Count by location
    alerts.forEach(alert => {
      stats.byLocation[alert.location] = (stats.byLocation[alert.location] || 0) + 1;
    });
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Alert stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch alert statistics',
      success: false
    });
  }
});

module.exports = router;