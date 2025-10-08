/**
 * Test script for AI integration
 * Run with: node test-ai.js
 */

require('dotenv').config();
const { getAIResponse, isHealthRelated, getAIStatus } = require('./utils/aiService');

async function testAIIntegration() {
  console.log('🤖 Testing GramCare AI Integration\n');
  
  // Test AI service status
  console.log('📊 AI Service Status:');
  const status = getAIStatus();
  console.log(JSON.stringify(status, null, 2));
  console.log();
  
  // Test health-related detection
  console.log('🔍 Testing Health-Related Detection:');
  const testMessages = [
    'I have a fever and headache',
    'What are the symptoms of COVID-19?',
    'How is the weather today?',
    'मुझे बुखार है', // Hindi: I have fever
    'What should I eat for breakfast?'
  ];
  
  testMessages.forEach(msg => {
    const isHealth = isHealthRelated(msg);
    console.log(`"${msg}" -> Health-related: ${isHealth}`);
  });
  console.log();
  
  // Test AI responses (only if API keys are configured)
  if (status.openai.configured || status.gemini.configured) {
    console.log('💬 Testing AI Responses:');
    
    const healthQuestions = [
      'What are the symptoms of dengue fever?',
      'How can I prevent malaria?',
      'मुझे सिरदर्द है, क्या करूं?' // Hindi: I have headache, what should I do?
    ];
    
    for (const question of healthQuestions) {
      try {
        console.log(`\n❓ Question: "${question}"`);
        const response = await getAIResponse(question, 'en', 'auto');
        
        if (response.success) {
          console.log(`✅ AI Provider: ${response.aiProvider}`);
          console.log(`📝 Response: ${response.response}`);
          console.log(`🎯 Confidence: ${response.confidence}`);
          if (response.tokens) {
            console.log(`🔢 Tokens: ${response.tokens}`);
          }
        } else {
          console.log(`❌ Error: ${response.error}`);
        }
      } catch (error) {
        console.log(`❌ Exception: ${error.message}`);
      }
    }
  } else {
    console.log('⚠️  No AI API keys configured. Skipping AI response tests.');
    console.log('To test AI responses, add OPENAI_API_KEY or GEMINI_API_KEY to your .env file.');
  }
  
  console.log('\n✨ AI Integration test completed!');
}

// Run the test
testAIIntegration().catch(console.error);