import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

// Fake remedies data with translations
const fakeRemedies = [
  {
    id: 1,
    en: {
      title: "Warning: Fake Remedy Alert",
      remedy: "Drinking cow urine to cure COVID-19",
      fact: "There is no scientific evidence that cow urine can cure or prevent COVID-19. Please follow medical guidelines for COVID-19 treatment and prevention."
    },
    hi: {
      title: "चेतावनी: नकली उपचार अलर्ट",
      remedy: "COVID-19 को ठीक करने के लिए गाय का मूत्र पीना",
      fact: "कोई वैज्ञानिक प्रमाण नहीं है कि गाय का मूत्र COVID-19 को ठीक या रोक सकता है। कृपया COVID-19 उपचार और रोकथाम के लिए चिकित्सा दिशानिर्देशों का पालन करें।"
    }
  },
  {
    id: 2,
    en: {
      title: "Warning: Fake Remedy Alert",
      remedy: "Applying mustard oil in nostrils to prevent COVID-19",
      fact: "This practice has no scientific backing and may be harmful. Follow proper mask usage and social distancing guidelines instead."
    },
    hi: {
      title: "चेतावनी: नकली उपचार अलर्ट",
      remedy: "COVID-19 को रोकने के लिए नथुनों में सरसों का तेल लगाना",
      fact: "इस प्रथा का कोई वैज्ञानिक समर्थन नहीं है और यह हानिकारक हो सकती है। इसके बजाय उचित मास्क उपयोग और सामाजिक दूरी दिशानिर्देशों का पालन करें।"
    }
  },
  {
    id: 3,
    en: {
      title: "Warning: Fake Remedy Alert",
      remedy: "Drinking alcohol to kill coronavirus",
      fact: "Consuming alcohol does not kill the coronavirus and can be harmful to your health. Follow proper hygiene and medical advice."
    },
    hi: {
      title: "चेतावनी: नकली उपचार अलर्ट",
      remedy: "कोरोनावायरस को मारने के लिए शराब पीना",
      fact: "शराब पीने से कोरोनावायरस नहीं मरता है और यह आपके स्वास्थ्य के लिए हानिकारक हो सकता है। उचित स्वच्छता और चिकित्सा सलाह का पालन करें।"
    }
  },
  {
    id: 4,
    en: {
      title: "Warning: Fake Remedy Alert",
      remedy: "Eating garlic to prevent infection",
      fact: "While garlic has some antimicrobial properties, there is no evidence it can prevent COVID-19 or other serious infections. Rely on proven medical treatments."
    },
    hi: {
      title: "चेतावनी: नकली उपचार अलर्ट",
      remedy: "संक्रमण को रोकने के लिए लहसुन खाना",
      fact: "हालांकि लहसुन में कुछ रोगाणुरोधी गुण हैं, लेकिन कोई प्रमाण नहीं है कि यह COVID-19 या अन्य गंभीर संक्रमणों को रोक सकता है। सिद्ध चिकित्सा उपचारों पर भरोसा करें।"
    }
  }
];

const FakeRemedyAlert = () => {
  const { language } = useLanguage();
  const [currentRemedyIndex, setCurrentRemedyIndex] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [textPosition, setTextPosition] = useState(-100);
  const textRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-dismiss timer (10-20 seconds)
  useEffect(() => {
    if (showAlert) {
      const dismissTime = Math.floor(Math.random() * 10000) + 10000; // Random between 10-20 seconds
      const dismissTimer = setTimeout(() => {
        setShowAlert(false);
      }, dismissTime);
      
      return () => clearTimeout(dismissTimer);
    }
  }, [showAlert]);

  // Show alert and set up rotation
  useEffect(() => {
    // Show first alert after 3 seconds
    const initialTimer = setTimeout(() => {
      setShowAlert(true);
    }, 3000);

    // Set up interval for rotating alerts
    const interval = setInterval(() => {
      setShowAlert(false);
      
      // Wait for exit animation to complete before changing content
      setTimeout(() => {
        setCurrentRemedyIndex((prevIndex) => (prevIndex + 1) % fakeRemedies.length);
        setShowAlert(true);
      }, 500);
    }, 20000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  // Text sliding animation
  useEffect(() => {
    if (showAlert && textRef.current && containerRef.current) {
      const textWidth = textRef.current.scrollWidth;
      const containerWidth = containerRef.current.clientWidth;
      
      // Only animate if text is wider than container
      if (textWidth > containerWidth) {
        const animationInterval = setInterval(() => {
          setTextPosition(prev => {
            // Reset position when text has scrolled completely out of view
            if (prev < -textWidth) {
              return containerWidth;
            }
            return prev - 1; // Move text to the left
          });
        }, 20);
        
        return () => clearInterval(animationInterval);
      }
    }
  }, [showAlert]);

  const handleClose = () => {
    setShowAlert(false);
  };

  const currentRemedy = fakeRemedies[currentRemedyIndex];
  const content = currentRemedy[language] || currentRemedy.en;

  return (
    <AnimatePresence>
      {showAlert && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-50 bg-red-50 border-b border-red-300 shadow-md"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          transition={{ duration: 0.5 }}
        >
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center flex-1 overflow-hidden" ref={containerRef}>
              <div className="flex-shrink-0 mr-3">
                <svg className="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div 
                ref={textRef}
                className="whitespace-nowrap font-medium"
                style={{ transform: `translateX(${textPosition}px)` }}
              >
                <span className="text-red-600 mr-2">{content.title}:</span>
                <span className="font-bold mr-2">{content.remedy}</span>
                <span className="text-gray-700">{content.fact}</span>
              </div>
            </div>
            <button
              className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={handleClose}
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FakeRemedyAlert;