import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { X, Newspaper, Calendar, ExternalLink, RefreshCw } from 'lucide-react';

const HealthNews = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock health news data - in a real app, this would come from an API
  const mockHealthNews = [
    {
      id: 1,
      title: {
        en: 'New Guidelines for Fever Management Released by Health Ministry',
        hi: 'स्वास्थ्य मंत्रालय द्वारा बुखार प्रबंधन के लिए नई दिशानिर्देश जारी'
      },
      summary: {
        en: 'The Ministry of Health has released updated guidelines for managing fever in rural areas, emphasizing early detection and proper treatment protocols.',
        hi: 'स्वास्थ्य मंत्रालय ने ग्रामीण क्षेत्रों में बुखार के प्रबंधन के लिए अद्यतन दिशानिर्देश जारी किए हैं, जो जल्दी पहचान और उचित उपचार प्रोटोकॉल पर जोर देते हैं।'
      },
      date: '2024-01-15',
      category: 'Government Policy',
      source: 'Ministry of Health & Family Welfare'
    },
    {
      id: 2,
      title: {
        en: 'Vaccination Drive Reaches 95% Coverage in Rural Areas',
        hi: 'ग्रामीण क्षेत्रों में टीकाकरण अभियान 95% कवरेज तक पहुंचा'
      },
      summary: {
        en: 'The nationwide vaccination campaign has achieved remarkable success with 95% coverage in rural areas, significantly improving community health outcomes.',
        hi: 'राष्ट्रव्यापी टीकाकरण अभियान ने ग्रामीण क्षेत्रों में 95% कवरेज के साथ उल्लेखनीय सफलता हासिल की है, जिससे सामुदायिक स्वास्थ्य परिणामों में काफी सुधार हुआ है।'
      },
      date: '2024-01-12',
      category: 'Public Health',
      source: 'National Health Mission'
    },
    {
      id: 3,
      title: {
        en: 'Telemedicine Services Expand to Remote Villages',
        hi: 'दूरदराज के गांवों में टेलीमेडिसिन सेवाओं का विस्तार'
      },
      summary: {
        en: 'New telemedicine initiatives are bringing quality healthcare to remote villages, connecting patients with specialists through digital platforms.',
        hi: 'नई टेलीमेडिसिन पहल दूरदराज के गांवों में गुणवत्तापूर्ण स्वास्थ्य सेवा ला रही है, डिजिटल प्लेटफॉर्म के माध्यम से मरीजों को विशेषज्ञों से जोड़ रही है।'
      },
      date: '2024-01-10',
      category: 'Technology',
      source: 'Digital Health Initiative'
    },
    {
      id: 4,
      title: {
        en: 'Seasonal Disease Prevention Campaign Launched',
        hi: 'मौसमी रोग रोकथाम अभियान शुरू'
      },
      summary: {
        en: 'A comprehensive campaign to prevent seasonal diseases like dengue, malaria, and chikungunya has been launched across all states.',
        hi: 'डेंगू, मलेरिया और चिकनगुनिया जैसी मौसमी बीमारियों को रोकने के लिए सभी राज्यों में एक व्यापक अभियान शुरू किया गया है।'
      },
      date: '2024-01-08',
      category: 'Disease Prevention',
      source: 'National Vector Borne Disease Control Programme'
    },
    {
      id: 5,
      title: {
        en: 'Mental Health Support Programs Strengthened',
        hi: 'मानसिक स्वास्थ्य सहायता कार्यक्रम मजबूत'
      },
      summary: {
        en: 'Government announces enhanced mental health support programs with focus on rural communities and vulnerable populations.',
        hi: 'सरकार ने ग्रामीण समुदायों और कमजोर आबादी पर ध्यान देने के साथ बेहतर मानसिक स्वास्थ्य सहायता कार्यक्रमों की घोषणा की।'
      },
      date: '2024-01-05',
      category: 'Mental Health',
      source: 'National Mental Health Programme'
    }
  ];

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setNews(mockHealthNews);
        setLoading(false);
      }, 1000);
    }
  }, [isOpen]);

  const refreshNews = () => {
    setLoading(true);
    setTimeout(() => {
      setNews([...mockHealthNews].sort(() => Math.random() - 0.5));
      setLoading(false);
    }, 1000);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(t('language') === 'hi' ? 'hi-IN' : 'en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <Newspaper className="w-8 h-8 text-blue-600 mr-3" />
              {t('healthNews')}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={refreshNews}
                disabled={loading}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">{t('loading')}</span>
            </div>
          ) : (
            <div className="space-y-6">
              {news.map((article) => (
                <div key={article.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {article.category}
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(article.date)}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">
                    {article.title[t('language') === 'hi' ? 'hi' : 'en']}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {article.summary[t('language') === 'hi' ? 'hi' : 'en']}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {t('language') === 'hi' ? 'स्रोत:' : 'Source:'} {article.source}
                    </span>
                    <button className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
                      {t('viewMore')}
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-6 rounded-b-2xl">
          <p className="text-sm text-gray-600 text-center">
            {t('language') === 'hi' 
              ? 'नवीनतम स्वास्थ्य समाचार और अपडेट के लिए नियमित रूप से जांचते रहें।'
              : 'Stay updated with the latest health news and updates by checking regularly.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default HealthNews;