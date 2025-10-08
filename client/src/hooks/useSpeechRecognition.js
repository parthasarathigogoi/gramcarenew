import { useState, useEffect, useCallback } from 'react';

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // Check if browser supports speech recognition
    if (typeof window !== 'undefined' && 
        (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      setSupported(true);
    }
  }, []);

  // Initialize speech recognition
  const recognition = useCallback(() => {
    if (!supported) return null;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = true;
    
    recognitionInstance.onstart = () => {
      setIsListening(true);
    };
    
    recognitionInstance.onresult = (event) => {
      const current = event.resultIndex;
      const transcriptText = event.results[current][0].transcript;
      setTranscript(transcriptText);
    };
    
    recognitionInstance.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };
    
    recognitionInstance.onend = () => {
      setIsListening(false);
    };
    
    return recognitionInstance;
  }, [supported]);

  const startListening = useCallback((language = 'en') => {
    const recognitionInstance = recognition();
    if (!recognitionInstance) return;
    
    // Clear previous transcript
    setTranscript('');
    
    // Set language
    recognitionInstance.lang = language === 'en' ? 'en-US' : 'hi-IN';
    
    // Start listening
    try {
      recognitionInstance.start();
    } catch (error) {
      console.error('Speech recognition error', error);
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    const recognitionInstance = recognition();
    if (!recognitionInstance) return;
    
    try {
      recognitionInstance.stop();
    } catch (error) {
      console.error('Speech recognition error', error);
    }
  }, [recognition]);

  return {
    isListening,
    startListening,
    stopListening,
    transcript,
    supported
  };
};