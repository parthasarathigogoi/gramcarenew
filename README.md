# GramCare - Multilingual AI Health Chatbot

🏥 **GramCare** is a comprehensive multilingual AI chatbot designed to educate rural and semi-urban populations about preventive healthcare, disease symptoms, and vaccination schedules. The system integrates with government health databases and provides real-time alerts for disease outbreaks.

## 🌟 Features

### Core Functionality
- **Multilingual Support**: 12+ languages including Hindi, Bengali, Telugu, Tamil, and more
- **Health Information**: Disease symptoms, prevention methods, vaccination schedules
- **Real-time Alerts**: Location-based outbreak notifications
- **WhatsApp Integration**: Accessible via WhatsApp for maximum reach
- **Voice Input**: Voice message support for better accessibility
- **Smart Translation**: Google Translate integration with caching

### Technical Features
- **Modern UI**: React-based responsive web interface
- **RESTful API**: Express.js backend with comprehensive endpoints
- **Real-time Communication**: WebSocket support for instant messaging
- **Analytics Dashboard**: Admin panel for monitoring usage and performance
- **Session Management**: User conversation history and preferences
- **Scalable Architecture**: Cloud-ready deployment configuration

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │────│  Express Server │────│   External APIs │
│                 │    │                 │    │                 │
│ • Chat UI       │    │ • Chat Routes   │    │ • Google Trans. │
│ • Alerts        │    │ • Alert System  │    │ • Twilio        │
│ • Dashboard     │    │ • WhatsApp      │    │ • Health APIs   │
│ • Admin Panel   │    │ • Analytics     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Google Cloud Account** (for translation services)
- **Twilio Account** (for WhatsApp integration)
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/gramcare.git
cd gramcare
```

### 2. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Environment Configuration

Create environment files:

#### Server Environment (`.env` in `/server`)

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Google Cloud Translation
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# Twilio Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
TWILIO_WHATSAPP_NUMBER=whatsapp:+your-whatsapp-number
WHATSAPP_VERIFY_TOKEN=your-webhook-verify-token

# Database (Optional - for production)
MONGODB_URI=mongodb://localhost:27017/gramcare

# Logging
LOG_LEVEL=info
```

#### Client Environment (`.env` in `/client`)

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WEBSOCKET_URL=ws://localhost:5000

# Feature Flags
REACT_APP_ENABLE_VOICE=true
REACT_APP_ENABLE_ANALYTICS=true
```

### 4. Google Cloud Setup

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Translation API**
   ```bash
   gcloud services enable translate.googleapis.com
   ```

3. **Create Service Account**
   ```bash
   gcloud iam service-accounts create gramcare-translator \
     --display-name="GramCare Translator"
   
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:gramcare-translator@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/translate.user"
   
   gcloud iam service-accounts keys create ./service-account.json \
     --iam-account=gramcare-translator@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

### 5. Twilio WhatsApp Setup

