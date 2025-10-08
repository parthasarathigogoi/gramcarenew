import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { X, MapPin, Phone, Clock, Navigation, Search, Filter } from 'lucide-react';

const HospitalFinder = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [userLocation, setUserLocation] = useState(null);

  // Mock hospital data - in a real app, this would come from an API
  const mockHospitals = [
    {
      id: 1,
      name: {
        en: 'District Government Hospital',
        hi: 'जिला सरकारी अस्पताल'
      },
      address: {
        en: 'Main Road, District Center, PIN: 123456',
        hi: 'मुख्य सड़क, जिला केंद्र, पिन: 123456'
      },
      phone: '+91-1234567890',
      distance: '2.5 km',
      type: 'Government',
      specialties: {
        en: ['General Medicine', 'Pediatrics', 'Emergency Care', 'Maternity'],
        hi: ['सामान्य चिकित्सा', 'बाल रोग', 'आपातकालीन देखभाल', 'प्रसूति']
      },
      timings: '24/7',
      rating: 4.2,
      facilities: {
        en: ['Emergency Services', 'Pharmacy', 'Laboratory', 'X-Ray'],
        hi: ['आपातकालीन सेवाएं', 'फार्मेसी', 'प्रयोगशाला', 'एक्स-रे']
      }
    },
    {
      id: 2,
      name: {
        en: 'Primary Health Center - Block A',
        hi: 'प्राथमिक स्वास्थ्य केंद्र - ब्लॉक ए'
      },
      address: {
        en: 'Village Road, Block A, PIN: 123457',
        hi: 'गांव रोड, ब्लॉक ए, पिन: 123457'
      },
      phone: '+91-1234567891',
      distance: '5.2 km',
      type: 'PHC',
      specialties: {
        en: ['General Medicine', 'Vaccination', 'Basic Surgery'],
        hi: ['सामान्य चिकित्सा', 'टीकाकरण', 'बुनियादी सर्जरी']
      },
      timings: '8:00 AM - 8:00 PM',
      rating: 3.8,
      facilities: {
        en: ['OPD', 'Pharmacy', 'Laboratory'],
        hi: ['OPD', 'फार्मेसी', 'प्रयोगशाला']
      }
    },
    {
      id: 3,
      name: {
        en: 'Community Health Center',
        hi: 'सामुदायिक स्वास्थ्य केंद्र'
      },
      address: {
        en: 'Community Center Road, PIN: 123458',
        hi: 'कम्युनिटी सेंटर रोड, पिन: 123458'
      },
      phone: '+91-1234567892',
      distance: '8.1 km',
      type: 'CHC',
      specialties: {
        en: ['General Medicine', 'Gynecology', 'Pediatrics', 'Surgery'],
        hi: ['सामान्य चिकित्सा', 'स्त्री रोग', 'बाल रोग', 'सर्जरी']
      },
      timings: '24/7',
      rating: 4.0,
      facilities: {
        en: ['Emergency Services', 'Operation Theater', 'Pharmacy', 'Laboratory', 'Blood Bank'],
        hi: ['आपातकालीन सेवाएं', 'ऑपरेशन थिएटर', 'फार्मेसी', 'प्रयोगशाला', 'ब्लड बैंक']
      }
    },
    {
      id: 4,
      name: {
        en: 'Sub-District Hospital',
        hi: 'उप-जिला अस्पताल'
      },
      address: {
        en: 'Hospital Road, Sub-District, PIN: 123459',
        hi: 'अस्पताल रोड, उप-जिला, पिन: 123459'
      },
      phone: '+91-1234567893',
      distance: '12.3 km',
      type: 'Government',
      specialties: {
        en: ['General Medicine', 'Orthopedics', 'Cardiology', 'Neurology'],
        hi: ['सामान्य चिकित्सा', 'हड्डी रोग', 'हृदय रोग', 'न्यूरोलॉजी']
      },
      timings: '24/7',
      rating: 4.5,
      facilities: {
        en: ['ICU', 'Emergency Services', 'Operation Theater', 'Pharmacy', 'Laboratory', 'CT Scan'],
        hi: ['ICU', 'आपातकालीन सेवाएं', 'ऑपरेशन थिएटर', 'फार्मेसी', 'प्रयोगशाला', 'CT स्कैन']
      }
    }
  ];

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      // Simulate getting user location and fetching hospitals
      setTimeout(() => {
        setHospitals(mockHospitals);
        setUserLocation({ lat: 28.6139, lng: 77.2090 }); // Mock Delhi coordinates
        setLoading(false);
      }, 1000);
    }
  }, [isOpen]);

  const filteredHospitals = hospitals.filter(hospital => {
    const matchesSearch = hospital.name.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hospital.name.hi.includes(searchTerm);
    const matchesFilter = selectedFilter === 'all' || hospital.type.toLowerCase() === selectedFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const getDirections = (hospital) => {
    // In a real app, this would open Google Maps or similar
    const address = hospital.address[t('language') === 'hi' ? 'hi' : 'en'];
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(address)}`;
    window.open(mapsUrl, '_blank');
  };

  const callHospital = (phone) => {
    window.open(`tel:${phone}`, '_self');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <MapPin className="w-8 h-8 text-red-600 mr-3" />
              {t('nearbyHospitals')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('language') === 'hi' ? 'अस्पताल खोजें...' : 'Search hospitals...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">{t('language') === 'hi' ? 'सभी' : 'All'}</option>
                <option value="government">{t('language') === 'hi' ? 'सरकारी' : 'Government'}</option>
                <option value="phc">{t('language') === 'hi' ? 'PHC' : 'PHC'}</option>
                <option value="chc">{t('language') === 'hi' ? 'CHC' : 'CHC'}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              <span className="ml-3 text-gray-600">{t('loading')}</span>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredHospitals.map((hospital) => (
                <div key={hospital.id} className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800 mb-1">
                            {hospital.name[t('language') === 'hi' ? 'hi' : 'en']}
                          </h3>
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <MapPin className="w-4 h-4 mr-1" />
                            {hospital.address[t('language') === 'hi' ? 'hi' : 'en']}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {hospital.distance}
                          </span>
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {hospital.type}
                          </span>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">
                            {t('language') === 'hi' ? 'विशेषताएं:' : 'Specialties:'}
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {hospital.specialties[t('language') === 'hi' ? 'hi' : 'en'].map((specialty, index) => (
                              <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                                {specialty}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">
                            {t('language') === 'hi' ? 'सुविधाएं:' : 'Facilities:'}
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {hospital.facilities[t('language') === 'hi' ? 'hi' : 'en'].map((facility, index) => (
                              <span key={index} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                                {facility}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {hospital.timings}
                        </div>
                        <div className="flex items-center">
                          <span className="text-yellow-500">★</span>
                          <span className="ml-1">{hospital.rating}/5</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 lg:ml-6">
                      <button
                        onClick={() => callHospital(hospital.phone)}
                        className="flex items-center justify-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        {t('language') === 'hi' ? 'कॉल करें' : 'Call'}
                      </button>
                      <button
                        onClick={() => getDirections(hospital)}
                        className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        {t('language') === 'hi' ? 'दिशा' : 'Directions'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredHospitals.length === 0 && !loading && (
                <div className="text-center py-12">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {t('language') === 'hi' 
                      ? 'कोई अस्पताल नहीं मिला। कृपया अपनी खोज बदलें।'
                      : 'No hospitals found. Please try a different search.'
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-6 rounded-b-2xl">
          <p className="text-sm text-gray-600 text-center">
            {t('language') === 'hi' 
              ? 'आपातकाल के लिए 108 पर कॉल करें। सभी सरकारी अस्पताल निःशुल्क आपातकालीन सेवा प्रदान करते हैं।'
              : 'For emergencies, call 108. All government hospitals provide free emergency services.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default HospitalFinder;