import { useLanguage } from '../context/LanguageContext';

const Footer = () => {
  const { language } = useLanguage();
  
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-4">
      <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
        <p>
          {language === 'en' 
            ? `© ${year} SwasthAI - AI-powered health assistant for rural communities` 
            : `© ${year} स्वस्थAI - ग्रामीण समुदायों के लिए AI-संचालित स्वास्थ्य सहायक`}
        </p>
      </div>
    </footer>
  );
};

export default Footer;