import { useLanguage } from '../context/LanguageContext';

const QuickActionButtons = ({ onSelect }) => {
  const { translations } = useLanguage();
  
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <button 
        onClick={() => onSelect('fever')}
        className="btn btn-primary flex-1 min-w-[100px] text-base-large"
      >
        {translations.fever}
      </button>
      <button 
        onClick={() => onSelect('cough')}
        className="btn btn-primary flex-1 min-w-[100px] text-base-large"
      >
        {translations.cough}
      </button>
      <button 
        onClick={() => onSelect('emergency')}
        className="btn btn-danger flex-1 min-w-[100px] text-base-large"
      >
        {translations.emergency}
      </button>
    </div>
  );
};

export default QuickActionButtons;