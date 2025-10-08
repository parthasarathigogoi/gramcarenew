import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { X, Heart, Shield, Pill, Users } from 'lucide-react';

const HealthcareSchemes = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

  const schemes = [
    {
      id: 1,
      name: t('ayushmanBharat'),
      description: {
        en: 'Provides health insurance coverage up to ₹5 lakh per family per year for secondary and tertiary care hospitalization.',
        hi: 'द्वितीयक और तृतीयक देखभाल अस्पताल में भर्ती के लिए प्रति परिवार प्रति वर्ष ₹5 लाख तक का स्वास्थ्य बीमा कवरेज प्रदान करता है।'
      },
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      eligibility: {
        en: 'Bottom 40% of the population based on SECC 2011 database',
        hi: 'SECC 2011 डेटाबेस के आधार पर जनसंख्या के निचले 40% लोग'
      },
      benefits: {
        en: ['Free treatment up to ₹5 lakh', 'Cashless transactions', 'Pre and post hospitalization coverage'],
        hi: ['₹5 लाख तक मुफ्त इलाज', 'कैशलेस लेनदेन', 'अस्पताल में भर्ती से पहले और बाद का कवरेज']
      }
    },
    {
      id: 2,
      name: t('janAushadhi'),
      description: {
        en: 'Provides quality generic medicines at affordable prices through dedicated Jan Aushadhi stores.',
        hi: 'समर्पित जन औषधि स्टोरों के माध्यम से किफायती कीमतों पर गुणवत्तापूर्ण जेनेरिक दवाएं प्रदान करता है।'
      },
      icon: <Pill className="w-8 h-8 text-green-600" />,
      eligibility: {
        en: 'Available to all citizens',
        hi: 'सभी नागरिकों के लिए उपलब्ध'
      },
      benefits: {
        en: ['50-90% cheaper than branded medicines', 'Quality assured medicines', 'Wide network of stores'],
        hi: ['ब्रांडेड दवाओं से 50-90% सस्ती', 'गुणवत्ता आश्वासित दवाएं', 'स्टोरों का व्यापक नेटवर्क']
      }
    },
    {
      id: 3,
      name: t('rashtriyaSwasthya'),
      description: {
        en: 'Health insurance scheme for Below Poverty Line (BPL) families providing coverage for hospitalization.',
        hi: 'गरीबी रेखा से नीचे (BPL) परिवारों के लिए अस्पताल में भर्ती के लिए कवरेज प्रदान करने वाली स्वास्थ्य बीमा योजना।'
      },
      icon: <Heart className="w-8 h-8 text-red-600" />,
      eligibility: {
        en: 'BPL families as per government records',
        hi: 'सरकारी रिकॉर्ड के अनुसार BPL परिवार'
      },
      benefits: {
        en: ['Coverage up to ₹30,000 per family', 'Cashless treatment', 'Pre-existing disease coverage'],
        hi: ['प्रति परिवार ₹30,000 तक का कवरेज', 'कैशलेस इलाज', 'पूर्व-मौजूदा बीमारी कवरेज']
      }
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              {t('healthcareSchemes')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {schemes.map((scheme) => (
            <div key={scheme.id} className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {scheme.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {scheme.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {scheme.description[t('language') === 'hi' ? 'hi' : 'en']}
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">
                        {t('language') === 'hi' ? 'पात्रता:' : 'Eligibility:'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {scheme.eligibility[t('language') === 'hi' ? 'hi' : 'en']}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">
                        {t('language') === 'hi' ? 'लाभ:' : 'Benefits:'}
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {scheme.benefits[t('language') === 'hi' ? 'hi' : 'en'].map((benefit, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                      {t('learnMore')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 p-6 rounded-b-2xl">
          <p className="text-sm text-gray-600 text-center">
            {t('language') === 'hi' 
              ? 'अधिक जानकारी के लिए अपने नजदीकी स्वास्थ्य केंद्र से संपर्क करें या 1075 पर कॉल करें।'
              : 'For more information, contact your nearest health center or call 1075.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default HealthcareSchemes;