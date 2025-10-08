const express = require('express');
const router = express.Router();
const moment = require('moment');

// Mock analytics data for demo purposes
// In production, this would come from a database
let mockAnalytics = {
  totalQueries: 1247,
  todayQueries: 89,
  activeUsers: 156,
  topQueries: [
    { query: 'dengue symptoms', count: 234, percentage: 18.8 },
    { query: 'vaccination schedule', count: 187, percentage: 15.0 },
    { query: 'malaria prevention', count: 156, percentage: 12.5 },
    { query: 'diarrhea treatment', count: 134, percentage: 10.7 },
    { query: 'TB symptoms', count: 98, percentage: 7.9 }
  ],
  languageDistribution: {
    english: 756,
    hindi: 491
  },
  queryCategories: {
    disease: 445,
    prevention: 312,
    vaccination: 267,
    treatment: 223
  },
  hourlyData: [
    { hour: '00:00', queries: 12 },
    { hour: '01:00', queries: 8 },
    { hour: '02:00', queries: 5 },
    { hour: '03:00', queries: 3 },
    { hour: '04:00', queries: 7 },
    { hour: '05:00', queries: 15 },
    { hour: '06:00', queries: 28 },
    { hour: '07:00', queries: 45 },
    { hour: '08:00', queries: 67 },
    { hour: '09:00', queries: 89 },
    { hour: '10:00', queries: 102 },
    { hour: '11:00', queries: 95 },
    { hour: '12:00', queries: 87 },
    { hour: '13:00', queries: 76 },
    { hour: '14:00', queries: 82 },
    { hour: '15:00', queries: 91 },
    { hour: '16:00', queries: 88 },
    { hour: '17:00', queries: 94 },
    { hour: '18:00', queries: 78 },
    { hour: '19:00', queries: 65 },
    { hour: '20:00', queries: 52 },
    { hour: '21:00', queries: 38 },
    { hour: '22:00', queries: 25 },
    { hour: '23:00', queries: 18 }
  ],
  weeklyData: [
    { day: 'Monday', queries: 198, users: 45 },
    { day: 'Tuesday', queries: 234, users: 52 },
    { day: 'Wednesday', queries: 187, users: 41 },
    { day: 'Thursday', queries: 156, users: 38 },
    { day: 'Friday', queries: 203, users: 47 },
    { day: 'Saturday', queries: 145, users: 33 },
    { day: 'Sunday', queries: 124, users: 28 }
  ],
  responseTypes: {
    faq: 892,
    greeting: 156,
    fallback: 134,
    alert_prompt: 65
  },
  userSatisfaction: {
    helpful: 78.5,
    neutral: 15.2,
    notHelpful: 6.3
  }
};

// Function to simulate real-time data updates
const updateMockData = () => {
  // Simulate new queries
  const newQueries = Math.floor(Math.random() * 5) + 1;
  mockAnalytics.totalQueries += newQueries;
  mockAnalytics.todayQueries += newQueries;
  
  // Update hourly data for current hour
  const currentHour = moment().format('HH:00');
  const hourlyIndex = mockAnalytics.hourlyData.findIndex(h => h.hour === currentHour);
  if (hourlyIndex !== -1) {
    mockAnalytics.hourlyData[hourlyIndex].queries += newQueries;
  }
};

// GET /api/analytics - Get overall analytics dashboard
router.get('/', (req, res) => {
  try {
    updateMockData();
    
    const { timeframe = '24h' } = req.query;
    
    // Calculate growth rates
    const yesterdayQueries = 76;
    const growthRate = ((mockAnalytics.todayQueries - yesterdayQueries) / yesterdayQueries * 100).toFixed(1);
    
    const analytics = {
      overview: {
        totalQueries: mockAnalytics.totalQueries,
        todayQueries: mockAnalytics.todayQueries,
        activeUsers: mockAnalytics.activeUsers,
        growthRate: parseFloat(growthRate),
        avgResponseTime: '1.2s',
        successRate: 94.2
      },
      topQueries: mockAnalytics.topQueries,
      languageDistribution: mockAnalytics.languageDistribution,
      queryCategories: mockAnalytics.queryCategories,
      responseTypes: mockAnalytics.responseTypes,
      userSatisfaction: mockAnalytics.userSatisfaction,
      timeframe,
      lastUpdated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      analytics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics',
      success: false
    });
  }
});

