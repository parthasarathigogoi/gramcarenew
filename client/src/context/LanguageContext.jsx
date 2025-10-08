import { createContext, useContext, useState, useEffect } from 'react';

// Translations for UI elements
const translations = {
  en: {
    // Navigation
    home: 'Home',
    services: 'Services',
    about: 'About',
    contact: 'Contact',
    dashboard: 'ASHA Dashboard',
    
    // App Header
    appTitle: 'SwasthAI',
    appSubtitle: 'Your Health Assistant',
    offlineAlert: 'Offline Mode',
    languageToggle: 'हिंदी',
    
    // Homepage
    welcome: 'Welcome to GramCare',
    subtitle: 'Your Trusted Healthcare Companion',
    description: 'AI-powered healthcare assistance for rural communities with multilingual support and expert medical guidance.',
    chatWithAI: 'Chat with SwasthAI',
    bookConsultation: 'Book Teleconsultation',
    prescriptionQR: 'Prescription QR',
    
    // ASHA Dashboard
    dashboardTitle: 'ASHA Worker Dashboard',
    villageHealthOverview: 'Village Health Overview',
    totalPatients: 'Total Patients',
    redTriageCases: 'Red Triage Cases',
    yellowTriageCases: 'Yellow Triage Cases',
    commonSymptoms: 'Common Symptoms',
    healthTrends: 'Health Trends',
    mostCommonSymptoms: 'Most Common Symptoms',
    patientsRequiringAttention: 'Patients Requiring Attention',
    noPatientsAttention: 'No patients requiring attention at this time.',
    patientName: 'Patient Name',
    patientPhone: 'Phone Number',
    patientSymptom: 'Symptom',
    patientTriage: 'Triage',
    patientVillage: 'Village',
    time: 'Time',
    patientActions: 'Actions',
    bookConsult: 'Book Consult',
    prescription: 'Prescription',

    // Chat Interface
    chatTitle: 'Chat with SwasthAI',
    chatPlaceholder: 'Type your health question here...',
    send: 'Send',
    typing: 'SwasthAI is typing...',
    
    // Existing translations
    welcomeMessage: "Hello! I'm SwasthAI, your health assistant. How can I help you today?",
    typeMessage: "Type your message...",
    startListening: "Start voice input",
    stopListening: "Stop voice input",
    fever: "Fever",
    cough: "Cough",
    emergency: "Emergency",
    emergencySelected: "I have an emergency situation",
    emergencyResponse: "This is an EMERGENCY. Please call 108 immediately or tap the button below to notify an Asha worker.",
    callEmergency: "Call 108",
    notifyAsha: "Notify Asha Worker",
    fallbackMessage: "I'm sorry, I couldn't understand that. Could you please rephrase?",
    errorMessage: "Sorry, there was an error processing your request. Please try again.",
    selectTimeSlot: "Select a time slot",
    confirmBooking: "Confirm Booking",
    bookingConfirmed: "Your teleconsultation has been booked. You'll receive a confirmation message shortly.",
    name: "Name",
    phone: "Phone Number",
    symptom: "Symptom",
    language: "Language",
    english: "English",
    hindi: "हिंदी",
    
    // Healthcare Schemes
    healthcareSchemes: 'Government Healthcare Schemes',
    ayushmanBharat: 'Ayushman Bharat',
    janAushadhi: 'Jan Aushadhi',
    rashtriyaSwasthya: 'Rashtriya Swasthya Bima Yojana',
    
    // Health News
    healthNews: 'Health News & Updates',
    latestNews: 'Latest Health News',
    
    // Hospitals
    nearbyHospitals: 'Nearby Government Hospitals',
    findHospitals: 'Find Hospitals',
    
    // Common
    loading: 'Loading...',
    error: 'Error occurred',
    retry: 'Retry',
    close: 'Close',
    viewMore: 'View More',
    learnMore: 'Learn More',
    getStarted: 'Get Started',
    bookNow: 'Book Now'
  },
  hi: {
    // Navigation
    home: 'होम',
    services: 'सेवाएं',
    about: 'हमारे बारे में',
    contact: 'संपर्क',
    dashboard: 'आशा डैशबोर्ड',
    
    // App Header
    appTitle: 'स्वास्थAI',
    appSubtitle: 'आपका स्वास्थ्य सहायक',
    offlineAlert: 'ऑफलाइन मोड',
    languageToggle: 'English',
    
    // Homepage
    welcome: 'ग्रामकेयर में आपका स्वागत है',
    subtitle: 'आपका विश्वसनीय स्वास्थ्य साथी',
    description: 'बहुभाषी समर्थन और विशेषज्ञ चिकित्सा मार्गदर्शन के साथ ग्रामीण समुदायों के लिए AI-संचालित स्वास्थ्य सहायता।',
    chatWithAI: 'स्वास्थ्य AI से बात करें',
    bookConsultation: 'टेलीकंसल्टेशन बुक करें',
    prescriptionQR: 'प्रिस्क्रिप्शन QR',
    
    // ASHA Dashboard
    dashboardTitle: 'आशा डैशबोर्ड',
    villageHealthOverview: 'ग्राम स्वास्थ्य अवलोकन',
    totalPatients: 'कुल मरीज',
    redTriageCases: 'रेड ट्रायज मामले',
    yellowTriageCases: 'पीले ट्रायज मामले',
    commonSymptoms: 'सामान्य लक्षण',
    healthTrends: 'स्वास्थ्य रुझान',
    mostCommonSymptoms: 'सबसे सामान्य लक्षण',
    patientsRequiringAttention: 'ध्यान देने योग्य मरीज',
    noPatientsAttention: 'इस समय ध्यान देने योग्य कोई मरीज नहीं है।',
    patientName: 'मरीज का नाम',
    patientPhone: 'फोन नंबर',
    patientSymptom: 'लक्षण',
    patientTriage: 'ट्राइएज',
    patientVillage: 'गाँव',
    time: 'समय',
    patientActions: 'कार्यवाही',
    bookConsult: 'परामर्श बुक करें',
    prescription: 'पर्चे',

    // Chat Interface
    chatTitle: 'स्वास्थ्य AI से बात करें',
    chatPlaceholder: 'यहाँ अपना स्वास्थ्य प्रश्न टाइप करें...',
    send: 'भेजें',
    typing: 'स्वास्थ्य AI टाइप कर रहा है...',
    
    // Existing translations
    welcomeMessage: "नमस्ते! मैं स्वास्थAI हूँ, आपका स्वास्थ्य सहायक। आज मैं आपकी कैसे मदद कर सकता हूँ?",
    typeMessage: "अपना संदेश लिखें...",
    startListening: "आवाज़ इनपुट शुरू करें",
    stopListening: "आवाज़ इनपुट बंद करें",
    fever: "बुखार",
    cough: "खांसी",
    emergency: "आपातकाल",
    emergencySelected: "मुझे एक आपातकालीन स्थिति है",
    emergencyResponse: "यह एक आपातकाल है। कृपया तुरंत 108 पर कॉल करें या आशा कार्यकर्ता को सूचित करने के लिए नीचे दिए गए बटन पर टैप करें।",
    callEmergency: "108 पर कॉल करें",
    notifyAsha: "आशा कार्यकर्ता को सूचित करें",
    fallbackMessage: "मुझे खेद है, मैं समझ नहीं पाया। क्या आप कृपया अपना प्रश्न दोबारा पूछ सकते हैं?",
    errorMessage: "क्षमा करें, आपके अनुरोध को संसाधित करने में एक त्रुटि हुई। कृपया पुन: प्रयास करें।",
    selectTimeSlot: "एक समय स्लॉट चुनें",
    confirmBooking: "बुकिंग की पुष्टि करें",
    bookingConfirmed: "आपका टेलीकंसल्टेशन बुक कर लिया गया है। आपको जल्द ही एक पुष्टिकरण संदेश प्राप्त होगा।",
    name: "नाम",
    phone: "फोन नंबर",
    symptom: "लक्षण",
    language: "भाषा",
    english: "English",
    hindi: "हिंदी",
    
    // Healthcare Schemes
    healthcareSchemes: 'सरकारी स्वास्थ्य योजनाएं',
    ayushmanBharat: 'आयुष्मान भारत',
    janAushadhi: 'जन औषधि',
    rashtriyaSwasthya: 'राष्ट्रीय स्वास्थ्य बीमा योजना',
    
    // Health News
    healthNews: 'स्वास्थ्य समाचार और अपडेट',
    latestNews: 'नवीनतम स्वास्थ्य समाचार',
    
    // Hospitals
    nearbyHospitals: 'नजदीकी सरकारी अस्पताल',
    findHospitals: 'अस्पताल खोजें',
    
    // Common
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि हुई',
    retry: 'पुनः प्रयास करें',
    close: 'बंद करें',
    viewMore: 'और देखें',
    learnMore: 'और जानें',
    getStarted: 'शुरू करें',
    bookNow: 'अभी बुक करें'
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  
  // Load language preference from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('swasthai-language');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);
  
  // Save language preference to localStorage
  useEffect(() => {
    localStorage.setItem('swasthai-language', language);
  }, [language]);
  
  const toggleLanguage = () => {
    setLanguage(prevLang => prevLang === 'en' ? 'hi' : 'en');
  };
  
  // Translation function
  const t = (key) => {
    return translations[language][key] || key;
  };
  
  return (
    <LanguageContext.Provider value={{ 
      language, 
      toggleLanguage, 
      translations: translations[language],
      t
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);