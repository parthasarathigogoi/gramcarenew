import { useState, useEffect } from 'react';

export const useSpeechSynthesis = () => {
  const [voices, setVoices] = useState([]);
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setSupported(true);
      
      // Get available voices
      const updateVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
      };
      
      updateVoices();
      
      // Chrome loads voices asynchronously
      window.speechSynthesis.onvoiceschanged = updateVoices;
      
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  const speak = (text, language = 'en') => {
    if (!supported) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    if (!text) return;
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language
    utterance.lang = language === 'en' ? 'en-US' : 'hi-IN';
    
    // Try to find a voice for the selected language
    const languageVoices = voices.filter(voice => voice.lang.includes(utterance.lang.substring(0, 2)));
    if (languageVoices.length > 0) {
      utterance.voice = languageVoices[0];
    }
    
    // Set other properties
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Event handlers
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    
    // Speak
    window.speechSynthesis.speak(utterance);
  };

  const cancel = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  return {
    speak,
    cancel,
    speaking,
    supported,
    voices
  };
};