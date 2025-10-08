import { useLanguage } from '../context/LanguageContext';

const Header = ({ online }) => {
  const { t, toggleLanguage } = useLanguage();

  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <div className="mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('appTitle')}</h1>
            <p className="text-sm opacity-80">{t('appSubtitle')}</p>
          </div>
        </div>
        <div className="flex items-center">
          {!online && (
            <div className="mr-4 text-sm bg-red-500 px-2 py-1 rounded-full flex items-center">
              <span className="inline-block w-2 h-2 bg-white rounded-full mr-1"></span>
              {t('offlineAlert')}
            </div>
          )}
          <button 
            onClick={toggleLanguage}
            className="bg-white text-indigo-700 px-3 py-1 rounded-full text-sm font-medium hover:bg-indigo-100 transition-colors"
          >
            {t('languageToggle')}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;