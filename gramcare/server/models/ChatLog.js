const mongoose = require('mongoose');

// Chat Log Schema for storing conversation history
const chatLogSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: false,
    index: true
  },
  userMessage: {
    type: String,
    required: true
  },
  botResponse: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'en',
    index: true
  },
  detectedLanguage: {
    type: String,
    default: null
  },
  confidence: {
    type: Number,
    default: null,
    min: 0,
    max: 1
  },
  intent: {
    type: String,
    default: null,
    index: true
  },
  entities: [{
    type: String,
    value: String,
    confidence: Number
  }],
  context: {
    location: {
      type: String,
      default: null
    },
    userType: {
      type: String,
      enum: ['patient', 'healthcare_worker', 'general'],
      default: 'general'
    },
    previousSymptoms: [String],
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    }
  },
  metadata: {
    platform: {
      type: String,
      enum: ['web', 'whatsapp', 'api'],
      default: 'web'
    },
    userAgent: String,
    ipAddress: String,
    responseTime: {
      type: Number,
      default: 0
    },
    translationUsed: {
      type: Boolean,
      default: false
    },
    quickReplyUsed: {
      type: Boolean,
      default: false
    }
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    helpful: {
      type: Boolean,
      default: null
    },
    comment: {
      type: String,
      default: null
    }
  },
  flags: {
    isEmergency: {
      type: Boolean,
      default: false,
      index: true
    },
    needsFollowUp: {
      type: Boolean,
      default: false,
      index: true
    },
    containsPII: {
      type: Boolean,
      default: false
    },
    isTestData: {
      type: Boolean,
      default: false,
      index: true
    }
  }
}, {
  timestamps: true,
  collection: 'chatlogs'
});

// Indexes for better query performance
chatLogSchema.index({ sessionId: 1, createdAt: -1 });
chatLogSchema.index({ userId: 1, createdAt: -1 });
chatLogSchema.index({ language: 1, createdAt: -1 });
chatLogSchema.index({ 'flags.isEmergency': 1, createdAt: -1 });
chatLogSchema.index({ 'flags.needsFollowUp': 1, createdAt: -1 });
chatLogSchema.index({ 'metadata.platform': 1, createdAt: -1 });

// Virtual for formatted timestamp
chatLogSchema.virtual('formattedTimestamp').get(function() {
  return this.createdAt.toLocaleString();
});

// Method to get conversation summary
chatLogSchema.methods.getSummary = function() {
  return {
    sessionId: this.sessionId,
    messageCount: 1,
    language: this.language,
    platform: this.metadata.platform,
    hasEmergencyFlag: this.flags.isEmergency,
    needsFollowUp: this.flags.needsFollowUp,
    lastMessage: this.createdAt
  };
};

// Static method to get session history
chatLogSchema.statics.getSessionHistory = async function(sessionId, limit = 50) {
  return this.find({ sessionId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('userMessage botResponse language createdAt metadata.responseTime')
    .lean();
};

// Static method to get analytics data
chatLogSchema.statics.getAnalytics = async function(startDate, endDate) {
  const pipeline = [
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        },
        'flags.isTestData': { $ne: true }
      }
    },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        uniqueSessions: { $addToSet: '$sessionId' },
        uniqueUsers: { $addToSet: '$userId' },
        languages: { $addToSet: '$language' },
        platforms: { $push: '$metadata.platform' },
        emergencyCount: {
          $sum: { $cond: ['$flags.isEmergency', 1, 0] }
        },
        followUpCount: {
          $sum: { $cond: ['$flags.needsFollowUp', 1, 0] }
        },
        avgResponseTime: { $avg: '$metadata.responseTime' },
        translationUsage: {
          $sum: { $cond: ['$metadata.translationUsed', 1, 0] }
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalMessages: 1,
        uniqueSessionCount: { $size: '$uniqueSessions' },
        uniqueUserCount: { $size: '$uniqueUsers' },
        languageCount: { $size: '$languages' },
        languages: 1,
        platforms: 1,
        emergencyCount: 1,
        followUpCount: 1,
        avgResponseTime: { $round: ['$avgResponseTime', 2] },
        translationUsage: 1,
        translationRate: {
          $round: [
            { $multiply: [{ $divide: ['$translationUsage', '$totalMessages'] }, 100] },
            2
          ]
        }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalMessages: 0,
    uniqueSessionCount: 0,
    uniqueUserCount: 0,
    languageCount: 0,
    languages: [],
    platforms: [],
    emergencyCount: 0,
    followUpCount: 0,
    avgResponseTime: 0,
    translationUsage: 0,
    translationRate: 0
  };
};

// Pre-save middleware to set metadata
chatLogSchema.pre('save', function(next) {
  if (this.isNew) {
    // Set response time if not already set
    if (!this.metadata.responseTime) {
      this.metadata.responseTime = Date.now() - (this._startTime || Date.now());
    }
    
    // Auto-detect emergency keywords
    const emergencyKeywords = [
      'emergency', 'urgent', 'severe', 'critical', 'dying', 'death',
      'unconscious', 'bleeding', 'chest pain', 'difficulty breathing',
      'stroke', 'heart attack', 'poisoning', 'overdose'
    ];
    
    const messageText = (this.userMessage + ' ' + this.botResponse).toLowerCase();
    this.flags.isEmergency = emergencyKeywords.some(keyword => 
      messageText.includes(keyword)
    );
    
    // Auto-detect follow-up needs
    const followUpKeywords = [
      'follow up', 'check back', 'monitor', 'track', 'appointment',
      'doctor', 'clinic', 'hospital', 'medication', 'treatment'
    ];
    
    this.flags.needsFollowUp = followUpKeywords.some(keyword => 
      messageText.includes(keyword)
    );
  }
  
  next();
});

// Export the model
module.exports = mongoose.model('ChatLog', chatLogSchema);