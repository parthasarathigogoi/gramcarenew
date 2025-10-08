const express = require('express');
const router = express.Router();
const vaccinationSchedule = require('../data/vaccinationSchedule.json');
const { translateText, getCachedTranslation } = require('../utils/translator');
const logger = require('../utils/logger');

// In-memory storage for user vaccination records (in production, use database)
const vaccinationRecords = new Map();

// Calculate age in weeks/months from birth date
const calculateAge = (birthDate) => {
  const birth = new Date(birthDate);
  const now = new Date();
  const diffTime = Math.abs(now - birth);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30.44); // Average days per month
  const diffYears = Math.floor(diffDays / 365.25); // Average days per year
  
  return {
    days: diffDays,
    weeks: diffWeeks,
    months: diffMonths,
    years: diffYears
  };
};

// Get vaccination schedule based on age
const getVaccinationSchedule = (age) => {
  const schedule = [];
  const vacSchedule = vaccinationSchedule.vaccinationSchedule;
  
  // Birth vaccines
  if (age.days >= 0) {
    schedule.push({
      ageGroup: 'birth',
      vaccines: vacSchedule.birth,
      status: age.days >= 0 ? 'due' : 'upcoming'
    });
  }
  
  // 6 weeks vaccines
  if (age.weeks >= 6) {
    schedule.push({
      ageGroup: '6_weeks',
      vaccines: vacSchedule['6_weeks'],
      status: age.weeks >= 6 ? 'due' : 'upcoming'
    });
  }
  
  // 10 weeks vaccines
  if (age.weeks >= 10) {
    schedule.push({
      ageGroup: '10_weeks',
      vaccines: vacSchedule['10_weeks'],
      status: age.weeks >= 10 ? 'due' : 'upcoming'
    });
  }
  
  // 14 weeks vaccines
  if (age.weeks >= 14) {
    schedule.push({
      ageGroup: '14_weeks',
      vaccines: vacSchedule['14_weeks'],
      status: age.weeks >= 14 ? 'due' : 'upcoming'
    });
  }
  
  // 9 months vaccines
  if (age.months >= 9) {
    schedule.push({
      ageGroup: '9_months',
      vaccines: vacSchedule['9_months'],
      status: age.months >= 9 ? 'due' : 'upcoming'
    });
  }
  
  // 12 months vaccines
  if (age.months >= 12) {
    schedule.push({
      ageGroup: '12_months',
      vaccines: vacSchedule['12_months'],
      status: age.months >= 12 ? 'due' : 'upcoming'
    });
  }
  
  // 16-24 months vaccines
  if (age.months >= 16) {
    schedule.push({
      ageGroup: '16_24_months',
      vaccines: vacSchedule['16_24_months'],
      status: age.months >= 16 ? 'due' : 'upcoming'
    });
  }
  
  // 5 years vaccines
  if (age.years >= 5) {
    schedule.push({
      ageGroup: '5_years',
      vaccines: vacSchedule['5_years'],
      status: age.years >= 5 ? 'due' : 'upcoming'
    });
  }
  
  // 10 years vaccines
  if (age.years >= 10) {
    schedule.push({
      ageGroup: '10_years',
      vaccines: vacSchedule['10_years'],
      status: age.years >= 10 ? 'due' : 'upcoming'
    });
  }
  
  // 16 years vaccines
  if (age.years >= 16) {
    schedule.push({
      ageGroup: '16_years',
      vaccines: vacSchedule['16_years'],
      status: age.years >= 16 ? 'due' : 'upcoming'
    });
  }
  
  return schedule;
};

// Get due and upcoming vaccines
const getDueVaccines = (birthDate, completedVaccines = []) => {
  const age = calculateAge(birthDate);
  const schedule = getVaccinationSchedule(age);
  
  const dueVaccines = [];
  const upcomingVaccines = [];
  const overdueVaccines = [];
  
  schedule.forEach(ageGroup => {
    ageGroup.vaccines.forEach(vaccine => {
      const vaccineKey = `${ageGroup.ageGroup}_${vaccine.vaccine}`;
      
      if (!completedVaccines.includes(vaccineKey)) {
        if (ageGroup.status === 'due') {
          // Check if overdue (more than 4 weeks past due date)
          const isOverdue = checkIfOverdue(ageGroup.ageGroup, age);
          
          if (isOverdue) {
            overdueVaccines.push({
              ...vaccine,
              ageGroup: ageGroup.ageGroup,
              status: 'overdue'
            });
          } else {
            dueVaccines.push({
              ...vaccine,
              ageGroup: ageGroup.ageGroup,
              status: 'due'
            });
          }
        } else {
          upcomingVaccines.push({
            ...vaccine,
            ageGroup: ageGroup.ageGroup,
            status: 'upcoming'
          });
        }
      }
    });
  });
  
  return {
    due: dueVaccines,
    upcoming: upcomingVaccines,
    overdue: overdueVaccines,
    age: age
  };
};

