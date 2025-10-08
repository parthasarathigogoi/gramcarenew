# 🤖 GramCare AI Integration

This document explains how to set up and use the AI-powered chatbot features in GramCare.

## 🚀 Features

- **Dual AI Support**: Integration with both OpenAI GPT and Google Gemini
- **Smart Fallback**: Automatically falls back to FAQ system if AI is unavailable
- **Health-Focused**: Specialized prompts for accurate health information
- **Multi-Language**: Supports responses in multiple Indian languages
- **Cost-Effective**: Prioritizes free Gemini API, falls back to OpenAI when needed

## 🔧 Setup Instructions

### 1. Install Dependencies

The required packages are already installed:
```bash
npm install openai @google/generative-ai
```

### 2. Configure API Keys

Add your API keys to the `.env` file:

```env
# AI Services Configuration
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# AI Configuration
AI_ENABLED=true
PREFERRED_AI_SERVICE=auto
AI_FALLBACK_TO_FAQ=true
```

### 3. Get API Keys

#### Google Gemini (Recommended - Free Tier Available)
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your `.env` file

#### OpenAI (Paid Service)
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in to your OpenAI account
3. Create a new API key
4. Copy the key to your `.env` file

## 🎯 How It Works

### Response Priority

1. **Greetings & Help**: Predefined responses
2. **Health Alerts**: Location-based alert system
3. **AI Processing**: For complex health questions
   - Checks if question is health-related
   - Uses preferred AI service (Gemini → OpenAI)
   - Provides intelligent, contextual responses
4. **FAQ Matching**: Traditional keyword-based matching
5. **Fallback**: Generic "didn't understand" message

### AI Service Selection

- `auto`: Tries Gemini first, then OpenAI (recommended)
- `gemini`: Uses only Google Gemini
- `openai`: Uses only OpenAI GPT

## 📡 API Endpoints

### Chat with AI
```http
POST /api/chat
Content-Type: application/json

{
  "message": "What are the symptoms of dengue fever?",
  "language": "en",
  "userId": "user123",
  "sessionId": "session456"
}
```

**Response:**
```json
{
  "success": true,
  "response": "Dengue fever symptoms include high fever, severe headache, pain behind eyes...",
  "language": "en",
  "responseType": "ai",
  "confidence": 0.9,
  "aiProvider": "gemini",
  "aiTokens": null,
  "quickReplies": [],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Check AI Status
```http
GET /api/chat/ai-status
```

**Response:**
```json
{
  "success": true,
  "aiServices": {
    "openai": {
      "available": true,
      "configured": true
    },
    "gemini": {
      "available": true,
      "configured": true
    }
  },
  "aiEnabled": true,
  "preferredService": "auto"
}
```

## 🧪 Testing

Run the test script to verify your setup:

```bash
node test-ai.js
```

This will test:
- AI service availability
- Health-related message detection
- AI response generation (if API keys are configured)

## 🔍 Health Detection

The system automatically detects health-related questions using keywords in multiple languages:

- **English**: health, medical, doctor, symptom, fever, etc.
- **Hindi**: स्वास्थ्य, चिकित्सा, डॉक्टर, बुखार, etc.
- **Bengali**: স্বাস্থ্য, চিকিৎসা, ডাক্তার, জ্বর, etc.
- **Telugu**: ఆరోగ్యం, వైద్యం, వైద్యుడు, జ్వరం, etc.

## 🛡️ Safety Features

- **Medical Disclaimer**: AI responses include appropriate disclaimers
- **Professional Consultation**: Always recommends consulting healthcare professionals
- **Accurate Information**: Responses based on WHO/CDC guidelines
- **Cultural Sensitivity**: Respects local customs and practices

## 💰 Cost Optimization

1. **Use Gemini First**: Free tier available, good for most queries
2. **OpenAI Fallback**: Only when Gemini is unavailable
3. **Token Limits**: Responses limited to 300 tokens to control costs
4. **FAQ Fallback**: Uses free FAQ system when AI fails

## 🔧 Configuration Options

| Variable | Options | Description |
|----------|---------|-------------|
| `AI_ENABLED` | `true`/`false` | Enable/disable AI features |
| `PREFERRED_AI_SERVICE` | `auto`/`gemini`/`openai` | Which AI service to prefer |
| `AI_FALLBACK_TO_FAQ` | `true`/`false` | Fall back to FAQ if AI fails |

## 🚨 Troubleshooting

### Common Issues

1. **"No AI service available"**
   - Check your API keys in `.env`
   - Verify API key permissions
   - Check internet connectivity

2. **"AI Response Error"**
   - Check API quotas/billing
   - Verify API key format
   - Check service status pages

3. **Health detection not working**
   - Check if message contains health keywords
   - Verify language detection is working

### Debug Mode

Enable detailed logging:
```env
LOG_LEVEL=debug
```

## 📈 Monitoring

The system logs:
- AI service usage
- Response times
- Error rates
- Token consumption (OpenAI)
- Fallback usage

## 🔄 Updates

To update AI models or add new features:

1. Update the `HEALTH_SYSTEM_PROMPT` in `utils/aiService.js`
2. Add new health keywords to `isHealthRelated()` function
3. Modify response processing in `routes/chat.js`

## 📞 Support

For issues with AI integration:
1. Check the test script output
2. Review server logs
3. Verify API key configuration
4. Check service status pages

---

**Note**: Always test thoroughly before deploying to production. Monitor API usage to avoid unexpected costs.