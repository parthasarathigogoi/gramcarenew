/**
 * Grock AI API Service
 * Handles communication with the Grock AI API for the chatbot
 */

const GROCK_API_KEY = "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";
const GROCK_API_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Send a message to the Grock AI API and get a response
 * @param {Array} messages - Array of message objects with role and content
 * @returns {Promise} - Promise with the AI response
 */
export const sendMessageToGrock = async (messages) => {
  try {
    console.log("Sending request to Groq API with key:", GROCK_API_KEY);
    
    const response = await fetch(GROCK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROCK_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      let errorMessage = 'Failed to get response from Groq AI';
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        // If JSON parsing fails, use the raw text
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("Groq API response:", data);
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error communicating with Groq AI:', error);
    throw error;
  }
};

/**
 * Initialize chat with Grock AI
 * @returns {Promise} - Promise with the initial greeting
 */
export const initializeChat = async () => {
  try {
    const systemMessage = {
      role: "system",
      content: "You are SwasthAI, a helpful healthcare assistant. Provide accurate, compassionate healthcare information. For serious medical concerns, always advise consulting with a healthcare professional."
    };
    
    const userMessage = {
      role: "user",
      content: "Hello, I'd like to talk about health concerns."
    };
    
    const response = await sendMessageToGrock([systemMessage, userMessage]);
    return response;
  } catch (error) {
    console.error('Error initializing chat with Groq AI:', error);
    return "Hello! I'm SwasthAI, your personal healthcare assistant. How can I help you today?";
  }
};