// Check if vaccine is overdue
const checkIfOverdue = (ageGroup, currentAge) => {
  const overdueThresholds = {
    'birth': { weeks: 4 },
    '6_weeks': { weeks: 10 },
    '10_weeks': { weeks: 14 },
    '14_weeks': { weeks: 18 },
    '9_months': { months: 11 },
    '12_months': { months: 15 },
    '16_24_months': { months: 28 },
    '5_years': { years: 6 },
    '10_years': { years: 11 },
    '16_years': { years: 17 }
  };
  
  const threshold = overdueThresholds[ageGroup];
  if (!threshold) return false;
  
  if (threshold.weeks && currentAge.weeks > threshold.weeks) return true;
  if (threshold.months && currentAge.months > threshold.months) return true;
  if (threshold.years && currentAge.years > threshold.years) return true;
  
  return false;
};

// POST /api/vaccination/register - Register a child for vaccination tracking
router.post('/register', async (req, res) => {
  try {
    const { childName, birthDate, parentPhone, language = 'en' } = req.body;
    
    if (!childName || !birthDate || !parentPhone) {
      return res.status(400).json({
        error: 'Child name, birth date, and parent phone are required',
        success: false
      });
    }
    
    const childId = `${parentPhone}_${childName.replace(/\s+/g, '_')}`;
    
    const childRecord = {
      id: childId,
      name: childName,
      birthDate: birthDate,
      parentPhone: parentPhone,
      language: language,
      completedVaccines: [],
      registeredDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    vaccinationRecords.set(childId, childRecord);
    
    // Get initial vaccination schedule
    const vaccineInfo = getDueVaccines(birthDate);
    
    logger.info(`Child registered for vaccination tracking: ${childName}`);
    
    res.json({
      success: true,
      message: 'Child registered successfully for vaccination tracking',
      childId: childId,
      vaccineSchedule: vaccineInfo,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Vaccination registration error:', error);
    res.status(500).json({
      error: 'Failed to register child for vaccination tracking',
      success: false
    });
  }
});

// GET /api/vaccination/schedule/:childId - Get vaccination schedule for a child
router.get('/schedule/:childId', async (req, res) => {
  try {
    const { childId } = req.params;
    const { language = 'en' } = req.query;
    
    const childRecord = vaccinationRecords.get(childId);
    
    if (!childRecord) {
      return res.status(404).json({
        error: 'Child record not found',
        success: false
      });
    }
    
    const vaccineInfo = getDueVaccines(childRecord.birthDate, childRecord.completedVaccines);
    
    // Translate vaccine descriptions if needed
    if (language !== 'en') {
      for (let category of ['due', 'upcoming', 'overdue']) {
        for (let vaccine of vaccineInfo[category]) {
          if (vaccine.description && vaccine.description[language]) {
            vaccine.translatedDescription = vaccine.description[language];
          }
        }
      }
    }
    
    res.json({
      success: true,
      child: {
        name: childRecord.name,
        age: vaccineInfo.age,
        birthDate: childRecord.birthDate
      },
      vaccines: vaccineInfo,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Get vaccination schedule error:', error);
    res.status(500).json({
      error: 'Failed to get vaccination schedule',
      success: false
    });
  }
});

// POST /api/vaccination/complete - Mark vaccine as completed
router.post('/complete', async (req, res) => {
  try {
    const { childId, vaccine, ageGroup, dateGiven, location } = req.body;
    
    if (!childId || !vaccine || !ageGroup) {
      return res.status(400).json({
        error: 'Child ID, vaccine, and age group are required',
        success: false
      });
    }
    
    const childRecord = vaccinationRecords.get(childId);
    
    if (!childRecord) {
      return res.status(404).json({
        error: 'Child record not found',
        success: false
      });
    }
    
    const vaccineKey = `${ageGroup}_${vaccine}`;
    
    if (!childRecord.completedVaccines.includes(vaccineKey)) {
      childRecord.completedVaccines.push(vaccineKey);
      childRecord.lastUpdated = new Date().toISOString();
      
      // Add detailed record
      if (!childRecord.vaccinationHistory) {
        childRecord.vaccinationHistory = [];
      }
      
      childRecord.vaccinationHistory.push({
        vaccine: vaccine,
        ageGroup: ageGroup,
        dateGiven: dateGiven || new Date().toISOString(),
        location: location || 'Not specified',
        recordedDate: new Date().toISOString()
      });
      
      vaccinationRecords.set(childId, childRecord);
      
      logger.info(`Vaccine completed: ${vaccine} for child ${childRecord.name}`);
    }
    
    // Get updated schedule
    const vaccineInfo = getDueVaccines(childRecord.birthDate, childRecord.completedVaccines);
    
    res.json({
      success: true,
      message: `${vaccine} marked as completed`,
      updatedSchedule: vaccineInfo,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Complete vaccination error:', error);
    res.status(500).json({
      error: 'Failed to mark vaccine as completed',
      success: false
    });
  }
});

// GET /api/vaccination/reminders - Get vaccination reminders for all children
router.get('/reminders', async (req, res) => {
  try {
    const { language = 'en' } = req.query;
    const reminders = [];
    
    for (let [childId, childRecord] of vaccinationRecords) {
      const vaccineInfo = getDueVaccines(childRecord.birthDate, childRecord.completedVaccines);
      
      // Add due vaccines as reminders
      vaccineInfo.due.forEach(vaccine => {
        reminders.push({
          childId: childId,
          childName: childRecord.name,
          parentPhone: childRecord.parentPhone,
          vaccine: vaccine.vaccine,
          ageGroup: vaccine.ageGroup,
          type: 'due',
          priority: 'high',
          description: vaccine.description[language] || vaccine.description.english
        });
      });
      
      // Add overdue vaccines as urgent reminders
      vaccineInfo.overdue.forEach(vaccine => {
        reminders.push({
          childId: childId,
          childName: childRecord.name,
          parentPhone: childRecord.parentPhone,
          vaccine: vaccine.vaccine,
          ageGroup: vaccine.ageGroup,
          type: 'overdue',
          priority: 'urgent',
          description: vaccine.description[language] || vaccine.description.english
        });
      });
    }
    
    res.json({
      success: true,
      reminders: reminders,
      totalReminders: reminders.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Get vaccination reminders error:', error);
    res.status(500).json({
      error: 'Failed to get vaccination reminders',
      success: false
    });
  }
});

// GET /api/vaccination/child/:phone - Get all children for a parent phone number
router.get('/child/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const { language = 'en' } = req.query;
    
    const children = [];
    
    for (let [childId, childRecord] of vaccinationRecords) {
      if (childRecord.parentPhone === phone) {
        const vaccineInfo = getDueVaccines(childRecord.birthDate, childRecord.completedVaccines);
        
        children.push({
          childId: childId,
          name: childRecord.name,
          birthDate: childRecord.birthDate,
          age: vaccineInfo.age,
          dueVaccines: vaccineInfo.due.length,
          overdueVaccines: vaccineInfo.overdue.length,
          upcomingVaccines: vaccineInfo.upcoming.length,
          completedVaccines: childRecord.completedVaccines.length
        });
      }
    }
    
    res.json({
      success: true,
      children: children,
      totalChildren: children.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Get children for parent error:', error);
    res.status(500).json({
      error: 'Failed to get children information',
      success: false
    });
  }
});

// GET /api/vaccination/stats - Get vaccination statistics
router.get('/stats', async (req, res) => {
  try {
    let totalChildren = 0;
    let totalDueVaccines = 0;
    let totalOverdueVaccines = 0;
    let totalCompletedVaccines = 0;
    
    const ageGroups = {
      'infants': 0, // 0-12 months
      'toddlers': 0, // 1-3 years
      'preschool': 0, // 3-5 years
      'school': 0, // 5+ years
    };
    
    for (let [childId, childRecord] of vaccinationRecords) {
      totalChildren++;
      totalCompletedVaccines += childRecord.completedVaccines.length;
      
      const vaccineInfo = getDueVaccines(childRecord.birthDate, childRecord.completedVaccines);
      totalDueVaccines += vaccineInfo.due.length;
      totalOverdueVaccines += vaccineInfo.overdue.length;
      
      // Categorize by age
      if (vaccineInfo.age.months < 12) {
        ageGroups.infants++;
      } else if (vaccineInfo.age.years < 3) {
        ageGroups.toddlers++;
      } else if (vaccineInfo.age.years < 5) {
        ageGroups.preschool++;
      } else {
        ageGroups.school++;
      }
    }
    
    res.json({
      success: true,
      statistics: {
        totalChildren,
        totalDueVaccines,
        totalOverdueVaccines,
        totalCompletedVaccines,
        ageGroups,
        vaccinationRate: totalChildren > 0 ? ((totalCompletedVaccines / (totalCompletedVaccines + totalDueVaccines + totalOverdueVaccines)) * 100).toFixed(2) : 0
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Get vaccination statistics error:', error);
    res.status(500).json({
      error: 'Failed to get vaccination statistics',
      success: false
    });
  }
});

module.exports = router;