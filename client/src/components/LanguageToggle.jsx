import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const LanguageToggle = () => {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={toggleLanguage}
        className="relative inline-flex h-8 w-16 items-center rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Toggle language"
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
            language === 'hi' ? 'translate-x-9' : 'translate-x-1'
          }`}
        />
        <span
          className={`absolute left-1 text-xs font-medium text-white transition-opacity duration-200 ${
            language === 'en' ? 'opacity-100' : 'opacity-50'
          }`}
        >
          EN
        </span>
        <span
          className={`absolute right-1 text-xs font-medium text-white transition-opacity duration-200 ${
            language === 'hi' ? 'opacity-100' : 'opacity-50'
          }`}
        >
          हि
        </span>
      </button>
      <span className="text-sm text-gray-600 dark:text-gray-300">
        {language === 'en' ? 'English' : 'हिंदी'}
      </span>
    </div>
  );
};

export default LanguageToggle;