1. **Create Twilio Account**
   - Sign up at [Twilio Console](https://console.twilio.com/)
   - Get Account SID and Auth Token

2. **Set up WhatsApp Sandbox**
   - Go to Messaging → Try it out → Send a WhatsApp message
   - Follow sandbox setup instructions
   - Configure webhook URL: `https://your-domain.com/api/whatsapp/webhook`

3. **Production WhatsApp (Optional)**
   - Apply for WhatsApp Business API access
   - Complete business verification process

### 6. Run the Application

#### Development Mode

```bash
# Terminal 1 - Start server
cd server
npm run dev

# Terminal 2 - Start client
cd client
npm start
```

#### Production Mode

```bash
# Build client
cd client
npm run build

# Start server (serves client build)
cd ../server
npm start
```

## 📱 Usage

### Web Interface

1. **Chat Interface**: `http://localhost:3000/chat`
   - Type health-related questions
   - Select preferred language
   - Use voice input (if enabled)

2. **Alerts Dashboard**: `http://localhost:3000/alerts`
   - View outbreak alerts
   - Filter by location and severity
   - Multi-language support

3. **Admin Dashboard**: `http://localhost:3000/admin`
   - Monitor usage analytics
   - Track query patterns
   - Language distribution insights

### WhatsApp Integration

1. **Send message to your Twilio WhatsApp number**
2. **Available commands**:
   - `help` - Show available options
   - `hindi` / `हिंदी` - Switch to Hindi
   - `english` - Switch to English
   - `alerts` - Get latest health alerts
   - Ask any health-related question

### API Endpoints

#### Chat API
```bash
# Send chat message
POST /api/chat
{
  "message": "What are COVID symptoms?",
  "language": "en",
  "sessionId": "user123"
}

# Get supported languages
GET /api/chat/languages

# Translate text
POST /api/chat/translate
{
  "text": "Hello",
  "targetLanguage": "hi"
}
```

#### Alerts API
```bash
# Get alerts
GET /api/alerts?language=en&location=delhi&severity=high

# Get location-specific alerts
GET /api/alerts/location/mumbai?language=hi
```

#### WhatsApp API
```bash
# Send WhatsApp message
POST /api/whatsapp/send
{
  "to": "+1234567890",
  "message": "Health alert message",
  "language": "en"
}

# Broadcast to multiple users
POST /api/whatsapp/broadcast
{
  "phoneNumbers": ["+1234567890", "+0987654321"],
  "message": "Important health update",
  "language": "hi"
}
```

## 🔧 Configuration

### Supported Languages

The system supports the following languages:

| Language | Code | Native Name |
|----------|------|-------------|
| English | en | English |
| Hindi | hi | हिंदी |
| Bengali | bn | বাংলা |
| Telugu | te | తెలుగు |
| Tamil | ta | தமிழ் |
| Marathi | mr | मराठी |
| Gujarati | gu | ગુજરાતી |
| Kannada | kn | ಕನ್ನಡ |
| Malayalam | ml | മലയാളം |
| Punjabi | pa | ਪੰਜਾਬੀ |
| Odia | or | ଓଡ଼ିଆ |
| Assamese | as | অসমীয়া |

### Health Data Sources

The system includes comprehensive health data:

- **Disease Information**: 50+ common diseases
- **Symptoms Database**: 200+ symptoms with descriptions
- **Vaccination Schedules**: Child and adult immunization
- **Prevention Guidelines**: WHO and government recommendations
- **Emergency Contacts**: Location-based emergency services

## 🚀 Deployment

### Docker Deployment

1. **Build Docker images**:
   ```bash
   # Build server image
   cd server
   docker build -t gramcare-server .
   
   # Build client image
   cd ../client
   docker build -t gramcare-client .
   ```

2. **Run with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

### Cloud Deployment (Heroku)

1. **Prepare for deployment**:
   ```bash
   # Install Heroku CLI
   npm install -g heroku
   
   # Login to Heroku
   heroku login
   
   # Create Heroku app
   heroku create gramcare-app
   ```

2. **Configure environment variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set GOOGLE_CLOUD_PROJECT_ID=your-project-id
   heroku config:set TWILIO_ACCOUNT_SID=your-sid
   # ... add all environment variables
   ```

3. **Deploy**:
   ```bash
   git push heroku main
   ```

### AWS Deployment

1. **Use AWS Elastic Beanstalk**:
   ```bash
   # Install EB CLI
   pip install awsebcli
   
   # Initialize EB application
   eb init gramcare
   
   # Create environment
   eb create gramcare-prod
   
   # Deploy
   eb deploy
   ```

2. **Configure Load Balancer** for high availability
3. **Set up CloudWatch** for monitoring
4. **Configure Auto Scaling** based on usage

## 📊 Monitoring & Analytics

### Built-in Analytics

- **User Engagement**: Daily/Weekly/Monthly active users
- **Query Analysis**: Most common health questions
- **Language Usage**: Distribution across supported languages
- **Response Accuracy**: User feedback and satisfaction
- **Alert Effectiveness**: Outbreak notification reach

### External Monitoring

- **Application Performance**: New Relic, DataDog
- **Error Tracking**: Sentry
- **Uptime Monitoring**: Pingdom, UptimeRobot
- **Log Management**: ELK Stack, Splunk

## 🧪 Testing

### Run Tests

```bash
# Server tests
cd server
npm test

# Client tests
cd client
npm test

# E2E tests
npm run test:e2e
```

### Test Coverage

```bash
# Generate coverage report
npm run test:coverage
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Guidelines

- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Troubleshooting](docs/troubleshooting.md)

### Community
- **Issues**: [GitHub Issues](https://github.com/your-username/gramcare/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/gramcare/discussions)
- **Email**: support@gramcare.health

### Professional Support
For enterprise deployments and custom integrations, contact: enterprise@gramcare.health

## 🙏 Acknowledgments

- **World Health Organization** for health guidelines
- **Google Cloud** for translation services
- **Twilio** for WhatsApp integration
- **Open source community** for amazing libraries
- **Healthcare workers** for their invaluable feedback

---

**Made with ❤️ for rural and semi-urban healthcare accessibility**

*GramCare - Bridging the healthcare information gap, one conversation at a time.*# gramcare
#   g r a m c a r e n e w  
 #   g r a m c a r e n e w  
 