// GET /api/analytics/queries - Get query analytics
router.get('/queries', (req, res) => {
  try {
    const { period = 'today', category } = req.query;
    
    let data = mockAnalytics.topQueries;
    
    // Filter by category if specified
    if (category) {
      // In a real app, this would filter based on FAQ categories
      data = data.filter(query => 
        query.query.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    res.json({
      success: true,
      queries: data,
      total: data.reduce((sum, q) => sum + q.count, 0),
      period,
      category: category || 'all',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Query analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch query analytics',
      success: false
    });
  }
});

// GET /api/analytics/usage - Get usage patterns
router.get('/usage', (req, res) => {
  try {
    const { type = 'hourly' } = req.query;
    
    let data;
    if (type === 'hourly') {
      data = mockAnalytics.hourlyData;
    } else if (type === 'weekly') {
      data = mockAnalytics.weeklyData;
    } else {
      data = mockAnalytics.hourlyData;
    }
    
    // Calculate peak usage
    const peakUsage = data.reduce((max, current) => 
      current.queries > max.queries ? current : max
    );
    
    res.json({
      success: true,
      usage: data,
      type,
      peakUsage,
      totalQueries: data.reduce((sum, item) => sum + item.queries, 0),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Usage analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch usage analytics',
      success: false
    });
  }
});

// GET /api/analytics/languages - Get language distribution
router.get('/languages', (req, res) => {
  try {
    const total = mockAnalytics.languageDistribution.english + mockAnalytics.languageDistribution.hindi;
    
    const languageStats = {
      english: {
        count: mockAnalytics.languageDistribution.english,
        percentage: ((mockAnalytics.languageDistribution.english / total) * 100).toFixed(1)
      },
      hindi: {
        count: mockAnalytics.languageDistribution.hindi,
        percentage: ((mockAnalytics.languageDistribution.hindi / total) * 100).toFixed(1)
      }
    };
    
    res.json({
      success: true,
      languages: languageStats,
      total,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Language analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch language analytics',
      success: false
    });
  }
});

// GET /api/analytics/categories - Get category distribution
router.get('/categories', (req, res) => {
  try {
    const total = Object.values(mockAnalytics.queryCategories).reduce((sum, count) => sum + count, 0);
    
    const categoryStats = Object.entries(mockAnalytics.queryCategories).map(([category, count]) => ({
      category,
      count,
      percentage: ((count / total) * 100).toFixed(1)
    }));
    
    // Sort by count descending
    categoryStats.sort((a, b) => b.count - a.count);
    
    res.json({
      success: true,
      categories: categoryStats,
      total,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Category analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch category analytics',
      success: false
    });
  }
});

// POST /api/analytics/log - Log a new query (for real-time updates)
router.post('/log', (req, res) => {
  try {
    const { query, language, category, responseType, userId } = req.body;
    
    if (!query) {
      return res.status(400).json({
        error: 'Query is required',
        success: false
      });
    }
    
    // Update mock analytics
    mockAnalytics.totalQueries += 1;
    mockAnalytics.todayQueries += 1;
    
    // Update language distribution
    if (language === 'hindi') {
      mockAnalytics.languageDistribution.hindi += 1;
    } else {
      mockAnalytics.languageDistribution.english += 1;
    }
    
    // Update category if provided
    if (category && mockAnalytics.queryCategories[category] !== undefined) {
      mockAnalytics.queryCategories[category] += 1;
    }
    
    // Update response type if provided
    if (responseType && mockAnalytics.responseTypes[responseType] !== undefined) {
      mockAnalytics.responseTypes[responseType] += 1;
    }
    
    // In a real app, save to database
    console.log('Query logged:', { query, language, category, responseType, userId, timestamp: new Date() });
    
    res.json({
      success: true,
      message: 'Query logged successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Query logging error:', error);
    res.status(500).json({
      error: 'Failed to log query',
      success: false
    });
  }
});

// GET /api/analytics/realtime - Get real-time statistics
router.get('/realtime', (req, res) => {
  try {
    updateMockData();
    
    const realtimeStats = {
      currentUsers: Math.floor(Math.random() * 20) + 5,
      queriesLastHour: mockAnalytics.hourlyData[new Date().getHours()]?.queries || 0,
      avgResponseTime: (Math.random() * 2 + 0.5).toFixed(1) + 's',
      systemStatus: 'healthy',
      lastQuery: {
        query: 'What are dengue symptoms?',
        language: 'english',
        timestamp: moment().subtract(Math.floor(Math.random() * 300), 'seconds').toISOString()
      }
    };
    
    res.json({
      success: true,
      realtime: realtimeStats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Realtime analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch realtime analytics',
      success: false
    });
  }
});

module.exports = router;